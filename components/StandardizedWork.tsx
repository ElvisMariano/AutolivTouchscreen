
import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Document, DocumentCategory } from '../types';
import PdfViewer from './common/PdfViewer';
import { hasCache } from '../services/offlineCache';

const StandardizedWork: React.FC = () => {
    const { docs, logEvent, selectedLineId } = useData();
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
    }, [normativeDocs.map(d => d.url).join('|')]);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(normativeDocs[0] || null);
    const selectedId = selectedDoc?.id;
    useEffect(() => {
        if (selectedDoc) {
            logEvent('document', 'view', selectedDoc.id, selectedDoc.title);
        }
    }, [selectedId]);

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 lg:w-1/4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex-shrink-0">
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-400 mb-4">Familía / Operadores</h3>
                <ul className="space-y-2">
                    {normativeDocs.map(doc => (
                        <li key={doc.id}>
                            <button
                                onClick={() => setSelectedDoc(doc)}
                                className={`w-full text-left p-4 rounded-md transition-colors text-lg ${selectedDoc?.id === doc.id
                                    ? 'bg-orange-600 text-white font-bold'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    {doc.title}
                                    
                                    {offlineMap[doc.id] && (
                                        <span className="px-2 py-1 bg-green-600 text-white text-sm rounded-md">Offline</span>
                                    )}
                                </span>
                            </button>
                        </li>
                    ))}
                    {normativeDocs.length === 0 && <li className="text-gray-600 dark:text-gray-500 p-4">Nenhum documento encontrado.</li>}
                </ul>
            </div>
            <div className="flex-1 min-h-0">
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
