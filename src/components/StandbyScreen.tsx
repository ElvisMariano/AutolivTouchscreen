import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../contexts/I18nContext';
import { useShiftProduction } from '../hooks/useShiftProduction';
import { useLine } from '../contexts/LineContext';
import { useDocuments } from '../hooks/useDocuments';
import { Presentation, QualityAlert, isAlertActive, getSeverityColorClass } from '../types';
import '../styles/StandbyScreen.css';
import { AutoCyclingPdfViewer } from './common/AutoCyclingPdfViewer';

interface StandbyScreenProps {
    lineId: string; // Used for L2L (External ID)
    dbLineId: string; // Used for DB Documents (Internal GUID)
    lineName: string;
    siteId: string;
    shiftStart: string;
    shiftEnd: string;
    onExit: () => void;
}

const StandbyScreen: React.FC<StandbyScreenProps> = ({
    lineId,
    dbLineId,
    lineName,
    siteId,
    shiftStart,
    shiftEnd,
    onExit
}) => {
    const { t, locale } = useI18n();
    const { data: shiftData, loading: shiftLoading, error: shiftError } = useShiftProduction(
        lineId,
        siteId,
        shiftStart,
        shiftEnd,
        60 // Atualizar a cada 60 segundos
    );

    // Hooks for Configuration
    const { lines } = useLine(); // To get line metadata
    const { data: unifiedDocs } = useDocuments(); // To get presentations and alerts

    // Derived State
    const currentLine = useMemo(() => lines.find(l => l.id === dbLineId), [lines, dbLineId]);
    const showProduction = currentLine?.metadata?.standby_config?.show_production !== false; // Default true

    const activePresentations = useMemo(() => {
        return (unifiedDocs?.presentations || []).filter(p =>
            p.lineId && p.lineId.toLowerCase() === dbLineId.toLowerCase() && p.metadata?.is_standby_active
        );
    }, [unifiedDocs, dbLineId]);

    const activeAlerts = useMemo(() => {
        return (unifiedDocs?.alerts || []).filter(a =>
            a.lineId && a.lineId.toLowerCase() === dbLineId.toLowerCase() &&
            a.metadata?.is_standby_active &&
            isAlertActive(a) // Helper import needed
        );
    }, [unifiedDocs, dbLineId]);

    // Carousel Playlist
    interface Slide {
        type: 'production' | 'presentation' | 'alert';
        id: string;
        data?: any;
        duration: number; // seconds
    }

    const playlist = useMemo<Slide[]>(() => {
        const list: Slide[] = [];

        // Default durations
        const durations = {
            production: currentLine?.metadata?.standby_config?.production_duration || 15,
            presentation: currentLine?.metadata?.standby_config?.presentation_duration || 20,
            alert: currentLine?.metadata?.standby_config?.alert_duration || 15
        };

        // 1. Production Metrics
        if (showProduction) {
            list.push({ type: 'production', id: 'production', duration: durations.production });
        }

        // 2. Presentations
        activePresentations.forEach(p => {
            list.push({ type: 'presentation', id: p.id, data: p, duration: durations.presentation });
        });

        // 3. Alerts
        activeAlerts.forEach(a => {
            list.push({ type: 'alert', id: a.id, data: a, duration: durations.alert });
        });

        return list;
    }, [showProduction, activePresentations, activeAlerts]);

    // Timer State
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(new Date());

    // Reset index if playlist changes and current index is invalid
    React.useEffect(() => {
        if (currentIndex >= playlist.length) {
            setCurrentIndex(0);
        }
    }, [playlist.length]);

    // Clock
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Carousel Timer
    React.useEffect(() => {
        if (playlist.length <= 1) return;

        const currentSlide = playlist[currentIndex];
        // Safety check if slide exists
        if (!currentSlide) {
            setCurrentIndex(0);
            return;
        }

        const timer = setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % playlist.length);
        }, currentSlide.duration * 1000);

        return () => clearTimeout(timer);
    }, [currentIndex, playlist]);

    // Data/Render helpers
    const currentSlide = playlist[currentIndex] || { type: 'production', id: 'production' };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString(locale || 'pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Render Components
    const renderProduction = () => (
        <div className="flex-1 flex items-center justify-center p-4 md:p-12 w-full">
            {shiftLoading && !shiftData && (
                <div className="flex flex-col items-center text-white/80">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-xl">{t('common.loading')}</p>
                </div>
            )}
            {shiftError && (
                <div className="text-center">
                    <p className="text-2xl text-red-400 font-bold">{t('common.error')}: {shiftError}</p>
                </div>
            )}
            {shiftData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-6xl">
                    <div className="bg-white/5 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-[1.02]">
                        <div className="text-lg md:text-2xl uppercase tracking-widest mb-2 md:mb-4 text-green-400 font-semibold">{t('standby.target')}</div>
                        <div className="text-5xl md:text-7xl font-bold text-green-200 font-mono">{shiftData.target.toLocaleString(locale || 'pt-BR')}</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-[1.02]">
                        <div className="text-lg md:text-2xl uppercase tracking-widest mb-2 md:mb-4 text-green-400 font-semibold">{t('standby.actuals')}</div>
                        <div className="text-5xl md:text-7xl font-bold text-green-300 font-mono">{shiftData.actuals.toLocaleString(locale || 'pt-BR')}</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-[1.02]">
                        <div className="text-lg md:text-2xl uppercase tracking-widest mb-2 md:mb-4 text-green-400 font-semibold">{t('standby.efficiency')}</div>
                        <div className="text-5xl md:text-7xl font-bold text-green-500 font-mono">{shiftData.efficiency}%</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md border border-red-500/30 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-[1.02]">
                        <div className="text-lg md:text-2xl uppercase tracking-widest mb-2 md:mb-4 text-red-400 font-semibold">{t('standby.shiftDowntime')}</div>
                        <div className="text-5xl md:text-7xl font-bold text-red-500 font-mono">{shiftData.downtimeFormatted}</div>
                    </div>
                </div>
            )}
        </div>
    );

    // Presentation Rendering

    const renderPresentation = (presentation: Presentation) => {
        // Use AutoCyclingPdfViewer which handles PDFs with auto-page turn, 
        // and falls back to iframe for other content.
        // Use PDF URL if available, otherwise fallback to main URL
        const targetUrl = presentation.metadata?.pdf_url || presentation.url;
        const pageDuration = presentation.metadata?.page_duration || 10;

        return (
            <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-2 md:p-4">
                <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4 text-cyan-600 dark:text-cyan-400 text-center px-4 truncate w-full">{presentation.title}</h2>
                <div className="w-full flex-1 bg-black border-2 md:border-4 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xl relative">
                    <AutoCyclingPdfViewer
                        pdfUrl={targetUrl}
                        fallbackUrl={presentation.url !== targetUrl ? presentation.url : undefined}
                        className="w-full h-full"
                        pageDurationSeconds={pageDuration}
                    />
                </div>
            </div>
        );
    };

    const renderAlert = (alert: QualityAlert) => {
        const severityClass = getSeverityColorClass(alert.severity);
        // Reuse PDF Viewer if URL exists, else show big card
        return (
            <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-4 md:p-8 flex flex-col">
                <div className={`p-4 md:p-6 rounded-t-xl text-white flex justify-between items-center ${severityClass}`}>
                    <div className="flex items-center gap-2 md:gap-4">
                        <h2 className="text-2xl md:text-4xl font-bold uppercase">{t('qualityAlerts.title')}</h2>
                        <span className="px-2 py-0.5 md:px-4 md:py-1 bg-white/20 rounded-lg text-lg md:text-2xl font-bold whitespace-nowrap">{t('admin.severity')} {alert.severity}</span>
                    </div>
                    <div className="text-lg md:text-2xl opacity-90 hidden md:block">
                        {new Date(alert.createdAt).toLocaleDateString(locale)}
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-gray-800 rounded-b-xl shadow-xl flex flex-col md:flex-row overflow-hidden border-2 border-t-0 p-4 md:p-8 gap-4 md:gap-8">
                    <div className="flex-1 flex flex-col justify-center gap-4 md:gap-6">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            {alert.title}
                        </h1>
                        <p className="text-xl md:text-3xl text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-6 md:line-clamp-none">
                            {alert.description}
                        </p>
                        <div className="mt-4 md:mt-8 p-4 md:p-6 bg-red-50 dark:bg-red-900/20 border-l-4 md:border-l-8 border-red-500 rounded-r-lg">
                            <p className="text-lg md:text-xl text-red-700 dark:text-red-300 font-bold uppercase flex items-center gap-2">
                                ⚠️ {t('qualityAlerts.validUntil')}: {new Date(alert.expiresAt).toLocaleDateString(locale)}
                            </p>
                        </div>
                    </div>

                    {alert.pdfUrl && (
                        <div className="w-full md:w-1/2 h-64 md:h-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-inner relative flex-shrink-0">
                            <iframe
                                src={alert.pdfUrl}
                                className="w-full h-full"
                                title="Alert PDF"
                            />
                            {/* Overlay to prevent interaction if desired, or let them scroll */}
                            <div className="absolute inset-0 bg-transparent" />
                        </div>
                    )}
                </div>
            </div>
        );
    };


    // --- Exit Logic (Hold 3s + Button) ---
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdTimerRef = useRef<any>(null);

    const startExitHold = () => {
        setIsHolding(true);
        setHoldProgress(0);
        const startTime = Date.now();
        const duration = 2000;

        if (holdTimerRef.current) clearInterval(holdTimerRef.current);

        holdTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setHoldProgress(progress);

            if (progress >= 100) {
                if (holdTimerRef.current) clearInterval(holdTimerRef.current);
                onExit();
            }
        }, 30);
    };

    const cancelExitHold = () => {
        setIsHolding(false);
        setHoldProgress(0);
        if (holdTimerRef.current) {
            clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
        }
    };

    // Gestures (Swipe)
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100; // px
        const velocityThreshold = 500;

        if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
            // Swipe Left -> Next
            setCurrentIndex(prev => (prev + 1) % playlist.length);
        } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
            // Swipe Right -> Prev
            setCurrentIndex(prev => (prev - 1 + playlist.length) % playlist.length);
        }
    };

    const swipeVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95
        })
    };

    // Track direction for animation
    // We can just use a simple state or ref, or infer from index diff. 
    // For simplicity, let's just use standard fade/scale for now or assume forward.
    // To do it right, we'd need usePrevious hook. Let's stick to a premium Fade/Scale transition for safety.

    const pageVariants = {
        initial: { opacity: 0, scale: 0.98, filter: 'blur(10px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.02, filter: 'blur(10px)' }
    };

    return (
        <div
            className="fixed inset-0 w-screen h-screen z-[9999] flex flex-col bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] cursor-default overflow-hidden select-none"
            onMouseDown={startExitHold}
            onMouseUp={cancelExitHold}
            onMouseLeave={cancelExitHold}
            onTouchStart={startExitHold}
            onTouchEnd={cancelExitHold}
        >
            {/* Header */}
            <div className={`standby-header relative z-10 transition-colors duration-500 px-6 py-5 md:px-10 md:py-6 flex justify-between items-center shadow-2xl ${currentSlide.type === 'alert' ? 'bg-red-900/95 border-b-4 border-red-600' : 'bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/10'}`}>

                {/* Left: Logo & Line Info */}
                <div className="flex items-center gap-6">
                    <div className="bg-white p-3 rounded-xl shadow-lg shadow-black/20 hidden md:block opacity-90">
                        <img src="/AutolivLogo.svg" alt="Autoliv" className="h-8 w-auto md:h-10" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-none mb-1 shadow-black/50 drop-shadow-md">
                            {lineName}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className={`h-3 w-3 md:h-4 md:w-4 rounded-full shadow-[0_0_10px_currentColor] ${currentSlide.type === 'alert' ? 'bg-red-500 text-red-500 animate-pulse' : 'bg-emerald-500 text-emerald-500 box-shadow-green'}`}></span>
                            <span className="text-sm md:text-lg text-gray-300 font-medium tracking-wide uppercase opacity-90">{t('standby.lineStatus')}</span>
                        </div>
                    </div>
                </div>

                {/* Center: Indicators */}
                {playlist.length > 1 && (
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-3 bg-black/30 px-6 py-3 rounded-full backdrop-blur-md border border-white/5 shadow-inner hidden lg:flex">
                        {playlist.map((_, idx) => (
                            <div key={idx} className={`h-2.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'bg-cyan-400 w-12 shadow-[0_0_12px_0_rgba(34,211,238,0.6)]' : 'bg-gray-600 w-2.5 hover:bg-gray-500'}`} />
                        ))}
                    </div>
                )}

                {/* Right: Time & Date */}
                <div className="flex flex-col items-end">
                    <div className="text-4xl md:text-6xl font-black font-mono tracking-wider text-white leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        {formatTime(currentTime)}
                    </div>
                    <div className="text-sm md:text-xl text-cyan-100/70 font-medium mt-1 uppercase tracking-[0.2em]">
                        {currentTime.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </div>

            {/* Exit Button (X) */}
            <button
                onClick={(e) => { e.stopPropagation(); onExit(); }}
                className="absolute top-24 right-4 md:top-4 md:right-4 z-50 p-3 md:p-4 bg-red-600/80 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur transition-transform active:scale-95 flex items-center justify-center group"
                aria-label="Exit Standby"
            >
                <XMarkIcon className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Hold Feedback Overlay */}
            {isHolding && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm transition-opacity duration-300">
                    <div className="relative flex flex-col items-center gap-4">
                        <svg className="w-64 h-64 transform -rotate-90">
                            <circle
                                cx="90"
                                cy="90"
                                r="56"
                                stroke="white"
                                strokeWidth="8"
                                fill="transparent"
                                className="opacity-20"
                            />
                            <circle
                                cx="90"
                                cy="90"
                                r="56"
                                stroke="cyan"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={351.86} // 2 * pi * 56
                                strokeDashoffset={351.86 - (351.86 * holdProgress) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-75 ease-linear"
                            />
                        </svg>
                        <span className="text-2xl font-bold text-white tracking-widest uppercase animate-pulse">
                            {t('common.holdingToExit') || "Segure para sair..."}
                        </span>
                    </div>
                </div>
            )}

            {/* Content Switcher with AnimatePresence */}
            <div className="flex-1 overflow-hidden relative w-full h-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="w-full h-full"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                    >
                        {currentSlide.type === 'production' && renderProduction()}
                        {currentSlide.type === 'presentation' && renderPresentation(currentSlide.data)}
                        {currentSlide.type === 'alert' && renderAlert(currentSlide.data)}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Hint */}
            <div className="standby-hint absolute bottom-4 w-full text-center pointer-events-none opacity-50 text-sm md:text-base">
                {playlist.length > 1 ? "Arraste para navegar • " : ""} {t('standby.tapToReturn')} (Segure 3s)
            </div>
        </div>
    );
};

export default StandbyScreen;
