// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Optional fallback UI. Defaults to a minimal dark error card. */
    fallback?: ReactNode;
    /** Label shown in the default fallback card (e.g. "3D Scene", "Video Player") */
    label?: string;
}

interface State {
    hasError: boolean;
    message: string;
}

/**
 * Generic React Error Boundary.
 * Wraps any component that might throw (3D canvas, YouTube iframe, Supabase calls).
 * On error, renders a graceful fallback instead of crashing the whole app.
 *
 * Usage:
 *   <ErrorBoundary label="3D Scene">
 *     <Canvas .../>
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, message: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // In production, send to your error-reporting service here
        console.error(`[ErrorBoundary] ${this.props.label || 'Component'} crashed:`, error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full min-h-screen flex items-center justify-center bg-[#0a0a1a] text-white p-6">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/5 border border-white/10 text-center max-w-xl">
                        <span className="text-5xl opacity-80">⚠️</span>
                        <h2 className="text-xl font-bold">App Crash Detected</h2>
                        <p className="text-red-400 font-mono text-sm bg-black/40 p-4 rounded-xl text-left w-full overflow-auto whitespace-pre-wrap">
                            {this.state.message}
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            {this.props.label || 'Component'} encountered an unexpected error.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-3 bg-[var(--accent-blue)] text-white font-bold rounded-xl hover:opacity-90 transition-all"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
