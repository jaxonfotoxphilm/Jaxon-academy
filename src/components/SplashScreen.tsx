import React, { useEffect, useState } from 'react';
import { SoundManager } from '../utils/SoundManager';

interface SplashScreenProps {
    onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'drawing' | 'glowing' | 'fading'>('drawing');

    useEffect(() => {
        // Trigger the magical chime as soon as the component mounts
        setTimeout(() => {
            SoundManager.playCinematicChime();
        }, 100);

        // Sequence the animations
        const glowTimer = setTimeout(() => {
            setPhase('glowing');
        }, 2000); // 2 seconds for the arc to draw

        const fadeTimer = setTimeout(() => {
            setPhase('fading');
        }, 4500); // Hold the glow for 2.5s, then fade out

        const completeTimer = setTimeout(() => {
            onComplete();
        }, 5500); // 1s fade out duration

        return () => {
            clearTimeout(glowTimer);
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center bg-[#02040a] transition-opacity duration-1000 ${
                phase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            {/* Ambient background particles */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
            
            <div className="relative flex flex-col items-center">
                {/* The sweeping arc SVG */}
                <svg className="absolute -top-16 w-[400px] h-[200px]" viewBox="0 0 400 200">
                    <defs>
                        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#ffffff" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    {/* The actual arc path */}
                    <path 
                        d="M 20,180 Q 200,-50 380,180" 
                        fill="none" 
                        stroke="url(#arcGradient)" 
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter="url(#glow)"
                        className="animate-draw-arc origin-bottom"
                        strokeDasharray="600"
                        strokeDashoffset="600"
                        style={{
                            animation: 'drawArc 2s ease-in-out forwards'
                        }}
                    />
                    
                    {/* The traveling star particle */}
                    <circle r="4" fill="#ffffff" filter="url(#glow)">
                        <animateMotion 
                            dur="2s" 
                            repeatCount="1" 
                            path="M 20,180 Q 200,-50 380,180" 
                            fill="freeze"
                            calcMode="spline"
                            keySplines="0.4 0 0.2 1"
                        />
                        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="2s" fill="freeze" />
                    </circle>
                </svg>

                {/* Logo Text */}
                <h1 
                    className={`mt-12 text-6xl md:text-7xl font-extrabold tracking-widest uppercase transition-all duration-1000 ${
                        phase === 'drawing' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
                >
                    <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">Jaxon</span>
                    <span className="font-light text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]">Academy</span>
                </h1>
                
                {/* Subtle lens flare / central glow */}
                <div 
                    className={`absolute inset-0 bg-blue-500 rounded-full blur-[100px] transition-all duration-1000 -z-10 ${
                        phase === 'drawing' ? 'opacity-0 w-0 h-0' : 'opacity-20 w-[400px] h-[200px]'
                    }`}
                ></div>
            </div>

            <style>{`
                @keyframes drawArc {
                    0% { stroke-dashoffset: 600; }
                    100% { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
};
