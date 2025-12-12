import React from 'react';
import { Page, isAlertActive } from '../../types';
import { useData } from '../../contexts/DataContext';
import { HomeIcon, Cog6ToothIcon, ExclamationTriangleIcon } from './Icons';
import useUpdateCheck from '../../hooks/useUpdateCheck';
import { useI18n } from '../../contexts/I18nContext';

interface HeaderProps {
    currentPage: Page;
    navigateTo: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, navigateTo }) => {
    const { alerts, selectedLineId } = useData();
    const { hasUpdate } = useUpdateCheck(60000);
    const { t, locale } = useI18n();

    const activeAlertsCount = React.useMemo(() => {
        return alerts
            .filter(alert => (!selectedLineId || alert.lineId === selectedLineId))
            .filter(isAlertActive)
            .length;
    }, [alerts, selectedLineId]);

    const getPageTitle = (page: Page) => {
        switch (page) {
            case Page.Dashboard: return t('dashboard.title');
            case Page.WorkInstructions: return t('workInstructions.title');
            case Page.AcceptanceCriteria: return t('acceptanceCriteria.title');
            case Page.StandardizedWork: return t('standardizedWork.title');
            case Page.QualityAlerts: return t('qualityAlerts.title');
            case Page.Admin: return t('admin.title');
            default: return page;
        }
    };

    const Clock: React.FC = () => {
        const [time, setTime] = React.useState(new Date());

        React.useEffect(() => {
            const timerId = setInterval(() => setTime(new Date()), 1000);
            return () => clearInterval(timerId);
        }, []);

        return (
            <div className="flex flex-col items-end">
                <div className="text-3xl font-bold font-mono tracking-wider text-blue-300">
                    {time.toLocaleTimeString(locale)}
                </div>
                <div className="text-sm text-gray-400 font-medium">
                    {time.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>
        );
    };

    return (
        <header className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white p-4 flex justify-between items-center shadow-lg border-b border-gray-300 dark:border-gray-700 transition-colors">
            <div className="flex items-center space-x-6">
                <div className="flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-2">
                    <img
                        src="/AutolivLogo.svg"
                        alt="Autoliv"
                        className="w-full h-full object-contain dark:invert"
                    />
                </div>

                <div className="h-12 w-px bg-gray-400 dark:bg-gray-600 mx-2"></div>

                <button onClick={() => navigateTo(Page.Dashboard)} className="p-3 bg-gray-300 dark:bg-gray-700 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition-all hover:scale-105 shadow-md group">
                    <HomeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-white transition-colors" />
                </button>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{getPageTitle(currentPage)}</h1>
            </div>

            <div className="flex items-center space-x-6">
                {hasUpdate && (
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors animate-pulse font-bold shadow-lg text-white">
                        {t('common.update')}
                    </button>
                )}

                <button
                    onClick={() => navigateTo(Page.QualityAlerts)}
                    className="relative px-6 py-3 bg-red-600 rounded-xl hover:bg-red-700 transition-all hover:scale-105 shadow-md group flex items-center gap-3"
                >
                    <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                    <span className="text-xl font-bold text-white">{t('header.alerts')}</span>
                    {activeAlertsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-white text-red-600 text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-800 shadow-sm">
                            {activeAlertsCount}
                        </span>
                    )}
                </button>

                <div className="bg-gray-100 dark:bg-gray-900 px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-700 shadow-inner">
                    <Clock />
                </div>

                <button onClick={() => navigateTo(Page.Admin)} className="p-3 bg-gray-300 dark:bg-gray-700 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition-all hover:scale-105 shadow-md group">
                    <Cog6ToothIcon className="h-8 w-8 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
                </button>
            </div>
        </header>
    );
};

export default Header;
