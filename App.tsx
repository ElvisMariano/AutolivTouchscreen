
import React, { useState, useCallback, useEffect } from 'react';
import { DataProvider, useData } from './contexts/DataContext';
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

const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminSubPage, setAdminSubPage] = useState<AdminSubPage>(AdminSubPage.Settings);

    const { settings, updateSetting, logEvent } = useData();

    useKioskMode(settings.kioskMode);

    const handleTimeout = useCallback(() => {
        console.log("Inactivity timeout. Returning to dashboard.");
        setCurrentPage(Page.Dashboard);
        setSelectedMachineId(null);
        setIsAdmin(false);
    }, []);

    useInactivityTimer(handleTimeout, settings.inactivityTimeout * 1000);

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
            // This is a placeholder for a more detailed machine view
            // For now, WorkInstructions handles the machine-specific logic
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

    // Theme Management
    useEffect(() => {
        const root = window.document.documentElement;
        console.log('Theme changed to:', settings.theme);

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
            if (settings.enableSoundNotifications) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors duration-300">
            <Header currentPage={currentPage} navigateTo={navigateTo} />
            <main className="flex-1 overflow-hidden relative p-4 md:p-8">
                <div
                    key={currentPage}
                    className="absolute inset-0 overflow-auto animate-fadeIn"
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
                    <AppContent />
                </I18nProvider>
            </DataProvider>
        </AuthProvider>
    );
};

export default App;
