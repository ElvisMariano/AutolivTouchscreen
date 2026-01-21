import React, { useMemo } from 'react';
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
        <div className="standby-content">
            {shiftLoading && !shiftData && (
                <div className="standby-loading">
                    <div className="spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            )}
            {shiftError && (
                <div className="standby-error">
                    <p>{t('common.error')}: {shiftError}</p>
                </div>
            )}
            {shiftData && (
                <div className="metrics-grid">
                    <div className="metric-card metric-target">
                        <div className="metric-label">{t('standby.target')}</div>
                        <div className="metric-value">{shiftData.target.toLocaleString(locale || 'pt-BR')}</div>
                    </div>
                    <div className="metric-card metric-actuals">
                        <div className="metric-label">{t('standby.actuals')}</div>
                        <div className="metric-value">{shiftData.actuals.toLocaleString(locale || 'pt-BR')}</div>
                    </div>
                    <div className="metric-card metric-efficiency">
                        <div className="metric-label">{t('standby.efficiency')}</div>
                        <div className="metric-value">{shiftData.efficiency}%</div>
                    </div>
                    <div className="metric-card metric-downtime">
                        <div className="metric-label">{t('standby.shiftDowntime')}</div>
                        <div className="metric-value">{shiftData.downtimeFormatted}</div>
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
            <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <h2 className="text-3xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">{presentation.title}</h2>
                <div className="w-full h-full bg-black border-4 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xl relative">
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
            <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-8 flex flex-col">
                <div className={`p-6 rounded-t-xl text-white flex justify-between items-center ${severityClass}`}>
                    <div className="flex items-center gap-4">
                        <h2 className="text-4xl font-bold uppercase">{t('qualityAlerts.title')}</h2>
                        <span className="px-4 py-1 bg-white/20 rounded-lg text-2xl font-bold">{t('admin.severity')} {alert.severity}</span>
                    </div>
                    <div className="text-2xl opacity-90">
                        {new Date(alert.createdAt).toLocaleDateString(locale)}
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-gray-800 rounded-b-xl shadow-xl flex flex-col md:flex-row overflow-hidden border-2 border-t-0 p-8 gap-8">
                    <div className="flex-1 flex flex-col justify-center gap-6">
                        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            {alert.title}
                        </h1>
                        <p className="text-3xl text-gray-600 dark:text-gray-300 leading-relaxed">
                            {alert.description}
                        </p>
                        <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border-l-8 border-red-500 rounded-r-lg">
                            <p className="text-xl text-red-700 dark:text-red-300 font-bold uppercase flex items-center gap-2">
                                ⚠️ {t('qualityAlerts.validUntil')}: {new Date(alert.expiresAt).toLocaleDateString(locale)}
                            </p>
                        </div>
                    </div>

                    {alert.pdfUrl && (
                        <div className="w-1/2 h-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-inner relative">
                            <iframe
                                src={alert.pdfUrl}
                                className="w-full h-full"
                                title="Alert PDF"
                            />
                            {/* Overlay to prevent interaction if desired, or let them scroll */}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="standby-screen" onClick={onExit}>
            {/* Header */}
            <div className={`standby-header transition-colors duration-500 ${currentSlide.type === 'alert' ? 'bg-red-900 border-red-700' : ''}`}>
                <div className="standby-status">
                    <span className={`status-indicator ${currentSlide.type === 'alert' ? 'bg-red-500 animate-pulse' : ''}`}></span>
                    <span className="status-text">{lineName} - {t('standby.lineStatus')}</span>
                </div>
                {playlist.length > 1 && (
                    <div className="flex gap-2 mx-auto">
                        {playlist.map((_, idx) => (
                            <div key={idx} className={`h-2 w-2 rounded-full transition-all ${idx === currentIndex ? 'bg-cyan-400 w-6' : 'bg-gray-500'}`} />
                        ))}
                    </div>
                )}
                <div className="standby-time">{formatTime(currentTime)}</div>
            </div>

            {/* Content Switcher */}
            <div className="flex-1 overflow-hidden relative w-full h-full">
                {currentSlide.type === 'production' && renderProduction()}
                {currentSlide.type === 'presentation' && renderPresentation(currentSlide.data)}
                {currentSlide.type === 'alert' && renderAlert(currentSlide.data)}
            </div>

            {/* Hint */}
            <div className="standby-hint">
                {t('standby.tapToReturn')}
            </div>
        </div>
    );
};

export default StandbyScreen;
