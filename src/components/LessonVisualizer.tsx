// src/components/LessonVisualizer.tsx
import React from 'react';
import { InteractiveVideo } from './InteractiveVideo';
import { VIDEO_INTERACTIONS } from './VideoInteractions';

/**
 * Curated YouTube background videos keyed by subject keyword.
 * These play muted as ambient background visuals behind the lesson UI.
 * Each maps a visualType keyword → a YouTube video ID for contextual ambiance.
 */
const BACKGROUND_YOUTUBE: Record<string, string> = {
    // Science
    'science':  'DkzQxoTMaJA',  // Beautiful science visuals
    'atom':     'FSyAehMdpyI',  // Atoms & molecules animated
    'biology':  'QnQe0xW_JY4',  // Biology cells animation
    'cell':     'URUJD5NEXC8',  // Inside a cell
    'space':    'libKVRa01L8',  // Space & galaxy footage
    'nature':   'LXb3EKWsInQ',  // Nature documentary 4K
    'eco':      'GlcmWsTR3OE',  // Ecosystem footage
    'earth':    'HCDVN7DCzYE',  // Planet earth
    // Math
    'math':     'X9e3JhM5FY4',  // Math patterns and beauty
    'geometry': 'WqzK3UAXaHc',  // Geometry visualization
    'algebra':  'NybHckSEQBI',  // Algebra concepts
    'arith':    'jQ-aWFYT_SU',  // Arithmetic for kids
    'count':    'e0dJWfQHF8Y',  // Counting visuals
    'add':      'jQ-aWFYT_SU',  // Addition
    'subtract': 'aukMVFCxyQA',  // Subtraction
    // History
    'history':  'xuCn8ux2gbs',  // History documentary
    'ancient':  'Yocja_N5s1I',  // Ancient civilizations
    'civil':    'ONP5jv_EWTI',  // Civics / government
    // Reading & Language Arts
    'reading':  'S9FLl6r5vy0',  // Reading & learning
    'book':     'S9FLl6r5vy0',  // Books & reading
    'grammar':  'sDVH5MrAVao',  // Grammar concepts
    'vocab':    'ZVPflMwMEYA',  // Vocabulary
    'spell':    'ZVPflMwMEYA',  // Spelling
    'essay':    'S9FLl6r5vy0',  // Essay writing
    'writing':  'S9FLl6r5vy0',  // Writing
    // Bible / Religious studies
    'bible':    'ak06MSETeo4',  // Bible stories animated
    'creation': 'teu7BCZTgDs',  // Creation story
    'jesus':    'dqTwnElYAiM',  // Life of Jesus
    'gospel':   'dqTwnElYAiM',  // Gospel stories
    'psalm':    'j9phNEaPrv8',  // Psalms
    'proverb':  'Gab04dPs_ZA',  // Proverbs
};

/**
 * Finds the best contextual YouTube video ID by matching keywords
 * from the visualType string against our curated background map.
 */
const getBackgroundYouTubeId = (visualType: string): string | null => {
    const lower = visualType.toLowerCase();
    for (const [keyword, videoId] of Object.entries(BACKGROUND_YOUTUBE)) {
        if (lower.includes(keyword)) return videoId;
    }
    // Fallback: relaxing educational ambient
    return 'LXb3EKWsInQ';
};

interface LessonVisualizerProps {
    visualType?: string;
    youtubeSearchQuery?: string;
}

export const LessonVisualizer: React.FC<LessonVisualizerProps> = ({ visualType, youtubeSearchQuery }) => {
    if (!visualType) return null;

    const renderVisual = () => {
        switch (visualType) {
            case 'science-atom':
                return (
                    <div className="relative w-64 h-64 flex items-center justify-center animate-in zoom-in duration-1000">
                        {/* Nucleus */}
                        <div className="w-12 h-12 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.8)] z-10 animate-pulse"></div>
                        {/* Electrons / Orbits */}
                        <div className="absolute w-full h-full border-4 border-blue-400/30 rounded-full animate-[spin_4s_linear_infinite] shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                            <div className="absolute -top-3 left-1/2 w-4 h-4 bg-blue-300 rounded-full shadow-[0_0_10px_rgba(147,197,253,1)]"></div>
                        </div>
                        <div className="absolute w-full h-full border-4 border-green-400/30 rounded-full animate-[spin_6s_linear_infinite_reverse] shadow-[0_0_15px_rgba(74,222,128,0.3)]" style={{ transform: 'rotateX(60deg) rotateY(45deg)' }}>
                            <div className="absolute -top-3 left-1/4 w-4 h-4 bg-green-300 rounded-full shadow-[0_0_10px_rgba(134,239,172,1)]"></div>
                        </div>
                        <div className="absolute w-full h-full border-4 border-yellow-400/30 rounded-full animate-[spin_5s_linear_infinite]" style={{ transform: 'rotateX(45deg) rotateY(60deg)' }}>
                            <div className="absolute bottom-0 right-1/4 w-4 h-4 bg-yellow-300 rounded-full shadow-[0_0_10px_rgba(253,224,71,1)]"></div>
                        </div>
                    </div>
                );
            case 'math-geometry':
                return (
                    <div className="relative w-64 h-64 flex items-center justify-center animate-in fade-in duration-1000">
                        {/* Floating shapes */}
                        <div className="absolute top-0 left-0 w-20 h-20 bg-transparent border-4 border-cyan-400/80 rounded-lg animate-[spin_10s_linear_infinite] shadow-[0_0_20px_rgba(34,211,238,0.5)]"></div>
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-transparent border-4 border-fuchsia-400/80 rounded-full animate-bounce shadow-[0_0_20px_rgba(232,121,249,0.5)]" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute top-1/4 right-1/4 w-0 h-0 border-l-[30px] border-l-transparent border-b-[50px] border-b-yellow-400/80 border-r-[30px] border-r-transparent animate-[spin_8s_linear_infinite_reverse] drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
                        {/* Math Symbols */}
                        <div className="absolute text-5xl font-mono text-white/50 animate-pulse font-black">∑</div>
                        <div className="absolute top-4 right-12 text-4xl font-mono text-white/40 animate-pulse font-black" style={{ animationDelay: '1s' }}>∫</div>
                        <div className="absolute bottom-12 left-12 text-6xl font-mono text-white/30 animate-pulse font-black" style={{ animationDelay: '2s' }}>π</div>
                    </div>
                );
            case 'history-scroll':
                return (
                    <div className="relative w-72 h-80 flex items-center justify-center animate-in slide-in-from-top-10 duration-1000">
                        {/* Scroll paper */}
                        <div className="w-full h-full bg-[#E8DCC4] rounded-sm shadow-[0_0_40px_rgba(251,191,36,0.3)] border-x-8 border-[#8B5A2B] relative overflow-hidden flex flex-col items-center justify-start p-8">
                            <div className="w-full h-1 bg-[#8B5A2B]/20 mb-4 animate-pulse"></div>
                            <div className="w-5/6 h-1 bg-[#8B5A2B]/20 mb-4 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-full h-1 bg-[#8B5A2B]/20 mb-4 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            <div className="w-4/6 h-1 bg-[#8B5A2B]/20 mb-4 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                            {/* Glowing cuneiform/hieroglyphics effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8B5A2B]/10 to-[#8B5A2B]/30 animate-[pulse_4s_ease-in-out_infinite]"></div>
                            {/* Scroll rollers */}
                            <div className="absolute -top-4 left-0 right-0 h-4 bg-[#5C3A21] rounded-t-full shadow-lg"></div>
                            <div className="absolute -bottom-4 left-0 right-0 h-4 bg-[#5C3A21] rounded-b-full shadow-lg"></div>
                        </div>
                    </div>
                );
            case 'reading-book':
                return (
                    <div className="relative w-80 h-64 flex flex-col items-center justify-center animate-in zoom-in duration-1000">
                        {/* Open Book */}
                        <div className="w-full h-full bg-white rounded-lg shadow-[0_0_50px_rgba(255,255,255,0.4)] flex relative overflow-hidden transform perspective-1000 rotate-x-12">
                            {/* Pages */}
                            <div className="w-1/2 h-full border-r border-slate-300 bg-gradient-to-r from-slate-100 to-white p-6">
                                <div className="w-full h-2 bg-slate-200 mb-4 rounded-full"></div>
                                <div className="w-3/4 h-2 bg-slate-200 mb-4 rounded-full"></div>
                                <div className="w-full h-2 bg-slate-200 mb-4 rounded-full"></div>
                            </div>
                            <div className="w-1/2 h-full bg-gradient-to-l from-slate-100 to-white p-6">
                                <div className="w-full h-2 bg-slate-200 mb-4 rounded-full"></div>
                                <div className="w-full h-2 bg-slate-200 mb-4 rounded-full"></div>
                                <div className="w-2/3 h-2 bg-slate-200 mb-4 rounded-full"></div>
                            </div>
                            {/* Book spine shadow */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-4 -ml-2 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-50"></div>
                            {/* Floating glowing letters */}
                            <div className="absolute top-1/4 left-1/4 text-4xl text-blue-500 font-serif font-bold animate-[bounce_3s_infinite] drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-0 animate-in fade-in fill-mode-forwards" style={{ animationDelay: '1s' }}>A</div>
                            <div className="absolute top-1/2 right-1/3 text-5xl text-purple-500 font-serif font-bold animate-[bounce_4s_infinite] drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] opacity-0 animate-in fade-in fill-mode-forwards" style={{ animationDelay: '2s' }}>B</div>
                            <div className="absolute bottom-1/4 left-1/3 text-3xl text-emerald-500 font-serif font-bold animate-[bounce_2s_infinite] drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] opacity-0 animate-in fade-in fill-mode-forwards" style={{ animationDelay: '3s' }}>C</div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    /** Pexels fallback URLs (only used if no YouTube match) */
    const getPexelsFallback = () => {
        if (visualType.includes('nature')) return "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4";
        if (visualType.includes('history')) return "https://videos.pexels.com/video-files/3163534/3163534-hd_1920_1080_30fps.mp4";
        if (visualType.includes('science') || visualType.includes('space')) return "https://videos.pexels.com/video-files/1851190/1851190-hd_1920_1080_25fps.mp4";
        return "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4";
    };

    const isVideoType = visualType.startsWith('video-');

    // Resolve background video: prefer contextual YouTube, fall back to Pexels
    const youtubeId = getBackgroundYouTubeId(youtubeSearchQuery || visualType);

    /**
     * Renders a muted, looping YouTube embed as ambient background.
     * Uses YouTube's embed API params: autoplay=1, mute=1, controls=0, loop=1, playlist=ID
     * The iframe is pointer-events-none so lesson buttons remain clickable.
     */
    const renderYouTubeBackground = () => {
        if (!youtubeId) return null;
        return (
            <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0`}
                title="Background Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: 'scale(1.2)', objectFit: 'cover' }}
                tabIndex={-1}
            />
        );
    };

    return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-8 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 z-0">
                {isVideoType ? (
                    <div className="pointer-events-auto w-full h-full">
                        <InteractiveVideo videoUrl={getPexelsFallback()} subjectKey={visualType} interactionsMap={VIDEO_INTERACTIONS} />
                    </div>
                ) : youtubeId ? (
                    /* Contextual YouTube video as ambient background */
                    renderYouTubeBackground()
                ) : (
                    /* Pexels stock fallback */
                    <video
                        src={getPexelsFallback()}
                        className="w-full h-full object-cover opacity-40 mix-blend-screen"
                        autoPlay loop muted playsInline
                    />
                )}
                {/* Dark overlay to keep text readable over video */}
                <div className="absolute inset-0 bg-slate-900/70"></div>
            </div>
            <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                {!isVideoType && renderVisual()}
            </div>
        </div>
    );
};
