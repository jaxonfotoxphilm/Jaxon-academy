import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import curriculumData from '../data/curriculum-structure.json';
import { motion } from 'framer-motion';

interface StudentProgressProps {
    studentName: string;
    gradeId: string | null;
}

interface ProgressRecord {
    id: number;
    student_name: string;
    subject: string;
    score: number;
    topic?: string;
    completed_at?: string;
}

/**
 * StudentProgress — "My Progress" view for students.
 * 
 * Shows:
 *   - Per-subject progress bars (lessons completed / 180)
 *   - Overall GPA and completion percentage
 *   - Recent activity timeline
 *   - Academic streak tracking
 */
export const StudentProgress: React.FC<StudentProgressProps> = ({ studentName, gradeId }) => {
    const [records, setRecords] = useState<ProgressRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from('student_progress')
                    .select('*')
                    .eq('student_name', studentName)
                    .order('id', { ascending: false })
                    .limit(500);
                if (data) setRecords(data as ProgressRecord[]);
            } catch {
                // Offline fallback
            }
            setLoading(false);
        };
        fetchProgress();
    }, [studentName]);

    const gradeData = curriculumData.grades.find(g => g.id === gradeId);
    const subjects = gradeData?.subjects || [];
    const uniqueSubjects = subjects.filter((s, i, arr) => arr.findIndex(t => t.name === s.name) === i);

    // Calculate per-subject metrics
    const subjectStats = useMemo(() => {
        return uniqueSubjects.map(subj => {
            const subjectRecords = records.filter(r => 
                r.subject?.toLowerCase().includes(subj.name.toLowerCase()) ||
                r.topic?.toLowerCase().includes(subj.name.toLowerCase())
            );
            const completed = subjectRecords.length;
            const avgScore = completed > 0 
                ? Math.round(subjectRecords.reduce((acc, r) => acc + r.score, 0) / completed) 
                : 0;
            const letterGrade = avgScore >= 93 ? 'A' : avgScore >= 85 ? 'B' : avgScore >= 77 ? 'C' : avgScore >= 70 ? 'D' : completed > 0 ? 'F' : '—';
            const gradeColor = avgScore >= 93 ? 'text-emerald-400' : avgScore >= 85 ? 'text-blue-400' : avgScore >= 77 ? 'text-yellow-400' : avgScore >= 70 ? 'text-orange-400' : completed > 0 ? 'text-rose-400' : 'text-slate-600';
            
            return {
                name: subj.name,
                icon: subj.icon || '📖',
                completed,
                total: 180,
                avgScore,
                letterGrade,
                gradeColor,
                progressPercent: Math.min(100, Math.round((completed / 180) * 100)),
            };
        });
    }, [uniqueSubjects, records]);

    // Overall metrics
    const totalCompleted = records.filter(r => !r.subject?.includes('[EXAM]')).length;
    const overallAvg = records.length > 0 
        ? Math.round(records.reduce((acc, r) => acc + r.score, 0) / records.length) 
        : 0;
    const overallGPA = overallAvg >= 93 ? '4.0' : overallAvg >= 85 ? '3.0' : overallAvg >= 77 ? '2.0' : overallAvg >= 70 ? '1.0' : '0.0';

    // Recent activity (last 10)
    const recentActivity = records.slice(0, 10);

    // Academic streak — count consecutive school days with at least one completion
    const uniqueDays = new Set(
        records
            .filter(r => r.completed_at)
            .map(r => new Date(r.completed_at!).toISOString().split('T')[0])
    );
    const streak = uniqueDays.size;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-700 pb-20 pt-4">
            {/* Header */}
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-300 font-black text-xs rounded-full uppercase tracking-widest mb-6 border border-emerald-500/30">
                    <span>📊</span> Academic Record
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter mb-3">
                    {studentName}'s Progress
                </h2>
                <p className="text-lg text-slate-400 font-light">
                    {gradeData?.label || 'Unknown Grade'} — Academic Year {new Date().getFullYear()}
                </p>
            </div>

            {loading ? (
                <div className="text-center py-24">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest">Loading Academic Records...</p>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <motion.div 
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                        initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                    >
                        <motion.div variants={cardVariants} className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-3">GPA</h4>
                            <p className="text-4xl font-black text-emerald-400">{overallGPA}</p>
                        </motion.div>
                        <motion.div variants={cardVariants} className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-3">Average Score</h4>
                            <p className="text-4xl font-black text-blue-400">{overallAvg}%</p>
                        </motion.div>
                        <motion.div variants={cardVariants} className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-3">Lessons Done</h4>
                            <p className="text-4xl font-black text-purple-400">{totalCompleted}</p>
                        </motion.div>
                        <motion.div variants={cardVariants} className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-3">School Days Active</h4>
                            <p className="text-4xl font-black text-amber-400">{streak}</p>
                        </motion.div>
                    </motion.div>

                    {/* Subject Progress Bars */}
                    <div className="mb-12">
                        <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-3">
                            <span className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"></span>
                            Subject Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subjectStats.map((stat, idx) => (
                                <motion.div
                                    key={stat.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{stat.icon}</span>
                                            <h4 className="font-bold text-white text-sm">{stat.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-400 font-bold">
                                                {stat.completed}/{stat.total}
                                            </span>
                                            <span className={`text-lg font-black ${stat.gradeColor}`}>{stat.letterGrade}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${
                                                stat.avgScore >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                                stat.avgScore >= 70 ? 'bg-gradient-to-r from-blue-500 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 
                                                stat.completed > 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-slate-700'
                                            }`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.progressPercent}%` }}
                                            transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.05 }}
                                        />
                                    </div>
                                    {stat.completed > 0 && (
                                        <p className="text-[11px] text-slate-500 mt-2 font-medium">
                                            Average: {stat.avgScore}% • {stat.progressPercent}% complete
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Timeline */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-3">
                            <span className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent"></span>
                            Recent Activity
                        </h3>
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                                <span className="text-4xl mb-3 block opacity-50">📭</span>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No lessons completed yet.</p>
                                <p className="text-slate-600 text-sm mt-2">Complete your first daily lesson to see progress here.</p>
                            </div>
                        ) : (
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
                                {recentActivity.map((r, idx) => {
                                    const isExam = r.subject?.includes('[EXAM]') || r.subject === 'Placement Test';
                                    return (
                                        <div 
                                            key={r.id || idx} 
                                            className="flex items-center gap-4 p-4 border-b border-slate-800/50 last:border-0 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 ${
                                                r.score >= 90 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                                r.score >= 70 ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                                                'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                            }`}>
                                                {isExam ? '📝' : r.score >= 90 ? '⭐' : r.score >= 70 ? '✓' : '✗'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium text-sm truncate">
                                                    {r.subject?.replace('[EXAM] ', '')}
                                                </p>
                                                <p className="text-slate-500 text-xs mt-0.5">
                                                    {r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Recently'}
                                                    {r.topic && <span className="text-slate-600 ml-2">• {r.topic.replace('dynamic:', '').substring(0, 40)}</span>}
                                                </p>
                                            </div>
                                            <div className={`font-black text-lg ${
                                                r.score >= 90 ? 'text-emerald-400' : r.score >= 70 ? 'text-blue-400' : 'text-rose-400'
                                            }`}>
                                                {r.score}%
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
