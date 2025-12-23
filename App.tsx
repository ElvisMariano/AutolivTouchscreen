import React, { useState, useCallback, useEffect } from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import { LineProvider } from './contexts/LineContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { LogProvider } from './contexts/LogContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminSubPage, Page } from './types'; // Page still used for ordering logic if needed, or remove
import useInactivityTimer from './hooks/useInactivityTimer';
import { useKioskMode } from './hooks/useKioskMode';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

import Dashboard from './components/Dashboard';
import WorkInstructions from './components/WorkInstructions';
import AcceptanceCriteria from './components/AcceptanceCriteria';
import StandardizedWork from './components/StandardizedWork';
import QualityAlerts from './components/QualityAlerts';
import AdminPanel from './components/AdminPanel';
import Header from './components/common/Header';
import GestureWrapper from './components/common/GestureWrapper';
import ToastContainer from './components/common/ToastContainer';

import LoginScreen from './components/LoginScreen';
import UnauthorizedScreen from './components/UnauthorizedScreen';


const AppRoutes: React.FC = () => {
    const { currentUser, unauthorizedUser, isLoading } = useAuth();
    const { settings } = useSettings();
    const { logEvent } = useData();
    const navigate = useNavigate();
    const location = useLocation();

    const [isAdmin, setIsAdmin] = useState(false);
    const [adminSubPage, setAdminSubPage] = useState<AdminSubPage>(AdminSubPage.Settings);
    // Remove selectedMachineId if not used globally or handle differently.
    // Dashboard usually sets it. If it's ephemeral, might belong in Dashboard or context.
    // Existing App logic had it. Let's keep it locally if needed, but Dashboard handles its own navigation?
    // Looking at previous code, selectedMachineId seemed unused in global scope except for clearing it on navigation.

    // Hooks must be called unconditionally
    const isKioskEnabled = settings.kioskMode || (currentUser?.role?.allowed_resources?.includes('system:kiosk_mode') ?? false);
    useKioskMode(isKioskEnabled);

    const handleTimeout = useCallback(() => {
        console.log("Inactivity timeout. Returning to dashboard.");
        navigate('/');
        setIsAdmin(false);
    }, [navigate]);

    useInactivityTimer(handleTimeout, settings.inactivityTimeout * 1000);

    // Theme Management
    useEffect(() => {
        const root = window.document.documentElement;
        if (settings.theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
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

    // Navigation Logging
    useEffect(() => {
        logEvent('navigation', 'view', location.pathname, location.pathname);
    }, [location.pathname, logEvent]);


    // Global Navigation Logic (Swipe)
    const ORDERED_PATHS = [
        '/',
        '/work-instructions',
        '/acceptance-criteria',
        '/standardized-work',
        '/quality-alerts'
    ];

    const handleSwipeNavigation = (direction: 'next' | 'prev') => {
        const currentPath = location.pathname === '/index.html' ? '/' : location.pathname; // Electron fix if needed
        const currentIndex = ORDERED_PATHS.indexOf(currentPath);

        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (direction === 'next') {
            nextIndex = currentIndex + 1;
        } else {
            nextIndex = currentIndex - 1;
        }

        if (nextIndex >= 0 && nextIndex < ORDERED_PATHS.length) {
            navigate(ORDERED_PATHS[nextIndex]);
        }
    };

    const canGoNext = () => {
        const currentIndex = ORDERED_PATHS.indexOf(location.pathname);
        return currentIndex < ORDERED_PATHS.length - 1;
    }

    const canGoPrev = () => {
        const currentIndex = ORDERED_PATHS.indexOf(location.pathname);
        return currentIndex > 0;
    }

    // Wrapper for Dashboard to pass legacy navigateTo if needed, or update Dashboard.
    // Assuming Dashboard uses navigateTo prop. We can provide a wrapper.
    // Wrapper removed

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
            <ToastContainer />
            <Header />
            <main className="flex-1 overflow-hidden relative p-4 md:p-8">
                <div key={location.pathname} className="absolute p-4 inset-0 overflow-auto pb-5">
                    <GestureWrapper
                        onNavigate={handleSwipeNavigation}
                        canGoNext={canGoNext()}
                        canGoPrev={canGoPrev()}
                        className="h-full"
                        enabled={settings.gestureNavigation}
                        threshold={settings.gestureSensitivity}
                    >
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/work-instructions" element={<WorkInstructions />} />
                            <Route path="/acceptance-criteria" element={<AcceptanceCriteria />} />
                            <Route path="/standardized-work" element={<StandardizedWork />} />
                            <Route path="/quality-alerts" element={<QualityAlerts />} />
                            <Route path="/admin" element={
                                <AdminPanel
                                    isAdmin={isAdmin}
                                    setIsAdmin={setIsAdmin}
                                    subPage={adminSubPage}
                                    setSubPage={setAdminSubPage}
                                />
                            } />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </GestureWrapper>
                </div>
            </main>
        </div>
    );
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
        },
    },
});

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <SettingsProvider>
                    <LogProvider>
                        <DataProvider>
                            <I18nProvider>
                                <LineProvider>
                                    <ToastProvider>
                                        <HashRouter>
                                            <AppContent />
                                        </HashRouter>
                                    </ToastProvider>
                                </LineProvider>
                            </I18nProvider>
                        </DataProvider>
                    </LogProvider>
                </SettingsProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};
// Helper to wrap AppContent
const AppContent = () => <AppRoutes />;

export default App;
