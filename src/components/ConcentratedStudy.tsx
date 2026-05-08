import React from 'react';
import { SoundManager } from '../utils/SoundManager';
import { BookOpen, Calculator, Beaker, PenTool } from 'lucide-react';

interface ConcentratedStudyProps {
    onLaunchExam: (examId: string) => void;
    lockedGradeId: string | null;
}

export const ConcentratedStudy: React.FC<ConcentratedStudyProps> = ({ onLaunchExam, lockedGradeId }) => {
    // Check if eligible for SAT Placement (Grades 4-8)
    const isEligibleForSAT = lockedGradeId && ['grade-4', 'grade-5', 'grade-6', 'grade-7', 'grade-8'].includes(lockedGradeId);

    const prepModules = [
        { id: 'sat-prep-math', name: 'Mathematics Prep', desc: 'Master computations and reasoning.', icon: <Calculator className="w-8 h-8 text-blue-400" />, color: 'bg-blue-900/40 border-blue-500/50 hover:border-blue-400' },
        { id: 'sat-prep-reading', name: 'Reading Meaning Prep', desc: 'Sharpen comprehension and analysis.', icon: <BookOpen className="w-8 h-8 text-emerald-400" />, color: 'bg-emerald-900/40 border-emerald-500/50 hover:border-emerald-400' },
        { id: 'sat-prep-language', name: 'Language Usage Prep', desc: 'Grammar, mechanics, and spelling.', icon: <PenTool className="w-8 h-8 text-amber-400" />, color: 'bg-amber-900/40 border-amber-500/50 hover:border-amber-400' },
        { id: 'sat-prep-science', name: 'Science Prep', desc: 'Nature study and scientific principles.', icon: <Beaker className="w-8 h-8 text-purple-400" />, color: 'bg-purple-900/40 border-purple-500/50 hover:border-purple-400' }
    ];

    return (
        <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-700 pb-20 pt-8">
            <div className="text-center mb-12">
                <h2 className="text-5xl font-extrabold text-white tracking-widest uppercase mb-4 drop-shadow-md">Study Camp</h2>
                <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                    A focused, distraction-free environment for rigorous exam preparation and formal placement tests.
                </p>
            </div>

            <div className="space-y-8">
                {isEligibleForSAT && (
                    <>
                        <div className="bg-slate-900 border border-indigo-500 hover:border-indigo-400 rounded-2xl p-8 shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-full uppercase tracking-widest mb-3">
                                        <span>🏆</span> Official Placement
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-2">Stanford 10 SAT Placement Test</h3>
                                    <p className="text-slate-400 text-lg">Advanced Examination, Form E. Comprehensive evaluation for Grades 4-8.</p>
                                    <p className="text-slate-500 font-medium mt-4">
                                        20 Questions • Multiple Choice
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        SoundManager.playClick();
                                        onLaunchExam('sat-placement');
                                    }}
                                    className="shrink-0 px-8 py-4 bg-indigo-600 text-white font-extrabold text-lg rounded-xl hover:bg-indigo-500 transition-colors shadow-lg w-full md:w-auto hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                >
                                    Take Official Exam
                                </button>
                            </div>
                        </div>

                        <div className="mt-16 pt-8 border-t border-slate-700/50">
                            <h3 className="text-2xl font-bold text-white mb-6">Stanford 10 SAT Preparatory Modules</h3>
                            
                            {/* Practice Quiz */}
                            <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-6 mb-6 flex justify-between items-center hover:border-slate-400 transition-colors">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-200">Randomized Practice Quiz</h4>
                                    <p className="text-slate-400 mt-1">20 randomized questions from the full historical SAT question bank. Receive dynamic AI remediation on questions you miss.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        SoundManager.playClick();
                                        onLaunchExam('sat-practice');
                                    }}
                                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                                >
                                    Start Practice
                                </button>
                            </div>

                            {/* Subject Deep Dives */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {prepModules.map(mod => (
                                    <div key={mod.id} className={`border rounded-xl p-6 flex items-start gap-4 transition-transform hover:-translate-y-1 cursor-pointer ${mod.color}`}
                                        onClick={() => {
                                            SoundManager.playClick();
                                            onLaunchExam(`dynamic:${mod.name}`);
                                        }}
                                    >
                                        <div className="shrink-0">{mod.icon}</div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{mod.name}</h4>
                                            <p className="text-slate-400 text-sm mt-1">{mod.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                
                {!isEligibleForSAT && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
                        <p className="text-slate-400 text-lg">You do not have any pending placement tests at this time.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-16 p-8 border-t border-white/10 text-center">
                <h4 className="text-slate-500 font-bold uppercase tracking-widest mb-4">Supplemental Material</h4>
                <p className="text-slate-600 italic">Study guides will appear here when assigned by the Principal.</p>
            </div>
        </div>
    );
};
