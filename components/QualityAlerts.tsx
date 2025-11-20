

import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { QualityAlert, Document, AlertSeverity, getSeverityColorClass, DocumentCategory } from '../types';
import Modal from './common/Modal';
import PdfViewer from './common/PdfViewer';
import { useI18n } from '../contexts/I18nContext';


const QualityAlerts: React.FC = () => {
    const { alerts, settings, getDocumentById, updateAlertStatus } = useData();
    const { t, locale } = useI18n();
    const [selectedAlert, setSelectedAlert] = useState<QualityAlert | null>(null);
    const [filterMode, setFilterMode] = useState<'newest' | 'oldest' | 'expiration'>('newest');
    const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');

    const filteredAlerts = useMemo(() => {
        const now = new Date();
        const maxAgeMs = settings.notificationDuration * 24 * 60 * 60 * 1000;

        let result = alerts;

        // Filter Logic
        if (filterMode === 'newest' || filterMode === 'expiration') {
            // Show only recent alerts (last 7 days)
            result = result.filter(alert => new Date(alert.createdAt).getTime() + maxAgeMs > now.getTime());
        }
        // 'oldest' shows all history (no time filter)

        // Severity Filter
        if (severityFilter !== 'all') {
            result = result.filter(alert => alert.severity === severityFilter);
        }

        // Sorting Logic
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
    }, [alerts, filterMode, severityFilter, settings.notificationDuration]);

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
                <div className="h-full flex flex-col gap-4">
                    <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="text-lg text-gray-900 dark:text-white"><span className="font-bold">{t('common.description')}: </span>{selectedAlert?.description}</p>
                            <p>
                                <span className="font-bold">{t('qualityAlerts.severity')}: </span>
                                <span className={`px-3 py-2 rounded-md text-white font-bold ${selectedAlert ? getSeverityClass(selectedAlert.severity) : 'bg-gray-500'}`}>
                                    {selectedAlert?.severity}
                                </span>
                            </p>
                        </div>
                        {selectedAlert?.pdfUrl && (
                            <div className="bg-cyan-900/50 px-4 py-2 rounded border border-cyan-500/50">
                                <span className="text-cyan-300 font-bold">📎 {t('qualityAlerts.viewingPdf')}</span>
                            </div>
                        )}
                    </div>
                    {displayDocument ? (
                        <div className="flex-1 min-h-0">
                            <PdfViewer document={displayDocument} />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg">
                            <p className="text-xl text-gray-700 dark:text-gray-300">{t('qualityAlerts.noDocument')}</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default QualityAlerts;
