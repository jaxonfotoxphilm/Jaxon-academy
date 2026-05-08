import React, { useState, useEffect } from 'react';
import { ParentManager } from '../utils/ParentManager';
import { SoundManager } from '../utils/SoundManager';

interface BackpackProps {
    currentUser: string;
    onClose: () => void;
}

// Simple dictionary of items for Gamification
const ITEM_DB: Record<string, { name: string; description: string; icon: string; color: string }> = {
    'armor_helmet': {
        name: 'Helmet of Salvation',
        description: 'Protects the mind. Earned by mastering Apologetics.',
        icon: '🪖',
        color: 'from-slate-400 to-slate-600'
    },
    'armor_shield': {
        name: 'Shield of Faith',
        description: 'Deflects doubts. Earned by standing strong in early theology.',
        icon: '🛡️',
        color: 'from-amber-400 to-amber-600'
    },
    'science_microscope': {
        name: 'Quantum Microscope',
        description: 'See the unseen design of the universe. Earned in Biology.',
        icon: '🔬',
        color: 'from-teal-400 to-emerald-600'
    },
    'history_scroll': {
        name: 'Ancient Scroll',
        description: 'A record of the past. Earned in World History.',
        icon: '📜',
        color: 'from-orange-800 to-amber-900'
    },
    'math_abacus': {
        name: 'Golden Abacus',
        description: 'Master of logic and order. Earned in Mathematics.',
        icon: '🧮',
        color: 'from-yellow-400 to-yellow-600'
    }
};

export const Backpack: React.FC<BackpackProps> = ({ currentUser, onClose }) => {
    const [inventory, setInventory] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchInventory = async () => {
            const inv = await ParentManager.getStudentInventory(currentUser);
            setInventory(inv);
        };
        fetchInventory();
        SoundManager.playHover(); // Play a nice sound on open
    }, [currentUser]);

    const CardHover = () => SoundManager.playHover();

    // Fill the rest with empty slots so it looks like a real inventory grid
    const maxSlots = 12;
    const slots = [...inventory];
    while (slots.length < maxSlots) {
        slots.push('empty');
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="bg-slate-900 w-full max-w-5xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                
                {/* Header */}
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            🎒 {currentUser}'s Backpack
                        </h2>
                        <p className="text-slate-400 font-medium mt-1">Collect items by completing your curriculum modules.</p>
                    </div>
                    <button 
                        onClick={() => { SoundManager.playClick(); onClose(); }}
                        className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-2xl transition-colors border border-white/10 hover:border-white/50"
                    >
                        ✕
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-12 hide-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {slots.map((itemId, index) => {
                            const isLocked = itemId === 'empty';
                            const itemDef = ITEM_DB[itemId];

                            if (isLocked || !itemDef) {
                                return (
                                    <div key={`empty-${index}`} className="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-white/10">
                                        <span className="text-4xl mb-2">🔒</span>
                                        <span className="text-sm font-bold uppercase tracking-wider">Locked</span>
                                    </div>
                                );
                            }

                            return (
                                <div 
                                    key={`item-${index}-${itemId}`}
                                    onMouseEnter={CardHover}
                                    className="aspect-square relative group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 hover:z-30 border-2 border-white/20 hover:border-white shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${itemDef.color} opacity-80 mix-blend-multiply`}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                        <div className="text-7xl mb-4 drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500">{itemDef.icon}</div>
                                        <div className="absolute bottom-4 left-0 right-0 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                                            <h4 className="font-bold text-white text-sm leading-tight drop-shadow-md mb-1">{itemDef.name}</h4>
                                            <p className="text-[10px] text-slate-300 leading-tight">{itemDef.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
