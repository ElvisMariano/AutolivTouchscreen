
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
import GestureWrapper from './components/common/GestureWrapper';

import LoginScreen from './components/LoginScreen';
import UnauthorizedScreen from './components/UnauthorizedScreen';
import { useAuth } from './contexts/AuthContext';


const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminSubPage, setAdminSubPage] = useState<AdminSubPage>(AdminSubPage.Settings);

    // Auth Logic from Context
    const { currentUser, unauthorizedUser, isLoading } = useAuth();
    const { settings, updateSetting, logEvent } = useData();

    // Hooks must be called unconditionally
    const isKioskEnabled = settings.kioskMode || (currentUser?.role?.allowed_resources?.includes('system:kiosk_mode') ?? false);
    useKioskMode(isKioskEnabled);

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

    // Font Size Management
    useEffect(() => {
        const root = window.document.documentElement;
        const sizeMap: Record<typeof settings.fontSize, string> = {
            small: '14px',
            medium: '16px',
            large: '18px',
        };
        root.style.fontSize = sizeMap[settings.fontSize] || '16px';
    }, [settings.fontSize]);

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

    // Global Navigation Logic
    const PAGE_ORDER = [
        Page.Dashboard,
        Page.WorkInstructions,
        Page.AcceptanceCriteria,
        Page.StandardizedWork,
        Page.QualityAlerts
    ];

    const handleSwipeNavigation = (direction: 'next' | 'prev') => {
        // If kiosk settings disable navigation or something similar, check here.
        // For now, allow always.

        // Important: If a Modal is open, we usually don't want global navigation.
        // But App.tsx doesn't know about Modals inside components easily unless we lift state.
        // However, the Inner GestureWrapper in Modal should stop propagation, so this shouldn't fire.
        // BUT, framer-motion drag listener on parent might still pick it up if not handled carefully.
        // Let's rely on event bubbling control.

        const currentIndex = PAGE_ORDER.indexOf(currentPage);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (direction === 'next') {
            nextIndex = currentIndex + 1;
        } else {
            nextIndex = currentIndex - 1;
        }

        // Boundary checks
        if (nextIndex >= 0 && nextIndex < PAGE_ORDER.length) {
            navigateTo(PAGE_ORDER[nextIndex]);
        }
    };

    const canGoNext = () => {
        const currentIndex = PAGE_ORDER.indexOf(currentPage);
        return currentIndex < PAGE_ORDER.length - 1;
    }

    const canGoPrev = () => {
        const currentIndex = PAGE_ORDER.indexOf(currentPage);
        return currentIndex > 0;
    }

    // Conditional RENDERING only (not hooks)
    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white flex-col">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                <p>Iniciando sistema...</p>
            </div>
        );
    }

    if (unauthorizedUser) {
        return <UnauthorizedScreen name={unauthorizedUser} />;
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
                    className="absolute p-4 inset-0 overflow-auto pb-5"
                >
                    <GestureWrapper
                        onNavigate={handleSwipeNavigation}
                        canGoNext={canGoNext()}
                        canGoPrev={canGoPrev()}
                        className="h-full"
                        enabled={settings.gestureNavigation}
                        threshold={settings.gestureSensitivity}
                    >
                        {renderPage()}
                    </GestureWrapper>
                </div>
            </main>
        </div>
    );
};

import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Prevent excessive refetches
            staleTime: 1000 * 60 * 5, // 5 minutes stale time
        },
    },
});

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <DataProvider>
                    <I18nProvider>
                        <LineProvider>
                            <AppContent />
                        </LineProvider>
                    </I18nProvider>
                </DataProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};

export default App;
