import React, { useState, useEffect, useRef } from 'react';
import { PdfViewer } from './PdfViewer';
import { GeminiService } from '../services/GeminiService';
import { CopyleaksService, type CopyleaksReport } from '../services/CopyleaksService';
import { SpeechService } from '../services/SpeechService';
import { XapiService } from '../services/XapiService';
import { supabase } from '../supabaseClient';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { SoundManager } from '../utils/SoundManager';
import curriculumData from '../data/curriculum-structure.json';

interface Message {
    role: 'student' | 'tutor';
    text: string;
}

interface MultiDraftTutorProps {
    onExit: () => void;
    studentName: string;
    assignmentId: string;
}

// Helper to render KaTeX mixed with text.
const renderWithMath = (text: string) => {
    // A simple regex to find $$...$$ or $...$ for math.
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    
    return parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
            return <BlockMath key={i} math={part.slice(2, -2)} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
            return <InlineMath key={i} math={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
    });
};

export const MultiDraftTutor: React.FC<MultiDraftTutorProps> = ({ onExit, studentName, assignmentId }) => {
    const [activeAssignmentId, setActiveAssignmentId] = useState(assignmentId);
    const [draftText, setDraftText] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'tutor', text: `Hello! I'm Professor Grace. We are studying ${activeAssignmentId}. Write your response or draft here, and I will help you improve it!` }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [isDictating, setIsDictating] = useState(false);
    const [report, setReport] = useState<CopyleaksReport | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    
    const stopDictationRef = useRef<(() => void) | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

        const contextMaterial = `The student is currently completing a module on the topic of "${activeAssignmentId}". You are Professor Grace. Do not assume the student is reading a PDF; rely on your own vast knowledge of "${activeAssignmentId}" to evaluate their draft. Be strict but encouraging. Ensure they understand the core concepts.`;

    useEffect(() => {
        // We will maintain the actual verified URL here.
        // We do not set it immediately so we don't flash a broken PDF before verifying.

        const checkUrls = async () => {
            try {
                // 1. Try Supabase
                const { data } = supabase.storage.from('curriculum-pdfs').getPublicUrl(`${activeAssignmentId}.pdf`);
                if (data?.publicUrl) {
                    const res = await fetch(data.publicUrl, { method: 'HEAD' });
                    if (res.ok && res.headers.get('content-type')?.includes('application/pdf')) {
                        setPdfUrl(data.publicUrl);
                        return;
                    }
                }
            } catch(e) {
                // Ignore
            }

            try {
                // 2. Try Local Fallback (for local development or if Supabase bucket doesn't have it)
                const safeId = activeAssignmentId.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                const localFallback = `/curriculum-pdfs/${safeId}.pdf`;
                const localRes = await fetch(localFallback, { method: 'HEAD' });
                // Vite SPA fallback returns 200 OK with text/html for missing files, so we MUST check content-type
                if (localRes.ok && localRes.headers.get('content-type')?.includes('application/pdf')) {
                    setPdfUrl(localFallback);
                    return;
                }
            } catch(e) {
                // Ignore
            }

            // 3. No fallback! If it doesn't exist, we don't show the PDF viewer.
            setPdfUrl(null);
        };
        checkUrls();
    }, [activeAssignmentId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        return () => {
            if (stopDictationRef.current) stopDictationRef.current();
            SpeechService.stop();
        };
    }, []);

    const toggleDictation = () => {
        SoundManager.playClick();
        if (isDictating) {
            if (stopDictationRef.current) stopDictationRef.current();
            setIsDictating(false);
        } else {
            setIsDictating(true);
            stopDictationRef.current = SpeechService.startListening(
                (text) => setDraftText(text),
                (err) => {
                    console.error("Dictation error", err);
                    setIsDictating(false);
                }
            );
        }
    };

    const handleReadAloud = (text: string) => {
        SoundManager.playHover();
        SpeechService.speak(text);
    };

    const handleSubmitForFeedback = async () => {
        if (!draftText.trim()) return;
        SoundManager.playClick();
        
        const newMsg: Message = { role: 'student', text: draftText };
        setMessages(prev => [...prev, newMsg]);
        setIsThinking(true);

        XapiService.sendStatement({
            actor: { name: studentName },
            verb: XapiService.verbs.attempted,
            object: { id: `assignment-${activeAssignmentId}`, definition: { name: { "en-US": `Draft submission for ${activeAssignmentId}` } } }
        });

        const feedback = await GeminiService.getTutoringFeedback(draftText, contextMaterial);
        
        setMessages(prev => [...prev, { role: 'tutor', text: feedback }]);
        setIsThinking(false);
    };

    const handleFinalSubmit = async () => {
        if (!draftText.trim()) return;
        SoundManager.playClick();
        setIsThinking(true);

        const result = await CopyleaksService.scanDraft(draftText);
        setReport(result);
        setIsThinking(false);

        XapiService.sendStatement({
            actor: { name: studentName },
            verb: XapiService.verbs.completed,
            object: { id: `assignment-${activeAssignmentId}`, definition: { name: { "en-US": `Final submission for ${activeAssignmentId}` } } },
            result: {
                success: result.status === 'pass',
                score: { raw: result.originalityScore, min: 0, max: 100 },
                response: draftText
            }
        });
    };

    // Writing topic picker using curriculum subjects
    if (activeAssignmentId === 'Writing Practice') {
        const allSubjects = curriculumData.grades.flatMap(g => g.subjects);
        const uniqueSubjects = allSubjects.filter((s, i, arr) => arr.findIndex(t => t.name === s.name) === i);

        return (
            <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-700 pb-20 pt-8">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/20 text-rose-300 font-black text-xs rounded-full uppercase tracking-widest mb-6 border border-rose-500/30">
                        <span>✍️</span> Writing Lab
                    </div>
                    <h2 className="text-5xl font-extrabold text-white tracking-tighter mb-4">Writing Tutor</h2>
                    <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                        Choose a subject to write about. Professor Grace will review your draft and provide feedback.
                    </p>
                </div>

                <div className="flex justify-end mb-6">
                    <button
                        onClick={onExit}
                        className="px-4 py-2 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-300 rounded-lg font-bold transition-all border border-transparent hover:border-rose-500/30 shadow-lg text-sm"
                    >
                        Close Writing Lab
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uniqueSubjects.slice(0, 18).map((subj) => (
                        <div 
                            key={subj.id}
                            className="bg-slate-800/80 border border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 cursor-pointer group hover:scale-[1.02] transition-all hover:shadow-lg hover:shadow-amber-900/20"
                            onClick={() => {
                                SoundManager.playClick();
                                setActiveAssignmentId(subj.name);
                            }}
                        >
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{subj.icon || '✍️'}</div>
                            <h3 className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-amber-300 transition-colors">{subj.name}</h3>
                            <p className="text-sm text-slate-400">Write an essay or report on this subject.</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col xl:flex-row gap-6 p-6 animate-in fade-in duration-500 bg-transparent relative z-50">
            {/* Left Pane: PDF Viewer */}
            {pdfUrl && (
                <div className="flex-1 xl:w-1/2 h-full min-h-[60vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest">{assignmentId} Material</h2>
                        <button onClick={onExit} className="px-4 py-2 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-300 rounded-lg font-bold transition-all border border-transparent hover:border-rose-500/30 shadow-lg">Close Tutor</button>
                    </div>
                    <div className="flex-1 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700 relative bg-slate-900">
                        <PdfViewer fileUrl={pdfUrl} />
                    </div>
                </div>
            )}

            {/* Right Pane: AI Tutor & Draft Pad */}
            <div className={`flex-1 ${pdfUrl ? 'xl:w-1/2' : 'w-full max-w-4xl mx-auto'} h-full flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden`}>
                <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                            <img src="/assets/avatar_astronaut.png" alt="Tutor" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest">Professor Grace</h3>
                            <p className="text-xs font-bold text-blue-400">AI Tutoring Active</p>
                        </div>
                    </div>
                    {!pdfUrl && (
                        <button onClick={onExit} className="px-4 py-2 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-300 rounded-lg text-sm font-bold transition-all border border-transparent hover:border-rose-500/30 shadow-lg">Close Tutor</button>
                    )}
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'student' ? 'justify-end' : 'justify-start'} group`}>
                            <div className={`max-w-[85%] p-5 rounded-2xl shadow-lg relative ${m.role === 'student' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'}`}>
                                <div className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">
                                    {renderWithMath(m.text)}
                                </div>
                                {m.role === 'tutor' && (
                                    <button 
                                        onClick={() => handleReadAloud(m.text)}
                                        className="absolute -right-12 top-2 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-md"
                                        title="Read Aloud"
                                    >
                                        🔊
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex gap-2 items-center shadow-lg">
                                <span className="animate-pulse">●</span>
                                <span className="animate-pulse delay-100">●</span>
                                <span className="animate-pulse delay-200">●</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Copyleaks Report */}
                {report && (
                    <div className={`mx-4 mb-4 p-5 rounded-xl border-2 ${report.status === 'pass' ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' : 'bg-rose-950/40 border-rose-800/50 text-rose-200'}`}>
                        <h4 className="font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            {report.status === 'pass' ? '✅ Submission Accepted' : '❌ Revisions Required'}
                        </h4>
                        <div className="flex gap-6 mb-3">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Human Originality</p>
                                <p className="text-2xl font-black">{report.originalityScore}%</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Probability</p>
                                <p className="text-2xl font-black">{report.aiProbability}%</p>
                            </div>
                        </div>
                        <p className="text-sm italic text-slate-300">{report.feedback}</p>
                    </div>
                )}

                {/* Draft Input */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
                    <div className="relative">
                        <textarea 
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            placeholder="Write your draft here..."
                            className="w-full min-h-[160px] bg-slate-900 border border-slate-700 rounded-xl p-4 pb-12 text-white resize-y focus:border-blue-500 outline-none pr-12 transition-colors shadow-inner custom-scrollbar"
                            disabled={isThinking || report?.status === 'pass'}
                        />
                        <button 
                            onClick={toggleDictation}
                            disabled={isThinking || report?.status === 'pass'}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isDictating ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            title={isDictating ? "Stop Dictation" : "Start Dictation"}
                        >
                            🎤
                        </button>
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                        <button 
                            onClick={handleSubmitForFeedback}
                            disabled={isThinking || !draftText.trim() || report?.status === 'pass'}
                            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold tracking-wide uppercase text-sm rounded-xl transition-all border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Get Feedback
                        </button>
                        <button 
                            onClick={handleFinalSubmit}
                            disabled={isThinking || !draftText.trim() || report?.status === 'pass'}
                            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold tracking-wide uppercase text-sm rounded-xl transition-all shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/20"
                        >
                            Final Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
