import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
                    <div className="rounded-2xl bg-[var(--color-surface-secondary)] p-8 shadow-sm">
                        <div className="mb-4 text-4xl">😵</div>
                        <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-text-primary)]">
                            Something went wrong
                        </h2>
                        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="rounded-lg bg-[var(--color-creator-purple)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-creator-purple-dark)]"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
