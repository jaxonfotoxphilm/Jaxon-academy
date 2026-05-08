import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { SoundManager } from '../utils/SoundManager';
import { CameraIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface VisionGraderProps {
    questionText: string;
    onClose: () => void;
}

export const VisionGrader: React.FC<VisionGraderProps> = ({ questionText, onClose }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMimeType(file.type);
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setSelectedImage(reader.result);
                setFeedback(null);
                setError(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;
        
        setIsAnalyzing(true);
        setError(null);
        SoundManager.playClick();

        try {
            // Extract just the base64 part, removing the "data:image/jpeg;base64," prefix
            const base64Data = selectedImage.split(',')[1];

            const { data, error: invokeError } = await supabase.functions.invoke('grade-vision', {
                body: { 
                    imageBase64: base64Data, 
                    mimeType: mimeType,
                    question: questionText 
                }
            });

            if (invokeError || !data || data.error) {
                throw new Error(data?.error || invokeError?.message || "Failed to analyze image");
            }

            setFeedback(data.response);
            
            // Try to speak the feedback
            try {
                const tts = await supabase.functions.invoke('generate-tts', { body: { text: data.response } });
                if (tts.data && tts.data.audioContent) {
                    const audio = new Audio("data:audio/mp3;base64," + tts.data.audioContent);
                    audio.play();
                }
            } catch(e) {
                // Fallback to browser TTS
                SoundManager.playCharacterVoice(data.response, 'professor');
            }

        } catch (err: any) {
            setError(err.message || "An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">Professor Grace Vision</h2>
                <p className="text-sm text-slate-400 mb-6">Upload a photo of your scratchpad and Professor Grace will review your work.</p>

                <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
                    <p className="text-sm font-medium text-slate-300">Current Question:</p>
                    <p className="text-white italic mt-1">{questionText}</p>
                </div>

                {!selectedImage ? (
                    <div 
                        className="w-full h-64 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800 hover:border-blue-400 cursor-pointer transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <PhotoIcon className="w-16 h-16 text-slate-500 mb-4" />
                        <p className="text-slate-300 font-medium">Click to upload photo of your work</p>
                        <p className="text-slate-500 text-sm mt-1">JPEG, PNG</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden border border-slate-700 mb-6 flex items-center justify-center">
                            <img src={selectedImage} alt="Student work" className="max-h-full max-w-full object-contain" />
                            <button 
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-lg backdrop-blur-sm"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {error && (
                            <div className="w-full bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {feedback ? (
                            <div className="w-full bg-blue-500/10 border border-blue-500/50 rounded-xl p-6 relative">
                                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border-2 border-slate-900">
                                    <span className="text-xl">👩‍🏫</span>
                                </div>
                                <p className="text-blue-100 leading-relaxed pl-4">{feedback}</p>
                            </div>
                        ) : (
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-xl ${
                                    isAnalyzing ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                                }`}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                        Analyzing handwriting...
                                    </>
                                ) : (
                                    <>
                                        <CameraIcon className="w-6 h-6" />
                                        Analyze My Work
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};
