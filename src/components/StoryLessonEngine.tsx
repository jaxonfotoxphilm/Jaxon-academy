import { useState, useEffect, useRef, Suspense } from 'react';
import { HelpCircle } from 'lucide-react';
import { LessonVisualizer } from './LessonVisualizer';
import { SoundManager } from '../utils/SoundManager';
import { Canvas } from '@react-three/fiber';
import { Avatar3D } from './Avatar3D';
import { Environment3D } from './Environment3D';
import { LearningProp3D } from './LearningProp3D';
import { TransparentSprite } from './TransparentSprite';
import { supabase } from '../supabaseClient';
import { ParentManager } from '../utils/ParentManager';
import { MultiDraftTutor } from './MultiDraftTutor';
import { AnimatePresence, motion } from 'framer-motion';
import lessonsData from '../data/lessons.json';
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

export const StoryLessonEngine = ({ subjectId, gradeLevel, studentName, onBack }: { subjectId: string, gradeLevel: string, studentName: string, onBack: () => void }) => {
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
    const [has3DModel, setHas3DModel] = useState(false);
    const [hasEnv3D, setHasEnv3D] = useState(false);
    const [hasProp3D, setHasProp3D] = useState(false);
    const [mathInputValue, setMathInputValue] = useState('');
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
    const [videoWatched, setVideoWatched] = useState(false);
    const [noteText, setNoteText] = useState('');
    /** Tracks all active Audio objects so we can force-stop them on navigation */
    const activeAudioRefs = useRef<HTMLAudioElement[]>([]);


    useEffect(() => {
        fetch('/grace.vrm', { method: 'HEAD' })
            .then(res => { if (res.ok && !res.headers.get('content-type')?.includes('text/html')) setHas3DModel(true); }).catch(() => {});
        fetch('/lab.glb', { method: 'HEAD' })
            .then(res => { if (res.ok && !res.headers.get('content-type')?.includes('text/html')) setHasEnv3D(true); }).catch(() => {});
        fetch('/prop.glb', { method: 'HEAD' })
            .then(res => { if (res.ok && !res.headers.get('content-type')?.includes('text/html')) setHasProp3D(true); }).catch(() => {});
    }, []);

    useEffect(() => {
        /**
         * Builds a rich 8-node interactive lesson locally when the AI backend is unavailable.
         * Uses the subjectId/dynamicQuery to extract subject name and topic,
         * then generates: Hook → YouTube Video → Word Scramble → Practice → Quiz → Fill-Blank → True/False → Synthesis
         */
        const buildOfflineLesson = (rawSubject: string): DialogueNode[] => {
            const cleaned = rawSubject.replace('dynamic:', '').replace(/-/g, ' ');
            const words = cleaned.split(/\s+/);
            let topic = words[words.length - 1] || 'this subject';
            let subjectName = cleaned;
            const prefixes = ['Language Arts', 'Science Biology', 'Science & Biology', 'Arithmetic Logic', 'Arithmetic & Logic', 'American History', 'World Geography', 'World Literature', 'Grammar Composition', 'Grammar & Composition', 'Vocabulary Spelling', 'Vocabulary & Spelling', 'Pre Algebra', 'Pre-Algebra / Algebra 1', 'Earth Space Science', 'Earth & Space Science', 'Life Science', 'World History', 'Civics Government', 'Civics & Government'];
            for (const prefix of prefixes) {
                if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
                    subjectName = prefix;
                    topic = cleaned.substring(prefix.length).trim() || topic;
                    break;
                }
            }
            if (topic.length < 2) topic = subjectName;

            /** Subject-specific YouTube search queries for high-quality educational videos */
            const youtubeQueries: Record<string, string> = {
                'Clauses': 'independent and dependent clauses grammar lesson middle school',
                'Phrases': 'types of phrases in English grammar explained',
                'Essays': 'how to write a 5 paragraph essay middle school',
                'Nouns': 'types of nouns proper common abstract grammar kids',
                'Mythology': 'Greek mythology for kids educational documentary',
                'Folklore': 'world folklore and fairy tales educational',
                'Poetry Analysis': 'how to analyze poetry middle school English',
                'Equations': 'solving one step equations algebra explained',
                'Inequalities': 'solving inequalities algebra 1 step by step',
                'Functions': 'what is a function in math explained simply',
                'Polynomials': 'polynomials explained algebra 1 lesson',
                'Graphing': 'graphing linear equations coordinate plane tutorial',
                'Ecosystems': 'ecosystems and biomes science lesson for kids',
                'Cells': 'parts of a cell biology lesson animated',
                'Genetics': 'genetics and DNA explained for middle school',
                'Geology': 'rocks and minerals earth science lesson',
                'Astronomy': 'solar system and space science educational',
                'Ancient Civilizations': 'ancient civilizations documentary for students',
                'Middle Ages': 'medieval times history lesson for kids',
                'Renaissance': 'the Renaissance period history explained',
                'Constitution': 'US Constitution explained for students',
                'Latin Roots': 'Latin and Greek roots vocabulary lesson',
                'Synonyms': 'synonyms and antonyms vocabulary building lesson',
                'Counting': 'counting and number recognition kindergarten',
                'Addition': 'addition facts math lesson for kids',
                'Subtraction': 'subtraction with regrouping explained',
            };

            const ytQuery = youtubeQueries[topic] || `${topic} ${subjectName} educational lesson ${gradeLevel}`;

            /** Subject-aware lesson content templates */
            const subjectHooks: Record<string, string> = {
                'Grammar & Composition': `Today we're exploring ${topic} — these are the building blocks that make your writing powerful. Every great author, from Shakespeare to your favorite novelist, masters ${topic.toLowerCase()} to craft sentences that captivate readers.`,
                'World Literature': `Get ready for an epic journey into ${topic}! The stories we'll explore today have been told for thousands of years, shaping cultures and inspiring generations. These tales are some of the most important in human history.`,
                'Pre-Algebra / Algebra 1': `Math time! Today's topic is ${topic}. I know math can feel intimidating, but here's the secret — ${topic.toLowerCase()} is actually a puzzle, and once you see the pattern, you'll feel like a genius. Let's crack the code together!`,
                'Earth & Space Science': `${studentName}, imagine you're an explorer charting unknown territory — that's exactly what we're doing today as we dive into ${topic}! Scientists spend their entire careers studying this, and you're about to learn the fundamentals that make it all click.`,
                'Life Science': `Welcome to the incredible world of ${topic}! Biology is the study of life itself, and ${topic.toLowerCase()} is one of the most fascinating chapters. What you learn today connects directly to how your own body works.`,
                'World History': `Step into the time machine, ${studentName}! Today we're traveling back to explore ${topic}. The events and people we'll learn about shaped the entire modern world — and some of it will absolutely blow your mind.`,
                'Vocabulary & Spelling': `Words are power, ${studentName}! Today we're studying ${topic}, and these are the secret weapons that make you sound brilliant in conversations and essays. Once you master these, you'll start noticing them everywhere.`,
            };

            const hookText = subjectHooks[subjectName] || `Today we're diving into an exciting topic in ${subjectName}: ${topic}. This connects to everything you've been learning, and I promise — by the end of this lesson, you'll see the world a little differently!`;

            return [
                {
                    id: "offline-1",
                    characterName: "Professor Grace",
                    text: `Good morning, ${studentName}! ${hookText} Your family would be so proud that you're tackling this today. Let's get started! 📚`,
                    voiceType: "professor",
                    visualType: "reading-book",
                    isQuiz: false,
                    itemReward: null as any
                },
                {
                    id: "offline-2",
                    characterName: "Professor Grace",
                    text: `Before I teach you the details, let's watch a short video about ${topic}. Pay close attention — I'm going to quiz you on what you see! Take notes if you can. After the video, we'll dive into some hands-on activities. 🎬`,
                    voiceType: "professor",
                    visualType: "video-nature",
                    isQuiz: false,
                    youtubeSearchQuery: ytQuery,
                    itemReward: null as any
                },
                {
                    id: "offline-3",
                    characterName: "Professor Grace",
                    text: `Great video, right? Now let's test your vocabulary with a quick word scramble! Unscramble the letters to form a key term from our lesson on ${topic}. 🔤`,
                    voiceType: "professor",
                    visualType: "science-atom",
                    isQuiz: false,
                    miniGame: "wordScramble",
                    itemReward: null as any
                },
                {
                    id: "offline-4",
                    characterName: "Professor Grace",
                    text: `Excellent work on that scramble, ${studentName}! Now let's connect what you've learned to the bigger picture. Think about ${topic.toLowerCase()} — it's not just something in a textbook. It shows up in your daily life, in the news, in the world around you. The best scholars are the ones who can see these connections. Can you think of where you've seen ${topic.toLowerCase()} in action? 🤔`,
                    voiceType: "professor",
                    visualType: "history-scroll",
                    isQuiz: false,
                    itemReward: null as any
                },
                {
                    id: "offline-5",
                    characterName: "Professor Grace",
                    text: `Time for a knowledge check! Let's see what you've learned about ${topic}. Read each option carefully — remember, the best answer isn't always the most obvious one. 🎯`,
                    voiceType: "professor",
                    visualType: "math-geometry",
                    isQuiz: true,
                    question: `Based on what you've learned, which statement about ${topic} is most accurate?`,
                    options: [
                        `${topic} is only relevant in academic settings and has no real-world application`,
                        `Understanding ${topic} builds foundational knowledge that connects to advanced concepts across ${subjectName}`,
                        `${topic} was only recently added to educational curricula and has limited importance`,
                        `${topic} is mainly memorization and doesn't require critical thinking`,
                        `I don't understand, break it down for me`
                    ],
                    correctIndex: 1,
                    itemReward: null as any
                },
                {
                    id: "offline-6",
                    characterName: "Professor Grace",
                    text: `Now let's fill in some blanks! Complete each sentence using what you've learned about ${topic}. This is how real scholars reinforce their knowledge — by putting concepts into their own words. ✍️`,
                    voiceType: "professor",
                    visualType: "reading-book",
                    isQuiz: false,
                    miniGame: "fillBlank",
                    itemReward: null as any
                },
                {
                    id: "offline-7",
                    characterName: "Professor Grace",
                    text: `Lightning round! True or false — how fast can you go? This tests your instincts and deep understanding of ${topic}. Trust what you've learned! ⚡`,
                    voiceType: "professor",
                    visualType: "science-atom",
                    isQuiz: false,
                    miniGame: "trueFalse",
                    itemReward: null as any
                },
                {
                    id: "offline-8",
                    characterName: "Professor Grace",
                    text: `Outstanding work today, ${studentName}! 🌟 You've watched an educational video, unscrambled vocabulary, answered quiz questions, filled in blanks, and crushed a lightning round — all on ${topic} in ${subjectName}. That's the kind of dedication that makes a true scholar. Your family would be so proud. Tomorrow, we'll build on everything you've learned today. Keep being amazing! 🎓`,
                    voiceType: "professor",
                    visualType: "video-space",
                    isQuiz: false,
                    itemReward: "Knowledge Star" as any
                }
            ];
        };

        const initializeCurriculum = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.functions.invoke('generate-lesson', {
                    body: { subject: subjectId.replace('dynamic:', '').replace(/-/g, ' '), gradeLevel: gradeLevel, studentName: studentName }
                });

                if (error || !data || !data.nodes) throw new Error("Fallback");
                setStoryNodes(data.nodes);
            } catch(e) {
                // Check for static lesson data first
                const staticNodes = (lessonsData as Record<string, DialogueNode[]>)[subjectId];
                if (staticNodes && staticNodes.length > 1) {
                    setStoryNodes(staticNodes);
                } else {
                    // Build a proper curriculum-driven offline lesson
                    setStoryNodes(buildOfflineLesson(subjectId));
                }
            }
            setIsLoading(false);
        };
        initializeCurriculum();
    }, [subjectId, gradeLevel, studentName]);

    const currentNode = storyNodes && storyNodes.length > 0 ? storyNodes[currentNodeIndex] : undefined;

    useEffect(() => {
        if (isComplete) return;
        
        const playDynamicAudio = async (text: string, voiceType: string) => {
            // Stop any previous audio first
            killAllAudio();
            
            // First try the premium cloud TTS, if it fails immediately fallback to local storytelling voice
            try {
                const { data, error } = await supabase.functions.invoke('generate-tts', { body: { text } });
                if (error || !data || !data.audioContent) throw new Error("TTS Fallback");
                const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
                activeAudioRefs.current.push(audio);
                audio.addEventListener('play', () => setIsTalking(true));
                audio.addEventListener('ended', () => { setIsTalking(false); activeAudioRefs.current = activeAudioRefs.current.filter(a => a !== audio); });
                audio.addEventListener('pause', () => setIsTalking(false));
                audio.play();
            } catch(e) {
                console.warn("Cloud TTS failed or unavailable, using high-quality local browser TTS.");
                setIsTalking(true);
                SoundManager.playCharacterVoice(text, voiceType as any);
                // Rough estimate for lip sync timing
                setTimeout(() => setIsTalking(false), text.length * 60);
            }
        };

        const loadDynamicImage = async (query: string) => {
            try {
                const { data, error } = await supabase.functions.invoke('generate-image', { body: { prompt: query } });
                if (error || !data || !data.imageBase64) throw new Error("Imagen Fallback");
                setDynamicImageUrl(`data:image/jpeg;base64,${data.imageBase64}`);
            } catch(e) {
                setDynamicImageUrl(null);
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
    }, [currentNode, isComplete]);

    const handleAskSubmit = async (overrideText?: string) => {
        const textToSubmit = overrideText && typeof overrideText === 'string' ? overrideText : askInput;
        if (!textToSubmit.trim()) return;
        setIsAsking(true);
        SoundManager.playClick();
        
        const speakText = async (text: string) => {
            try {
                const tts = await supabase.functions.invoke('generate-tts', { body: { text } });
                if (tts.data && tts.data.audioContent) {
                    const audio = new Audio("data:audio/mp3;base64," + tts.data.audioContent);
                    askAudioRef.current = audio;
                    audio.addEventListener('play', () => setIsTalking(true));
                    audio.addEventListener('ended', () => setIsTalking(false));
                    audio.addEventListener('pause', () => setIsTalking(false));
                    audio.play();
                } else {
                    throw new Error("TTS API Error");
                }
            } catch(e) {
                setIsTalking(true);
                SoundManager.playCharacterVoice(text, 'professor');
                setTimeout(() => setIsTalking(false), text.length * 50);
            }
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

    const handlePopQuiz = async () => {
        if (!currentNode) return;
        setIsLoadingQuiz(true);
        SoundManager.playClick();
        try {
            const { data, error } = await supabase.functions.invoke('generate-lesson', {
                body: { 
                    subject: `Pop Quiz on: ${currentNode.text.substring(0, 100)}`, 
                    gradeLevel: gradeLevel, 
                    studentName: studentName 
                }
            });
            if (error || !data || !data.nodes) throw new Error("Failed to generate pop quiz");
            
            const quizNodes = data.nodes;
            if (quizNodes && quizNodes.length > 0) {
                const newNodeId = quizNodes[0].id;
                const lastQuizNode = quizNodes[quizNodes.length - 1];
                lastQuizNode.nextNodeId = currentNode.nextNodeId || (storyNodes[currentNodeIndex + 1]?.id) || 'end';

                const newStoryNodes = [...storyNodes];
                newStoryNodes[currentNodeIndex] = { ...currentNode, nextNodeId: newNodeId };
                newStoryNodes.splice(currentNodeIndex + 1, 0, ...quizNodes);
                setStoryNodes(newStoryNodes);
                
                setTimeout(() => handleNext(), 100);
                SoundManager.playCharacterVoice("Let's see what you remember. Pop quiz time!", "professor");
            }
        } catch(e) {
            console.error(e);
            alert("Professor Grace is too busy grading papers to make a quiz right now!");
        }
        setIsLoadingQuiz(false);
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
            
            // Speak text directly
            const tts = await supabase.functions.invoke('generate-tts', { body: { text: data.response } });
            if (tts.data && tts.data.audioContent) {
                const audio = new Audio("data:audio/mp3;base64," + tts.data.audioContent);
                askAudioRef.current = audio;
                audio.play();
            }
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

    /** Force-stop ALL audio: Web Speech, ElevenLabs Audio elements, Kokoro Audio elements */
    const killAllAudio = () => {
        // Stop Web Speech API
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        // Stop all tracked Audio elements (ElevenLabs / Kokoro / Cloud TTS)
        activeAudioRefs.current.forEach(a => { try { a.pause(); a.currentTime = 0; } catch {} });
        activeAudioRefs.current = [];
        // Also stop VoiceService audio
        import('../utils/VoiceService').then(({ stopSpeaking }) => stopSpeaking());
        setIsTalking(false);
    };

    const handleNext = () => {
        SoundManager.playClick();
        killAllAudio();
        
        if (!currentNode) return;
        if (currentNode.nextNodeId === 'end') { handleComplete(); return; }
        
        // Reset video and note state for next node
        setVideoWatched(false);
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
            setVideoWatched(false);
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
                SoundManager.playCharacterVoice("Correct! Excellent job.", "professor");
                setShowQuizResult('correct');
                setTimeout(() => {
                    setShowQuizResult(null);
                    handleNext();
                }, 2000);
            } else {
                SoundManager.playCharacterVoice("That is incorrect. Let's think about this carefully.", "narrator");
                setScore(prev => Math.max(0, prev - 10));
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
            SoundManager.playClick();
            setTimeout(() => {
                setShowQuizResult(null);
                setMathInputValue('');
                handleNext();
            }, 2000);
        } else {
            SoundManager.playClick();
            setShowQuizResult('incorrect');
            setScore(prev => Math.max(0, prev - 10));
            setTimeout(() => setShowQuizResult(null), 2000);
        }
    };

    const handleComplete = async () => {
        setIsComplete(true);
        SoundManager.playClick();
        
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

    /**
     * Curated educational YouTube video IDs mapped by topic keyword.
     * Uses standard /embed/{videoId} format which is fully supported.
     * Falls back to a "Watch on YouTube" button for topics without a curated ID.
     */
    /**
     * Curated educational YouTube video IDs mapped by topic keyword.
     * Covers all subjects across the 14-grade curriculum.
     * Falls back to a YouTube search link for uncovered topics.
     */
    const VIDEO_IDS: Record<string, string> = {
        // Language Arts / ELA
        'letter recognition': 'ezGcPMfH5qI', 'letter sounds': 'jvAYUvQsLWo',
        'rhyming': 'PsBf3KuONaI', 'short vowels': 'hb9t3EurHfg',
        'long vowels': 'xWHp2C558DI', 'blends': 'RSoHkMp-6jI',
        'sight words': 'dyBKGazDhdI', 'phonics': 'YAsFCo9BGWY',
        'reading strategies': 'YlEJkaOJ6yQ', 'nouns': '4E2e1FC3e10',
        'verbs': 'DgZI5L4Eb60', 'verb tenses': 'LHmOQiQx3gI',
        'adjectives': 'sHaOp5meuIU', 'adverbs': 'CmSf6E37PgE',
        'clauses': 'PpSPFKAoFxo', 'sentences': 'dIxE7tCR5Lw',
        'writing': 'dHdU_DTZlnc', 'essays': 'dHdU_DTZlnc',
        'figurative language': 'X3acnKZLE0w', 'poetry': 'JwhouCNq_Ew',
        'comprehension': 'YlEJkaOJ6yQ', 'vocabulary': 'vIEifRY3nAs',
        'grammar': 'HpX9nndksSI', 'punctuation': 'J9_oKAgBLIA',
        'spelling': 'hu1TiqiVqqs', 'prefixes': 'VLnH4-1fK_I',
        'suffixes': 'VLnH4-1fK_I', 'root words': 'VLnH4-1fK_I',
        // Math
        'counting': 'bGetqbqYE4Q', 'number recognition': 'DR-cfDsz_FY',
        'shapes': '6k0bKXhLH4A', 'patterns': 'K3tJVIGsDCA',
        'addition': 'Fe8u4I8AUqo', 'subtraction': 'ug0FLEKAHAU',
        'multiplication': 'qU6YnXkhGRk', 'division': 'rGx1QNl1Fk0',
        'fractions': 'n0FZhQ_GkKw', 'decimals': 'do_IbHId2Os',
        'place value': 'aR0WvQsOm_U', 'measurement': 'GnS47MUbEig',
        'time': 'HrxZWNu72WI', 'money': 'dO3JBhoeeJI',
        'area': 'xCIEBx3MwRg', 'perimeter': 'AAY1bBaCaIk',
        'equations': 'l3XzepN03KQ', 'inequalities': 'xOxvyeSl0uA',
        'functions': 'kvGsIo1TmsM', 'polynomials': 'ffLLmV4mZwU',
        'graphing': 'T4jMLJRlsPM', 'algebra': 'NybHckSEQBI',
        'geometry': 'H8gJpL1x4Q0', 'trigonometry': 'T6-U7UlBwsY',
        'statistics': 'sxQaBpKfDRk', 'probability': 'KzfWUEJjG18',
        'exponents': 'XZRQhkii0h0', 'quadratics': 'IlNAJl36-10',
        // Science
        'five senses': 'q1xNuU7gaAQ', 'living': 'GhBVhpGb7hU',
        'weather': 'Uo8lbeVUGSg', 'seasons': 'VHR9pMqO2bE',
        'plants': 'p3St51F4kE8', 'animals': 'oiyZaDxZsAg',
        'life cycles': 'k7dIxdWfbGY', 'food chains': 'MuKs9o1s8FA',
        'ecosystems': 'v5K_NOTaD4A', 'habitats': '9S2d3cj6IpI',
        'cells': 'URUJD5NEXC8', 'genetics': 'CBezq1fFUEA',
        'dna': 'zwibgNGe4aY', 'evolution': 'GhHOjC4oxh8',
        'matter': 'IW0v6untlek', 'atoms': 'h6JNWP9CkaI',
        'chemical reactions': '8m6RtOpqvtU', 'periodic table': 'rz4Dd1I_fX0',
        'forces': 'VtyoEHE28sE', 'motion': 'VtyoEHE28sE',
        'energy': 'CW0_S5YpYVo', 'electricity': 'mc979OhitAg',
        'magnetism': 'MnhYy_JZGVY', 'waves': 'RNTbWymU0bI',
        'light': 'bGfrYcOKp9c', 'sound': 'GkNHeBhlBRU',
        'rocks': 'FD3FMKQfm6k', 'minerals': 'FD3FMKQfm6k',
        'water cycle': 'al2GRvFbcJA', 'solar system': 'libKVRa01L8',
        'earth': 'HCDVN7DCzYE', 'volcano': 'lAmqsMQG3RM',
        'body systems': 'gEUu-A2wfSE', 'biology': '8IHU2JEbsAQ',
        'chemistry': 'FSyAehMdpyI', 'physics': 'b1t41Q3xRM8',
        'climate': 'SN5-DnOHQmE', 'environment': 'HBFk1EHmHJM',
        // Social Studies / History
        'community': '-ZzxMCMl0mw', 'maps': 'DO5J2sKRZEI',
        'american symbols': 'MSvJ9SBIGok', 'holidays': 'F2L3T5trfDg',
        'families': 'PKzJ9gH7Euo', 'government': 'bO7FQsCcbD8',
        'constitution': 'bO7FQsCcbD8', 'bill of rights': 'yYEfLm5dLMQ',
        'ancient civilizations': 'jchcA3GG-YY', 'mesopotamia': 'sohXPx_XZ6Y',
        'ancient egypt': 'hO1tzmi1V5g', 'ancient greece': 'g2hDkDEa5PE',
        'ancient rome': 'oPf27gAup9U', 'medieval': '12G0FhQ170w',
        'middle ages': '12G0FhQ170w', 'renaissance': 'Vufba_ZDTas',
        'reformation': 'IATyzSAjC1w', 'exploration': 'wOclF9eP5uM',
        'colonial': 'o69TvGqyMOo', 'revolution': 'HlE7n-NxOcY',
        'civil war': 'rY9zHNOjGrs', 'westward': 'q16RpV8aJFo',
        'immigration': 'Fe79i1jN4s8', 'industrial': 'zhL5DCizj5c',
        'world war': 'HUqy-OQvVGg', 'cold war': 'wVqziNV7dGY',
        // Bible
        'creation': 'teu7BCZTgDs', 'noah': 'dFSBU6cz1_o',
        'moses': '4t2FAfwQaas', 'david': 'WGGhvUQGzIc',
        'jesus': 'dqTwnElYAiM', 'parables': 'L8XYHO-mYMI',
        'apostles': 'Dmqv0MFOHn0', 'psalms': 'j9phNEaPrv8',
        'proverbs': 'Gab04dPs_ZA', 'gospel': 'dqTwnElYAiM',
    };
    const ytQuery = currentNode.youtubeSearchQuery?.toLowerCase() || '';
    const youtubeVideoId = Object.entries(VIDEO_IDS).find(([key]) => ytQuery.includes(key))?.[1] || null;

    return (
        <div 
            className="w-full h-[80vh] rounded-3xl overflow-hidden relative flex flex-col justify-end border-2 border-white/20 shadow-2xl animate-in zoom-in duration-700"
            style={{ background: currentNode?.backgroundUrl || '#040714' }}
        >
            <div className={`absolute inset-0 z-0 overflow-hidden ${currentNode.youtubeSearchQuery ? 'pointer-events-auto' : 'pointer-events-auto'}`}>
                {(hasEnv3D || hasProp3D) ? (
                    <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="w-full h-full">
                        <ambientLight intensity={1.5} />
                        <directionalLight position={[2, 2, 2]} intensity={2} />
                        <Suspense fallback={null}>
                            {hasEnv3D && <Environment3D url="/lab.glb" />}
                            {hasProp3D && <LearningProp3D url="/prop.glb" />}
                        </Suspense>
                    </Canvas>
                ) : currentNode.youtubeSearchQuery ? (
                    /* ─── Full-Screen Video Layout with Note-Taking ─── */
                    <div className="w-full h-full flex flex-col md:flex-row bg-black">
                        {/* Video Panel — takes most of the space */}
                        <div className="flex-1 relative min-h-[40vh] md:min-h-0">
                            {youtubeVideoId ? (
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`} 
                                    title="Educational Video" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                ></iframe>
                            ) : (
                                /* Fallback: use YouTube's embed search to find a relevant video */
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(currentNode.youtubeSearchQuery || '')}`} 
                                    title="Educational Video" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                ></iframe>
                            )}
                            {/* Video timer overlay — unlocks Next after watching */}
                            {!videoWatched && (
                                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-amber-400 px-4 py-2 rounded-full text-sm font-bold border border-amber-400/30 animate-pulse z-20">
                                    ⏳ Watch the video to continue
                                </div>
                            )}
                        </div>
                        {/* Note-Taking Sidebar */}
                        <div className="w-full md:w-[380px] bg-[#0a0e1a] border-t md:border-t-0 md:border-l border-indigo-500/20 flex flex-col p-5 shrink-0">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">📝</span>
                                <h4 className="text-lg font-bold text-white tracking-wide">My Notes</h4>
                            </div>
                            <p className="text-slate-400 text-xs mb-3 leading-relaxed">Write down key points from the video. Good notes help you remember what you learned!</p>
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder={`Take notes on what you learn, ${studentName}...\n\n• Key vocabulary\n• Important facts\n• Questions you have`}
                                className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-slate-200 text-sm leading-relaxed resize-none focus:outline-none focus:border-indigo-400/50 placeholder-slate-600 pointer-events-auto"
                            />
                            <button
                                onClick={() => { setVideoWatched(true); }}
                                className={`mt-3 w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all pointer-events-auto ${
                                    videoWatched
                                        ? 'bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 cursor-default'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-95'
                                }`}
                                disabled={videoWatched}
                            >
                                {videoWatched ? '✅ Video Complete' : '✓ I finished watching'}
                            </button>
                            {/* Navigation buttons for video page */}
                            <div className="flex gap-3 mt-3 pointer-events-auto">
                                {currentNodeIndex > 0 && (
                                    <button 
                                        onClick={handleBack}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/10 text-slate-300 border border-white/20 hover:bg-white/20 transition-all"
                                    >
                                        ◀ Back
                                    </button>
                                )}
                                <button 
                                    onClick={handleNext}
                                    disabled={!videoWatched}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                        videoWatched
                                            ? 'bg-white text-black hover:bg-slate-200'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    Next ▶
                                </button>
                            </div>
                        </div>
                    </div>) : dynamicImageUrl ? (
                    <div className="w-full h-full p-12 flex items-center justify-center bg-slate-900/40">
                        <img 
                            src={dynamicImageUrl} 
                            alt="Lesson Illustration" 
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-700/50 pointer-events-none animate-in zoom-in duration-1000" 
                        />
                    </div>
                ) : (
                    <LessonVisualizer visualType={currentNode.visualType} youtubeSearchQuery={currentNode.youtubeSearchQuery} />
                )}
            </div>

            <div className="absolute top-0 left-0 w-full h-2 bg-white/10 z-50">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(74,222,128,0.5)]" 
                    style={{ width: `${Math.max(5, (currentNodeIndex / storyNodes.length) * 100)}%` }}
                ></div>
            </div>
            
            {/* Dark gradient overlay — hidden on video pages so video stays visible */}
            {!currentNode.youtubeSearchQuery && (
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>
            )}

            {/* Content Container (Avatar + Dialogue) — HIDDEN on video pages */}
            {!currentNode.youtubeSearchQuery && (
            <div className="relative z-30 w-full mt-auto flex flex-col md:flex-row items-end pb-8 px-4 md:px-12 gap-8 max-w-7xl mx-auto">
                
                {/* Character Sprite */}
                <div className="hidden md:block w-1/3 max-w-[350px] relative pointer-events-none drop-shadow-2xl flex-shrink-0 h-[60vh]">
                    {has3DModel ? (
                        <div className="w-full h-full absolute inset-0">
                            <Canvas camera={{ position: [0, -0.2, 2.2], fov: 45 }}>
                                <ambientLight intensity={1.5} />
                                <directionalLight position={[2, 2, 2]} intensity={2} />
                                <Avatar3D url="/grace.vrm" isTalking={isTalking} />
                            </Canvas>
                        </div>
                    ) : (
                        <TransparentSprite 
                            src="/grace_idle.png" 
                            alt="Professor Grace" 
                            className={`w-full h-full absolute bottom-0 object-bottom object-contain origin-bottom filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${isTalking ? 'animate-talk' : 'animate-float'} ${currentNode.isQuiz ? 'animate-pose-think' : ''}`}
                        />
                    )}
                </div>

                {/* Dialogue Box */}
                <div className="w-full md:flex-1 bg-[#02040A]/80 backdrop-blur-3xl border border-indigo-500/20 p-8 md:p-12 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] relative flex flex-col max-h-[65vh]">
                    {/* Shimmer border effect */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-70"></div>
                    
                    {/* Character Name Badge */}
                    <div className="absolute -top-6 left-12 bg-gradient-to-r from-indigo-600 to-violet-700 px-10 py-2 rounded-full font-black text-xl tracking-[0.1em] text-white shadow-[0_0_30px_rgba(79,70,229,0.6)] border border-indigo-400/50">
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

                    {/* Pop Quiz Trigger */}
                    <button
                        onClick={handlePopQuiz}
                        disabled={isLoadingQuiz}
                        className="absolute -top-5 right-56 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/50 text-rose-100 px-6 py-1.5 rounded-full font-medium tracking-wide flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                        title="Generate an instant knowledge check!"
                    >
                        {isLoadingQuiz ? <span className="animate-spin">🔄</span> : <span>⚡</span>}
                        Pop Quiz!
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
                                            {/* Next button — disabled during video until watched */}
                                            <button 
                                                onClick={handleNext}
                                                disabled={!!currentNode.youtubeSearchQuery && !videoWatched}
                                                className={`shrink-0 px-8 py-4 font-bold text-lg rounded-full transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 ${
                                                    currentNode.youtubeSearchQuery && !videoWatched
                                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                                                        : 'bg-white text-black hover:bg-slate-200'
                                                }`}
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
            )}

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
            </div>

            {/* Ask Modal */}
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
    );
};
