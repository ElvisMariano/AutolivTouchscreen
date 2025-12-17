
import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Document, DocumentCategory } from '../types';
import PdfViewer from './common/PdfViewer';
import { hasCache } from '../services/offlineCache';
import { useI18n } from '../contexts/I18nContext';
import { useDocuments } from '../hooks/useDocuments';
import { useUnreadDocuments } from '../hooks/useUnreadDocuments';
import { useLine } from '../contexts/LineContext';
import { useLog } from '../contexts/LogContext';

const StandardizedWork: React.FC = () => {
    // 1. Hook Data
    const { t } = useI18n();
    const { logEvent } = useLog();
    const { selectedLine } = useLine();
    const selectedLineId = selectedLine?.id || null;
    const { data: unifiedDocs, acknowledgeDocument } = useDocuments();
    const docs = unifiedDocs?.docs || [];

    // 2. Legacy/Global Data from DataContext
    const {
        autoOpenDocId,
        setAutoOpenDocId,
        currentShift,
        activeShifts // Needed for unread hook
    } = useData();

    // 3. Derived Data
    const unreadDocuments = useUnreadDocuments(selectedLineId, currentShift, activeShifts);

    const normativeDocs = useMemo(() => docs.filter(doc =>
        doc.category === DocumentCategory.StandardizedWork &&
        (!doc.lineId || doc.lineId === selectedLineId)
    ), [docs, selectedLineId]);

    const [offlineMap, setOfflineMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let mounted = true;
        Promise.all(normativeDocs.map(async d => [d.id, await hasCache(d.url)] as const)).then(entries => {
            if (mounted) setOfflineMap(Object.fromEntries(entries));
        });
        return () => { mounted = false; };
    }, [normativeDocs]); // Dependency simplified

    const [selectedDoc, setSelectedDoc] = useState<Document | null>(normativeDocs[0] || null);

    // Auto-open logic
    useEffect(() => {
        if (autoOpenDocId) {
            const foundDoc = normativeDocs.find(d => d.id === autoOpenDocId);
            if (foundDoc) {
                setSelectedDoc(foundDoc);
                setAutoOpenDocId(null);
            }
        }
    }, [autoOpenDocId, normativeDocs, setAutoOpenDocId]);

    const selectedId = selectedDoc?.id;
    useEffect(() => {
        if (selectedDoc) {
            logEvent('document', 'view', selectedDoc.id, selectedDoc.title);
        }
    }, [selectedId]);

    const isUnread = (docId: string) => unreadDocuments.some(d => d.id === docId);
    const hasUnreadSelected = selectedDoc ? isUnread(selectedDoc.id) : false;

    const handleConfirmRead = async () => {
        if (!selectedDoc) return;
        try {
            await acknowledgeDocument.mutateAsync({
                documentId: selectedDoc.id,
                shift: currentShift,
                userId: undefined
            });
        } catch (error) {
            console.error('Error acknowledging document:', error);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 lg:w-1/4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex-shrink-0">
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-400 mb-4">Familía / Operadores</h3>
                <ul className="space-y-2">
                    {normativeDocs.map(doc => {
                        const unread = isUnread(doc.id);
                        return (
                            <li key={doc.id}>
                                <button
                                    onClick={() => setSelectedDoc(doc)}
                                    className={`w-full text-left p-4 rounded-md transition-colors text-lg relative ${selectedDoc?.id === doc.id
                                        ? 'bg-orange-600 text-white font-bold'
                                        : unread
                                            ? 'bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-white border border-red-500'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <span className="flex items-center gap-3">
                                        {doc.title}

                                        {offlineMap[doc.id] && (
                                            <span className="px-2 py-1 bg-green-600 text-white text-sm rounded-md">Offline</span>
                                        )}
                                        {unread && (
                                            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                    {normativeDocs.length === 0 && <li className="text-gray-600 dark:text-gray-500 p-4">Nenhum documento encontrado.</li>}
                </ul>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
                <h1 className="text-lg md:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate max-w-[150px] pb-8 md:max-w-none">{t('standardizedWork.title')}</h1>
                {/* Confirmation Bar */}
                {hasUnreadSelected && (
                    <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between shadow-md mb-2 rounded-lg animate-pulse">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-lg">Documento Atualizado</span>
                            <span className="text-sm opacity-90">Confirmação de leitura pendente</span>
                        </div>
                        <button
                            onClick={handleConfirmRead}
                            className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-sm text-sm"
                        >
                            Confirmar Leitura
                        </button>
                    </div>
                )}

                {selectedDoc ? (
                    <PdfViewer document={selectedDoc} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl text-gray-600 dark:text-gray-500">Selecione um documento para visualizar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StandardizedWork;
