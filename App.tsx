
import React, { useState, useCallback, useEffect } from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import { LineProvider } from './contexts/LineContext';
import { Page, AdminSubPage } from './types';
import useInactivityTimer from './hooks/useInactivityTimer';
import { useKioskMode } from './hooks/useKioskMode';

import Dashboard from './components/Dashboard';
import WorkInstructions from './components/WorkInstructions';
import AcceptanceCriteria from './components/AcceptanceCriteria';
import StandardizedWork from './components/StandardizedWork';
import QualityAlerts from './components/QualityAlerts';
import AdminPanel from './components/AdminPanel';
import Header from './components/common/Header';

import LoginScreen from './components/LoginScreen';
import { useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminSubPage, setAdminSubPage] = useState<AdminSubPage>(AdminSubPage.Settings);

    // Auth Logic from Context
    const { currentUser, isLoading } = useAuth();
    const { settings, updateSetting, logEvent } = useData();

    // Hooks must be called unconditionally
    useKioskMode(settings.kioskMode);

    const handleTimeout = useCallback(() => {
        console.log("Inactivity timeout. Returning to dashboard.");
        setCurrentPage(Page.Dashboard);
        setSelectedMachineId(null);
        setIsAdmin(false);
    }, []);

    useInactivityTimer(handleTimeout, settings.inactivityTimeout * 1000);

    // Theme Management
    useEffect(() => {
        const root = window.document.documentElement;
        console.log('App: Theme changed to:', settings.theme);

        if (settings.theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }

        // Force a repaint to ensure classes are applied
        void root.offsetHeight;
    }, [settings.theme]);

    // Sound Feedback
    useEffect(() => {
        const playClickSound = () => {
            // ... existing sound logic ...
            if (settings.enableSoundNotifications) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                // ... (abbreviated for brevity, full logic assumed present but simplified here for replacement context if unchanged, 
                // but better to keep full implementation to avoid breaking sound) ...
                // Re-implementing full logic to ensure no regression:
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        };

        window.addEventListener('click', playClickSound);
        return () => window.removeEventListener('click', playClickSound);
    }, [settings.enableSoundNotifications]);


    const navigateTo = (page: Page) => {
        setCurrentPage(page);
        setSelectedMachineId(null);
        logEvent('navigation', 'view', String(page), String(page));
    };

    const onSelectMachine = (machineId: string) => {
        setSelectedMachineId(machineId);
    };

    const renderPage = () => {
        if (currentPage === Page.Admin) {
            return <AdminPanel
                isAdmin={isAdmin}
                setIsAdmin={setIsAdmin}
                subPage={adminSubPage}
                setSubPage={setAdminSubPage}
            />;
        }

        if (selectedMachineId) {
            const { getMachineById } = useData();
            const machine = getMachineById(selectedMachineId);
        }

        switch (currentPage) {
            case Page.Dashboard:
                return <Dashboard navigateTo={navigateTo} />;
            case Page.WorkInstructions:
                return <WorkInstructions />;
            case Page.AcceptanceCriteria:
                return <AcceptanceCriteria />;
            case Page.StandardizedWork:
                return <StandardizedWork />;
            case Page.QualityAlerts:
                return <QualityAlerts />;
            default:
                return <Dashboard navigateTo={navigateTo} />;
        }
    };

    // Conditional RENDERING only (not hooks)
    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white flex-col">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                <p>Iniciando sistema...</p>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl">
                    <LoginScreen />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors duration-300">
            <Header currentPage={currentPage} navigateTo={navigateTo} />
            <main className="flex-1 overflow-hidden relative p-4 md:p-8">
                <div
                    key={currentPage}
                    className="absolute inset-0 overflow-auto"
                >
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <DataProvider>
                <I18nProvider>
                    <LineProvider>
                        <AppContent />
                    </LineProvider>
                </I18nProvider>
            </DataProvider>
        </AuthProvider>
    );
};

export default App;
