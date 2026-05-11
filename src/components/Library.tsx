import React, { useState, useEffect } from 'react';
import curriculumData from '../data/curriculum-structure.json';
import { SoundManager } from '../utils/SoundManager';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

interface LibraryProps {
    onLaunchLesson: (subjectId: string) => void;
    lockedGradeId?: string | null;
    currentUser?: string | null;
}

/**
 * Library / Syllabus Browser — A structured, browsable view of the full curriculum.
 * 
 * Shows Grade → Subject → 180 individual lessons from curriculum-structure.json.
 * Tracks lesson completion status per student via Supabase.
 * Allows students to launch any unlocked lesson in their grade.
 */
export const Library: React.FC<LibraryProps> = ({ onLaunchLesson, lockedGradeId, currentUser }) => {
    const [selectedGrade, setSelectedGrade] = useState<string>(lockedGradeId || curriculumData.grades[0].id);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    const gradeData = curriculumData.grades.find(g => g.id === selectedGrade);
    const subjects = gradeData?.subjects || [];

    // Deduplicate subjects by name
    const uniqueSubjects = subjects.filter((s, i, arr) => arr.findIndex(t => t.name === s.name) === i);

    // Selected subject's full data (with lessons array)
    const activeSubject = selectedSubject ? subjects.find(s => s.id === selectedSubject) : null;
    const lessons = (activeSubject as any)?.lessons || [];

    // Load completed lessons for this student
    useEffect(() => {
        const loadCompletions = async () => {
            if (!currentUser) return;
            try {
                const { data } = await supabase
                    .from('student_progress')
                    .select('subject')
                    .eq('student_name', currentUser);
                if (data) {
                    const set = new Set<string>();
                    data.forEach((row: any) => set.add(row.subject));
                    setCompletedLessons(set);
                }
            } catch {
                // Offline fallback — no completion tracking
            }
        };
        loadCompletions();
    }, [currentUser, selectedGrade]);

    const getIconForGrade = (gradeId: string) => {
        if (gradeId.includes('PK') || gradeId.includes('K')) return '🌱';
        const num = parseInt(gradeId.replace('grade-', ''));
        if (num <= 5) return '📗';
        if (num <= 8) return '📘';
        return '📕';
    };

    return (
        <div className="flex h-[calc(100vh-120px)] w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#040714] animate-in zoom-in-95 duration-700 relative">
            
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#040714] opacity-90"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[100px] mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
            </div>

            {/* Sidebar — Grade & Subject Navigation */}
            <div className="w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col relative z-10 shrink-0">
                <div className="p-8 pb-4">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-wider flex items-center gap-3">
                        <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] text-3xl">📚</span> 
                        My Syllabus
                    </h2>
                    <p className="text-slate-400 text-xs mt-2 font-medium tracking-wide uppercase">Full Curriculum Browser</p>
                </div>

                {/* Grade selector */}
                <div className="px-4 pb-4">
                    <select
                        value={selectedGrade}
                        onChange={(e) => {
                            SoundManager.playClick();
                            setSelectedGrade(e.target.value);
                            setSelectedSubject(null);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-medium text-sm focus:border-blue-500 outline-none transition-all"
                    >
                        {curriculumData.grades.map(g => (
                            <option key={g.id} value={g.id}>{getIconForGrade(g.id)} {g.label}</option>
                        ))}
                    </select>
                </div>

                {/* Subject list */}
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                    <h3 className="font-bold text-slate-600 uppercase tracking-widest text-[10px] mb-3 px-4">Subjects</h3>
                    <motion.div 
                        className="flex flex-col gap-1.5" 
                        initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                    >
                        {uniqueSubjects.map(subj => (
                            <motion.button
                                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                                key={subj.id}
                                onClick={() => {
                                    SoundManager.playClick();
                                    setSelectedSubject(subj.id);
                                }}
                                onMouseEnter={() => SoundManager.playHover()}
                                className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
                                    selectedSubject === subj.id 
                                        ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 text-white border border-slate-700 shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <span className="text-lg">{subj.icon || '📖'}</span>
                                <span className="truncate">{subj.name}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto relative z-10 bg-transparent p-10 md:p-12 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {!selectedSubject ? (
                        /* Landing: No subject selected */
                        <motion.div 
                            key="landing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="mb-12 border-b border-white/10 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                        <span className="text-5xl drop-shadow-lg">{getIconForGrade(selectedGrade)}</span>
                                    </div>
                                    <div>
                                        <h1 className="text-5xl font-black text-white tracking-tight">{gradeData?.label || 'Curriculum'}</h1>
                                        <p className="text-blue-400 font-bold tracking-[0.15em] uppercase text-xs mt-3">
                                            {uniqueSubjects.length} Subjects • 180 School Days
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 text-lg leading-relaxed mb-12">
                                Select a subject from the sidebar to browse all 180 daily lessons. Each lesson is an interactive, AI-powered module taught by Professor Grace.
                            </p>

                            {/* Subject Overview Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {uniqueSubjects.map((subj, idx) => (
                                    <motion.div
                                        key={subj.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-white/25 cursor-pointer group transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl"
                                        onClick={() => {
                                            SoundManager.playClick();
                                            setSelectedSubject(subj.id);
                                        }}
                                    >
                                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{subj.icon || '📖'}</div>
                                        <h3 className="font-extrabold text-white text-lg mb-1 group-hover:text-blue-300 transition-colors">{subj.name}</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">180 Lessons</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        /* Lesson List for Selected Subject */
                        <motion.div
                            key={selectedSubject}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-5xl mx-auto"
                        >
                            <div className="mb-10 border-b border-white/10 pb-6 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                                        <span className="text-4xl">{activeSubject?.icon || '📖'}</span>
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-white tracking-tight">{activeSubject?.name}</h1>
                                        <p className="text-slate-400 font-medium text-sm mt-1">{gradeData?.label} • {lessons.length} Lessons</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { SoundManager.playClick(); setSelectedSubject(null); }}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all border border-slate-700"
                                >
                                    ← Back
                                </button>
                            </div>

                            {/* Lesson Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {lessons.map((lesson: any, idx: number) => {
                                    const isQuizDay = lesson.title?.includes('Quiz') || lesson.title?.includes('Unit Test');
                                    const isCompleted = completedLessons.has(lesson.dynamicQuery?.replace('dynamic:', '') || '');
                                    
                                    return (
                                        <motion.div
                                            key={lesson.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: Math.min(idx * 0.01, 0.5) }}
                                            className={`p-4 rounded-xl border cursor-pointer group transition-all hover:-translate-y-0.5 relative overflow-hidden ${
                                                isQuizDay 
                                                    ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/20 hover:border-purple-400/50' 
                                                    : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
                                            }`}
                                            onClick={() => {
                                                SoundManager.playClick();
                                                if (lesson.dynamicQuery) {
                                                    onLaunchLesson(lesson.dynamicQuery.replace('dynamic:', ''));
                                                }
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Day {lesson.day}</span>
                                                        {isQuizDay && (
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                                                                {lesson.title?.includes('Unit Test') ? 'TEST' : 'QUIZ'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-white text-sm leading-snug group-hover:text-blue-300 transition-colors truncate">
                                                        {lesson.title?.replace(/^Lesson \d+: /, '') || `Lesson ${lesson.day}`}
                                                    </h4>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm transition-all ${
                                                    isCompleted 
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                        : 'bg-white/5 text-slate-500 border border-white/10 group-hover:bg-white/10 group-hover:text-white'
                                                }`}>
                                                    {isCompleted ? '✓' : '▶'}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {lessons.length === 0 && (
                                <div className="text-center py-24 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                                    <span className="text-5xl mb-4 block opacity-50">📂</span>
                                    <p className="font-bold uppercase tracking-widest">No lessons found for this subject.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
