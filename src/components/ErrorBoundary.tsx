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
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 text-center max-w-xs">
                        <span className="text-3xl opacity-60">⚠️</span>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                            {this.props.label || 'Component'} unavailable
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, message: '' })}
                            className="text-xs text-[var(--accent-blue)] hover:underline transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
