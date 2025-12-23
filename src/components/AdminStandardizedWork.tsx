import React, { useEffect, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Document, DocumentCategory } from '../types';
import Modal from './common/Modal';
import { PencilSquareIcon, TrashIcon } from './common/Icons';
import { cacheUrl, hasCache, putBlob } from '../services/offlineCache';
import { usePDFStorage } from '../hooks/usePDFStorage';
import { useI18n } from '../contexts/I18nContext';
import { useLine } from '../contexts/LineContext';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments } from '../hooks/useDocuments';

const AdminStandardizedWork: React.FC = () => {
    const { data: unifiedDocs, createDocument, updateDocument, deleteDocument } = useDocuments();
    const docs = unifiedDocs?.docs || [];
    const { t } = useI18n();
    const { selectedLine } = useLine();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Document | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteDocument.mutateAsync(itemToDelete);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    }

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    }

    const DocumentList: React.FC = () => {
        const { selectedLine } = useLine();
        const [cachedMap, setCachedMap] = useState<Record<string, boolean>>({});
        const [visibleCount, setVisibleCount] = useState(20);
        const [isLoading, setIsLoading] = useState(false);
        const sentinelRef = useRef<HTMLDivElement | null>(null);

        const filteredDocs = React.useMemo(() =>
            docs.filter(d => d.category === DocumentCategory.StandardizedWork && (!d.lineId || (selectedLine && d.lineId === selectedLine.id))),
            [docs, selectedLine]);

        useEffect(() => {
            let mounted = true;
            Promise.all(filteredDocs.map(async d => [d.id, await hasCache(d.url)] as const)).then(entries => {
                if (mounted) setCachedMap(Object.fromEntries(entries));
            });
            return () => { mounted = false; };
        }, [filteredDocs.map(d => d.url).join('|')]);

        const loadMore = async () => {
            if (isLoading) return;
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 150));
            setVisibleCount(v => Math.min(v + 20, filteredDocs.length));
            setIsLoading(false);
        };

        useEffect(() => {
            const el = sentinelRef.current;
            if (!el) return;
            const io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && visibleCount < filteredDocs.length) {
                        loadMore();
                    }
                }
            }, { rootMargin: '200px' });
            io.observe(el);
            return () => io.disconnect();
        }, [visibleCount, filteredDocs.length]);

        const rows = filteredDocs.slice(0, visibleCount);

        return (
            <div className="overflow-x-auto mt-6">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">{t('common.title')}</th>
                            <th className="p-4">{t('common.url')}</th>
                            <th className="p-4">{t('common.version')}</th>
                            <th className="p-4 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {rows.map(doc => (
                            <tr key={doc.id} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium">{doc.title}</td>
                                <td className="p-4 truncate max-w-xs text-gray-600 dark:text-gray-300">{doc.url}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{doc.version}</td>
                                <td className="p-4 flex justify-end space-x-3">
                                    <button onClick={() => openModal(doc)} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                                        <PencilSquareIcon className="h-6 w-6" />
                                    </button>
                                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('common.delete')}>
                                        <TrashIcon className="h-6 w-6" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div ref={sentinelRef} className="p-4 text-center space-y-2">
                    {isLoading && <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300">{t('common.loading')}</span>}
                </div>
            </div>
        )
    };

    const FormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        const { selectedLine } = useLine();
        const { currentUser } = useAuth();
        const [formData, setFormData] = useState<Partial<Document>>(editingItem || {});
        const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [uploadProgress, setUploadProgress] = useState<string>('');
        const { savePDF } = usePDFStorage();

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

            // Validar linha
            if (!selectedLine) {
                alert('Por favor, selecione uma linha de produção primeiro.');
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

            if (editingItem && formData.url) {
                try {
                    await updateDocument.mutateAsync({
                        id: editingItem.id,
                        updates: {
                            title: formData.title,
                            document_id: formData.url,
                            version: formData.version?.toString()
                        }
                    });
                    console.log('Documento atualizado no banco.');
                } catch (error) {
                    console.error('Erro ao atualizar documento no banco:', error);
                }
            } else {
                if (currentUser && formData.url && formData.title) {
                    try {
                        await createDocument.mutateAsync({
                            lineId: selectedLine.id,
                            type: 'standardized_work',
                            documentId: formData.url,
                            title: formData.title,
                            uploadedBy: currentUser.id,
                            version: formData.version?.toString(),
                            metadata: { line_name: selectedLine.name }
                        });
                        console.log('Trabalho Padronizado vinculado à linha');
                    } catch (error) {
                        console.error('Erro ao vincular:', error);
                    }
                }
            }
            onClose();
        }

        return (
            <Modal isOpen={true} onClose={onClose} title={editingItem ? t('admin.editStandardizedWork') : t('admin.addStandardizedWork')}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {!selectedLine && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                ⚠️ Selecione uma linha de produção no seletor acima.
                            </p>
                        </div>
                    )}
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
                <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{t('standardizedWork.title')} (P4)</h2>
                <div className="flex flex-col items-end gap-2">
                    <button
                        disabled={!selectedLine}
                        onClick={() => openModal()}
                        className={`px-6 py-3 rounded-lg text-xl font-bold text-white shadow-lg transition-transform transform ${!selectedLine ? 'bg-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 hover:scale-105'}`}
                    >
                        + {t('admin.newDocument')}
                    </button>
                    {!selectedLine && <p className="text-red-500 text-sm font-semibold">{t('admin.selectLineToEnable')}</p>}
                </div>
            </div>

            <DocumentList />

            {isModalOpen && <FormModal onClose={closeModal} />}

            <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title={t('admin.confirmDelete')}>
                <div className="space-y-6">
                    <p className="text-xl text-gray-800 dark:text-gray-300">{t('admin.deleteStandardizedWorkConfirm')}</p>
                    <div className="flex justify-end space-x-4">
                        <button onClick={cancelDelete} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
                        <button onClick={confirmDelete} className="px-6 py-3 bg-red-600 rounded-lg text-xl hover:bg-red-500 text-white">{t('common.delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminStandardizedWork;
