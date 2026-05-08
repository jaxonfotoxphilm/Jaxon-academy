import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import curriculum from '../data/curriculum.json';

const MATH_QUESTIONS = curriculum.math;

export const MathMountain: React.FC<{ playerName: string }> = ({ playerName }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(100);
    const [gameOver, setGameOver] = useState(false);
    const [playerHeight, setPlayerHeight] = useState(0); // 0 to 100 percentage
    const [isAnimating, setIsAnimating] = useState(false);

    const question = MATH_QUESTIONS[currentQuestionIndex];

    useEffect(() => {
        if (gameOver) {
            const saveRecord = async () => {
                await supabase.from('student_progress').insert([
                    { student_name: playerName, subject: 'Math Mountain', score, level_reached: 3 }
                ]);
            };
            saveRecord();
        }
    }, [gameOver, playerName, score]);

    const handleAnswer = (index: number) => {
        if (isAnimating || gameOver) return;

        setIsAnimating(true);
        if (index === question.correctIndex) {
            // Correct jump
            setPlayerHeight(prev => prev + (100 / MATH_QUESTIONS.length));
            setTimeout(() => {
                if (currentQuestionIndex + 1 < MATH_QUESTIONS.length) {
                    setCurrentQuestionIndex(prev => prev + 1);
                } else {
                    setGameOver(true);
                }
                setIsAnimating(false);
            }, 1000);
        } else {
            // Incorrect
            setScore(prev => Math.max(0, prev - 20));
            setTimeout(() => {
                setIsAnimating(false);
            }, 500);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-white/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        ⛰️
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Math Mountain</h2>
                        <p className="text-emerald-300 font-medium">Climb the peak of logic!</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Excellence Score</div>
                    <div className="text-3xl font-extrabold text-white">{score}%</div>
                </div>
            </div>

            {/* Game Area */}
            <div className="relative w-full h-[500px] bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 flex">
                
                {/* Mountain Visual */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[400px] border-r-[400px] border-b-[500px] border-l-transparent border-r-transparent border-b-slate-600 drop-shadow-2xl"></div>
                    <div className="absolute bottom-[400px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[100px] border-r-[100px] border-b-[100px] border-l-transparent border-r-transparent border-b-white"></div>
                </div>

                {/* Player Sprite */}
                <div 
                    className="absolute left-1/2 -ml-6 w-12 h-16 transition-all duration-1000 ease-in-out z-20 drop-shadow-lg"
                    style={{ bottom: `${playerHeight * 0.8 + 10}%`, transform: isAnimating ? 'scale(1.2) translateY(-20px)' : 'scale(1) translateY(0)' }}
                >
                    <div className="w-full h-full bg-blue-500 rounded-t-full rounded-b-lg border-2 border-white flex items-center justify-center text-white font-bold shadow-inner">
                        YOU
                    </div>
                </div>

                {/* Question UI Overlay */}
                {gameOver ? (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in duration-500">
                        <div className="text-7xl mb-6 animate-bounce">🏔️</div>
                        <h2 className="text-5xl font-extrabold text-emerald-400 mb-4 tracking-tight drop-shadow-lg">Summit Reached!</h2>
                        <p className="text-xl text-white mb-8 font-medium">Excellence Score: {score}% saved to the Principal's Desk.</p>
                        <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 rounded-2xl text-white font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all duration-300">Play Again</button>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col justify-between p-8 z-30">
                        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-emerald-400 max-w-lg mx-auto text-center transform hover:scale-[1.02] transition-transform">
                            <h3 className="text-sm uppercase tracking-widest text-emerald-600 font-bold mb-2">Equation Challenge</h3>
                            <p className="text-3xl font-extrabold text-slate-800">{question.question}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto w-full mt-auto">
                            {question.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={isAnimating}
                                    className={`relative group overflow-hidden px-6 py-6 bg-slate-800 border-4 border-slate-600 rounded-[2rem] shadow-[0_8px_0_#475569] active:shadow-[0_0_0_#475569] active:translate-y-2 transition-all font-bold text-2xl text-white hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
