import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { SoundManager } from '../utils/SoundManager';
import examData from '../data/exam-data.json';
// import { VisionGrader } from './VisionGrader';
import { ParentManager } from '../utils/ParentManager';

interface ExamEngineProps {
    examId: string;
    currentUser: string;
    onExit: () => void;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({ examId, currentUser, onExit }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exam = (examData as any)[examId];
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [_showVisionGrader, setShowVisionGrader] = useState(false);

    if (!exam) return <div>Exam not found</div>;

    const questions = exam.questions;
    const currentQuestion = questions[currentQuestionIndex];

    React.useEffect(() => {
        if (!isComplete) {
            // Read question and options
            const textToRead = `${currentQuestion.question}. ${currentQuestion.options.join('. ')}`;
            SoundManager.playCharacterVoice(textToRead, 'professor');
        }
    }, [currentQuestionIndex, isComplete, currentQuestion]);

    const handleAnswer = (optionIndex: number) => {
        SoundManager.playClick();
        const newAnswers = [...answers, optionIndex];
        setAnswers(newAnswers);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishExam(newAnswers);
        }
    };

    const finishExam = async (allAnswers: number[]) => {
        // Calculate score
        let correctCount = 0;
        allAnswers.forEach((ans, idx) => {
            if (ans === questions[idx].correctIndex) correctCount++;
        });
        const scorePercentage = Math.round((correctCount / questions.length) * 100);
        setFinalScore(scorePercentage);
        setIsComplete(true);

        // Save to Supabase
        await supabase.from('student_progress').insert({
            student_name: currentUser,
            subject: `[EXAM] ${exam.title}`,
            score: scorePercentage,
            completed_at: new Date().toISOString()
        });

        // Hyper-Personalized Remedial Curriculum Engine
        if (scorePercentage < 70) {
            const remedialTopic = exam.questions[0].subject || exam.title;
            await ParentManager.assignLesson(
                currentUser,
                `dynamic:Remedial ${remedialTopic} using Minecraft`,
                "Professor Grace noticed you struggled a bit. Let's practice with this fun Minecraft lesson!",
                "Tomorrow"
            );
        }
    };

    if (isComplete) {
        return (
            <div className="w-full max-w-4xl mx-auto h-[70vh] bg-slate-900 border border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl animate-in zoom-in duration-500">
                <h2 className="text-4xl font-extrabold text-white mb-6">Exam Completed</h2>
                <div className="text-8xl mb-8">
                    {finalScore >= 90 ? '🏆' : finalScore >= 70 ? '👍' : '📚'}
                </div>
                <p className="text-2xl text-slate-300 font-medium mb-8">Final Grade: <span className={`font-bold ${finalScore >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>{finalScore}%</span></p>
                <button 
                    onClick={onExit}
                    className="px-10 py-4 bg-white text-black font-extrabold text-lg rounded-xl hover:bg-slate-200 transition-colors shadow-lg"
                >
                    Return to Study Camp
                </button>
            </div>
        );
    }

    const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

    return (
        <div className="w-full max-w-4xl mx-auto min-h-[70vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in duration-500 relative">
            {/* Header / Progress */}
            <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
                <div>
                    <h3 className="font-bold text-slate-300 uppercase tracking-widest text-sm">{exam.title}</h3>
                    <p className="text-blue-400 font-medium">{currentQuestion.subject}</p>
                </div>
                <div className="text-right mr-32">
                    <p className="text-slate-400 font-bold mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl md:text-4xl font-semibold text-white leading-relaxed mb-12">
                    {currentQuestion.question}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((opt: string, idx: number) => (
                        <button 
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            onMouseEnter={() => SoundManager.playHover()}
                            className="p-6 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 rounded-2xl text-left text-xl font-medium transition-all shadow-md hover:shadow-blue-500/20"
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <div className="mt-12 flex justify-center">
                    <button
                        onClick={() => setShowVisionGrader(true)}
                        className="px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg"
                    >
                        📸 Show My Work via Photo
                    </button>
                </div>
            </div>
            
            {/* Exit Control */}
            <button 
                onClick={onExit}
                className="absolute top-6 right-6 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm font-bold transition-colors z-10"
            >
                Abandon Exam
            </button>

            {/*showVisionGrader && (
                <VisionGrader 
                    questionText={currentQuestion.question}
                    onClose={() => setShowVisionGrader(false)}
                />
            )*/}
        </div>
    );
};
