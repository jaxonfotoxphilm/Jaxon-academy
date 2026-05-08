import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, BookOpen } from 'lucide-react';
import { supabase } from '../supabaseClient';
import satData from '../data/sat-placement-data.json';
import satPrepData from '../data/sat-prep-bank.json';

interface SatPlacementTestProps {
    onComplete: () => void;
    studentId: string;
    mode?: 'placement' | 'practice';
    onReviewNeeded?: (missedQuestions: any[]) => void;
}

export const SatPlacementTest: React.FC<SatPlacementTestProps> = ({ onComplete, studentId, mode = 'placement', onReviewNeeded }) => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [placedGrade, setPlacedGrade] = useState<number | null>(null);
    const [incorrectAnswers, setIncorrectAnswers] = useState<any[]>([]);

    useEffect(() => {
        if (mode === 'practice') {
            const shuffled = [...satPrepData.questions].sort(() => Math.random() - 0.5).slice(0, 20);
            setQuestions(shuffled);
        } else {
            setQuestions(satData.questions);
        }
    }, [mode]);

    if (questions.length === 0) return null;

    const handleAnswer = async (selectedIndex: number) => {
        const currentQuestion = questions[currentIndex];
        
        let newScore = score;
        if (selectedIndex === currentQuestion.correctAnswer) {
            newScore += 1;
            setScore(newScore);
        } else {
            setIncorrectAnswers(prev => [...prev, {
                question: currentQuestion.question,
                subject: currentQuestion.subject,
                studentAnswer: currentQuestion.options[selectedIndex],
                correctAnswer: currentQuestion.options[currentQuestion.correctAnswer]
            }]);
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsFinished(true);

            if (mode === 'placement') {
                let calculatedGrade = 4;
                if (newScore >= 6 && newScore <= 9) calculatedGrade = 5;
                else if (newScore >= 10 && newScore <= 13) calculatedGrade = 6;
                else if (newScore >= 14 && newScore <= 17) calculatedGrade = 7;
                else if (newScore >= 18) calculatedGrade = 8;

                setPlacedGrade(calculatedGrade);

                try {
                    await supabase.from('student_progress').insert({
                        student_id: studentId,
                        subject: 'Placement Test',
                        score: Math.round((newScore / 20) * 100),
                        topic: `SAT Form E - Placed in Grade ${calculatedGrade}`
                    });
                } catch (error) {
                    console.error('Error saving placement test score:', error);
                }
            } else {
                try {
                    await supabase.from('student_progress').insert({
                        student_id: studentId,
                        subject: 'Practice Test',
                        score: Math.round((newScore / 20) * 100),
                        topic: `SAT Practice Quiz`
                    });
                } catch (error) {
                    console.error('Error saving practice test score:', error);
                }
            }
        }
    };

    if (isFinished) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-slate-800 p-12 rounded-3xl border border-indigo-500/30 text-center max-w-2xl w-full shadow-2xl animate-in zoom-in duration-500">
                    <ShieldCheck className="w-24 h-24 text-indigo-400 mx-auto mb-6" />
                    <h1 className="text-4xl font-black text-white mb-4">Test Complete</h1>
                    <p className="text-xl text-slate-300 mb-8">
                        You scored {score} out of 20.
                    </p>
                    
                    {mode === 'placement' && (
                        <div className="bg-indigo-900/40 p-6 rounded-2xl mb-8 border border-indigo-500/50">
                            <p className="text-lg text-indigo-200 mb-2">Recommended Placement</p>
                            <p className="text-5xl font-black text-white">Grade {placedGrade}</p>
                        </div>
                    )}

                    {mode === 'practice' && incorrectAnswers.length > 0 && (
                        <div className="bg-rose-900/20 p-6 rounded-2xl mb-8 border border-rose-500/30">
                            <p className="text-lg text-rose-200 mb-2">You missed {incorrectAnswers.length} question{incorrectAnswers.length !== 1 && 's'}.</p>
                            {onReviewNeeded && (
                                <button 
                                    onClick={() => onReviewNeeded(incorrectAnswers)}
                                    className="mt-4 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-2 mx-auto transition-colors"
                                >
                                    <BookOpen className="w-5 h-5" /> Start AI Remediation Review
                                </button>
                            )}
                        </div>
                    )}

                    {!(mode === 'practice' && incorrectAnswers.length > 0 && onReviewNeeded) && (
                        <button 
                            onClick={onComplete}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95"
                        >
                            Return to Dashboard
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col p-4 md:p-8">
            <div className="max-w-4xl w-full mx-auto mt-12 bg-slate-800 border border-slate-700 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{mode === 'placement' ? satData.title : 'SAT Practice Quiz'}</h2>
                        <p className="text-slate-400">{currentQuestion.subject}</p>
                    </div>
                    <div className="text-xl font-bold text-indigo-400 bg-indigo-900/30 px-6 py-2 rounded-full border border-indigo-500/30">
                        Question {currentIndex + 1} of 20
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-800">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${((currentIndex) / 20) * 100}%` }}
                    ></div>
                </div>

                {/* Question Area */}
                <div className="p-8 md:p-12 flex-1 flex flex-col justify-center">
                    <p className="text-2xl md:text-3xl text-white font-medium leading-relaxed mb-12">
                        {currentQuestion.question}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                className="p-6 bg-slate-700/50 hover:bg-indigo-600/20 border border-slate-600 hover:border-indigo-500 rounded-2xl text-left text-xl text-slate-200 transition-all group flex items-center justify-between"
                            >
                                <span>{opt}</span>
                                <CheckCircle2 className="w-6 h-6 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
