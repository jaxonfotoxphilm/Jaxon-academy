import React, { useState } from 'react';

interface ProfessorGraceTriviaProps {
    question: string;
    options: string[];
    correctIndex: number;
    onAnswer: (isCorrect: boolean) => void;
}

export const ProfessorGraceTrivia: React.FC<ProfessorGraceTriviaProps> = ({
    question,
    options,
    correctIndex,
    onAnswer,
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleOptionClick = (index: number) => {
        if (selectedIndex !== null) return; // Prevent multiple clicks while animating
        setSelectedIndex(index);
        setTimeout(() => {
            onAnswer(index === correctIndex);
        }, 1500); // Wait 1.5 seconds so the student can see if they were right/wrong
    };

    return (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            {/* Glassmorphism Card */}
            <div className="relative overflow-hidden bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] max-w-lg w-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/20 transform transition-all">
                
                {/* Background glowing orb effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-[50px] pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/30 rounded-full blur-[50px] pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-5 mb-8">
                        {/* Avatar with animated gradient border */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <div className="relative w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-3xl border-2 border-white/10 shadow-inner">
                                👩‍🏫
                            </div>
                        </div>
                        <div>
                            <h2 className="text-sm uppercase tracking-widest text-cyan-300 font-semibold mb-1">Pop Quiz</h2>
                            <h3 className="text-2xl font-extrabold text-white tracking-tight">Professor Grace</h3>
                        </div>
                    </div>
                    
                    <p className="text-xl text-slate-100 mb-8 font-medium leading-relaxed drop-shadow-md">
                        {question}
                    </p>
                    
                    <div className="space-y-4">
                        {options.map((option, index) => {
                            // Default premium button style
                            let buttonClass = "group relative w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl font-semibold text-slate-200 transition-all duration-300 overflow-hidden";
                            let icon = <span className="w-6 h-6 rounded-full border-2 border-white/20 group-hover:border-white/40 flex-shrink-0 transition-colors"></span>;

                            if (selectedIndex !== null) {
                                if (index === correctIndex) {
                                    // Correct Answer: Vibrant green gradient & glow
                                    buttonClass = "relative w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 border border-emerald-400 rounded-2xl font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.4)] scale-[1.02] transition-all duration-300";
                                    icon = <span className="text-2xl drop-shadow-md animate-bounce">✨</span>;
                                } else if (index === selectedIndex) {
                                    // Incorrect Answer (Selected): Red gradient
                                    buttonClass = "relative w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-500 to-red-500 border border-rose-400 rounded-2xl font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-[1.02] transition-all duration-300";
                                    icon = <span className="text-2xl drop-shadow-md">❌</span>;
                                } else {
                                    // Other options fade out
                                    buttonClass = "relative w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/5 rounded-2xl font-medium text-slate-400 opacity-40 grayscale transition-all duration-300";
                                    icon = <span className="w-6 h-6 rounded-full border-2 border-white/10 flex-shrink-0"></span>;
                                }
                            } else {
                                // Add hover text gradient effect for unselected state
                                buttonClass += " hover:scale-[1.01]";
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleOptionClick(index)}
                                    className={buttonClass}
                                    disabled={selectedIndex !== null}
                                >
                                    {/* Hover highlight overlay */}
                                    {selectedIndex === null && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                    )}
                                    
                                    <span className="relative z-10 text-left pr-4">{option}</span>
                                    <div className="relative z-10 flex-shrink-0">
                                        {icon}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};