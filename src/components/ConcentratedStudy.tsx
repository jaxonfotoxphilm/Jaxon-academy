import React, { useState } from 'react';
import pdfList from '../data/pdf-list.json';
import { SoundManager } from '../utils/SoundManager';
import { motion } from 'framer-motion';

export const ConcentratedStudy: React.FC<{ onLaunchExam: (examId: string) => void }> = ({ onLaunchExam }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>("Grade Specific");
    const categories = Object.keys(pdfList) as Array<keyof typeof pdfList>;

    const activeFiles = pdfList[selectedCategory as keyof typeof pdfList] || [];

    return (
        <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-700 pb-20 pt-8">
            <div className="text-center mb-12">
                <h2 className="text-5xl font-extrabold text-white tracking-widest uppercase mb-4 drop-shadow-md">Study Camp</h2>
                <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                    Select an official curriculum document to begin a rigorous, AI-proctored examination.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => {
                            SoundManager.playClick();
                            setSelectedCategory(cat);
                        }}
                        className={`px-5 py-2 rounded-full font-bold transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFiles.map(file => (
                    <motion.div 
                        key={file.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-800/80 border border-slate-700 hover:border-blue-500 rounded-2xl p-6 cursor-pointer group"
                        onClick={() => {
                            SoundManager.playClick();
                            onLaunchExam(`dynamic:Exam on ${file.name}`);
                        }}
                    >
                        <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📝</div>
                        <h3 className="font-bold text-white text-lg leading-tight mb-2">{file.name}</h3>
                        <p className="text-sm text-slate-400">Generate a comprehensive test based on this PDF.</p>
                    </motion.div>
                ))}
            </div>
            
            {activeFiles.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">No curriculum files found for this category.</p>
                </div>
            )}
        </div>
    );
};
