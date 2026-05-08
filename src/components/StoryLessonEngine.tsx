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


    useEffect(() => {
        fetch('/grace.vrm', { method: 'HEAD' })
            .then(res => { if (res.ok && !res.headers.get('content-type')?.includes('text/html')) setHas3DModel(true); }).catch(() => {});
        fetch('/lab.glb', { method: 'HEAD' })
            .then(res => { if (res.ok && !res.headers.get('content-type')?.includes('text/html')) setHasEnv3D(true); }).catch(() => {});
        fetch('/prop.glb', { method: 'HEAD' })
            .then(res => { if (res.ok && !res.headers.get('content-type')?.includes('text/html')) setHasProp3D(true); }).catch(() => {});
    }, []);

    useEffect(() => {
        const initializeCurriculum = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.functions.invoke('generate-lesson', {
                    body: { subject: subjectId.replace('dynamic:', '').replace(/-/g, ' '), gradeLevel: gradeLevel, studentName: studentName }
                });

                if (error || !data || !data.nodes) throw new Error("Fallback");
                setStoryNodes(data.nodes);
            } catch(e) {
                const fallbackNodes = [{ id: "error", characterName: "Professor Grace", text: "I'm sorry, I'm having trouble connecting to my academic database right now. Please check your connection and try again.", voiceType: "professor", visualType: "video-nature", isQuiz: false, itemReward: null }];
                const staticNodes = (lessonsData as Record<string, DialogueNode[]>)[subjectId] || 
                                  (lessonsData as Record<string, DialogueNode[]>)['default'] || fallbackNodes;
                setStoryNodes(staticNodes);
            }
            setIsLoading(false);
        };
        initializeCurriculum();
    }, [subjectId, gradeLevel, studentName]);

    const currentNode = storyNodes && storyNodes.length > 0 ? storyNodes[currentNodeIndex] : undefined;

    useEffect(() => {
        if (isComplete) return;
        
        const playDynamicAudio = async (text: string, voiceType: string) => {
            try {
                const { data, error } = await supabase.functions.invoke('generate-tts', { body: { text } });
                if (error || !data || !data.audioContent) throw new Error("TTS Fallback");
                const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
                audio.addEventListener('play', () => setIsTalking(true));
                audio.addEventListener('ended', () => setIsTalking(false));
                audio.addEventListener('pause', () => setIsTalking(false));
                audio.play();
            } catch(e) {
                setIsTalking(true);
                SoundManager.playCharacterVoice(text, voiceType as any);
                setTimeout(() => setIsTalking(false), text.length * 50);
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

    const handleNext = () => {
        SoundManager.playClick();
        if (!currentNode) return;
        if (currentNode.nextNodeId === 'end') { handleComplete(); return; }
        if (currentNode.nextNodeId) {
            const nextIndex = storyNodes.findIndex(n => n.id === currentNode.nextNodeId);
            if (nextIndex !== -1) setCurrentNodeIndex(nextIndex); else handleComplete();
        } else {
            if (currentNodeIndex < storyNodes.length - 1) setCurrentNodeIndex(currentNodeIndex + 1); else handleComplete();
        }
    };

    const handleQuizAnswer = async (index: number) => {
        if (!currentNode) return;
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
        
        try {
            const cleanSubject = subjectId.replace('dynamic:', '');
            // 1. Push final score to database
            const { error: progressError } = await supabase.from('student_progress').insert([
                { student_name: studentName, subject: cleanSubject, score: score }
            ]);
            if (progressError) console.error("Progress sync error:", progressError);

            // 2. Mark assignment complete if it exists
            await ParentManager.completeAssignmentBySubject(studentName, subjectId);
        } catch(e) {
            console.error("Failed to sync progress to Parent Portal:", e);
        }
        setShowTutor(false);
        const isPassed = score >= 70;
        
        if (isPassed) {
            SoundManager.playCharacterVoice("Lesson complete. Splendid work today.", "professor");
        } else {
            SoundManager.playCharacterVoice("Module failed. You will need to review this material.", "professor");
        }

        try {
            await supabase.from('student_progress').insert({
                student_name: studentName,
                subject: subjectId,
                score: score,
                completed_at: new Date().toISOString()
            });

            if (earnedItem && isPassed) {
                await ParentManager.grantItem(studentName, earnedItem);
            }
        } catch (e) {
            console.error("Failed to save progress", e);
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

    return (
        <div 
            className="w-full h-[80vh] rounded-3xl overflow-hidden relative flex flex-col justify-end border-2 border-white/20 shadow-2xl animate-in zoom-in duration-700"
            style={{ background: currentNode?.backgroundUrl || '#040714' }}
        >
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
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
                    <div className="w-full h-full p-4 flex items-center justify-center bg-black rounded-3xl overflow-hidden shadow-2xl relative">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(currentNode.youtubeSearchQuery + " educational kids")}`} 
                            title="YouTube Video" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        ></iframe>
                    </div>
                ) : dynamicImageUrl ? (
                    <div className="w-full h-full p-12 flex items-center justify-center bg-slate-900/40">
                        <img 
                            src={dynamicImageUrl} 
                            alt="Lesson Illustration" 
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-700/50 pointer-events-none animate-in zoom-in duration-1000" 
                        />
                    </div>
                ) : (
                    <LessonVisualizer visualType={currentNode.visualType} />
                )}
            </div>

            <div className="absolute top-0 left-0 w-full h-2 bg-white/10 z-50">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(74,222,128,0.5)]" 
                    style={{ width: `${Math.max(5, (currentNodeIndex / storyNodes.length) * 100)}%` }}
                ></div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>

            {/* Content Container (Avatar + Dialogue) */}
            <div className="relative z-30 w-full mt-auto flex flex-col md:flex-row items-end pb-8 px-4 md:px-12 gap-8 max-w-7xl mx-auto">
                
                {/* Character Sprite (VTuber Lip Sync Model) OR 3D CGI Model */}
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
                <div className="w-full md:flex-1 bg-black/85 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-[0_0_60px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[65vh]">
                    {/* Shimmer border effect */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"></div>
                    
                    {/* Character Name Badge */}
                    <div className="absolute -top-5 left-12 bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-1.5 rounded-full font-bold text-lg tracking-wider shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/50">
                        {currentNode.characterName}
                    </div>

                    {/* Ask Professor Grace Modal Trigger */}
                    <button
                        onClick={() => setIsAsking(true)}
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

                                {currentNode.isMathInput ? (
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
                                            {currentNode.options?.map((opt, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => handleQuizAnswer(idx)}
                                                    className={`p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-left text-lg font-medium transition-all hover:scale-[1.02] ${idx === 4 ? 'md:col-span-2 bg-rose-900/20 hover:bg-rose-800/40 border-rose-500/30 text-rose-200' : ''}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
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
                                    <div className="mt-4 flex justify-end gap-6">
                                            <button 
                                                onClick={handleNext}
                                                className="shrink-0 px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
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
