import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
import { Document, DocumentCategory } from '../types';
import Modal from './common/Modal';
import PdfViewer from './common/PdfViewer';
import { hasCache } from '../services/offlineCache';
import { useDocuments } from '../hooks/useDocuments';
import { useUnreadDocuments } from '../hooks/useUnreadDocuments';
import { useLine } from '../contexts/LineContext';
import { useShift } from '../contexts/ShiftContext';
import { useLog } from '../contexts/LogContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const AcceptanceCriteria: React.FC = () => {
    // 1. Hook Data
    const { t } = useI18n();
    const { currentUser } = useAuth();
    const { success, error } = useToast();
    const { logEvent } = useLog();
    const { selectedLine } = useLine();
    const selectedLineId = selectedLine?.id || null;
    const { data: unifiedDocs, acknowledgeDocument } = useDocuments();
    const docs = unifiedDocs?.docs || [];

    // 2. Legacy/Global Data from DataContext
    const {
        autoOpenDocId,
        setAutoOpenDocId,
    } = useData();

    // Shift Logic
    const { currentShift, activeShifts } = useShift();

    // 3. Derived Data
    const unreadDocuments = useUnreadDocuments(selectedLineId, currentShift, activeShifts);

    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const criteriaDocs = useMemo(() => docs.filter(doc =>
        doc.category === DocumentCategory.AcceptanceCriteria &&
        (!doc.lineId || doc.lineId === selectedLineId)
    ), [docs, selectedLineId]);

    const [offlineMap, setOfflineMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let mounted = true;
        Promise.all(criteriaDocs.map(async d => [d.id, await hasCache(d.url)] as const)).then(entries => {
            if (mounted) setOfflineMap(Object.fromEntries(entries));
        });
        return () => { mounted = false; };
    }, [criteriaDocs]);

    // Auto-open logic
    useEffect(() => {
        if (autoOpenDocId) {
            const foundDoc = criteriaDocs.find(d => d.id === autoOpenDocId);
            if (foundDoc) {
                setSelectedDoc(foundDoc);
                setAutoOpenDocId(null);
            }
        }
    }, [autoOpenDocId, criteriaDocs, setAutoOpenDocId]);

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
                userId: currentUser?.id
            });
            success(t('common.readConfirmed') || 'Leitura confirmada com sucesso!');
        } catch (err) {
            console.error('Error acknowledging document:', err);
            error(t('common.readConfirmError') || 'Erro ao confirmar leitura. Tente novamente.');
        }
    };

    return (
        <div className="h-full w-full">
            <h1 className="text-lg md:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate max-w-[150px] pb-8 md:max-w-none">{t('acceptanceCriteria.title')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {criteriaDocs.length > 0 ? criteriaDocs.map(doc => {
                    const unread = isUnread(doc.id);
                    return (
                        <button
                            key={doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            className={`
                                w-full text-left p-6 rounded-lg hover:scale-105 transform transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500 relative
                                ${unread
                                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                                    : 'bg-yellow-100 dark:bg-gray-800 hover:bg-yellow-200 dark:hover:bg-yellow-700'
                                }
                            `}
                        >
                            {unread && (
                                <div className="absolute top-3 right-3 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </div>
                            )}

                            <p className={`text-2xl font-bold flex items-center justify-between gap-3 ${unread ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                {doc.title}

                                {offlineMap[doc.id] && (
                                    <span className="px-2 py-1 bg-green-600 text-white text-sm rounded-md">Offline</span>
                                )}
                            </p>
                            <p className="text-md text-gray-600 dark:text-gray-400 mt-2">Versão: {doc.version}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-500">Última atualização: {new Date(doc.lastUpdated).toLocaleDateString('pt-BR')}</p>
                        </button>
                    );
                }) : (
                    <div className="col-span-full text-center py-10">
                        <p className="text-2xl text-gray-600 dark:text-gray-500">Nenhum critério de aceitação encontrado.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} title={selectedDoc?.title || ''} size="full">
                <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
                    {/* Confirmation Bar */}
                    {hasUnreadSelected && (
                        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between shadow-lg animate-pulse z-50 flex-none">
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

                    <div className="flex-1 min-h-0 relative">
                        {selectedDoc && <PdfViewer document={selectedDoc} />}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AcceptanceCriteria;
