import React, { useEffect, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Document, DocumentCategory } from '../types';
import Modal from './common/Modal';
import { PencilSquareIcon, TrashIcon } from './common/Icons';

import { cacheUrl, hasCache, putBlob } from '../services/offlineCache';
import { usePDFStorage } from '../hooks/usePDFStorage';
import { useI18n } from '../contexts/I18nContext';
import { useLine } from '../contexts/LineContext';
import StationSelector from './common/StationSelector';
import { WorkStation, StationInstruction, getInstructionsByStation, getInstructionsByLine, getStationsByLine, updateStationInstruction } from '../services/stationService';
import { addStationInstruction } from '../services/stationService';
import { useAuth } from '../contexts/AuthContext';

interface WorkInstructionRowProps {
    doc: Document & { stationName?: string };
    isCached: boolean;
    onEdit: (doc: Document) => void;
    onDelete: (id: string) => void;
    onCache: (doc: Document) => Promise<void>;
    onUploadLocal: (doc: Document, file: File) => Promise<void>;
}

const WorkInstructionRow = React.memo(({ doc, isCached, onEdit, onDelete, onCache, onUploadLocal }: WorkInstructionRowProps) => {
    const { t } = useI18n();
    return (
        <tr className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="p-4 font-medium text-gray-900 dark:text-white">{doc.title}</td>
            <td className="p-4 text-gray-600 dark:text-gray-300">{doc.stationName || '-'}</td>
            <td className="p-4 truncate max-w-xs text-gray-600 dark:text-gray-300">{doc.url}</td>
            <td className="p-4 text-gray-600 dark:text-gray-300">{doc.version}</td>
            <td className="p-4 flex justify-end space-x-3">
                <button onClick={() => onEdit(doc)} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                    <PencilSquareIcon className="h-6 w-6" />
                </button>
                <button onClick={() => onDelete(doc.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('common.delete')}>
                    <TrashIcon className="h-6 w-6" />
                </button>
            </td>
        </tr>
    );
});

const AdminWorkInstructions: React.FC = () => {
    const { docs, addDocument, updateDocument, deleteDocument } = useData();
    const { selectedLine } = useLine();
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Document | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [supabaseInstructions, setSupabaseInstructions] = useState<StationInstruction[]>([]);
    const [selectedStationForFilter, setSelectedStationForFilter] = useState<string>('');
    const [stations, setStations] = useState<WorkStation[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Buscar estações da linha selecionada
    useEffect(() => {
        if (!selectedLine) {
            setStations([]);
            return;
        }

        const fetchStations = async () => {
            try {
                const stationsData = await getStationsByLine(selectedLine.id);
                setStations(stationsData);
            } catch (error) {
                console.error('Error fetching stations:', error);
                setStations([]);
            }
        };

        fetchStations();
    }, [selectedLine]);

    // Buscar instruções do Supabase quando linha/estação mudar
    useEffect(() => {
        if (!selectedLine) {
            setSupabaseInstructions([]);
            return;
        }

        const fetchInstructions = async () => {
            try {
                if (selectedStationForFilter) {
                    const instructions = await getInstructionsByStation(selectedStationForFilter);
                    setSupabaseInstructions(instructions);
                } else {
                    const instructions = await getInstructionsByLine(selectedLine.id);
                    setSupabaseInstructions(instructions);
                }
            } catch (error) {
                console.error('Error fetching instructions:', error);
                setSupabaseInstructions([]);
            }
        };

        fetchInstructions();
    }, [selectedLine, selectedStationForFilter, refreshTrigger]);

    const openModal = (item: Document | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    }

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteDocument(itemToDelete);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    }

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    }

    const DocumentList: React.FC = () => {
        // Filtrar docs locais por categoria (compatibilidade) e pela linha selecionada
        const localDocs = docs.filter(doc =>
            doc.category === DocumentCategory.WorkInstruction &&
            // Se o documento tiver lineId, ele deve corresponder à linha selecionada.
            // Se não tiver (legado), mantemos o comportamento atual (aparece em todas), 
            // ou poderíamos ocultar. Para evitar perda de dados offline, mantemos se for indefinido,
            // mas o ideal é que todos tenham lineId.
            (!doc.lineId || (selectedLine && doc.lineId === selectedLine.id))
        );

        // Converter instruções do Supabase em Documents para exibição
        const supabaseDocs: (Document & { stationName?: string })[] = supabaseInstructions.map(inst => ({
            id: inst.id,
            title: inst.title,
            url: inst.document_id, // document_id é a URL/ID do IndexedDB
            category: DocumentCategory.WorkInstruction,
            version: inst.version || '1',
            lastUpdated: inst.uploaded_at,
            stationName: inst.work_stations?.name,
            stationId: inst.station_id
        }));

        // Combinar docs locais com docs do Supabase (priorizando Supabase e evitando duplicatas por ID ou URL)
        const allDocs: (Document & { stationName?: string })[] = [...supabaseDocs];

        localDocs.forEach(lDoc => {
            // Verifica se o documento já existe na lista vinda do Supabase (por ID ou por URL)
            // Se a URL for a mesma, assumimos que é o mesmo documento já sincronizado/vinculado
            const exists = allDocs.some(d => d.id === lDoc.id || (d.url && d.url === lDoc.url));
            if (!exists) {
                allDocs.push(lDoc);
            }
        });

        const [cachedMap, setCachedMap] = useState<Record<string, boolean>>({});
        const [visibleCount, setVisibleCount] = useState(20);
        const [isLoading, setIsLoading] = useState(false);
        const sentinelRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            let mounted = true;
            Promise.all(allDocs.map(async d => [d.id, await hasCache(d.url)] as const)).then(entries => {
                if (mounted) setCachedMap(Object.fromEntries(entries));
            });
            return () => { mounted = false; };
        }, [allDocs.map(d => d.url).join('|')]);

        const loadMore = async () => {
            if (isLoading) return;
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 150));
            setVisibleCount(v => Math.min(v + 20, allDocs.length));
            setIsLoading(false);
        };

        useEffect(() => {
            const el = sentinelRef.current;
            if (!el) return;
            const io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && visibleCount < allDocs.length) {
                        loadMore();
                    }
                }
            }, { rootMargin: '200px' });
            io.observe(el);
            return () => io.disconnect();
        }, [visibleCount, allDocs.length]);

        const rows = allDocs.slice(0, visibleCount);

        return (
            <div className="overflow-x-auto mt-6">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">{t('common.title')}</th>
                            <th className="p-4">Estação</th>
                            <th className="p-4">{t('common.url')}</th>
                            <th className="p-4">{t('common.version')}</th>
                            <th className="p-4 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {rows.map(doc => (
                            <WorkInstructionRow
                                key={doc.id}
                                doc={doc}
                                isCached={!!cachedMap[doc.id]}
                                onEdit={openModal}
                                onDelete={handleDelete}
                                onCache={async (d) => {
                                    await cacheUrl(d.url).catch(() => { });
                                    const v = await hasCache(d.url);
                                    setCachedMap(prev => ({ ...prev, [d.id]: v }));
                                }}
                                onUploadLocal={async (d, f) => {
                                    await putBlob(d.url, f);
                                    const v = await hasCache(d.url);
                                    setCachedMap(prev => ({ ...prev, [d.id]: v }));
                                }}
                            />
                        ))}
                    </tbody>
                </table>
                <div ref={sentinelRef} className="p-4 text-center space-y-2">
                    {isLoading && <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300">{t('common.loading')}</span>}
                </div>
            </div>
        );
    };

    const FormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        const { selectedLine } = useLine();
        const { currentUser } = useAuth();
        const [selectedStation, setSelectedStation] = useState<WorkStation | null>(null);
        const [formData, setFormData] = useState<Partial<Document>>(editingItem || {});
        const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [uploadProgress, setUploadProgress] = useState<string>('');
        const { savePDF } = usePDFStorage();

        useEffect(() => {
            if (editingItem && (editingItem as any).stationId) {
                const sId = (editingItem as any).stationId;
                const found = stations.find(s => s.id === sId);
                if (found) setSelectedStation(found);
            }
        }, []);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (file.type !== 'application/pdf') {
                alert(t('admin.onlyPdf'));
                return;
            }

            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                alert(t('admin.fileTooLarge'));
                return;
            }

            setSelectedFile(file);
            setUploadProgress(`${t('admin.fileSelected')}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            // Validar linha e estação
            if (!selectedLine) {
                alert('Por favor, selecione uma linha de produção primeiro.');
                return;
            }
            if (!selectedStation) {
                alert('Por favor, selecione uma estação de trabalho.');
                return;
            }

            if (uploadMode === 'upload' && selectedFile) {
                try {
                    setUploadProgress(t('admin.uploading'));
                    const targetId = editingItem ? editingItem.id : `doc-${Date.now()}`;
                    const indexedDBUrl = await savePDF(selectedFile, targetId);
                    formData.url = indexedDBUrl;
                    setUploadProgress(t('admin.uploadComplete'));
                } catch (error) {
                    alert(t('admin.uploadError'));
                    console.error('Upload error:', error);
                    return;
                }
            }

            if (editingItem) {
                updateDocument(formData as Document);
                if (formData.url) {
                    try {
                        await updateStationInstruction(
                            editingItem.id,
                            {
                                title: formData.title,
                                document_id: formData.url,
                                version: formData.version,
                                station_id: selectedStation?.id
                            }
                        );
                        setRefreshTrigger(prev => prev + 1);
                    } catch (e) { console.error(e); }
                }
            } else {
                // Adicionar documento ao DataContext (compatibilidade)
                addDocument({
                    ...(formData as any),
                    category: DocumentCategory.WorkInstruction,
                    lineId: selectedLine.id,
                    stationId: selectedStation.id
                });

                // Salvar vínculo no Supabase
                if (currentUser && formData.url && formData.title) {
                    try {
                        await addStationInstruction(
                            selectedStation.id,
                            formData.url,
                            formData.title,
                            currentUser.id,
                            formData.version,
                            { line_id: selectedLine.id, line_name: selectedLine.name, station_name: selectedStation.name }
                        );
                        console.log('Instrução vinculada à estação com sucesso');
                        setRefreshTrigger(prev => prev + 1);
                    } catch (error) {
                        console.error('Erro ao vincular instrução:', error);
                    }
                }
            }
            onClose();
        }

        return (
            <Modal isOpen={true} onClose={onClose} title={editingItem ? t('admin.editInstruction') : t('admin.addInstruction')}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Station Selector */}
                    <StationSelector
                        selectedStation={selectedStation}
                        onStationChange={setSelectedStation}
                    />

                    <label className="text-xl block text-gray-900 dark:text-white">{t('common.title')} <input name="title" value={formData.title || ''} onChange={handleChange} className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors" required /></label>

                    <div className="flex gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => setUploadMode('url')}
                            className={`flex-1 py-4 px-6 rounded-lg text-lg font-medium transition-all border-2 ${uploadMode === 'url'
                                ? 'bg-cyan-600 border-cyan-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                        >
                            🔗 {t('admin.externalUrl')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode('upload')}
                            className={`flex-1 py-4 px-6 rounded-lg text-lg font-medium transition-all border-2 ${uploadMode === 'upload'
                                ? 'bg-cyan-600 border-cyan-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                        >
                            📁 {t('admin.uploadFile')}
                        </button>
                    </div>

                    {uploadMode === 'url' ? (
                        <label className="text-xl block text-gray-900 dark:text-white">
                            {t('admin.pdfUrl')}
                            <input
                                name="url"
                                type="url"
                                value={formData.url || ''}
                                onChange={handleChange}
                                className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors"
                                placeholder="https://exemplo.com/documento.pdf"
                                required
                            />
                        </label>
                    ) : (
                        <div className="space-y-3">
                            <label className="block">
                                <div className="text-xl mb-2 text-gray-900 dark:text-white">{t('admin.selectPdf')}</div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleFileSelect}
                                        className="w-full text-gray-900 dark:text-white file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-lg file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3"
                                        required={!selectedFile}
                                    />
                                </div>
                            </label>
                            {uploadProgress && (
                                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-500/30 rounded-lg text-cyan-800 dark:text-cyan-300 text-sm">
                                    {uploadProgress}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
                        <button type="submit" className="px-6 py-3 bg-cyan-600 rounded-lg text-xl hover:bg-cyan-500 text-white">{t('common.save')}</button>
                    </div>
                </form>
            </Modal>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{t('workInstructions.title')} (P1)</h2>
                    {selectedLine && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            📍 Linha: <span className="font-semibold">{selectedLine.name}</span>
                            {supabaseInstructions.length > 0 && (
                                <span className="ml-3 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                                    {supabaseInstructions.length} {supabaseInstructions.length === 1 ? 'instrução' : 'instruções'} cadastrada(s)
                                </span>
                            )}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        disabled={!selectedLine}
                        onClick={() => openModal()}
                        className={`px-6 py-3 rounded-lg text-xl font-bold text-white shadow-lg transition-transform transform ${!selectedLine ? 'bg-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 hover:scale-105'}`}
                    >
                        + {t('admin.newInstruction')}
                    </button>
                    {!selectedLine && <p className="text-red-500 text-sm font-semibold">{t('admin.selectLineToEnable')}</p>}
                </div>
            </div>

            {/* Filtro por Estação */}
            {selectedLine && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filtrar por Estação (opcional)
                    </label>
                    <select
                        value={selectedStationForFilter}
                        onChange={(e) => setSelectedStationForFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                        <option value="">Todas as estações da linha</option>
                        {stations.map(station => (
                            <option key={station.id} value={station.id}>
                                {station.position}. {station.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}



            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-300 mt-8 border-t border-gray-300 dark:border-gray-700 pt-6">{t('admin.documents')}</h3>
            <DocumentList />

            {isModalOpen && <FormModal onClose={closeModal} />}

            <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title={t('admin.confirmDelete')}>
                <div className="space-y-6">
                    <p className="text-xl text-gray-800 dark:text-gray-300">{t('admin.deleteInstructionConfirm')}</p>
                    <div className="flex justify-end space-x-4">
                        <button onClick={cancelDelete} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
                        <button onClick={confirmDelete} className="px-6 py-3 bg-red-600 rounded-lg text-xl hover:bg-red-500 text-white">{t('common.delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminWorkInstructions;
