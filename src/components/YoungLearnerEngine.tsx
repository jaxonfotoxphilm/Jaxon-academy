import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LottieImport from 'lottie-react';
import { supabase } from '../supabaseClient';
import { speak as voiceSpeak, stopSpeaking } from '../utils/VoiceService';
import { getLottieUrl, CELEBRATION_LOTTIE } from '../utils/LottieAnimationMap';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

// ESM/CJS interop
const Lottie = (typeof LottieImport === 'function' ? LottieImport : (LottieImport as any).default || LottieImport) as React.ComponentType<any>;

/**
 * YoungLearnerEngine — Animated cartoon lesson engine for Pre-K & Kindergarten.
 * 
 * Features:
 * - AI-generated cartoon illustrations per lesson node (via generate-video edge function)
 * - Lottie animation fallback while images load
 * - Professor Grace TTS narration
 * - Background music for the "cartoon show" feel
 * - Interactive quiz games with confetti celebrations
 */

interface YoungLearnerNode {
    id: string;
    characterName: string;
    text: string;
    imagePrompt: string;
    interactionType: 'listen' | 'tap-match' | 'tap-count';
    isQuiz: boolean;
    question: string;
    options: string[];
    correctIndex: number;
    interactionData?: Record<string, any>;
}

// ─── Background Music URLs (free, royalty-free children's music) ───
const BG_MUSIC_TRACKS = [
    'https://cdn.pixabay.com/audio/2024/11/28/audio_3e58a0a1c5.mp3', // happy kids
    'https://cdn.pixabay.com/audio/2022/10/14/audio_7573fce2fb.mp3', // playful 
    'https://cdn.pixabay.com/audio/2024/02/07/audio_53aefc055c.mp3', // gentle learning
];

// ─── Sound Effects ───
const SFX = {
    correct: 'https://cdn.pixabay.com/audio/2024/02/19/audio_e09ddd388c.mp3',
    wrong: 'https://cdn.pixabay.com/audio/2022/03/24/audio_805cb66c1c.mp3',
    whoosh: 'https://cdn.pixabay.com/audio/2022/03/15/audio_942de69019.mp3',
    pop: 'https://cdn.pixabay.com/audio/2024/02/19/audio_e09ddd388c.mp3',
};

function playSFX(key: keyof typeof SFX) {
    try {
        const audio = new Audio(SFX[key]);
        audio.volume = 0.4;
        audio.play().catch(() => {});
    } catch {}
}

const ConfettiParticle = ({ delay }: { delay: number }) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#FF85A2', '#7DD3FC', '#FCA5A5', '#86EFAC'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return (
        <motion.div
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: '100vh', x: (Math.random() - 0.5) * 200, opacity: 0, rotate: Math.random() * 360 }}
            transition={{ duration: 2 + Math.random(), delay, ease: 'easeOut' }}
            className="absolute pointer-events-none z-50"
            style={{ left: `${Math.random() * 100}%`, width: 10, height: 10, background: color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
        />
    );
};

/** Fetches and caches Lottie animation JSON */
function useLottieData(url: string) {
    const [data, setData] = useState<object | null>(null);
    const cache = useRef<Record<string, object>>({});
    useEffect(() => {
        if (cache.current[url]) { setData(cache.current[url]); return; }
        fetch(url).then(r => r.json()).then(json => {
            cache.current[url] = json;
            setData(json);
        }).catch(() => setData(null));
    }, [url]);
    return data;
}

const CelebrationOverlay = ({ show }: { show: boolean }) => {
    const confettiData = useLottieData(CELEBRATION_LOTTIE);
    return (
        <AnimatePresence>
            {show && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 pointer-events-none">
                    {Array.from({ length: 30 }).map((_, i) => <ConfettiParticle key={i} delay={i * 0.05} />)}
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', damping: 12 }}
                        className="absolute inset-0 flex items-center justify-center">
                        {confettiData ? (
                            <div className="w-[300px] h-[300px]"><Lottie animationData={confettiData} loop={false} /></div>
                        ) : (
                            <span className="text-[120px] drop-shadow-2xl">🎉</span>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const STEP_LABELS = ['🎉 Hello!', '🎵 Story Time!', '👀 Look & Learn!', '🎮 Game Time!', '🔢 Let\'s Count!', '🎊 You Did It!'];

export const YoungLearnerEngine = ({ subjectId, gradeLevel, studentName, onBack, teacherGuideUrl }: {
    subjectId: string;
    gradeLevel: string;
    studentName: string;
    onBack: () => void;
    teacherGuideUrl?: string;
}) => {
    const [nodes, setNodes] = useState<YoungLearnerNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState<'correct' | 'incorrect' | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const hasSpokenRef = useRef<Set<string>>(new Set());

    // AI cartoon images state
    const [cartoonImages, setCartoonImages] = useState<Record<string, string>>({});
    const [imageLoadProgress, setImageLoadProgress] = useState(0);
    const [imagesReady, setImagesReady] = useState(false);

    // Background music
    const bgMusicRef = useRef<HTMLAudioElement | null>(null);
    const [musicEnabled, setMusicEnabled] = useState(true);

    const currentNode = nodes[currentIndex];

    // ─── Fetch lesson ───
    useEffect(() => {
        const fetchLesson = async () => {
            setIsLoading(true);
            try {
                const dynamicMatch = subjectId.match(/^dynamic:(.+)/);
                const subject = dynamicMatch ? dynamicMatch[1] : subjectId;
                const { data, error } = await supabase.functions.invoke('generate-lesson', {
                    body: { subject, gradeLevel, studentName, teacherGuideUrl }
                });
                if (error || !data?.nodes) throw new Error('Failed to fetch lesson');
                setNodes(data.nodes);
            } catch (e) {
                console.error('[YoungLearner] Error:', e);
                setNodes([{
                    id: 'fallback_1', characterName: 'Professor Grace',
                    text: `Hey ${studentName}! Let's have fun learning today!`,
                    imagePrompt: 'teacher waving hello to a child', interactionType: 'listen',
                    isQuiz: false, question: '', options: [], correctIndex: 0,
                }]);
            }
            setIsLoading(false);
        };
        fetchLesson();
    }, [subjectId, gradeLevel, studentName, teacherGuideUrl]);

    // ─── Generate AI cartoon images for each node (after lesson loads) ───
    useEffect(() => {
        if (nodes.length === 0) return;

        const generateImages = async () => {
            let completed = 0;
            setImagesReady(false);
            setImageLoadProgress(0);

            // Fire all requests in parallel
            const promises = nodes.map(async (node) => {
                try {
                    const { data, error } = await supabase.functions.invoke('generate-video', {
                        body: {
                            prompt: node.imagePrompt || node.text,
                            fallbackToImage: true,
                        }
                    });

                    if (!error && data?.type === 'image' && data?.data) {
                        const imgUrl = `data:${data.mimeType || 'image/png'};base64,${data.data}`;
                        setCartoonImages(prev => ({ ...prev, [node.id]: imgUrl }));
                    }
                } catch (e) {
                    console.log(`[YoungLearner] Image gen failed for ${node.id}:`, e);
                }
                completed++;
                setImageLoadProgress(Math.round((completed / nodes.length) * 100));
            });

            await Promise.all(promises);
            setImagesReady(true);
        };

        generateImages();
    }, [nodes]);

    // ─── Background music ───
    useEffect(() => {
        if (isLoading || nodes.length === 0) return;

        const track = BG_MUSIC_TRACKS[Math.floor(Math.random() * BG_MUSIC_TRACKS.length)];
        const audio = new Audio(track);
        audio.loop = true;
        audio.volume = 0.15;
        bgMusicRef.current = audio;

        if (musicEnabled) {
            audio.play().catch(() => {});
        }

        return () => {
            audio.pause();
            audio.src = '';
            bgMusicRef.current = null;
        };
    }, [isLoading, nodes.length]);

    useEffect(() => {
        if (bgMusicRef.current) {
            if (musicEnabled) bgMusicRef.current.play().catch(() => {});
            else bgMusicRef.current.pause();
        }
    }, [musicEnabled]);

    // ─── Auto-speak on node change ───
    const speakCurrentNode = useCallback(async () => {
        if (!currentNode || hasSpokenRef.current.has(currentNode.id)) return;
        hasSpokenRef.current.add(currentNode.id);
        const textToSpeak = currentNode.isQuiz && currentNode.question
            ? `${currentNode.text} ${currentNode.question}`
            : currentNode.text;
        setIsTalking(true);
        try {
            await voiceSpeak(textToSpeak, {
                onStart: () => setIsTalking(true),
                onEnd: () => setIsTalking(false),
            });
        } catch { setIsTalking(false); }
        setTimeout(() => setIsTalking(false), 15000);
    }, [currentNode]);

    useEffect(() => { speakCurrentNode(); }, [speakCurrentNode]);

    const handleNext = useCallback(() => {
        if (currentIndex < nodes.length - 1) {
            playSFX('whoosh');
            setSelectedAnswer(null);
            setShowResult(null);
            stopSpeaking();
            setIsTalking(false);
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, nodes.length]);

    const handleAnswer = (idx: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(idx);
        if (idx === currentNode?.correctIndex) {
            setShowResult('correct');
            setShowCelebration(true);
            playSFX('correct');
            voiceSpeak("Yaaaay! That's right! You're so smart!", {
                onEnd: () => setTimeout(() => { setShowCelebration(false); handleNext(); }, 1200),
            });
        } else {
            setShowResult('incorrect');
            playSFX('wrong');
            voiceSpeak("Oops! That's okay! Let's try again!", {
                onEnd: () => setTimeout(() => { setSelectedAnswer(null); setShowResult(null); }, 600),
            });
        }
    };

    const handleFinish = async () => {
        if (isFinishing) return;
        setIsFinishing(true);
        if (bgMusicRef.current) bgMusicRef.current.pause();
        
        try {
            // Save to database
            const { error: progressError } = await supabase.from('student_progress').insert([{
                student_name: studentName,
                subject: subjectId,
                score: 100, // 100% for completing the lesson
                topic: subjectId
            }]);
            
            if (progressError) console.error("Error saving progress:", progressError);

            // Save to localStorage for unlocking
            const storageKey = `jaxon-academy-completed-${studentName}`;
            const completedStr = localStorage.getItem(storageKey);
            const completed = completedStr ? JSON.parse(completedStr) : [];
            if (!completed.includes(subjectId)) {
                completed.push(subjectId);
                localStorage.setItem(storageKey, JSON.stringify(completed));
            }
        } catch (e) {
            console.error("Failed to save progress", e);
        }

        onBack();
    };

    const bgColors = [
        'linear-gradient(135deg, hsl(220, 60%, 18%) 0%, hsl(260, 50%, 12%) 100%)',
        'linear-gradient(135deg, hsl(180, 50%, 16%) 0%, hsl(220, 55%, 12%) 100%)',
        'linear-gradient(135deg, hsl(280, 45%, 18%) 0%, hsl(320, 40%, 12%) 100%)',
        'linear-gradient(135deg, hsl(30, 60%, 18%) 0%, hsl(50, 50%, 12%) 100%)',
        'linear-gradient(135deg, hsl(140, 50%, 16%) 0%, hsl(180, 45%, 12%) 100%)',
        'linear-gradient(135deg, hsl(340, 50%, 18%) 0%, hsl(20, 50%, 12%) 100%)',
    ];

    // ─── Loading screen ───
    if (isLoading) {
        return (
            <div className="w-full h-[80vh] rounded-3xl flex flex-col items-center justify-center border-2 border-yellow-400/30 shadow-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(260,50%,15%), hsl(220,60%,10%))' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-8xl mb-6">🌟</motion.div>
                <motion.h2 animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-4xl font-black text-yellow-300" style={{ fontFamily: "'Outfit', cursive" }}>Getting Your Lesson Ready!</motion.h2>
                <p className="text-yellow-200/60 mt-3 text-lg">Hang tight, superstar...</p>
            </div>
        );
    }

    if (!currentNode) return null;
    const progress = ((currentIndex + 1) / nodes.length) * 100;
    const isLastNode = currentIndex >= nodes.length - 1;
    const showNextBtn = !currentNode.isQuiz || showResult === 'correct';
    const currentCartoon = cartoonImages[currentNode.id];

    return (
        <div className="w-full h-[80vh] rounded-3xl flex flex-col border-2 border-yellow-400/30 shadow-2xl overflow-hidden"
            style={{ background: bgColors[currentIndex % bgColors.length] }}>

            <CelebrationOverlay show={showCelebration} />

            {/* ═══ TOP: Progress bar + step label ═══ */}
            <div className="shrink-0 relative">
                {/* Back */}
                <button onClick={() => { stopSpeaking(); if (bgMusicRef.current) bgMusicRef.current.pause(); onBack(); }}
                    className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Music toggle */}
                <button onClick={() => setMusicEnabled(!musicEnabled)}
                    className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all">
                    {musicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {/* Progress */}
                <div className="w-full h-3 bg-white/10 relative">
                    <motion.div className="h-full bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400"
                        animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                    {nodes.map((_, i) => (
                        <span key={i} className={`absolute top-1/2 text-[8px] ${i <= currentIndex ? 'text-yellow-300' : 'text-white/20'}`}
                            style={{ left: `${((i + 1) / nodes.length) * 100}%`, transform: 'translate(-50%,-50%)' }}>⭐</span>
                    ))}
                </div>

                {/* Step label */}
                <div className="text-center py-2">
                    <span className="text-base font-black uppercase tracking-widest text-yellow-300/90" style={{ fontFamily: "'Outfit', cursive" }}>
                        {STEP_LABELS[currentIndex] || `Step ${currentIndex + 1}`}
                    </span>
                </div>
            </div>

            {/* ═══ MIDDLE: Cartoon + Speech (horizontal split) ═══ */}
            <div className="flex-1 min-h-0 flex items-center px-6 gap-6">
                <AnimatePresence mode="wait">
                    <motion.div key={currentNode.id}
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex flex-row items-center gap-6">

                        {/* LEFT — AI Cartoon illustration OR Lottie fallback */}
                        <CartoonVisual
                            cartoonUrl={currentCartoon}
                            nodeText={currentNode.text}
                            imagePrompt={currentNode.imagePrompt}
                            nodeIndex={currentIndex}
                            isTalking={isTalking}
                            imageLoadProgress={imageLoadProgress}
                            imagesReady={imagesReady}
                        />

                        {/* RIGHT — Speech + Game */}
                        <div className="flex-1 flex flex-col gap-4 min-w-0">
                            {/* Professor Grace badge */}
                            <div className="flex items-center gap-2">
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg flex items-center justify-center text-lg ${isTalking ? 'animate-bounce' : ''}`}>🎓</div>
                                <span className="text-xs font-black text-yellow-300 uppercase tracking-wider">Professor Grace</span>
                                {isTalking && (
                                    <div className="flex items-center gap-0.5 ml-1">
                                        {[1,2,3,4,5].map(i => (
                                            <motion.div key={i} animate={{ height: [3, 12, 3] }}
                                                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.06 }}
                                                className="w-1 bg-yellow-400 rounded-full" style={{ minHeight: 3 }} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Speech bubble */}
                            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl px-6 py-5">
                                <p className="text-white text-xl md:text-2xl font-bold leading-relaxed" style={{ fontFamily: "'Outfit', 'Comic Sans MS', cursive" }}>
                                    {currentNode.text}
                                </p>
                            </div>

                            {/* Quiz game area */}
                            {currentNode.isQuiz && currentNode.options.length > 0 && (
                                <div>
                                    <p className="text-yellow-200 text-lg font-bold text-center mb-2" style={{ fontFamily: "'Outfit', cursive" }}>
                                        {currentNode.question}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentNode.options.map((opt, idx) => {
                                            const btnColors = ['from-rose-500 to-pink-600', 'from-sky-500 to-blue-600', 'from-emerald-500 to-green-600', 'from-amber-500 to-orange-600'];
                                            const isSelected = selectedAnswer === idx;
                                            const isCorrect = showResult === 'correct' && isSelected;
                                            const isWrong = showResult === 'incorrect' && isSelected;
                                            return (
                                                <button key={idx} onClick={() => handleAnswer(idx)} disabled={selectedAnswer !== null}
                                                    className={`relative py-3 px-3 rounded-xl text-white font-black text-lg shadow-md transition-all border-3 bg-gradient-to-br ${btnColors[idx % 4]} hover:scale-105 active:scale-95
                                                        ${isCorrect ? 'border-green-300 ring-4 ring-green-400/50' : ''} ${isWrong ? 'border-red-300 ring-4 ring-red-400/50' : ''} ${!isSelected ? 'border-white/20' : ''} disabled:opacity-70`}
                                                    style={{ fontFamily: "'Outfit', cursive" }}>
                                                    {opt}
                                                    {isCorrect && <span className="absolute -top-2 -right-2 text-xl">✅</span>}
                                                    {isWrong && <span className="absolute -top-2 -right-2 text-xl">❌</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ═══ BOTTOM BAR ═══ */}
            <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-black/30 border-t border-white/10">
                <button onClick={() => { hasSpokenRef.current.delete(currentNode.id); speakCurrentNode(); }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all">
                    🔊
                </button>

                {showNextBtn && (
                    !isLastNode ? (
                        <button onClick={handleNext}
                            className="px-10 py-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)] border-4 border-yellow-300/50 hover:scale-105 active:scale-95 transition-all animate-pulse"
                            style={{ fontFamily: "'Outfit', cursive" }}>
                            Next ▶
                        </button>
                    ) : (
                        <button onClick={handleFinish}
                            disabled={isFinishing}
                            className={`px-10 py-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-2xl shadow-[0_0_30px_rgba(52,211,153,0.5)] border-4 border-green-300/50 transition-all ${isFinishing ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                            style={{ fontFamily: "'Outfit', cursive" }}>
                            {isFinishing ? 'Saving...' : '🏆 All Done!'}
                        </button>
                    )
                )}

                <div className="w-12" />
            </div>
        </div>
    );
};


/**
 * CartoonVisual — Displays AI-generated cartoon illustration, falling back to Lottie animation.
 * Shows a loading shimmer while images are being generated.
 */
const CartoonVisual = ({ cartoonUrl, nodeText, imagePrompt, nodeIndex, isTalking, imageLoadProgress, imagesReady }: {
    cartoonUrl?: string;
    nodeText: string;
    imagePrompt: string;
    nodeIndex: number;
    isTalking: boolean;
    imageLoadProgress: number;
    imagesReady: boolean;
}) => {
    const lottieUrl = getLottieUrl(nodeText, imagePrompt, nodeIndex);
    const lottieData = useLottieData(lottieUrl);

    return (
        <div className="w-[35%] shrink-0 flex items-center justify-center">
            <motion.div
                animate={isTalking ? { scale: [1, 1.03, 1], y: [0, -3, 0] } : { scale: 1, y: 0 }}
                transition={{ duration: 1.2, repeat: isTalking ? Infinity : 0, ease: 'easeInOut' }}
                className="w-full max-w-[280px] aspect-square rounded-[2rem] border-4 border-white/20 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
            >
                {/* AI-generated cartoon illustration */}
                {cartoonUrl ? (
                    <motion.img
                        src={cartoonUrl}
                        alt="Lesson illustration"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full object-cover rounded-[1.5rem]"
                    />
                ) : (
                    // Lottie fallback while AI images generate
                    <div className="relative w-full h-full flex items-center justify-center">
                        {lottieData ? (
                            <Lottie animationData={lottieData} loop={true} className="w-[85%] h-[85%]" />
                        ) : (
                            <motion.span
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-[70px] select-none">
                                🌟
                            </motion.span>
                        )}

                        {/* Image generation progress indicator */}
                        {!imagesReady && (
                            <div className="absolute bottom-2 left-2 right-2">
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-yellow-400 to-pink-400"
                                        animate={{ width: `${imageLoadProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <p className="text-[9px] text-white/40 text-center mt-0.5 font-bold">
                                    ✨ Making cartoons...
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};
