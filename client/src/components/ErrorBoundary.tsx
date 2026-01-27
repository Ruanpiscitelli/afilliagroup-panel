import { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex items-center justify-center min-h-screen bg-white">
                    <div className="text-center p-8">
                        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Algo deu errado</h1>
                        <p className="text-slate-600 mb-4">Ocorreu um erro ao carregar a página.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-slate-950 text-white rounded-lg hover:bg-slate-900 transition-colors"
                        >
                            Recarregar página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
