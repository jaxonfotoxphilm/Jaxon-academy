import React, { useState } from 'react';
import curriculumData from '../data/curriculum-structure.json';
import { SoundManager } from '../utils/SoundManager';
import { motion } from 'framer-motion';

interface ConcentratedStudyProps {
    onLaunchExam: (examId: string) => void;
    lockedGradeId?: string | null;
}

/**
 * Study Camp — The school's testing and exam center.
 * 
 * Shows grade-appropriate subjects from the official curriculum structure
 * and lets students launch AI-generated exams on any topic.
 * Also provides access to the hardcoded placement test.
 */
export const ConcentratedStudy: React.FC<ConcentratedStudyProps> = ({ onLaunchExam, lockedGradeId }) => {
    const [selectedGrade, setSelectedGrade] = useState<string>(lockedGradeId || curriculumData.grades[0].id);

    const gradeData = curriculumData.grades.find(g => g.id === selectedGrade);
    const subjects = gradeData?.subjects || [];

    // Deduplicate subjects by name (curriculum JSON has many lessons per subject)
    const uniqueSubjects = subjects.filter((s, i, arr) => arr.findIndex(t => t.name === s.name) === i);

    // Subject icon color mapping for premium visual variety
    const cardColors = [
        { bg: 'from-blue-900/40 to-indigo-900/40', border: 'border-blue-500/20', hover: 'hover:border-blue-400/50', glow: 'group-hover:shadow-blue-500/20' },
        { bg: 'from-emerald-900/40 to-teal-900/40', border: 'border-emerald-500/20', hover: 'hover:border-emerald-400/50', glow: 'group-hover:shadow-emerald-500/20' },
        { bg: 'from-amber-900/40 to-orange-900/40', border: 'border-amber-500/20', hover: 'hover:border-amber-400/50', glow: 'group-hover:shadow-amber-500/20' },
        { bg: 'from-purple-900/40 to-fuchsia-900/40', border: 'border-purple-500/20', hover: 'hover:border-purple-400/50', glow: 'group-hover:shadow-purple-500/20' },
        { bg: 'from-rose-900/40 to-pink-900/40', border: 'border-rose-500/20', hover: 'hover:border-rose-400/50', glow: 'group-hover:shadow-rose-500/20' },
        { bg: 'from-cyan-900/40 to-sky-900/40', border: 'border-cyan-500/20', hover: 'hover:border-cyan-400/50', glow: 'group-hover:shadow-cyan-500/20' },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-700 pb-20 pt-8">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 text-purple-300 font-black text-xs rounded-full uppercase tracking-widest mb-6 border border-purple-500/30">
                    <span>📝</span> Examination Center
                </div>
                <h2 className="text-5xl font-extrabold text-white tracking-tighter mb-4">Study Camp</h2>
                <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                    Select a subject to begin a rigorous, AI-proctored examination based on your curriculum.
                </p>
            </div>

            {/* Grade Selector */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
                {curriculumData.grades.map(grade => (
                    <button
                        key={grade.id}
                        onClick={() => {
                            SoundManager.playClick();
                            setSelectedGrade(grade.id);
                        }}
                        className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${
                            selectedGrade === grade.id 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/50 shadow-lg shadow-purple-900/50' 
                                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 hover:text-white border-slate-700'
                        }`}
                    >
                        {grade.label}
                    </button>
                ))}
            </div>

            {/* Standardized Tests Section */}
            <div className="mb-12">
                <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent"></span>
                    Standardized Assessments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-indigo-500/30 hover:border-indigo-400/60 rounded-2xl p-6 cursor-pointer group transition-all shadow-lg hover:shadow-indigo-500/20"
                        onClick={() => { SoundManager.playClick(); onLaunchExam('placement_test_friday'); }}
                    >
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎓</div>
                        <h3 className="font-bold text-white text-lg mb-1">Placement Test</h3>
                        <p className="text-sm text-indigo-200/70">Comprehensive grade-level assessment across all core subjects.</p>
                    </motion.div>
                </div>
            </div>

            {/* Subject Exams Grid */}
            <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent"></span>
                {gradeData?.label || 'Grade'} — Subject Exams
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uniqueSubjects.map((subject, idx) => {
                    const color = cardColors[idx % cardColors.length];
                    return (
                        <motion.div
                            key={subject.id}
                            whileHover={{ scale: 1.02 }}
                            className={`bg-gradient-to-br ${color.bg} border ${color.border} ${color.hover} rounded-2xl p-6 cursor-pointer group transition-all shadow-lg ${color.glow}`}
                            onClick={() => {
                                SoundManager.playClick();
                                onLaunchExam(`dynamic:Comprehensive exam on ${subject.name} for ${gradeData?.label || 'this grade level'}`);
                            }}
                        >
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{subject.icon || '📝'}</div>
                            <h3 className="font-bold text-white text-lg leading-tight mb-2">{subject.name}</h3>
                            <p className="text-sm text-slate-400">Generate a rigorous AI exam on this subject.</p>
                        </motion.div>
                    );
                })}
            </div>

            {uniqueSubjects.length === 0 && (
                <div className="text-center py-20">
                    <span className="text-5xl mb-4 block opacity-50">📂</span>
                    <p className="text-slate-500 font-bold uppercase tracking-widest">No subjects found for this grade level.</p>
                </div>
            )}
        </div>
    );
};
