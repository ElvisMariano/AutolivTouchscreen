import React from 'react';
import { Page, isAlertActive } from '../../types';
import { useData } from '../../contexts/DataContext';
import { HomeIcon, Cog6ToothIcon, ExclamationTriangleIcon } from './Icons';
import DocumentNotification from './DocumentNotification';
import useUpdateCheck from '../../hooks/useUpdateCheck';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
    // navigateTo removed
    // currentPage removed (we'll use useLocation)
}

const Header: React.FC<HeaderProps> = () => {
    const { alerts, selectedLineId } = useData();
    const { hasUpdate } = useUpdateCheck(60000);
    const { t, locale } = useI18n();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to map location.pathname to Page enum (optional, or just use paths directly in navigation)
    // Page enum values are string 'Dashboard', 'WorkInstructions'. 
    // We should map them to paths: /dashboard, /work-instructions or just use strings as paths?
    // Implementation Plan said: /dashboard, /work-instructions.

    // For now, let's assume we pass strings to navigate().
    // But page enum is used for Title.

    // Note: navigateTo in props took Page enum. Now we navigate to paths.
    // Dashboard -> '/'

    const activeAlertsCount = React.useMemo(() => {
        return alerts
            .filter(alert => (!selectedLineId || alert.lineId === selectedLineId))
            .filter(isAlertActive)
            .length;
    }, [alerts, selectedLineId]);

    const Clock: React.FC = () => {
        const [time, setTime] = React.useState(new Date());

        React.useEffect(() => {
            const timerId = setInterval(() => setTime(new Date()), 1000);
            return () => clearInterval(timerId);
        }, []);

        return (
            <div className="flex flex-col items-end">
                <div className="text-xl md:text-3xl font-bold font-mono tracking-wider text-blue-300">
                    {time.toLocaleTimeString(locale)}
                </div>
                <div className="text-sm text-gray-400 font-medium hidden md:block">
                    {time.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>
        );
    };

    return (
        <header className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white p-2 md:p-4 flex flex-wrap md:flex-nowrap justify-between items-center shadow-lg border-b border-gray-300 dark:border-gray-700 transition-colors gap-2 md:gap-0">
            <div className="flex items-center space-x-2 md:space-x-6">
                <div className="flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-1 md:p-2">
                    <img
                        src="/AutolivLogo.svg"
                        alt="Autoliv"
                        className="w-full h-full object-contain dark:invert"
                    />
                </div>

                <div className="h-8 w-px md:h-12 bg-gray-400 dark:bg-gray-600 mx-1 md:mx-2 hidden md:block"></div>

                <button onClick={() => navigate('/')} className="p-2 md:p-3 bg-gray-300 dark:bg-gray-700 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition-all hover:scale-105 shadow-md group">
                    <HomeIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-white transition-colors" />
                </button>
            </div>

            <div className="flex items-center space-x-2 md:space-x-6">
                {hasUpdate && (
                    <button onClick={() => window.location.reload()} className="px-2 py-1 md:px-4 md:py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors animate-pulse font-bold shadow-lg text-white text-xs md:text-base">
                        {t('common.update')}
                    </button>
                )}


                <DocumentNotification />



                <button
                    onClick={() => navigate('/quality-alerts')}
                    className="relative px-3 py-2 md:px-6 md:py-3 bg-red-600 rounded-xl hover:bg-red-700 transition-all hover:scale-105 shadow-md group flex items-center gap-2 md:gap-3"
                >
                    <ExclamationTriangleIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    <span className="text-sm md:text-xl font-bold text-white hidden md:inline">{t('header.alerts')}</span>
                    {activeAlertsCount > 0 && (
                        <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-white text-red-600 text-xs md:text-sm font-bold rounded-full h-5 w-5 md:h-8 md:w-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-800 shadow-sm">
                            {activeAlertsCount}
                        </span>
                    )}
                </button>

                <div className="bg-gray-100 dark:bg-gray-900 px-3 py-1 md:px-6 md:py-2 rounded-xl border border-gray-300 dark:border-gray-700 shadow-inner">
                    {/* Current Shift Display (Read-only) */}
                    {/* <span className="font-bold text-blue-600 dark:text-blue-400">{useData().currentShift}</span> */}
                    <Clock />
                </div>

                {(isAdmin || (useAuth().currentUser?.role?.allowed_resources?.includes('view:admin_access_button'))) && (
                    <button onClick={() => navigate('/admin')} className="p-2 md:p-3 bg-gray-300 dark:bg-gray-700 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition-all hover:scale-105 shadow-md group">
                        <Cog6ToothIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
                    </button>
                )}
            </div>
        </header >
    );
};

export default Header;
