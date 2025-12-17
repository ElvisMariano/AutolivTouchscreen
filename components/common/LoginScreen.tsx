import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { UserRole } from '../../types';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'; // Adjust import based on what's available

interface LoginScreenProps {
    onUnlock: () => void;
    requireRole?: UserRole;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onUnlock, requireRole }) => {
    const [username, setUsername] = useState('');

    // Effect to fetch OS username robustly
    React.useEffect(() => {
        const fetchOsUser = () => {
            if (window.electron?.getOsUsername) {
                const osUser = window.electron.getOsUsername();
                console.log('LoginScreen: Fetched OS User:', osUser);
                if (osUser) {
                    setUsername(osUser);
                }
            }
        };

        fetchOsUser();
        // Retry once after a short delay just in case preload is slow (rare but possible)
        const timer = setTimeout(fetchOsUser, 500);
        return () => clearTimeout(timer);
    }, []);

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { users } = useData();
    const { setCurrentUser } = useAuth();
    const { t } = useI18n();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u =>
            (u.username?.toLowerCase() === username.toLowerCase() || u.name.toLowerCase() === username.toLowerCase()) && // Fallback to name if username not set
            u.password === password
        );

        if (user) {
            if (requireRole && user.role.id !== requireRole) {
                setError(t('admin.accessDenied'));
                return;
            }
            setCurrentUser(user);
            onUnlock();
        } else {
            setError(t('admin.invalidCredentials') || 'Credenciais inválidas'); // Add translation key later
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-8 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-2xl transition-colors duration-300">
            <div className="flex items-center justify-center w-20 h-20 mb-6 bg-cyan-600 rounded-full shadow-lg">
                <LockClosedIcon className="w-10 h-10 text-white" />
            </div>

            <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{t('common.login')}</h2>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.user')}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-4 pl-10 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors"
                            placeholder={t('common.user')}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.password')}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <LockClosedIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 pl-10 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 text-center animate-shake">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full px-5 py-4 text-lg font-bold text-center text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 transition-transform transform hover:scale-105"
                >
                    {t('common.login')}
                </button>
            </form>
        </div>
    );
};

export default LoginScreen;
