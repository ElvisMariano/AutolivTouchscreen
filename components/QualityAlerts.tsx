

import React, { useState, useMemo, Suspense } from 'react';
import { useData } from '../contexts/DataContext';
import { QualityAlert, Document, AlertSeverity, getSeverityColorClass, DocumentCategory, isAlertActive } from '../types';
import Modal from './common/Modal';
import GestureWrapper from './common/GestureWrapper';
import { useI18n } from '../contexts/I18nContext';
import Skeleton from './common/Skeleton';

// Lazy load PdfViewer
const PdfViewer = React.lazy(() => import('./common/PdfViewer'));

import { useSettings } from '../contexts/SettingsContext';
import { useDocuments } from '../hooks/useDocuments';
import { useUnreadDocuments } from '../hooks/useUnreadDocuments';
import { useLine } from '../contexts/LineContext';

const QualityAlerts: React.FC = () => {
    // Global State from Hooks
    const { settings } = useSettings();
    const { t, locale } = useI18n();
    const { selectedLine } = useLine();
    const selectedLineId = selectedLine?.id || null;

    // Data & Mutations from Hooks
    const { data: unifiedDocs, acknowledgeDocument } = useDocuments();
    const alerts = unifiedDocs?.alerts || [];
    const docs = unifiedDocs?.docs || [];

    // Pending Legacy State/Logic from DataContext (for Shift & AutoOpen)
    const {
        autoOpenDocId,
        setAutoOpenDocId,
        currentShift,
        activeShifts // Needed for unread calculation
    } = useData();

    // Use specific unread hook
    const unreadDocuments = useUnreadDocuments(selectedLineId, currentShift, activeShifts);

    const [selectedAlert, setSelectedAlert] = useState<QualityAlert | null>(null);
    const [filterMode, setFilterMode] = useState<'newest' | 'oldest' | 'expiration'>('newest');
    const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');

    // Handle auto-opening specific document if passed via context
    React.useEffect(() => {
        if (autoOpenDocId) {
            const foundAlert = alerts.find(a => a.id === autoOpenDocId || a.documentId === autoOpenDocId);
            if (foundAlert) {
                console.log('Auto-opening alert:', autoOpenDocId);
                setSelectedAlert(foundAlert);
                setAutoOpenDocId(null); // Clear after opening to avoid loop
            }
        }
    }, [autoOpenDocId, alerts, setAutoOpenDocId]);

    const filteredAlerts = useMemo(() => {
        // Don't show any alerts if no line is selected
        if (!selectedLineId) return [];

        let result = alerts.filter(a => a.lineId === selectedLineId);
        result = result.filter(isAlertActive);
        if (severityFilter !== 'all') {
            result = result.filter(alert => alert.severity === severityFilter);
        }
        return result.sort((a, b) => {
            if (filterMode === 'newest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (filterMode === 'oldest') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (filterMode === 'expiration') {
                return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
            }
            return 0;
        });
    }, [alerts, filterMode, severityFilter, selectedLineId]);

    const isUnread = (alert: QualityAlert) => {
        return unreadDocuments.some(doc => doc.id === alert.id);
    };

    const handleAlertClick = (alert: QualityAlert) => {
        setSelectedAlert(alert);
    };

    const handleConfirmRead = async () => {
        if (!selectedAlert) return;

        // Check if unread
        const isAlertUnread = isUnread(selectedAlert);

        if (isAlertUnread || !selectedAlert.isRead) {
            try {
                // Use mutation
                acknowledgeDocument.mutate({
                    documentId: selectedAlert.id,
                    shift: currentShift
                });
            } catch (error) {
                console.error('Error acknowledging alert:', error);
            }
        }
    };

    const getSeverityClass = (severity: AlertSeverity) => {
        switch (severity) {
            case AlertSeverity.A: return 'bg-red-500';
            case AlertSeverity.B: return 'bg-yellow-500';
            case AlertSeverity.C: return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    // Helper to get doc by ID from local list
    const getDocumentByIdLocal = (id: string | undefined) => {
        if (!id) return undefined;
        return docs.find(d => d.id === id);
    };

    // Determina qual documento exibir: PDF vinculado ao alerta (prioridade) ou Documento associado
    const displayDocument = useMemo(() => {
        if (!selectedAlert) return null;

        // Se tiver PDF vinculado diretamente ao alerta
        if (selectedAlert.pdfUrl) {
            return {
                id: selectedAlert.id,
                title: selectedAlert.pdfName || selectedAlert.title,
                url: selectedAlert.pdfUrl,
                type: 'pdf',
                category: DocumentCategory.QualityAlert,
                version: 1,
                lastUpdated: selectedAlert.createdAt
            } as Document;
        }

        // Fallback para documento associado antigo
        return getDocumentByIdLocal(selectedAlert.documentId);
    }, [selectedAlert, docs]);

    const hasUnread = selectedAlert ? isUnread(selectedAlert) : false;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-lg md:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate max-w-[150px] md:max-w-none">{t('qualityAlerts.title')}</h1>
                <div className="flex space-x-4 items-center bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
                    <span className="text-gray-900 dark:text-white font-semibold ml-2">{t('qualityAlerts.filterBy')}:</span>
                    <select
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value as any)}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-lg"
                    >
                        <option value="newest">{t('qualityAlerts.newest')}</option>
                        <option value="oldest">{t('qualityAlerts.oldest')}</option>
                        <option value="expiration">{t('qualityAlerts.expiration')}</option>
                    </select>
                </div>
                <div className="flex space-x-2 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
                    {(['all', ...Object.values(AlertSeverity)] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setSeverityFilter(s)}
                            className={`px-6 py-3 text-xl font-semibold rounded-md transition-colors ${severityFilter === s ? 'bg-cyan-500 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                            {s === 'all' ? t('common.all') : s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {!selectedLineId ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm max-w-md">
                            <div className="text-gray-400 mb-4 text-6xl">⚠️</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('qualityAlerts.noLineSelected')}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('qualityAlerts.selectLineFirst')}</p>
                        </div>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {filteredAlerts.length > 0 ? filteredAlerts.map(alert => {
                            const activeUnread = isUnread(alert);
                            return (
                                <li key={alert.id}>
                                    <button
                                        onClick={() => handleAlertClick(alert)}
                                        className={`
                                            w-full text-left p-4 rounded-lg flex items-start gap-4 transition-all duration-300
                                            ${activeUnread
                                                ? 'bg-red-50 dark:bg-red-900/10 border-2 border-red-500 shadow-lg shadow-red-500/10 hover:bg-red-100 dark:hover:bg-red-900/20'
                                                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 border-none'
                                            }
                                        `}
                                    >
                                        {activeUnread && (
                                            <div className="absolute top-2 right-2 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </div>
                                        )}

                                        {!alert.isRead && !activeUnread && <div className="w-4 h-4 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>}

                                        <div className="flex-1 relative">
                                            <div className="flex justify-between items-center">
                                                <h3 className={`text-2xl font-bold ${activeUnread ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {alert.title}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1 text-sm font-bold rounded-full text-white ${getSeverityClass(alert.severity)}`}
                                                >
                                                    {alert.severity}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 mt-1">{alert.description}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">
                                                {t('common.created')}: {new Date(alert.createdAt).toLocaleString(locale)} |
                                                {t('qualityAlerts.validUntil')}: {new Date(alert.expiresAt).toLocaleString(locale)}
                                                {alert.pdfUrl && <span className="ml-2 text-cyan-400 font-bold">📎 {t('qualityAlerts.pdfAttached')}</span>}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            );
                        }) : (
                            <div className="text-center py-10">
                                <p className="text-2xl text-gray-600 dark:text-gray-500">{t('qualityAlerts.noAlerts')}</p>
                            </div>
                        )}
                    </ul>
                )}
            </div>

            <Modal isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} title={selectedAlert?.title || ''} size="full">
                <GestureWrapper
                    enabled={settings.gestureNavigation}
                    threshold={settings.gestureSensitivity}
                    onNavigate={(direction) => {
                        if (!selectedAlert) return;
                        const currentIndex = filteredAlerts.findIndex(a => a.id === selectedAlert.id);
                        if (currentIndex === -1) return;

                        let nextIndex = currentIndex;
                        if (direction === 'next') {
                            nextIndex = currentIndex + 1;
                        } else {
                            nextIndex = currentIndex - 1;
                        }

                        if (nextIndex >= 0 && nextIndex < filteredAlerts.length) {
                            const nextAlert = filteredAlerts[nextIndex];
                            setSelectedAlert(nextAlert);
                            // Do NOt auto-read
                        }
                    }}
                    canGoNext={selectedAlert && filteredAlerts.findIndex(a => a.id === selectedAlert.id) < filteredAlerts.length - 1}
                    canGoPrev={selectedAlert && filteredAlerts.findIndex(a => a.id === selectedAlert.id) > 0}
                    className="h-full"
                >
                    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
                        {/* Confirmation Bar */}
                        {hasUnread && (
                            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between shadow-lg animate-pulse z-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg">{t('common.documentUpdated')}</span>
                                        <span className="text-sm opacity-90">{t('common.confirmReadRequired')}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConfirmRead}
                                    className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {t('common.confirmRead')}
                                </button>
                            </div>
                        )}

                        {/* Header aligned mostly with WorkInstructions style */}
                        <div className="flex-none p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm z-10">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {selectedAlert?.description}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold text-white uppercase tracking-wider ${selectedAlert ? getSeverityClass(selectedAlert.severity) : 'bg-gray-500'}`}>
                                        {t('qualityAlerts.severity')}: {selectedAlert?.severity}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedAlert?.title}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {currentShift && (
                                    <div className="hidden md:flex flex-col items-end mr-4">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">{t('common.currentShift')}</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            {currentShift}
                                        </span>
                                    </div>
                                )}

                                {selectedAlert?.pdfUrl && (
                                    <div className="bg-cyan-50 dark:bg-cyan-900/30 px-3 py-1.5 rounded-md border border-cyan-200 dark:border-cyan-800 flex items-center gap-2">
                                        <span className="text-cyan-700 dark:text-cyan-300 font-medium text-sm">
                                            {t('qualityAlerts.viewingPdf')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
                            {displayDocument ? (
                                <Suspense fallback={
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center gap-4 w-full px-4">
                                            <Skeleton width="100%" height="60vh" />
                                        </div>
                                    </div>
                                }>
                                    <PdfViewer document={displayDocument} />
                                </Suspense>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm max-w-md mx-4">
                                        <div className="text-gray-400 mb-4 text-6xl">📄</div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('qualityAlerts.noDocument')}</h3>
                                        <p className="text-gray-500 dark:text-gray-400">{t('qualityAlerts.selectAnother')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </GestureWrapper>
            </Modal>
        </div>
    );
};

export default QualityAlerts;
