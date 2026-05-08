import React, { useState, useEffect } from 'react';
import curriculumData from '../data/curriculum-structure.json';
import { SoundManager } from '../utils/SoundManager';
import { supabase } from '../supabaseClient';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

// removed CoursePathway interface

export const Library: React.FC<{ lockedGradeId?: string | null; currentUser?: string | null }> = ({ lockedGradeId, currentUser }) => {
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
    const [generatedContent, setGeneratedContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

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
        setGeneratedContent(null);
    };

    const handleSubjectSelect = (subjectId: string) => {
        SoundManager.playClick();
        setSelectedSubjectId(subjectId);
        setActiveModule(null);
        setGeneratedContent(null);
    };

    const handleModuleSelect = async (moduleName: string) => {
        SoundManager.playClick();
        setActiveModule(moduleName);
        setGeneratedContent(null);
        setIsGenerating(true);

        try {
            const { data, error } = await supabase.functions.invoke('generate-course-material', {
                body: {
                    gradeLevel: activeGrade?.label || 'Elementary',
                    subject: activeSubject?.name || 'General Studies',
                    topic: moduleName
                }
            });

            if (error) throw error;
            if (data && data.content) {
                setGeneratedContent(data.content);
            }
        } catch (error) {
            console.error("Failed to generate course material:", error);
            setGeneratedContent("# Error\nFailed to fetch curriculum material. Please check your connection or contact the Principal.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full min-h-[85vh] bg-slate-950 flex flex-col md:flex-row relative overflow-hidden animate-in fade-in duration-500 font-sans">
            {/* Left Sidebar: Academy Navigation */}
            <div className="w-full md:w-80 bg-[#0f172a] border-r border-slate-800 p-6 flex flex-col shrink-0 z-10 h-full overflow-y-auto">
                <div className="mb-10">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 uppercase tracking-widest flex items-center gap-3">
                        <span className="text-blue-500">🎓</span> Virtual Academy
                    </h2>
                    <p className="text-xs font-bold text-slate-500 tracking-wider mt-2 uppercase">Nebraska State Standards</p>
                </div>

                {/* Grade Level Selection */}
                <h3 className="font-bold text-slate-600 uppercase tracking-widest text-[10px] mb-3">Academic Level</h3>
                <motion.div 
                    className="flex flex-col gap-1 mb-8"
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
                            className={`text-left px-4 py-3 rounded-lg font-bold text-sm transition-all ${selectedGradeId === g.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            {g.label}
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
            <div className="flex-1 overflow-y-auto relative z-10 bg-[#0B0F19]">
                {!selectedSubjectId ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-slate-800">
                            <span className="text-5xl">🏫</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Select a Course</h3>
                        <p className="text-slate-400 max-w-md">Choose a core subject from the sidebar to view your state-aligned academic pathway.</p>
                    </div>
                ) : !activeModule ? (
                    /* Learning Pathway UI */
                    <div className="p-10 md:p-16 max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
                        <div className="mb-12 border-b border-slate-800 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl drop-shadow-lg">{activeSubject?.icon}</span>
                                <div>
                                    <h1 className="text-4xl font-black text-white">{activeSubject?.name}</h1>
                                    <p className="text-blue-400 font-bold tracking-wider uppercase text-sm mt-2">{activeGrade?.label} Coursework</p>
                                </div>
                            </div>
                            
                            {/* Official Curriculum Materials Link */}
                            <a 
                                href="https://www.coreknowledge.org/curriculum/download-curriculum/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-105 group"
                            >
                                <div className="bg-red-500/20 text-red-400 p-3 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors text-xl">
                                    📄
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">Official PDF Readers</h4>
                                    <p className="text-slate-400 text-xs mt-1">Download Core Knowledge Textbooks</p>
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
                ) : (
                    /* AI Generated Curriculum Viewer */
                    <div className="animate-in slide-in-from-right-8 duration-500 h-full flex flex-col">
                        <div className="flex justify-between items-center bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-800 p-6 sticky top-0 z-20">
                            <button onClick={() => setActiveModule(null)} className="text-slate-400 font-bold flex items-center gap-2 hover:text-white transition-colors bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                                <span>←</span> Back to Pathway
                            </button>
                            <div className="text-right">
                                <h2 className="text-lg font-black text-white">{activeSubject?.name}</h2>
                                <div className="text-blue-400 text-xs font-bold uppercase tracking-widest">{activeModule}</div>
                            </div>
                        </div>
                        
                        <div className="flex-1 bg-white p-8 md:p-16 overflow-y-auto">
                            <div className="max-w-3xl mx-auto">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                                        <h3 className="text-xl font-bold text-slate-800">Generating State Curriculum...</h3>
                                        <p className="text-sm mt-2">Professor Grace is writing your official textbook chapter.</p>
                                    </div>
                                ) : (
                                    <div className="prose prose-lg prose-slate max-w-none">
                                        <ReactMarkdown>{generatedContent || ''}</ReactMarkdown>
                                        
                                        <div className="mt-16 pt-8 border-t-2 border-slate-200 flex justify-between items-center bg-slate-50 p-6 rounded-2xl">
                                            <div>
                                                <h4 className="font-bold text-slate-800 m-0">Finished Reading?</h4>
                                                <p className="text-sm text-slate-500 m-0 mt-1">Head to the Study Camp to take the interactive lesson!</p>
                                            </div>
                                            <button 
                                                onClick={() => setActiveModule(null)}
                                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Return to Pathway
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
