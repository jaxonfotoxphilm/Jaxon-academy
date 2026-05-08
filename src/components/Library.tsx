import React, { useState } from 'react';
import pdfList from '../data/pdf-list.json';
import { SoundManager } from '../utils/SoundManager';
import { motion, AnimatePresence } from 'framer-motion';

export const Library: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>("Grade Specific");
    const categories = Object.keys(pdfList) as Array<keyof typeof pdfList>;

    const handleCategorySelect = (category: string) => {
        SoundManager.playClick();
        setActiveCategory(category);
    };

    const handlePdfSelect = (pdf: { id: string, name: string, path: string }) => {
        SoundManager.playClick();
        // Since we are basing off the curriculum folder, clicking the PDF simply opens it!
        // We will open it in a new tab natively.
        window.open(pdf.path, '_blank', 'noopener,noreferrer');
    };

    const getIconForCategory = (cat: string) => {
        if (cat === 'Elementary') return '🌱';
        if (cat === 'Middle School') return '🎒';
        if (cat === 'High School') return '🎓';
        return '📚';
    };

    const activeFiles = pdfList[activeCategory as keyof typeof pdfList] || [];

    return (
        <div className="flex h-full w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#040714] animate-in zoom-in-95 duration-700 relative">
            
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#040714] opacity-90"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[100px] mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
            </div>

            {/* Sidebar */}
            <div className="w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col relative z-10">
                <div className="p-8 pb-4">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-wider flex items-center gap-3">
                        <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] text-3xl">🏛️</span> 
                        Archives
                    </h2>
                    <p className="text-slate-400 text-xs mt-2 font-medium tracking-wide uppercase">Official PDF Library</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                    <h3 className="font-bold text-slate-600 uppercase tracking-widest text-[10px] mb-3 px-4">Collections</h3>
                    <motion.div 
                        className="flex flex-col gap-2" 
                        initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                    >
                        {categories.map(cat => (
                            <motion.button
                                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                                key={cat}
                                onClick={() => handleCategorySelect(cat)}
                                onMouseEnter={() => SoundManager.playHover()}
                                className={`text-left px-5 py-4 rounded-xl font-bold text-sm transition-all flex items-center gap-3 shadow-lg ${activeCategory === cat ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 text-white border border-slate-700 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
                            >
                                <span className="text-xl">{getIconForCategory(cat)}</span> {cat}
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto relative z-10 bg-transparent p-10 md:p-16 custom-scrollbar">
                <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
                    <div className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                <span className="text-5xl drop-shadow-lg">{getIconForCategory(activeCategory)}</span>
                            </div>
                            <div>
                                <h1 className="text-5xl font-black text-white tracking-tight">{activeCategory}</h1>
                                <p className="text-blue-400 font-bold tracking-[0.15em] uppercase text-xs mt-3">Local Document Storage</p>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-slate-400 text-lg leading-relaxed mb-12">Select a PDF to instantly open the official curriculum document in your reading room.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {activeFiles.map((file, idx) => (
                                <motion.div 
                                    key={file.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, delay: idx * 0.02 }}
                                    className="p-6 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_-15px_rgba(59,130,246,0.3)] hover:border-blue-500/30 hover:-translate-y-2 transition-all cursor-pointer flex flex-col h-full group relative overflow-hidden"
                                    onClick={() => handlePdfSelect(file)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                        <span className="text-2xl">📄</span>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <h3 className="font-extrabold text-white text-lg mb-2 leading-snug group-hover:text-blue-300 transition-colors">{file.name}</h3>
                                        <p className="text-xs text-slate-400 font-mono tracking-wider break-all">{file.id}</p>
                                    </div>

                                    <div className="mt-8 flex justify-between items-center border-t border-white/10 pt-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-400 transition-colors">PDF Document</span>
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                                            →
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    
                    {activeFiles.length === 0 && (
                        <div className="text-center py-24 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                            <span className="text-5xl mb-4 block opacity-50">📂</span>
                            <p className="font-bold uppercase tracking-widest">No documents found in this collection.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
