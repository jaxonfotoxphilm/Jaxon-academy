import React, { useState, useEffect } from 'react';
import curriculumData from '../data/curriculum-structure.json';
import { SoundManager } from '../utils/SoundManager';
import { motion } from 'framer-motion';

// removed CoursePathway interface

export const Library: React.FC<{ lockedGradeId?: string | null; currentUser?: string | null; launchLesson?: (subjectId: string) => void }> = ({ lockedGradeId, currentUser, launchLesson }) => {
    const [selectedGradeId, setSelectedGradeId] = useState<string>(lockedGradeId || curriculumData.grades[0].id);
    const [renderTrigger, setRenderTrigger] = useState(0);

    useEffect(() => {
        const handleStorage = () => setRenderTrigger(prev => prev + 1);
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        if (lockedGradeId && currentUser !== 'Principal') {
            setSelectedGradeId(lockedGradeId);
        }
    }, [lockedGradeId, currentUser]);

    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [activeModule, setActiveModule] = useState<string | null>(null);

    const activeGrade = curriculumData.grades.find(g => g.id === selectedGradeId);
    
    const mandateSubject = { id: 'mandate:nebraska-civics', name: 'NE Civics & Financial Lit', icon: '🏛️' };
    const activeSubject = selectedSubjectId === 'mandate:nebraska-civics' 
        ? mandateSubject 
        : activeGrade?.subjects.find(s => s.id === selectedSubjectId);

    // Dynamic curriculum modules for the pathway
    const textbookStructure: { unit: string, chapters: string[] }[] = (activeSubject as any)?.textbookStructure || [
        {
            unit: "Unit 1: Foundations",
            chapters: [
                "Chapter 1: Key Concepts and Definitions", 
                "Chapter 2: Historical Context and Background",
                "Chapter 3: Formative Assessment"
            ]
        },
        {
            unit: "Unit 2: Advanced Application",
            chapters: [
                "Chapter 4: Real-world Principles", 
                "Chapter 5: Synthesis and Critical Analysis", 
                "Chapter 6: Summative Mastery Assessment"
            ]
        }
    ];

    const handleGradeSelect = (gradeId: string) => {
        SoundManager.playClick();
        setSelectedGradeId(gradeId);
        setSelectedSubjectId(null);
        setActiveModule(null);
    };

    const handleSubjectSelect = (subjectId: string) => {
        SoundManager.playClick();
        setSelectedSubjectId(subjectId);
        setActiveModule(null);
    };

    const handleModuleSelect = async (moduleName: string) => {
        SoundManager.playClick();
        if (launchLesson) {
            launchLesson(`dynamic:${activeGrade?.label} ${activeSubject?.name} - ${moduleName}`);
        } else {
            setActiveModule(moduleName);
        }
    };

    return (
        <div className="w-full min-h-[85vh] bg-[#02040A] flex flex-col md:flex-row relative overflow-hidden animate-in fade-in duration-500 font-sans">
            
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[150px]"></div>
            </div>

            {/* Left Sidebar: Academy Navigation */}
            <div className="w-full md:w-80 bg-white/[0.02] backdrop-blur-2xl border-r border-white/5 p-6 flex flex-col shrink-0 z-10 h-full overflow-y-auto shadow-2xl">
                <div className="mb-10">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 uppercase tracking-widest flex items-center gap-3 drop-shadow-sm">
                        <span className="text-blue-500 drop-shadow-md">🎓</span> Virtual Academy
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-2 uppercase">Nebraska State Standards</p>
                </div>

                {/* Grade Level Selection */}
                <h3 className="font-bold text-slate-500 uppercase tracking-[0.15em] text-[10px] mb-4 flex items-center gap-2">
                    <div className="h-px bg-slate-700/50 flex-1"></div> Academic Level <div className="h-px bg-slate-700/50 flex-1"></div>
                </h3>
                <motion.div 
                    className="flex flex-col gap-2 mb-8"
                    initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                    {curriculumData.grades
                        .filter(g => currentUser === 'Principal' || !lockedGradeId || g.id === lockedGradeId)
                        .map(g => (
                        <motion.button
                            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                            key={g.id}
                            onClick={() => handleGradeSelect(g.id)}
                            onMouseEnter={() => SoundManager.playHover()}
                            className={`text-left px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 relative overflow-hidden ${selectedGradeId === g.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/30' : 'bg-white/5 border border-transparent text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/10'}`}
                        >
                            <span className="relative z-10">{g.label}</span>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Subject Selection */}
                {activeGrade && (
                    <div className="animate-in fade-in duration-300">
                        <h3 className="font-bold text-slate-600 uppercase tracking-widest text-[10px] mb-3">Core Subjects</h3>
                        <motion.div 
                            className="flex flex-col gap-1" 
                            data-trigger={renderTrigger}
                            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        >
                            {activeGrade.subjects.filter(s => localStorage.getItem(`adopted-${s.name}`) !== 'false').map(s => (
                                <motion.button
                                    variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                                    key={s.id}
                                    onClick={() => handleSubjectSelect(s.id)}
                                    onMouseEnter={() => SoundManager.playHover()}
                                    className={`text-left px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-3 ${selectedSubjectId === s.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                                >
                                    <span>{s.icon}</span> {s.name}
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* STATE LEGISLATURE MANDATE */}
                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <h3 className="font-bold text-rose-500/80 uppercase tracking-widest text-[10px] mb-3">State Mandates</h3>
                            <button
                                onClick={() => handleSubjectSelect('mandate:nebraska-civics')}
                                onMouseEnter={() => SoundManager.playHover()}
                                className={`text-left px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-3 ${selectedSubjectId === 'mandate:nebraska-civics' ? 'bg-rose-900/40 text-rose-300 border border-rose-500/50' : 'text-slate-500 hover:text-rose-400 hover:bg-slate-900/50'}`}
                            >
                                <span>🏛️</span> {mandateSubject.name}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto relative z-10 bg-transparent">
                {!selectedSubjectId ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center animate-in zoom-in duration-700 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#02040A] via-[#0A0F24]/50 to-[#02040A] pointer-events-none"></div>
                        <div className="w-32 h-32 bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/5 relative z-10 hover:scale-105 transition-transform duration-500">
                            <span className="text-6xl drop-shadow-2xl">🏫</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-3 tracking-tight relative z-10">Select a Course</h3>
                        <p className="text-slate-400 max-w-md font-medium leading-relaxed relative z-10">Choose a core subject from the sidebar to view your state-aligned academic pathway.</p>
                    </div>
                ) : !activeModule ? (
                    /* Learning Pathway UI */
                    <div className="p-10 md:p-16 max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
                        <div className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-xl">
                                    <span className="text-5xl drop-shadow-lg">{activeSubject?.icon}</span>
                                </div>
                                <div>
                                    <h1 className="text-5xl font-black text-white tracking-tight">{activeSubject?.name}</h1>
                                    <p className="text-blue-400 font-bold tracking-[0.15em] uppercase text-xs mt-3">{activeGrade?.label} Coursework</p>
                                </div>
                            </div>
                            
                            {/* Official Curriculum Materials Link */}
                            <a 
                                href="https://www.coreknowledge.org/curriculum/download-curriculum/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="bg-white/5 backdrop-blur-xl hover:bg-white/10 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-3 rounded-xl shadow-lg text-xl">
                                    📚
                                </div>
                                <div>
                                    <h4 className="text-white font-extrabold text-sm tracking-wide">Local Reading Room</h4>
                                    <p className="text-slate-300 text-xs mt-1 font-medium">Access Downloaded Textbooks</p>
                                </div>
                            </a>
                        </div>
                        <p className="text-slate-400 text-lg leading-relaxed mb-12">Official Digital Textbook Structure aligned with Core Knowledge Sequence for {activeGrade?.label} {activeSubject?.name}.</p>

                        {textbookStructure.map((unit: { unit: string, chapters: string[] }, uIdx: number) => (
                            <div key={uIdx} className="mb-12">
                                <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3 border-b border-slate-800 pb-2">
                                    <span className="text-blue-500">📚</span> 
                                    {unit.unit}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {unit.chapters.map((chapter: string, cIdx: number) => (
                                        <div key={cIdx} 
                                             className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-blue-900/40 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-between h-full"
                                             onClick={() => handleModuleSelect(chapter)}
                                        >
                                            <div>
                                                <h3 className="font-bold text-white text-lg mb-2">{chapter}</h3>
                                                <p className="text-sm text-slate-400 mb-4">Read chapter content and complete embedded critical thinking prompts.</p>
                                            </div>
                                            <button className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors mt-auto">
                                                Start Reading <span>→</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
};
