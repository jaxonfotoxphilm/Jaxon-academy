import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
    fileUrl: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl }) => {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    return (
        <div className="flex flex-col items-center bg-slate-900 rounded-xl overflow-hidden border border-slate-700 h-full w-full max-h-full">
            <div className="bg-slate-800 w-full p-2 flex justify-between items-center text-sm font-bold text-slate-300 border-b border-slate-700 shrink-0">
                <button 
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                    className="px-3 py-1 hover:bg-slate-700 rounded disabled:opacity-50 transition-colors"
                >
                    &larr; Prev
                </button>
                <span>
                    Page {pageNumber} of {numPages || '--'}
                </span>
                <button 
                    onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
                    disabled={pageNumber >= (numPages || 1)}
                    className="px-3 py-1 hover:bg-slate-700 rounded disabled:opacity-50 transition-colors"
                >
                    Next &rarr;
                </button>
            </div>
            <div className="flex-1 overflow-auto w-full flex justify-center bg-slate-950 p-4 relative">
                <Document 
                    file={fileUrl} 
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={console.error}
                    error={<div className="text-rose-500 font-bold mt-10">Failed to load curriculum material.</div>}
                    className="shadow-2xl"
                    loading={<div className="text-slate-500 animate-pulse mt-10">Loading Curriculum Material...</div>}
                >
                    <Page 
                        pageNumber={pageNumber} 
                        renderTextLayer={true} 
                        renderAnnotationLayer={false}
                        width={600}
                    />
                </Document>
            </div>
        </div>
    );
};
