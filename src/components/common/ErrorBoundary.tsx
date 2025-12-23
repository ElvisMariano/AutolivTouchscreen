import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen bg-red-900 text-white flex flex-col items-center justify-center p-10 overflow-auto">
                    <h1 className="text-3xl font-bold mb-4">Algo deu errado.</h1>
                    <p className="text-xl mb-4">Ocorreu um erro inesperado na aplicação.</p>
                    <div className="bg-black p-4 rounded text-left font-mono text-sm whitespace-pre-wrap max-w-4xl w-full">
                        <p className="text-red-400 mb-2">{this.state.error && this.state.error.toString()}</p>
                        <p className="text-gray-400">{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
                    </div>
                    <button
                        className="mt-8 px-6 py-3 bg-white text-red-900 font-bold rounded hover:bg-gray-200 transition-colors"
                        onClick={() => window.location.reload()}
                    >
                        Recarregar Aplicação
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
