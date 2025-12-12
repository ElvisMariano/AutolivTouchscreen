
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Document, DocumentCategory } from '../types';
import Modal from './common/Modal';
import PdfViewer from './common/PdfViewer';
import { hasCache } from '../services/offlineCache';

const AcceptanceCriteria: React.FC = () => {
    const { docs, settings, logEvent, selectedLineId } = useData();
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
    }, [criteriaDocs.map(d => d.url).join('|')]);
    const selectedId = selectedDoc?.id;
    useEffect(() => {
        if (selectedDoc) {
            logEvent('document', 'view', selectedDoc.id, selectedDoc.title);
        }
    }, [selectedId]);

    return (
        <div className="h-full w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {criteriaDocs.length > 0 ? criteriaDocs.map(doc => (
                    <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="w-full text-left bg-yellow-100 dark:bg-gray-800 p-6 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-700 hover:scale-105 transform transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 flex items-center justify-between gap-3">
                            {doc.title}
                            {new Date(doc.lastUpdated).getTime() + settings.notificationDuration * 24 * 60 * 60 * 1000 > Date.now() && (
                                <span className="px-2 py-1 bg-yellow-500 text-gray-900 text-sm rounded-md">Atualizado</span>
                            )}
                            {offlineMap[doc.id] && (
                                <span className="px-2 py-1 bg-green-600 text-white text-sm rounded-md">Offline</span>
                            )}
                        </p>
                        <p className="text-md text-gray-600 dark:text-gray-400 mt-2">Versão: {doc.version}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-500">Última atualização: {new Date(doc.lastUpdated).toLocaleDateString('pt-BR')}</p>
                    </button>
                )) : (
                    <div className="col-span-full text-center py-10">
                        <p className="text-2xl text-gray-600 dark:text-gray-500">Nenhum critério de aceitação encontrado.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} title={selectedDoc?.title || ''} size="full">
                {selectedDoc && <PdfViewer document={selectedDoc} />}
            </Modal>
        </div>
    );
};

export default AcceptanceCriteria;
