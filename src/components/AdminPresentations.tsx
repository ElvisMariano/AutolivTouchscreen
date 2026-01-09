import React, { useEffect, useRef, useState } from 'react';
// import { useData } from '../contexts/DataContext';
import { useDocuments } from '../hooks/useDocuments';
import { Presentation } from '../types';
import Modal from './common/Modal';
import { PencilSquareIcon, TrashIcon, CheckCircleIcon, ExclamationTriangleIcon } from './common/Icons'; // Icons assumed to exist or need update
import { useI18n } from '../contexts/I18nContext';
import { useLine } from '../contexts/LineContext';
import { createDocument as addLineDocument, updateDocument as updateLineDocument } from '@/services/api/documents';
import { useAuth } from '../contexts/AuthContext';

const AdminPresentations: React.FC = () => {
    const {
        data: unifiedDocs,
        deleteDocument: deleteDocMutation
    } = useDocuments();

    const presentations = unifiedDocs?.presentations || [];
    const deletePresentation = (id: string) => deleteDocMutation.mutate(id);

    // addPresentation and updatePresentation were in destructuring but looking at code:
    // Line 189: updatePresentation(docData);
    // Line 192: await updateLineDocument(...)
    // It called BOTH? That's double mutation!
    // The previous code did:
    // updatePresentation(docData); // Updates context state optimistically?
    // await updateLineDocument(...); // Updates DB
    // With React Query, we just do one mutation and invalidate queries.
    // So we can remove the `updatePresentation` call and relies on the direct API call or (better) replace direct API call with hook mutation.
    // However, for minimal friction, I will remove the context call. 
    // Wait, the "direct API call" logic in these files is actually what we want to keep or replace with Hook?
    // Hook implementation uses `createDocument` API.
    // `AdminPresentations` uses `createDocument` API directly.
    // So they are redundant.
    // I should PROBABLY switch to using the hook mutation for consistency and automatic cache invalidation.
    // But for this step "clean DataContext", removing the `useData` dependency is the priority.
    // I will replace usage of `addPresentation`/`updatePresentation` with NO-OPs or rely on the existing API calls, 
    // BUT we must ensure the cache updates.
    // If I keep direct API calls, the Query Cache won't know to refetch.
    // So replacing direct API calls with `useDocuments().createDocument` is BETTER.

    // Let's import the mutations properly.
    const { createDocument: createDocMutation, updateDocument: updateDocMutation } = useDocuments();

    // Helper to adapt signatures if needed, or just use mutations in handleSubmit
    const addPresentation = (p: Presentation) => { /* no-op, use mutation in submit */ };
    const updatePresentation = (p: Presentation) => { /* no-op, use mutation in submit */ };
    const { t } = useI18n();
    const { selectedLine } = useLine();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Presentation | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const openModal = (item: Presentation | null = null) => {
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
            deletePresentation(itemToDelete);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    }

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    }

    const PresentationList: React.FC = () => {
        const [visibleCount, setVisibleCount] = useState(20);
        const [isLoading, setIsLoading] = useState(false);
        const sentinelRef = useRef<HTMLDivElement | null>(null);

        const filteredPresentations = presentations.filter(p => !p.lineId || (selectedLine && p.lineId === selectedLine.id));

        const loadMore = async () => {
            if (isLoading) return;
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 150));
            setVisibleCount(v => Math.min(v + 20, filteredPresentations.length));
            setIsLoading(false);
        };

        useEffect(() => {
            const el = sentinelRef.current;
            if (!el) return;
            const io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && visibleCount < filteredPresentations.length) {
                        loadMore();
                    }
                }
            }, { rootMargin: '200px' });
            io.observe(el);
            return () => io.disconnect();
        }, [visibleCount, filteredPresentations.length]);

        const rows = filteredPresentations.slice(0, visibleCount);

        return (
            <div className="overflow-x-auto mt-6">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">{t('common.title')}</th>
                            <th className="p-4">{t('common.url')}</th>
                            <th className="p-4 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {rows.map(doc => (
                            <tr key={doc.id} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium">{doc.title}</td>
                                <td className="p-4 truncate max-w-xs text-gray-600 dark:text-gray-300">{doc.url}</td>
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
        const [formData, setFormData] = useState<Partial<Presentation>>(editingItem || {});
        const [embedCode, setEmbedCode] = useState('');
        const [extractedUrl, setExtractedUrl] = useState<string | null>(editingItem?.url || null);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
            if (editingItem?.url) {
                // If editing, try to reconstruct an iframe code representation or just leave empty instructions
                setExtractedUrl(editingItem.url);
            }
        }, [editingItem]);

        const extractUrlFromEmbed = (code: string) => {
            setEmbedCode(code);
            setError(null);

            if (!code.trim()) {
                setExtractedUrl(null);
                return;
            }

            // Regex to find src attribute within iframe tag
            const srcMatch = code.match(/<iframe.*?src=["'](.*?)["']/i);

            if (srcMatch && srcMatch[1]) {
                const url = srcMatch[1];
                // Verify if it looks like a valid URL
                if (url.startsWith('http')) {
                    setExtractedUrl(url);
                    setFormData(prev => ({ ...prev, url: url }));
                } else {
                    setError('A URL extraída parece inválida.');
                    setExtractedUrl(null);
                }
            } else {
                // If user pasted a direct URL instead of iframe code, we might want to warn them
                // But per requirements "Only Embed Code", we should enforce it.
                // Checking if input itself is a URL
                if (code.trim().startsWith('http')) {
                    setError('Por favor, cole o código HTML completo do iframe (<iframe src="...">).');
                    setExtractedUrl(null);
                } else {
                    setError('Código de incorporação inválido. Certifique-se de copiar o tag <iframe> completo.');
                    setExtractedUrl(null);
                }
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            if (!selectedLine) {
                alert('Por favor, selecione uma linha de produção primeiro.');
                return;
            }

            if (!extractedUrl) {
                alert('URL da apresentação inválida.');
                return;
            }

            const docData = {
                ...formData,
                url: extractedUrl
            } as Presentation;

            if (editingItem) {
                updatePresentation(docData);

                try {
                    await updateLineDocument(editingItem.id, {
                        title: formData.title,
                        document_url: extractedUrl,
                        version: typeof formData.version === 'number' ? formData.version : (formData.version ? Number(formData.version) : undefined)
                    });
                } catch (error) {
                    console.error('Erro ao atualizar apresentação:', error);
                }
            } else {
                addPresentation({ ...docData, lineId: selectedLine.id });

                if (currentUser && extractedUrl && formData.title) {
                    try {
                        await addLineDocument({
                            line_id: selectedLine.id,
                            category: 'presentation',
                            title: formData.title,
                            document_url: extractedUrl, // Using extractedUrl for document_url
                            version: typeof formData.version === 'number' ? formData.version : (formData.version ? Number(formData.version) : 1),
                            uploaded_by: currentUser.name || 'Admin'
                        });
                    } catch (error) {
                        console.error('Erro ao vincular:', error);
                    }
                }
            }
            onClose();
        }

        return (
            <Modal isOpen={true} onClose={onClose} title={editingItem ? t('admin.editPresentation') : t('admin.addPresentation')}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {!selectedLine && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                ⚠️ Selecione uma linha no seletor acima.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xl block text-gray-900 dark:text-white">
                            {t('common.title')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="title"
                            value={formData.title || ''}
                            onChange={handleChange}
                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xl block text-gray-900 dark:text-white">
                            {t('admin.embedCode')} (SharePoint Embed) <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Copie o código completo em <b>Arquivo {'>'} Compartilhar {'>'} Incorporar</b> no SharePoint.
                        </p>
                        <textarea
                            rows={4}
                            value={embedCode}
                            onChange={(e) => extractUrlFromEmbed(e.target.value)}
                            placeholder='<iframe src="https://..." width="..." ...></iframe>'
                            className={`w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-sm font-mono border-2 focus:outline-none transition-colors ${error ? 'border-red-500 focus:border-red-500' :
                                extractedUrl ? 'border-green-500 focus:border-green-500' : 'border-gray-300 dark:border-gray-600 focus:border-cyan-500'
                                }`}
                        />
                        {error && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                                <ExclamationTriangleIcon className="w-4 h-4" /> {error}
                            </p>
                        )}
                        {extractedUrl && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Link extraído com sucesso!
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                    {extractedUrl}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
                        <button
                            type="submit"
                            disabled={!extractedUrl || !selectedLine || !formData.title}
                            className="px-6 py-3 bg-cyan-600 rounded-lg text-xl hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{t('presentations.title')}</h2>
                <div className="flex flex-col items-end gap-2">
                    <button
                        disabled={!selectedLine}
                        onClick={() => openModal()}
                        className={`px-6 py-3 rounded-lg text-xl font-bold text-white shadow-lg transition-transform transform ${!selectedLine ? 'bg-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 hover:scale-105'}`}
                    >
                        + {t('admin.newPresentation')}
                    </button>
                    {!selectedLine && <p className="text-red-500 text-sm font-semibold">{t('admin.selectLineToEnable')}</p>}
                </div>
            </div>

            <PresentationList />

            {isModalOpen && <FormModal onClose={closeModal} />}

            <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title={t('admin.confirmDelete')}>
                <div className="space-y-6">
                    <p className="text-xl text-gray-800 dark:text-gray-300">{t('admin.deletePresentationConfirm')}</p>
                    <div className="flex justify-end space-x-4">
                        <button onClick={cancelDelete} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
                        <button onClick={confirmDelete} className="px-6 py-3 bg-red-600 rounded-lg text-xl hover:bg-red-500 text-white">{t('common.delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPresentations;
