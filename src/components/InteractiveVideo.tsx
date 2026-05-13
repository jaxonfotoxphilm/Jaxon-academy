// src/components/InteractiveVideo.tsx
import React, { useRef, useState, useEffect } from 'react';


/**
 * Types for interactive points within a video.
 * - `time`: seconds when the overlay should appear.
 * - `type`: currently supported "quiz" or "info".
 * - `content`: for "info" a string; for "quiz" a QuizData object.
 */
interface InteractionPoint {
    time: number;
    type: 'quiz' | 'info';
    content: string | QuizData;
}

interface QuizData {
    question: string;
    options: string[];
    correctIndex: number;
    feedback?: string; // optional extra explanation
}

interface InteractiveVideoProps {
    videoUrl: string;
    /** Identifier used to fetch interaction points (e.g., visualType) */
    subjectKey: string;
    /** Map of subject to interaction points. If none, video plays plain. */
    interactionsMap: Record<string, InteractionPoint[]>;
}

/**
 * InteractiveVideo component – a premium video player with glass‑morphism overlays.
 * It pauses the video when an interaction appears, displays the overlay, then
 * resumes playback once the user proceeds (or answers a quiz).
 */
export const InteractiveVideo: React.FC<InteractiveVideoProps> = ({ videoUrl, subjectKey, interactionsMap }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentIdx, setCurrentIdx] = useState<number>(0);
    const [showOverlay, setShowOverlay] = useState<boolean>(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<string>('');
    const [hasError, setHasError] = useState(false);

    const interactions = interactionsMap[subjectKey] || [];

    // Monitor video time and trigger overlays (or show sequentially if no video)
    useEffect(() => {
        if (!videoUrl) {
            // Quiz-only mode: show overlays sequentially without waiting
            if (currentIdx < interactions.length) {
                setShowOverlay(true);
            }
            return;
        }

        const video = videoRef.current;
        if (!video) return;
        const handleTimeUpdate = () => {
            if (currentIdx >= interactions.length) return;
            const point = interactions[currentIdx];
            if (video.currentTime >= point.time) {
                video.pause();
                setShowOverlay(true);
            }
        };
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [currentIdx, interactions, videoUrl]);

    const proceed = () => {
        setShowOverlay(false);
        setSelected(null);
        setFeedback('');
        setCurrentIdx(prev => prev + 1);
        videoRef.current?.play();
    };

    const renderOverlay = () => {
        if (!showOverlay) return null;
        const point = interactions[currentIdx];
        if (!point) return null;
        // Glass‑morphism container
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-lg p-6 shadow-lg transition-opacity duration-300">
                {point.type === 'info' && (
                    <div className="text-lg text-slate-800">
                        {typeof point.content === 'string' ? point.content : ''}
                        <button onClick={proceed} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                            Continue
                        </button>
                    </div>
                )}
                {point.type === 'quiz' && (
                    <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-xl">
                        <p className="font-medium mb-3 text-slate-800">{(point.content as QuizData).question}</p>
                        <ul className="space-y-2">
                            {(point.content as QuizData).options.map((opt, i) => (
                                <li key={i}>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="quiz"
                                            value={i}
                                            checked={selected === i}
                                            onChange={() => setSelected(i)}
                                            className="form-radio h-4 w-4 text-indigo-600"
                                        />
                                        <span className="text-slate-700">{opt}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                        {feedback && <p className="mt-2 text-sm text-green-700">{feedback}</p>}
                        <button
                            onClick={() => {
                                if (selected === null) return;
                                const q = point.content as QuizData;
                                if (selected === q.correctIndex) {
                                    setFeedback(q.feedback || 'Correct! 🎉');
                                } else {
                                    setFeedback('Incorrect – try again or click Continue to move on.');
                                }
                            }}
                            className="mt-4 mr-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                        >
                            Submit
                        </button>
                        <button onClick={proceed} className="mt-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition">
                            Skip / Continue
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Background elements */}
            {!videoUrl ? (
                // Clean background for quiz-only mode
                <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                    {currentIdx >= interactions.length && (
                        <p className="text-slate-400 text-lg font-medium animate-pulse">Quiz Complete! Great job. 🎉</p>
                    )}
                </div>
            ) : hasError ? (
                <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 text-white gap-4">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400 opacity-60">
                        <path d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-400 text-sm font-medium">Video unavailable – lesson content loading…</p>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover opacity-90"
                    autoPlay
                    loop={false}
                    muted
                    controls
                    playsInline
                    onError={(e) => { console.error('Video load error:', e); setHasError(true); }}
                >
                    <source src={videoUrl} type="video/mp4" />
                </video>
            )}
            
            {/* The interactive overlay itself */}
            {renderOverlay()}
        </div>
    );
};
