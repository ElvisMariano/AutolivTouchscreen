

import React, { useState, useMemo, Suspense } from 'react';
import { useData } from '../contexts/DataContext';
import { QualityAlert, Document, AlertSeverity, getSeverityColorClass, DocumentCategory, isAlertActive } from '../types';
import Modal from './common/Modal';
import GestureWrapper from './common/GestureWrapper';
import { useI18n } from '../contexts/I18nContext';
import Skeleton from './common/Skeleton';

// Lazy load PdfViewer
const PdfViewer = React.lazy(() => import('./common/PdfViewer'));

const QualityAlerts: React.FC = () => {
    const { alerts, getDocumentById, updateAlertStatus, selectedLineId, settings } = useData();
    const { t, locale } = useI18n();
    const [selectedAlert, setSelectedAlert] = useState<QualityAlert | null>(null);
    const [filterMode, setFilterMode] = useState<'newest' | 'oldest' | 'expiration'>('newest');
    const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');

    const filteredAlerts = useMemo(() => {
        let result = alerts.filter(a => !selectedLineId || a.lineId === selectedLineId);
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

    const handleAlertClick = (alert: QualityAlert) => {
        setSelectedAlert(alert);
        if (!alert.isRead) {
            updateAlertStatus(alert.id, true);
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
        return getDocumentById(selectedAlert.documentId);
    }, [selectedAlert, getDocumentById]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
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
                <ul className="space-y-4">
                    {filteredAlerts.length > 0 ? filteredAlerts.map(alert => (
                        <li key={alert.id}>
                            <button onClick={() => handleAlertClick(alert)} className="w-full text-left bg-gray-200 dark:bg-gray-800 p-4 rounded-lg flex items-start gap-4 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                                {!alert.isRead && <div className="w-4 h-4 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{alert.title}</h3>
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
                    )) : (
                        <div className="text-center py-10">
                            <p className="text-2xl text-gray-600 dark:text-gray-500">{t('qualityAlerts.noAlerts')}</p>
                        </div>
                    )}
                </ul>
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
                            if (!nextAlert.isRead) {
                                updateAlertStatus(nextAlert.id, true);
                            }
                        }
                    }}
                    canGoNext={selectedAlert && filteredAlerts.findIndex(a => a.id === selectedAlert.id) < filteredAlerts.length - 1}
                    canGoPrev={selectedAlert && filteredAlerts.findIndex(a => a.id === selectedAlert.id) > 0}
                    className="h-full"
                >
                    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
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

                            {selectedAlert?.pdfUrl && (
                                <div className="bg-cyan-50 dark:bg-cyan-900/30 px-3 py-1.5 rounded-md border border-cyan-200 dark:border-cyan-800 flex items-center gap-2">
                                    <span className="text-cyan-700 dark:text-cyan-300 font-medium text-sm">
                                        {t('qualityAlerts.viewingPdf')}
                                    </span>
                                </div>
                            )}
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
