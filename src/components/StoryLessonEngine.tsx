import { useState, useEffect, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { SoundManager } from '../utils/SoundManager';
import { speak as voiceSpeak, stopSpeaking } from '../utils/VoiceService';
// import { Canvas } from '@react-three/fiber';
import { supabase } from '../supabaseClient';
import { ParentManager } from '../utils/ParentManager';
import { MultiDraftTutor } from './MultiDraftTutor';
import { AnimatePresence, motion } from 'framer-motion';
import { MiniGame } from './MiniGame';

interface DialogueNode {
    id: string;
    characterName: string;
    text: string;
    voiceType: 'narrator' | 'professor' | 'hero';
    visualType?: string;
    spriteUrl?: string;
    backgroundUrl?: string;
    isQuiz?: boolean;
    isBranch?: boolean;
    question?: string;
    options?: string[];
    correctIndex?: number;
    branchTargets?: string[];
    nextNodeId?: string;
    itemReward?: string;
    youtubeSearchQuery?: string;
    isMathInput?: boolean;
    correctAnswer?: string;
    imagePrompt?: string;
    miniGame?: string;
    feedbackWrong?: string;
}

// ─── Background Music URLs (free, royalty-free children's music) ───
const BG_MUSIC_TRACKS = [
    'https://cdn.pixabay.com/audio/2024/11/28/audio_3e58a0a1c5.mp3', // happy kids
    'https://cdn.pixabay.com/audio/2022/10/14/audio_7573fce2fb.mp3', // playful 
    'https://cdn.pixabay.com/audio/2024/02/07/audio_53aefc055c.mp3', // gentle learning
];

export const StoryLessonEngine = ({ subjectId, gradeLevel, studentName, onBack, teacherGuideUrl }: { subjectId: string, gradeLevel: string, studentName: string, onBack: () => void, teacherGuideUrl?: string }) => {
    const [storyNodes, setStoryNodes] = useState<DialogueNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
    const [showQuizResult, setShowQuizResult] = useState<'correct' | 'incorrect' | null>(null);
    const [showTutor, setShowTutor] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [score, setScore] = useState(100);
    const [earnedItem, setEarnedItem] = useState<string | null>(null);
    const [dynamicImageUrl, setDynamicImageUrl] = useState<string | null>(null);
    const [isAskModalOpen, setIsAskModalOpen] = useState(false);
    const [askInput, setAskInput] = useState('');
    const [askHistory, setAskHistory] = useState<{role: 'student'|'tutor', text: string}[]>([]);
    const [showHintArrow, setShowHintArrow] = useState(false);
    const askAudioRef = useRef<HTMLAudioElement | null>(null);
    const [isAsking, setIsAsking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [mathInputValue, setMathInputValue] = useState('');
    const [correctStreak, setCorrectStreak] = useState(0);
    const [lessonPdfs, setLessonPdfs] = useState<{ label: string; url: string }[]>([]);
    const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
    const [activePdfIndex, setActivePdfIndex] = useState(0);
    const [lessonInfo, setLessonInfo] = useState<{ unitName: string; unitNumber: string; totalLessons: number | null; chapterHint: string } | null>(null);

    // Skip Protection State
    const [timeSpent, setTimeSpent] = useState(0);
    const [skipAttempts, setSkipAttempts] = useState(0);
    const [skipQuizData, setSkipQuizData] = useState<{ question: string; options: string[]; correctIndex: number } | null>(null);
    const [isSkipQuizActive, setIsSkipQuizActive] = useState(false);
    const [isSkipQuizLoading, setIsSkipQuizLoading] = useState(false);

    // Background music
    const bgMusicRef = useRef<HTMLAudioElement | null>(null);
    const [musicEnabled, setMusicEnabled] = useState(true);

    /** Tracks all active Audio objects so we can force-stop them on navigation */
    const activeAudioRefs = useRef<HTMLAudioElement[]>([]);

    // Background music loop
    useEffect(() => {
        if (isLoading || storyNodes.length === 0 || !musicEnabled) {
            if (bgMusicRef.current) bgMusicRef.current.pause();
            return;
        }

        if (!bgMusicRef.current) {
            const track = BG_MUSIC_TRACKS[Math.floor(Math.random() * BG_MUSIC_TRACKS.length)];
            const audio = new Audio(track);
            audio.loop = true;
            audio.volume = 0.12; // soft background music
            bgMusicRef.current = audio;
            audio.play().catch(e => console.log("Autoplay blocked for BG music:", e));
        } else {
            bgMusicRef.current.play().catch(e => console.log("Autoplay blocked for BG music:", e));
        }

        return () => {
            if (bgMusicRef.current) {
                bgMusicRef.current.pause();
            }
        };
    }, [isLoading, storyNodes.length, musicEnabled]);



    useEffect(() => {
        /**
         * Builds a structured lesson from the lesson plan data system.
         * Converts a LessonPlan into DialogueNode[] for the story engine.
         */
        // @ts-expect-error — reserved for future lesson plan data system integration
        const _buildLessonFromPlan = (plan: any): DialogueNode[] => {
            const nodes: DialogueNode[] = [];
            const isEarlyEd = plan.grade === 'PK' || plan.grade === 'K';

            // Node 1: Objective + Hook
            nodes.push({
                id: 'lp-objective', characterName: 'Professor Grace',
                text: `${plan.teacherScript.hook}\n\n📋 Today's Goal: ${plan.objectiveKidFriendly || plan.objective}`,
                voiceType: 'professor', visualType: 'reading-book', isQuiz: false, itemReward: null as any,
            });

            // Node 2: IEP supports (brief note)
            if (plan.iepSupports.length > 0) {
                nodes.push({
                    id: 'lp-supports', characterName: 'Professor Grace',
                    text: `📝 Remember, ${studentName}: ${plan.iepSupports[0]}. Take your time — there's no rush! ${isEarlyEd ? '😊' : ''}`,
                    voiceType: 'professor', visualType: 'reading-book', isQuiz: false, itemReward: null as any,
                });
            }

            // Agenda-driven nodes
            plan.agenda.forEach((item: any, i: number) => {
                if (item.phase === 'exit-ticket') return; // handled separately
                const transition = plan.teacherScript.transitions[i] || '';
                nodes.push({
                    id: `lp-agenda-${i}`, characterName: 'Professor Grace',
                    text: `${isEarlyEd ? '🎯' : '📖'} ${item.title} (${item.duration} min)\n${item.description}${transition ? '\n\n' + transition : ''}`,
                    voiceType: 'professor', visualType: i % 2 === 0 ? 'reading-book' : 'science-atom',
                    isQuiz: false, itemReward: null as any,
                    miniGame: i === 1 && plan.miniGames[0] ? plan.miniGames[0].type : undefined,
                });
            });

            // Checks for understanding as quiz nodes
            plan.checksForUnderstanding.forEach((check: any, i: number) => {
                if (check.type === 'quiz' && check.question && check.options) {
                    nodes.push({
                        id: `lp-check-${i}`, characterName: 'Professor Grace',
                        text: `📝 ${isEarlyEd ? 'Quick Check!' : 'COMPREHENSION CHECK'}\n${check.prompt || ''}`,
                        voiceType: 'professor', visualType: 'math-geometry', isQuiz: true,
                        question: check.question, options: [...check.options, "I don't understand, break it down for me"],
                        correctIndex: check.correctIndex, feedbackWrong: check.feedbackWrong,
                        itemReward: null as any,
                    });
                }
            });

            // Mini-games (remaining ones after the first)
            plan.miniGames.slice(1).forEach((game: any, i: number) => {
                const checkIn = plan.teacherScript.checkIns[i] || '';
                nodes.push({
                    id: `lp-game-${i}`, characterName: 'Professor Grace',
                    text: `${isEarlyEd ? '🎮 Game Time!' : '🧩 Activity'}\n${checkIn}`,
                    voiceType: 'professor', visualType: 'reading-book', isQuiz: false,
                    miniGame: game.type, itemReward: null as any,
                });
            });

            // Exit Ticket
            nodes.push({
                id: 'lp-exit', characterName: 'Professor Grace',
                text: `${isEarlyEd ? '⏰ Exit Ticket Time!' : '📝 EXIT TICKET (5 minutes)'}\n${plan.exitTicket.prompt}`,
                voiceType: 'professor', visualType: 'math-geometry',
                isQuiz: plan.exitTicket.type === 'multiple-choice',
                question: plan.exitTicket.type === 'multiple-choice' ? plan.exitTicket.prompt : undefined,
                options: plan.exitTicket.options,
                correctIndex: plan.exitTicket.correctIndex,
                itemReward: null as any,
            });

            // Closing
            nodes.push({
                id: 'lp-closing', characterName: 'Professor Grace',
                text: `${plan.teacherScript.closingWords}\n\nLesson complete, ${studentName}! ${isEarlyEd ? '⭐🎉' : '🎓'}`,
                voiceType: 'professor', visualType: 'reading-book', isQuiz: false,
                itemReward: 'Knowledge Star' as any,
            });

            return nodes;
        };

        /**
         * Fallback: builds a content-rich lesson aligned to the Core Knowledge unit title.
         * Follows Teacher Guide Architecture: Scope → Hook → Activities → Comprehension Checks.
         */
        const buildFallbackLesson = (rawSubject: string): DialogueNode[] => {
            const cleaned = rawSubject.replace('dynamic:', '').replace(/-/g, ' ');
            // Extract a meaningful topic from the full unit title
            const unitMatch = cleaned.match(/(?:Unit \d+:?\s*)?(.*)/i);
            const topic = unitMatch ? unitMatch[1].trim() : cleaned;

            const nodes: DialogueNode[] = [
                // Node 1 — Welcome
                { id: "fb-1", characterName: "Professor Grace",
                  text: `Hey ${studentName}! 👋 Today we're exploring "${topic}" — this is going to be really cool. Let's jump in!`,
                  voiceType: "professor", visualType: "reading-book", isQuiz: false, miniGame: undefined, itemReward: null as any },

                // Node 2 — Hook
                { id: "fb-2", characterName: "Professor Grace",
                  text: `Here's something interesting about "${topic}" — did you know this connects to things you see every single day?\n\nThink about it for a second. What do you already know about this? Hold that thought — I'm about to blow your mind! 🤯`,
                  voiceType: "professor", visualType: "reading-book", isQuiz: false, miniGame: undefined, itemReward: null as any },

                // Node 3 — Vocabulary Building
                { id: "fb-3", characterName: "Professor Grace",
                  text: `Let's learn some key words for "${topic}". Strong readers are strong word-learners! Unscramble the letters to reveal an important term.`,
                  voiceType: "professor", visualType: "science-atom", isQuiz: false, miniGame: "wordScramble", itemReward: null as any },

                // Node 4 — Guided Practice / Matching
                { id: "fb-4", characterName: "Professor Grace",
                  text: `Nice work! Now let's connect the dots. Match each term with its meaning — you've got this! 💪`,
                  voiceType: "professor", visualType: "reading-book", isQuiz: false, miniGame: "matchPairs", itemReward: null as any },

                // Node 5 — Fill in the Blanks
                { id: "fb-5", characterName: "Professor Grace",
                  text: `Almost there! Fill in the blanks to complete these sentences about "${topic}". Use what you just learned.`,
                  voiceType: "professor", visualType: "reading-book", isQuiz: false, miniGame: "fillBlank", itemReward: null as any },

                // Node 6 — Closing
                { id: "fb-6", characterName: "Professor Grace",
                  text: `🎓 You did it, ${studentName}!\n\nToday you learned about "${topic}" — and you crushed it.\n\nRemember: every lesson builds on the last one. The more you learn, the more connections you'll see everywhere. Your family is going to be SO proud! ⭐`,
                  voiceType: "professor", visualType: "reading-book", isQuiz: false, itemReward: "Knowledge Star" as any },
            ];
            return nodes;
        };

        const initializeCurriculum = async () => {
            setIsLoading(true);
            try {
                /**
                 * Pass the teacher guide URL alongside the subject so the AI can
                 * scrape real Core Knowledge content instead of making things up.
                 */
                const { data, error } = await supabase.functions.invoke('generate-lesson', {
                    body: {
                        subject: subjectId.replace('dynamic:', '').replace(/-/g, ' '),
                        gradeLevel,
                        studentName,
                        teacherGuideUrl: teacherGuideUrl || undefined,
                    }
                });
                if (error || !data || !data.nodes) throw new Error('Fallback');
                setStoryNodes(data.nodes);
                // Extract lesson-level PDF resources (Activity Book, Study Guide)
                if (data.pdfResources && Array.isArray(data.pdfResources)) {
                    setLessonPdfs(data.pdfResources);
                }
                if (data.lessonInfo) {
                    setLessonInfo(data.lessonInfo);
                }
            } catch(e) {
                // Fallback: content-rich lesson from unit title
                setStoryNodes(buildFallbackLesson(subjectId));
            }
            setIsLoading(false);
        };
        initializeCurriculum();
    }, [subjectId, gradeLevel, studentName, teacherGuideUrl]);

    const currentNode = storyNodes && storyNodes.length > 0 ? storyNodes[currentNodeIndex] : undefined;

    useEffect(() => {
        if (isComplete) return;
        let cancelled = false;
        
        /**
         * Speak text using the unified VoiceService (ElevenLabs → Kokoro → Web Speech).
         * The isTalking state is synced via callbacks so Professor Grace animates correctly.
         */
        const playDynamicAudio = async (text: string, _voiceType: string) => {
            killAllAudio();
            if (cancelled) return;
            await voiceSpeak(text, {
                onStart: () => { if (!cancelled) setIsTalking(true); },
                onEnd: () => { if (!cancelled) setIsTalking(false); },
            });
        };

        const loadDynamicImage = async (query: string) => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 4000); // 4s max
                const { data, error } = await supabase.functions.invoke('generate-image', { 
                    body: { prompt: query },
                });
                clearTimeout(timeout);
                if (cancelled) return;
                if (error || !data || !data.imageBase64) throw new Error("Imagen Fallback");
                setDynamicImageUrl(`data:image/jpeg;base64,${data.imageBase64}`);
            } catch(e) {
                if (!cancelled) setDynamicImageUrl(null);
            }
        };

        if (currentNode) {
            playDynamicAudio(currentNode.question || currentNode.text || "Let's continue.", currentNode.voiceType || "narrator");
            const safeText = currentNode.text || "lesson material";
            const imageQuery = (currentNode as any).imagePrompt || currentNode.visualType?.replace('video-', '') || 'educational children book illustration of ' + safeText.substring(0, 50);
            loadDynamicImage(imageQuery);
            if (currentNode.itemReward) setEarnedItem(currentNode.itemReward);
        } else {
            setDynamicImageUrl(null);
        }

        return () => { cancelled = true; };
    }, [currentNode, isComplete]);

    const handleAskSubmit = async (overrideText?: string) => {
        const textToSubmit = overrideText && typeof overrideText === 'string' ? overrideText : askInput;
        if (!textToSubmit.trim()) return;
        setIsAsking(true);
        SoundManager.playClick();
        
        /** Speak via unified VoiceService (ElevenLabs → Kokoro → Web Speech) */
        const speakText = async (text: string) => {
            await voiceSpeak(text, {
                onStart: () => setIsTalking(true),
                onEnd: () => setIsTalking(false),
            });
        };

        try {
            const newHistory = [...askHistory, { role: 'student' as const, text: textToSubmit }];
            setAskHistory(newHistory);
            setAskInput('');
            const { data, error } = await supabase.functions.invoke('ask-professor', {
                body: { question: textToSubmit, context: currentNode?.text || "", gradeLevel: gradeLevel, studentName, chatHistory: newHistory.slice(0, -1) }
            });
            if (error || !data || data.error) throw new Error("Failed to ask");
            setAskHistory(prev => [...prev, { role: 'tutor', text: data.response }]);
            await speakText(data.response);
        } catch (e) {
            const fallbackMsg = "I'm sorry, I'm having trouble connecting to my database right now!";
            setAskHistory(prev => [...prev, { role: 'tutor', text: fallbackMsg }]);
            await speakText(fallbackMsg);
        }
        setIsAsking(false);
    };



    const handleListen = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            SoundManager.playClick();
            if (askAudioRef.current) {
                askAudioRef.current.pause();
            }
            SoundManager.stopAll(); // Interrupts Professor Grace
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setAskInput(transcript);
            handleAskSubmit(transcript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleHint = async () => {
        setIsAskModalOpen(true);
        setIsAsking(true);
        SoundManager.playClick();
        
        try {
            const session = await supabase.auth.getSession();
            const studentName = session.data.session?.user?.email?.split('@')[0] || 'Darius';
            
            const hintPrompt = "I need a hint for this question.";
            const newHistory = [...askHistory, { role: 'student' as const, text: hintPrompt }];
            setAskHistory(newHistory);
            
            const { data, error } = await supabase.functions.invoke('ask-professor', {
                body: { 
                    question: hintPrompt, 
                    context: currentNode?.text || "",
                    gradeLevel: gradeLevel,
                    studentName,
                    chatHistory: newHistory.slice(0, -1),
                    isHint: true
                }
            });

            if (error || !data || data.error) throw new Error("Failed to ask");
            
            setAskHistory(prev => [...prev, { role: 'tutor', text: data.response }]);
            
            // Speak via unified VoiceService
            await voiceSpeak(data.response, {
                onStart: () => setIsTalking(true),
                onEnd: () => setIsTalking(false),
            });
        } catch(e) {
            console.error("Hint failed", e);
        }
        setIsAsking(false);
    };

    useEffect(() => {
        if (!isAskModalOpen) {
            setAskInput('');
            setAskHistory([]);
            if (askAudioRef.current) askAudioRef.current.pause();
            SoundManager.stopAll();
        }
    }, [isAskModalOpen]);

    useEffect(() => {
        setShowHintArrow(false);
        const currentNode = storyNodes[currentNodeIndex];
        if (currentNode?.isQuiz || currentNode?.isMathInput) {
            const timer = setTimeout(() => {
                setShowHintArrow(true);
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [currentNodeIndex, storyNodes]);

    // Timer effect for skip protection
    useEffect(() => {
        setTimeSpent(0);
        setSkipAttempts(0);
        setSkipQuizData(null);
        setIsSkipQuizActive(false);

        const interval = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [currentNodeIndex]);

    /** Force-stop ALL audio: Web Speech, ElevenLabs Audio elements, Kokoro Audio elements */
    const killAllAudio = () => {
        // Stop all VoiceService audio (handles Web Speech, ElevenLabs, Kokoro)
        stopSpeaking();
        // Stop any legacy tracked Audio elements
        activeAudioRefs.current.forEach(a => { try { a.pause(); a.currentTime = 0; } catch {} });
        activeAudioRefs.current = [];
        setIsTalking(false);
    };

    const handleNext = async () => {
        SoundManager.playClick();
        
        if (!currentNode) return;
        
        // --- Skip Protection Logic ---
        if (!currentNode.isQuiz && !currentNode.miniGame && !isSkipQuizActive && currentNode.id !== 'lp-closing') {
            const wordCount = currentNode.text.split(' ').length;
            // 3 words per second, min 5 seconds
            const minimumTime = Math.max(5, Math.floor(wordCount * 0.33));
            
            if (timeSpent < minimumTime) {
                if (skipAttempts === 0) {
                    setSkipAttempts(1);
                    alert("Actually read the lesson! You are trying to skip too fast.");
                    try {
                        await supabase.from('student_progress').insert([{
                            student_name: studentName,
                            subject: '[ALERT] Skipped Reading',
                            topic: `Tried to skip page ${currentNodeIndex + 1} (${wordCount} words) after only ${timeSpent}s.`,
                            score: 0,
                            completed_at: new Date().toISOString()
                        }]);
                    } catch (e) {}
                    return; // Block skipping
                } else {
                    // Second offense -> lock them into a quiz
                    setIsSkipQuizLoading(true);
                    try {
                        const { data, error } = await supabase.functions.invoke('generate-skip-quiz', {
                            body: { text: currentNode.text }
                        });
                        if (!error && data && data.question) {
                            setSkipQuizData(data);
                            setIsSkipQuizActive(true);
                        } else {
                            alert("Actually read the lesson! (No skip-quiz fallback)");
                        }
                    } catch (e) {
                        alert("Actually read the lesson!");
                    }
                    setIsSkipQuizLoading(false);
                    return; // Block skipping
                }
            }
        }
        // --- End Skip Protection Logic ---

        killAllAudio();
        if (currentNode.nextNodeId === 'end') { handleComplete(); return; }
        
        // Reset state for next node
        setShowQuizResult(null);
        setMathInputValue('');
        
        if (currentNode.nextNodeId) {
            const nextIndex = storyNodes.findIndex(n => n.id === currentNode.nextNodeId);
            if (nextIndex !== -1) {
                setCurrentNodeIndex(nextIndex);
            } else if (currentNodeIndex < storyNodes.length - 1) {
                setCurrentNodeIndex(currentNodeIndex + 1);
            } else {
                handleComplete();
            }
        } else {
            if (currentNodeIndex < storyNodes.length - 1) setCurrentNodeIndex(currentNodeIndex + 1); else handleComplete();
        }
    };

    const handleBack = () => {
        SoundManager.playClick();
        killAllAudio();
        if (currentNodeIndex > 0) {
            setShowQuizResult(null);
            setMathInputValue('');
            setCurrentNodeIndex(currentNodeIndex - 1);
        }
    };

    const handleQuizAnswer = async (index: number) => {
        if (!currentNode) return;

        // "I don't understand" is always the last option (index 4) — open help instead of marking wrong
        if (currentNode.options && index === currentNode.options.length - 1 && currentNode.options[index]?.toLowerCase().includes("don't understand")) {
            SoundManager.playCharacterVoice("No problem! Let me break this down for you.", "professor");
            handleHint();
            return;
        }

        if (currentNode.branchTargets && currentNode.branchTargets[index]) {
            SoundManager.playCharacterVoice("Understood.", "professor");
            const targetId = currentNode.branchTargets[index];
            const nextIndex = storyNodes.findIndex(n => n.id === targetId);
            if (nextIndex !== -1) {
                setTimeout(() => setCurrentNodeIndex(nextIndex), 1000);
            }
        } else if (currentNode.correctIndex !== undefined) {
            if (index === currentNode.correctIndex) {
                SoundManager.playReward();
                SoundManager.playCharacterVoice("Correct! Excellent job.", "professor");
                setShowQuizResult('correct');
                const newStreak = correctStreak + 1;
                setCorrectStreak(newStreak);
                if (newStreak >= 3) {
                    SoundManager.playStreakNotification();
                }
                setTimeout(() => {
                    setShowQuizResult(null);
                    handleNext();
                }, 2000);
            } else {
                SoundManager.playError();
                SoundManager.playCharacterVoice("That is incorrect. Let's think about this carefully.", "narrator");
                setScore(prev => Math.max(0, prev - 10));
                setCorrectStreak(0);
                setShowQuizResult('incorrect');
                
                try {
                    const chosenOption = currentNode.options ? currentNode.options[index] : "";
                    
                    const { data } = await supabase.functions.invoke('ask-professor', {
                        body: { 
                            question: `The student chose the wrong answer "${chosenOption}" to the quiz question "${currentNode.question}". Please generate a brief 2-sentence mini-lesson explaining exactly why that is wrong and what the correct concept is.`, 
                            context: currentNode.text || "",
                            gradeLevel: gradeLevel,
                            studentName: studentName
                        }
                    });

                    if (data && data.answer) {
                        const miniLessonNode: DialogueNode = {
                            id: 'mini-lesson-' + Date.now(),
                            characterName: 'Professor Grace',
                            text: data.answer,
                            voiceType: 'professor',
                            visualType: currentNode.visualType,
                            nextNodeId: currentNode.id // Loop back to the quiz!
                        };
                        setStoryNodes(prev => {
                            const newNodes = [...prev];
                            newNodes.splice(currentNodeIndex + 1, 0, miniLessonNode);
                            return newNodes;
                        });
                        setShowQuizResult(null);
                        handleNext(); // Move to the mini-lesson
                    } else {
                        throw new Error("Failed to generate mini-lesson");
                    }
                } catch (e) {
                    console.error("Mini-lesson fallback", e);
                    setTimeout(() => { setShowQuizResult(null); }, 1500);
                }
            }
        } else {
            handleNext();
        }
    };

    const handleMathSubmit = () => {
        if (!currentNode) return;
        
        const cleanInput = mathInputValue.replace(/\s+/g, '').toLowerCase();
        const cleanAnswer = currentNode.correctAnswer?.replace(/\s+/g, '').toLowerCase();
        
        let isCorrect = (cleanInput === cleanAnswer);
        if (!isCorrect && !isNaN(Number(cleanInput)) && !isNaN(Number(cleanAnswer))) {
            if (Number(cleanInput) === Number(cleanAnswer)) isCorrect = true;
        }
        
        if (isCorrect) {
            setScore(prev => Math.min(100, prev + 5));
            setShowQuizResult('correct');
            SoundManager.playReward();
            setCorrectStreak(prev => prev + 1);
            setTimeout(() => {
                setShowQuizResult(null);
                setMathInputValue('');
                handleNext();
            }, 2000);
        } else {
            SoundManager.playError();
            setShowQuizResult('incorrect');
            setScore(prev => Math.max(0, prev - 10));
            setCorrectStreak(0);
            setTimeout(() => setShowQuizResult(null), 2000);
        }
    };

    const handleComplete = async () => {
        if (bgMusicRef.current) bgMusicRef.current.pause();
        setIsComplete(true);
        SoundManager.playLevelUp();
        
        const cleanSubject = subjectId.replace('dynamic:', '');
        const isPassed = score >= 70;

        /**
         * Save lesson completion to localStorage for local progress tracking.
         * This powers the lesson-locking system on the dashboard and
         * works even when Supabase is offline.
         */
        const storageKey = `jaxon-academy-completed-${studentName}`;
        const completedSet: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (!completedSet.includes(subjectId) && isPassed) {
            completedSet.push(subjectId);
            localStorage.setItem(storageKey, JSON.stringify(completedSet));
        }

        try {
            /**
             * Save lesson completion to student_progress.
             * - `subject`: human-readable subject name (e.g., "Phonics & Word Study Alphabet")
             * - `topic`: the full dynamicQuery for per-lesson tracking
             * - `score`: 0–100 percentage
             */
            const { error: progressError } = await supabase.from('student_progress').insert([{
                student_name: studentName,
                subject: cleanSubject,
                topic: subjectId,
                score: score,
                completed_at: new Date().toISOString()
            }]);
            if (progressError) console.error("Progress sync error:", progressError);

            // Mark Principal-assigned task complete if it exists
            await ParentManager.completeAssignmentBySubject(studentName, subjectId);

            // Grant backpack item if earned and lesson passed
            if (earnedItem && isPassed) {
                await ParentManager.grantItem(studentName, earnedItem);
            }
        } catch(e) {
            console.error("Failed to sync progress to Parent Portal:", e);
        }

        setShowTutor(false);
        
        if (isPassed) {
            SoundManager.playCharacterVoice("Lesson complete. Splendid work today.", "professor");
        } else {
            SoundManager.playCharacterVoice("Module failed. You will need to review this material.", "professor");
        }
    };

    if (showTutor) {
        return (
            <div className="absolute inset-0 z-50 bg-[#040714]">
                <MultiDraftTutor 
                    studentName={studentName}
                    assignmentId={subjectId.replace('dynamic:', '')}
                    onExit={handleComplete}
                />
            </div>
        );
    }

    if (isComplete) {
        const isPassed = score >= 70;
        return (
            <div className={`w-full h-[80vh] rounded-3xl overflow-hidden relative flex flex-col items-center justify-center border-2 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-in zoom-in duration-700 ${isPassed ? 'bg-gradient-to-br from-slate-900 to-black' : 'bg-gradient-to-br from-rose-950 to-black'}`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                <div className="z-10 text-center animate-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both flex flex-col items-center">
                    <h2 className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r mb-6 drop-shadow-lg ${isPassed ? 'from-blue-400 to-emerald-400' : 'from-rose-400 to-orange-400'}`}>
                        {isPassed ? "Lesson Complete!" : "Module Failed"}
                    </h2>
                    <p className="text-2xl text-slate-300 font-medium mb-8">Academic Score: <span className={`font-bold ${isPassed ? 'text-white' : 'text-rose-400'}`}>{score}%</span></p>
                    
                    {earnedItem && isPassed && (
                        <div className="mb-10 animate-in zoom-in slide-in-from-bottom-4 duration-700 delay-700 p-6 bg-yellow-500/10 border border-yellow-500/50 rounded-2xl">
                            <h3 className="text-yellow-400 font-extrabold uppercase tracking-widest text-sm mb-2">New Reward Unlocked!</h3>
                            <div className="text-6xl drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">✨</div>
                            <p className="text-white font-bold mt-2">Check your Backpack!</p>
                        </div>
                    )}

                    <button 
                        onClick={onBack}
                        className="px-10 py-5 bg-white text-black font-extrabold text-xl rounded-full hover:bg-slate-300 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95"
                    >
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="w-full h-[80vh] rounded-3xl overflow-hidden relative flex flex-col items-center justify-center border-2 border-white/20 shadow-2xl bg-[#040714] animate-in zoom-in duration-700">
                <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                <h2 className="text-3xl font-extrabold text-white tracking-widest animate-pulse drop-shadow-lg">ACCESSING UNIVERSAL DATABASE...</h2>
                <p className="text-indigo-400 mt-4 font-mono">Synthesizing dynamic curriculum. Please hold.</p>
            </div>
        );
    }

    if (!currentNode) return null;

    /** Build chapter entries for the lesson jump list */
    const chapterEntries = lessonInfo?.totalLessons
        ? Array.from({ length: lessonInfo.totalLessons }, (_, i) => ({
            label: `Lesson ${i + 1}`,
            page: Math.max(1, Math.round((i / lessonInfo.totalLessons!) * 100) + 3),
        }))
        : [];

    return (
        <div className={`w-full h-[80vh] flex gap-0 transition-all duration-500 ease-out`}>
            {/* ──── LEFT: Materials Panel (only when open) ──── */}
            <AnimatePresence>
                {isMaterialsOpen && lessonPdfs.length > 0 && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '55%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full flex flex-col bg-[#0a0e1a] border-2 border-indigo-500/30 rounded-l-3xl overflow-hidden shrink-0"
                    >
                        {/* Panel Header */}
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-indigo-500/20 bg-[#0d1225] shrink-0">
                            <span className="text-base">📚</span>
                            <h3 className="text-sm font-bold text-white flex-1 truncate">Lesson Materials</h3>
                            <button
                                onClick={() => setIsMaterialsOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-500/80 text-slate-400 hover:text-white text-sm transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Chapter Jump List */}
                        {chapterEntries.length > 0 && (
                            <div className="px-3 py-2 border-b border-indigo-500/20 bg-amber-500/5 shrink-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs">📖</span>
                                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                                        Jump to Lesson {lessonInfo?.totalLessons ? `(${lessonInfo.totalLessons} total)` : ''}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {chapterEntries.map((ch, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                // Reload iframe with page anchor
                                                const pdf = lessonPdfs[activePdfIndex];
                                                if (pdf) {
                                                    const iframe = document.getElementById('materials-pdf-viewer') as HTMLIFrameElement;
                                                    if (iframe) {
                                                        iframe.src = `${pdf.url}#page=${ch.page}`;
                                                    }
                                                }
                                            }}
                                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 transition-all hover:scale-105 active:scale-95"
                                        >
                                            {ch.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PDF Tabs (Activity Book / Study Guide) */}
                        {lessonPdfs.length > 1 && (
                            <div className="flex border-b border-indigo-500/20 shrink-0">
                                {lessonPdfs.map((pdf, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActivePdfIndex(idx)}
                                        className={`flex-1 px-3 py-2 text-xs font-semibold transition-all ${
                                            activePdfIndex === idx
                                                ? 'text-indigo-300 border-b-2 border-indigo-400 bg-indigo-500/10'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                        }`}
                                    >
                                        📄 {pdf.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* PDF Viewer — direct embed for native controls (zoom, search, page nav) */}
                        <div className="flex-1 min-h-0">
                            <iframe
                                id="materials-pdf-viewer"
                                key={lessonPdfs[activePdfIndex]?.url}
                                src={lessonPdfs[activePdfIndex]?.url || ''}
                                className="w-full h-full bg-white"
                                title={lessonPdfs[activePdfIndex]?.label || 'Materials'}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ──── RIGHT: Lesson Container (shrinks when materials are open) ──── */}
            <div 
                className={`h-full rounded-3xl overflow-hidden relative flex flex-col justify-end border-2 border-white/20 shadow-2xl animate-in zoom-in duration-700 transition-all duration-500 ${
                    isMaterialsOpen && lessonPdfs.length > 0 ? 'flex-1 rounded-l-none border-l-0' : 'w-full'
                }`}
                style={{ background: currentNode?.backgroundUrl || '#040714' }}
            >
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {dynamicImageUrl ? (
                        <div className="w-full h-full p-12 flex items-center justify-center bg-slate-900/40">
                            <img
                                src={dynamicImageUrl}
                                alt="Lesson Illustration"
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-700/50 pointer-events-none animate-in zoom-in duration-1000"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-[#040714]" />
                    )}
                </div>

                <div className="absolute top-0 left-0 w-full h-2 bg-white/10 z-50">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(74,222,128,0.5)]" 
                        style={{ width: `${Math.max(5, (currentNodeIndex / storyNodes.length) * 100)}%` }}
                    ></div>
                </div>
                
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>

                {/* Open Materials Button — inside the lesson area */}
                {lessonPdfs.length > 0 && !isMaterialsOpen && (
                    <button
                        onClick={() => setIsMaterialsOpen(true)}
                        className="absolute bottom-6 left-6 z-40 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    >
                        📚 Open Materials
                    </button>
                )}

                {/* Content Container (Avatar + Dialogue) */}
                <div className="relative z-30 w-full mt-auto flex flex-col md:flex-row items-end pb-8 px-4 md:px-12 gap-8 max-w-7xl mx-auto">
                    
                    {/* Character Sprite — hidden when materials panel is open to save space */}
                    {!isMaterialsOpen && (
                        <div className="hidden md:flex w-1/3 max-w-[350px] items-end justify-center shrink-0 h-[60vh] relative pointer-events-none">
                            <div className="flex flex-col items-center gap-4 animate-grace-entrance">
                                {/* Avatar with animated glow ring */}
                                <div className={`relative w-52 h-52 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isTalking ? 'animate-grace-talk animate-glow-ring' : 'animate-grace-idle'
                                }`}>
                                    {/* Outer glow ring */}
                                    <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                                        isTalking 
                                            ? 'bg-gradient-to-br from-indigo-500/30 to-violet-500/30 shadow-[0_0_80px_rgba(99,102,241,0.4)]' 
                                            : 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 shadow-[0_0_40px_rgba(99,102,241,0.15)]'
                                    }`} />
                                    {/* Inner avatar */}
                                    <div className="relative z-10 w-44 h-44 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-indigo-400/40 flex items-center justify-center overflow-hidden">
                                        <span className="text-8xl select-none" style={{ filter: isTalking ? 'drop-shadow(0 0 20px rgba(129,140,248,0.6))' : 'none' }}>🎓</span>
                                    </div>
                                    {/* Rotating accent ring */}
                                    <div className="absolute inset-[-4px] rounded-full border-2 border-transparent profile-ring" style={{
                                        opacity: isTalking ? 0.8 : 0.3,
                                        transition: 'opacity 0.5s',
                                    }} />
                                </div>

                                {/* Speech wave visualizer — only visible when talking */}
                                <div className={`flex items-end gap-1 h-6 transition-all duration-300 ${isTalking ? 'opacity-100' : 'opacity-0'}`}>
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} className="w-1 bg-gradient-to-t from-indigo-500 to-violet-400 rounded-full speech-wave-bar" style={{ minHeight: '4px' }} />
                                    ))}
                                </div>

                                {/* Status indicator */}
                                <div className={`text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                                    isTalking ? 'text-indigo-400' : 'text-slate-600'
                                }`}>
                                    {isTalking ? '● Speaking' : '○ Listening'}
                                </div>
                            </div>
                        </div>
                    )}

                {/* Dialogue Box */}
                <div className="w-full md:flex-1 bg-[#02040A]/80 backdrop-blur-3xl border border-indigo-500/20 p-8 md:p-12 rounded-[2.5rem] dialogue-glow relative flex flex-col max-h-[65vh]">
                    {/* Shimmer border effect */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-70"></div>
                    
                    {/* Character Name Badge */}
                    <div className="absolute -top-6 left-12 bg-gradient-to-r from-indigo-600 to-violet-700 px-10 py-2 rounded-full font-black text-xl tracking-[0.1em] text-white shadow-[0_0_30px_rgba(79,70,229,0.6)] border border-indigo-400/50 animate-badge-glow">
                        {currentNode.characterName}
                    </div>

                    {/* Ask Professor Grace Modal Trigger */}
                    <button
                        onClick={() => setIsAskModalOpen(true)}
                        className="absolute -top-5 right-12 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-400/50 text-indigo-100 px-6 py-1.5 rounded-full font-medium tracking-wide flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <HelpCircle className="w-5 h-5" />
                        Ask Professor
                    </button>


                    <div className="flex-1 overflow-y-auto pt-4 pr-2 flex flex-col justify-start custom-scrollbar relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentNode.id}
                                initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full mt-auto"
                            >
                                <p className="text-lg md:text-xl text-slate-200 leading-relaxed font-light mb-8 whitespace-pre-wrap break-words">
                                    {currentNode.text || "Generating content..."}
                                </p>

                                {/* Mini-Game rendering for interactive lesson nodes */}
                                {currentNode.miniGame ? (
                                    <div className="mt-2 pointer-events-auto">
                                        <MiniGame
                                            gameType={currentNode.miniGame}
                                            topic={(() => {
                                                const cleaned = subjectId.replace('dynamic:', '').replace(/-/g, ' ');
                                                const prefixes = ['Grammar & Composition', 'World Literature', 'Vocabulary & Spelling', 'Pre-Algebra / Algebra 1', 'Earth & Space Science', 'Life Science', 'World History', 'Civics & Government'];
                                                for (const p of prefixes) {
                                                    if (cleaned.toLowerCase().startsWith(p.toLowerCase())) return cleaned.substring(p.length).trim() || cleaned;
                                                }
                                                return cleaned.split(/\s+/).pop() || cleaned;
                                            })()}
                                            subject={subjectId.replace('dynamic:', '')}
                                            studentName={studentName}
                                            onComplete={() => handleNext()}
                                            onScoreChange={(delta) => setScore(prev => Math.max(0, Math.min(100, prev + delta)))}
                                        />
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={handleNext}
                                                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 font-medium rounded-full transition-all hover:scale-105"
                                            >
                                                Skip Game →
                                            </button>
                                        </div>
                                    </div>
                                ) : currentNode.isMathInput ? (
                                    <div className="mt-4 animate-in slide-in-from-bottom-4 duration-500">
                                        <p className="text-2xl font-bold leading-relaxed mb-6 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]">
                                            ✍️ {currentNode.question}
                                        </p>
                                        <div className="flex flex-col gap-4 max-w-lg">
                                            <input 
                                                type="text" 
                                                value={mathInputValue}
                                                onChange={(e) => setMathInputValue(e.target.value)}
                                                onKeyDown={(e) => { if(e.key === 'Enter') handleMathSubmit(); }}
                                                className="w-full bg-slate-900/80 border-2 border-indigo-500/50 text-white text-2xl px-6 py-5 min-h-[80px] rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 shadow-inner leading-normal"
                                                placeholder="Type your answer here..."
                                                autoFocus
                                            />
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={handleMathSubmit}
                                                    className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xl rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    Submit Answer
                                                </button>
                                                <button 
                                                    onClick={handleHint}
                                                    className="px-6 py-4 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-400/50 text-yellow-300 font-bold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:scale-105"
                                                    title="Get a hint without revealing the answer"
                                                >
                                                    💡 Hint
                                                </button>
                                            </div>
                                        </div>
                                        {showQuizResult === 'correct' && (
                                            <motion.div 
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                                            >
                                                <div className="flex flex-col items-center animate-in zoom-in slide-in-from-bottom-10 duration-500">
                                                    <div className="text-9xl mb-4 drop-shadow-[0_0_50px_rgba(74,222,128,1)] animate-bounce">✅</div>
                                                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 drop-shadow-2xl">BRILLIANT!</h1>
                                                </div>
                                            </motion.div>
                                        )}
                                        {showQuizResult === 'incorrect' && (
                                            <p className="text-red-400 font-bold mt-4 animate-pulse text-lg">
                                                Incorrect, try again. Make sure your spelling is correct.
                                            </p>
                                        )}
                                    </div>
                                ) : currentNode.isQuiz ? (
                                    <div className="mt-4">
                                        <p className="text-2xl font-bold leading-relaxed mb-6 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]">
                                            🤔 {currentNode.question}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {currentNode.options?.map((opt, idx) => {
                                                const isHelpOption = idx === (currentNode.options?.length || 0) - 1 && opt.toLowerCase().includes("don't understand");
                                                return (
                                                <button 
                                                    key={idx}
                                                    onClick={() => handleQuizAnswer(idx)}
                                                    className={`p-4 border rounded-xl text-left text-lg font-medium transition-all hover:scale-[1.02] ${isHelpOption ? 'md:col-span-2 bg-indigo-900/30 hover:bg-indigo-700/40 border-indigo-400/40 text-indigo-200' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}
                                                >
                                                    {isHelpOption ? '💡 ' : ''}{opt}
                                                </button>
                                            )})}
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={handleHint}
                                                className="px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-400/50 text-yellow-300 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:scale-105"
                                            >
                                                💡 Need a hint?
                                            </button>
                                        </div>
                                        {showQuizResult === 'correct' && (
                                            <motion.div 
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                                            >
                                                <div className="flex flex-col items-center animate-in zoom-in slide-in-from-bottom-10 duration-500">
                                                    <div className="text-9xl mb-4 drop-shadow-[0_0_50px_rgba(74,222,128,1)] animate-bounce">✅</div>
                                                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 drop-shadow-2xl">BRILLIANT!</h1>
                                                </div>
                                            </motion.div>
                                        )}
                                        {showQuizResult === 'incorrect' && (
                                            <p className="text-red-400 font-bold mt-4 animate-pulse">
                                                {"Incorrect, try again."}
                                            </p>
                                        )}
                                    </div>

                                ) : currentNode.isBranch ? (
                                    <div className="mt-4">
                                        <div className="flex flex-col gap-4">
                                            {currentNode.options?.map((opt, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => {
                                                        SoundManager.playClick();
                                                        const targetId = currentNode.branchTargets?.[idx];
                                                        if (targetId) {
                                                            const nextIndex = storyNodes.findIndex(n => n.id === targetId);
                                                            if (nextIndex !== -1) setCurrentNodeIndex(nextIndex);
                                                        }
                                                    }}
                                                    className="p-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 hover:from-blue-600 hover:to-indigo-600 border border-blue-400/30 rounded-xl text-left text-lg font-bold transition-all shadow-lg hover:shadow-blue-500/50 hover:translate-x-2"
                                                >
                                                    🗣️ "{opt}"
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex justify-between items-center gap-4">
                                            {/* Back button */}
                                            {currentNodeIndex > 0 && (
                                                <button 
                                                    onClick={handleBack}
                                                    className="shrink-0 px-6 py-3 bg-white/10 text-slate-300 font-semibold text-base rounded-full hover:bg-white/20 transition-colors border border-white/20 hover:scale-105 active:scale-95"
                                                >
                                                    ◀ Back
                                                </button>
                                            )}
                                            <div className="flex-1" />
                                            {/* Next button */}
                                            <button 
                                                onClick={handleNext}
                                                className="shrink-0 px-8 py-4 font-bold text-lg rounded-full transition-colors bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                                            >
                                                Next ▶
                                            </button>
                                        </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute top-6 left-6 z-40 flex gap-4">
                <div className="relative">
                    <button 
                        onClick={() => setIsAskModalOpen(true)}
                        className="px-6 py-2 bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/50 rounded-full text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                    >
                        ✋ Ask Professor
                    </button>
                    {showHintArrow && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)] pointer-events-none">
                            <span className="text-xs font-bold uppercase tracking-wider mb-1">Stuck?</span>
                            ↑
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setMusicEnabled(!musicEnabled)}
                    className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-white transition-colors"
                    title={musicEnabled ? "Mute Background Music" : "Play Background Music"}
                >
                    {musicEnabled ? "🎵" : "🔇"}
                </button>
            </div>

            {/* Ask Modal */}
            <AnimatePresence>
                {isSkipQuizActive && skipQuizData && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
                            className="bg-slate-900 border border-red-500/50 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden flex flex-col"
                        >
                            <h3 className="text-3xl font-bold text-red-400 mb-2 shrink-0">Hold on a second...</h3>
                            <p className="text-slate-300 mb-6 italic">You're skipping through the reading! Prove you read it by answering this question to continue:</p>
                            
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
                                <h4 className="text-2xl text-white font-medium mb-6">{skipQuizData.question}</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {skipQuizData.options.map((opt, idx) => (
                                        <button 
                                            key={idx}
                                            disabled={isSkipQuizLoading}
                                            onClick={() => {
                                                setIsSkipQuizLoading(true);
                                                if (idx === skipQuizData.correctIndex) {
                                                    // Pass! Let them move on
                                                    SoundManager.playReward();
                                                    setIsSkipQuizActive(false);
                                                    setTimeSpent(9999); // bypass timer for this page next click
                                                    setIsSkipQuizLoading(false);
                                                } else {
                                                    // Fail!
                                                    SoundManager.playError();
                                                    alert("See, you should have read to understand! Now try again. Nice try, you ain't slick.");
                                                    setIsSkipQuizActive(false); // Close quiz, send them back to reading
                                                    setIsSkipQuizLoading(false);
                                                }
                                            }}
                                            className="p-4 rounded-xl text-left font-bold text-lg transition-all border border-white/10 bg-white/5 hover:bg-white/20 text-white shadow-md disabled:opacity-50"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAskModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
                            className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(79,70,229,0.3)] relative overflow-hidden flex flex-col h-[80vh]"
                        >
                            <button onClick={() => { setIsAskModalOpen(false); setAskHistory([]); setAskInput(''); }} className="absolute top-4 right-6 text-white/50 hover:text-white text-2xl z-10">×</button>
                            
                            <h3 className="text-3xl font-bold text-white mb-6 shrink-0">Ask Professor Grace</h3>
                            
                            <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-4 pr-2">
                                {askHistory.length === 0 ? (
                                    <div className="text-slate-400 text-center italic mt-10">Ask Professor Grace a question or request a hint!</div>
                                ) : (
                                    askHistory.map((m, idx) => (
                                        <div key={idx} className={`flex ${m.role === 'student' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'student' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'}`}>
                                                <p className="whitespace-pre-wrap">{m.text}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="shrink-0 flex flex-col gap-4">
                                <div className="relative">
                                    <textarea 
                                        value={askInput}
                                        onChange={(e) => setAskInput(e.target.value)}
                                        placeholder="Type your question or use the microphone to interrupt..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pr-16 text-white text-lg min-h-[120px] resize-y focus:outline-none focus:border-indigo-500 custom-scrollbar"
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskSubmit(); } }}
                                    />
                                    <button 
                                        onClick={handleListen}
                                        disabled={isListening || isAsking}
                                        className={`absolute bottom-4 right-4 p-3 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-white/10 text-slate-300 hover:bg-indigo-500 hover:text-white'}`}
                                        title="Speak your question"
                                    >
                                        🎤
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleAskSubmit()}
                                    disabled={isAsking || !askInput.trim()}
                                    className="py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isAsking ? 'Professor Grace is thinking...' : 'Send Message'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
};
