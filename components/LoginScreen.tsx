import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface LoginScreenProps {
    onClose?: () => void;
}

export default function LoginScreen({ onClose }: LoginScreenProps) {
    const { login } = useAuth();
    const { t } = useI18n();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setError('');
        setIsLoading(true);

        try {
            // Calling login logic from AuthContext which handles redirect
            await login();
            // Note: If successful, page might redirect, so logic below might not execute
        } catch (err) {
            console.error(err);
            setError('Erro ao iniciar sessão Microsoft');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                )}

                <div className="text-center mb-8">
                    {/* Logo da Autoliv */}
                    <img
                        src="/AutolivLogo.svg"
                        alt="Autoliv"
                        className="h-16 mx-auto mb-6 dark:invert"
                    />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('login.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Autenticação Microsoft
                    </p>
                </div>

                <div className="space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full bg-[#2F2F2F] hover:bg-[#4a4a4a] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 21 21">
                            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                        </svg>
                        {isLoading ? 'Redirecionando...' : 'Entrar com Microsoft'}
                    </button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Use sua conta corporativa.</p>
                </div>
            </div>
        </div>
    );
}
