
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { AdminSubPage } from '../types';
import AdminWorkInstructions from './AdminWorkInstructions';
import AdminAcceptanceCriteria from './AdminAcceptanceCriteria';
import AdminStandardizedWork from './AdminStandardizedWork';
import AdminPowerBI from './AdminPowerBI';
import AdminPresentations from './AdminPresentations';
import AdminUserManagement from './AdminUserManagement';
import AdminChangeLog from './AdminChangeLog';
import AdminAlertsManagement from './AdminAlertsManagement';
import { getLatestBackup } from '../services/backup';
import { useI18n } from '../contexts/I18nContext';
import {
    DocumentTextIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    PresentationChartBarIcon,
    UsersIcon,
    ClockIcon,
    CogIcon
} from './common/Icons';


interface PinLockScreenProps {
    onUnlock: () => void;
}

import LoginScreen from './common/LoginScreen';

const AdminSettings: React.FC = () => {
    const { settings, updateSetting, exportAll, importAll, logEvent } = useData();
    const { t } = useI18n();
    const restoreSettingsBackup = async () => {
        const data = await getLatestBackup('settings');
        if (data) {
            importAll({ settings: data });
            logEvent('settings', 'update', 'restore', 'Restaurar último backup de configurações');
        }
    };
    const handleExport = () => {
        const data = exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-autoliv-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        logEvent('settings', 'view', 'export', 'Exportar backup JSON');
    };
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(String(reader.result));
                importAll(data);
                logEvent('settings', 'view', 'import', 'Importar backup JSON');
            } catch { }
        };
        reader.readAsText(file);
        e.currentTarget.value = '';
    };

    return (
        <div className="space-y-8">
            <div>
                <label htmlFor="inactivity" className="text-2xl font-semibold text-gray-800 dark:text-gray-300">{t('admin.inactivityTimeout')}</label>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{t('admin.inactivityDescription')}</p>
                <input
                    type="number"
                    id="inactivity"
                    value={settings.inactivityTimeout}
                    onChange={(e) => updateSetting('inactivityTimeout', parseInt(e.target.value, 10) || 0)}
                    className="w-full md:w-1/2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-lg text-2xl border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors"
                />
            </div>
            <div>
                <label htmlFor="notification" className="text-2xl font-semibold text-gray-800 dark:text-gray-300">{t('admin.notificationDuration')}</label>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{t('admin.notificationDescription')}</p>
                <input
                    type="number"
                    id="notification"
                    value={settings.notificationDuration}
                    onChange={(e) => updateSetting('notificationDuration', parseInt(e.target.value, 10) || 0)}
                    className="w-full md:w-1/2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-lg text-2xl border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors"
                />
            </div>

            <div className="mt-10 border-t border-gray-700 pt-6">
                <h3 className="text-2xl font-bold text-gray-300 mb-4">{t('common.settings')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Idioma */}
                    <div>
                        <label className="block text-xl mb-2">{t('common.language')}</label>
                        <select
                            value={settings.language || 'pt-BR'}
                            onChange={(e) => updateSetting('language', e.target.value as any)}
                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-xl border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors"
                        >
                            <option value="pt-BR">Português (Brasil)</option>
                            <option value="en-US">English (US)</option>
                            <option value="es-ES">Español</option>
                        </select>
                    </div>
                    {/* Tema */}
                    <div>
                        <label className="block text-xl mb-2">{t('common.theme')}</label>
                        <select
                            value={settings.theme || 'dark'}
                            onChange={(e) => updateSetting('theme', e.target.value as any)}
                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-xl border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors"
                        >
                            <option value="dark">{t('common.dark')}</option>
                            <option value="light">{t('common.light')}</option>
                        </select>
                    </div>
                    {/* Fonte */}
                    <div>
                        <label className="block text-xl mb-2">{t('admin.fontSize')}</label>
                        <select
                            value={settings.fontSize || 'medium'}
                            onChange={(e) => updateSetting('fontSize', e.target.value as any)}
                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-xl border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors"
                        >
                            <option value="small">{t('common.small')}</option>
                            <option value="medium">{t('common.medium')}</option>
                            <option value="large">{t('common.large')}</option>
                        </select>
                    </div>
                    {/* Auto Refresh */}
                    <div>
                        <label className="block text-xl mb-2">{t('admin.autoRefresh')}</label>
                        <input
                            type="number"
                            value={settings.autoRefreshInterval || 60}
                            onChange={(e) => updateSetting('autoRefreshInterval', parseInt(e.target.value) || 60)}
                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-xl border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <label className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700 hover:border-cyan-500 transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.enableSoundNotifications || false}
                            onChange={(e) => updateSetting('enableSoundNotifications', e.target.checked)}
                            className="w-6 h-6 accent-cyan-500"
                        />
                        <span className="text-xl text-gray-900 dark:text-white">{t('admin.enableSound')}</span>
                    </label>
                    <label className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700 hover:border-cyan-500 transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.showTutorials ?? true}
                            onChange={(e) => updateSetting('showTutorials', e.target.checked)}
                            className="w-6 h-6 accent-cyan-500"
                        />
                        <span className="text-xl text-gray-900 dark:text-white">{t('admin.showTutorials')}</span>
                    </label>
                    <label className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700 hover:border-cyan-500 transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.compactMode || false}
                            onChange={(e) => updateSetting('compactMode', e.target.checked)}
                            className="w-6 h-6 accent-cyan-500"
                        />
                        <span className="text-xl text-gray-900 dark:text-white">{t('admin.compactMode')}</span>
                    </label>
                    <label className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700 hover:border-cyan-500 transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.kioskMode || false}
                            onChange={(e) => updateSetting('kioskMode', e.target.checked)}
                            className="w-6 h-6 accent-cyan-500"
                        />
                        <span className="text-xl text-gray-900 dark:text-white">{t('admin.kioskMode')}</span>
                    </label>
                </div>
            </div>
            <div className="mt-10 border-t border-gray-300 dark:border-gray-700 pt-6">
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">{t('admin.backup')}</h3>
                <div className="flex items-center gap-4 flex-wrap">
                    <button onClick={handleExport} className="px-6 py-3 bg-blue-600 rounded-lg text-xl hover:bg-blue-500 text-white">{t('admin.export')}</button>
                    <label className="px-6 py-3 bg-green-600 rounded-lg text-xl hover:bg-green-500 cursor-pointer text-white">
                        {t('admin.import')}
                        <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
                    </label>
                    <button onClick={restoreSettingsBackup} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('admin.restore')}</button>
                </div>
            </div>
        </div>
    );
}

interface AdminPanelProps {
    isAdmin: boolean;
    setIsAdmin: (isAdmin: boolean) => void;
    subPage: AdminSubPage;
    setSubPage: (subPage: AdminSubPage) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin, setIsAdmin, subPage, setSubPage }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const isPanningRef = useRef(false);
    const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const { t } = useI18n();

    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser && currentUser.role === 'admin' && !isAdmin) {
            setIsAdmin(true);
        }
    }, [currentUser, isAdmin, setIsAdmin]);

    if (!isAdmin) {
        return <LoginScreen onUnlock={() => setIsAdmin(true)} requireRole='admin' />;
    }

    const renderSubPage = () => {
        switch (subPage) {
            case AdminSubPage.Settings:
                return <AdminSettings />;
            case AdminSubPage.WorkInstructions:
                return <AdminWorkInstructions />;
            case AdminSubPage.AcceptanceCriteria:
                return <AdminAcceptanceCriteria />;
            case AdminSubPage.StandardizedWork:
                return <AdminStandardizedWork />;
            case AdminSubPage.PowerBI:
                return <AdminPowerBI />;
            case AdminSubPage.Presentations:
                return <AdminPresentations />;
            case AdminSubPage.Users:
                return <AdminUserManagement />;
            case AdminSubPage.History:
                return <AdminChangeLog />;
            case AdminSubPage.QualityAlerts:
                return <AdminAlertsManagement />;
            default:
                return <AdminSettings />;
        }
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('input,select,textarea,button')) return;
        const el = contentRef.current;
        if (!el) return;
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
    };
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isPanningRef.current) return;
        const el = contentRef.current;
        if (!el) return;
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        el.scrollLeft = panStartRef.current.scrollLeft - dx;
        el.scrollTop = panStartRef.current.scrollTop - dy;
    };
    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = contentRef.current;
        if (!el) return;
        el.releasePointerCapture(e.pointerId);
        isPanningRef.current = false;
    };

    const getSubPageTitle = (page: AdminSubPage) => {
        switch (page) {
            case AdminSubPage.WorkInstructions: return t('workInstructions.title');
            case AdminSubPage.AcceptanceCriteria: return t('acceptanceCriteria.title');
            case AdminSubPage.StandardizedWork: return t('standardizedWork.title');
            case AdminSubPage.QualityAlerts: return t('qualityAlerts.title');
            case AdminSubPage.PowerBI: return t('common.report');
            case AdminSubPage.Presentations: return t('common.presentation');
            case AdminSubPage.Users: return t('admin.users');
            case AdminSubPage.History: return t('admin.logs');
            case AdminSubPage.Settings: return t('admin.settings');
            default: return page;
        }
    };

    // Menu items com ícones na ordem especificada
    const menuItems = [
        { page: AdminSubPage.WorkInstructions, icon: DocumentTextIcon },
        { page: AdminSubPage.AcceptanceCriteria, icon: DocumentTextIcon },
        { page: AdminSubPage.StandardizedWork, icon: DocumentTextIcon },
        { page: AdminSubPage.QualityAlerts, icon: ExclamationTriangleIcon },
        { page: AdminSubPage.PowerBI, icon: ChartBarIcon },
        { page: AdminSubPage.Presentations, icon: PresentationChartBarIcon },
        { page: AdminSubPage.Users, icon: UsersIcon },
        { page: AdminSubPage.History, icon: ClockIcon },
        { page: AdminSubPage.Settings, icon: CogIcon },
    ];

    return (
        <div className="h-full flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-800 p-4 rounded-lg flex-shrink-0 transition-colors duration-300 shadow-lg">
                <h3 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">{t('admin.title')}</h3>
                <ul className="space-y-2">
                    {menuItems.map(({ page, icon: Icon }) => (
                        <li key={page}>
                            <button
                                onClick={() => setSubPage(page)}
                                className={`w-full flex items-center gap-3 p-4 rounded-md transition-colors text-lg ${subPage === page
                                    ? 'bg-cyan-600 text-white font-bold'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <Icon className="h-6 w-6 flex-shrink-0" />
                                <span className="text-left">{getSubPageTitle(page)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div
                ref={contentRef}
                className="flex-1 min-h-0 bg-white dark:bg-gray-800 p-8 rounded-lg overflow-auto cursor-grab active:cursor-grabbing transition-colors duration-300 shadow-lg"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ touchAction: 'none' }}
            >
                {renderSubPage()}
            </div>
        </div>
    );
};

export default AdminPanel;
