import React, { useRef } from 'react';
import { useUploadCurriculum } from '../hooks/useUploadCurriculum';
import { CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface CurriculumUploaderProps {
    onUploadComplete?: (url: string) => void;
}

export const CurriculumUploader: React.FC<CurriculumUploaderProps> = ({ onUploadComplete }) => {
    const { isLoading, error, publicUrl, uploadFile, resetState } = useUploadCurriculum();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadFile(file);
        }
        // Reset input so the same file can be uploaded again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            uploadFile(file);
        }
    };

    const handleRetry = () => {
        resetState();
    };

    return (
        <div className="w-full max-w-xl mx-auto p-6 bg-slate-900 rounded-xl shadow-xl border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-4">Admin: Upload Study Material</h2>
            <p className="text-sm text-slate-400 mb-6">Upload a curriculum PDF to securely route it into the public cloud storage bucket.</p>

            <div 
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${isLoading ? 'border-blue-500 bg-blue-500/10' : error ? 'border-red-500 bg-red-500/10' : publicUrl ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800 hover:border-blue-400 hover:bg-slate-700/50 cursor-pointer'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !isLoading && !publicUrl && fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={isLoading}
                />

                {isLoading && (
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-blue-400 font-medium">Uploading & Routing PDF...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="flex flex-col items-center text-center">
                        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-3" />
                        <p className="text-red-400 font-medium mb-2">Upload Failed</p>
                        <p className="text-sm text-red-300 mb-4">{error}</p>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {publicUrl && !isLoading && !error && (
                    <div className="flex flex-col items-center text-center">
                        <CheckCircleIcon className="w-12 h-12 text-emerald-500 mb-3" />
                        <p className="text-emerald-400 font-medium mb-2">Successfully Uploaded!</p>
                        <a 
                            href={publicUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm text-blue-400 hover:text-blue-300 hover:underline mb-4 break-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {publicUrl}
                        </a>
                        <button 
                            onClick={(e) => { e.stopPropagation(); resetState(); if (onUploadComplete) onUploadComplete(publicUrl); }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
                        >
                            Upload Another File
                        </button>
                    </div>
                )}

                {!isLoading && !error && !publicUrl && (
                    <div className="flex flex-col items-center pointer-events-none">
                        <CloudArrowUpIcon className="w-12 h-12 text-slate-400 mb-3" />
                        <p className="text-slate-300 font-medium mb-1">Click to browse or drag and drop</p>
                        <p className="text-slate-500 text-xs">PDF files only</p>
                    </div>
                )}
            </div>
        </div>
    );
};
