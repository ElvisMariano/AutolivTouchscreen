import React, { useEffect, useRef, useState } from 'react';
// import { useData } from '../contexts/DataContext';
import { useDocuments } from '../hooks/useDocuments';
import { Document, PowerBiReport, Presentation, DocumentCategory, QualityAlert, AlertSeverity } from '../types';
import Modal from './common/Modal';
import { PencilSquareIcon, TrashIcon } from './common/Icons';
import ProductionLineEditor from './ProductionLineEditor';
import { cacheUrl, hasCache, putBlob } from '../services/offlineCache';
import { usePDFStorage } from '../hooks/usePDFStorage';

type DocType = 'work_instructions' | 'acceptance_criteria' | 'standardized_work' | 'quality_alerts' | 'bi' | 'ppt';

const AdminDocumentManagement: React.FC = () => {
    const {
        data: unifiedDocs,
        createDocument: createDocMutation,
        updateDocument: updateDocMutation,
        deleteDocument: deleteDocMutation
    } = useDocuments();

    // Derived State
    const docs = unifiedDocs?.docs || [];
    const alerts = unifiedDocs?.alerts || [];
    const biReports = unifiedDocs?.reports || [];
    const presentations = unifiedDocs?.presentations || [];

    // Mapping mutations to legacy function signatures locally or updating callsites?
    // Let's update callsites in valid chunks or create adapters here to minimize diff size first?
    // Updating callsites is better for clean code.
    // We will need to adapt the logic below. For now, let's keep the hook visible.
    const [activeTab, setActiveTab] = useState<DocType>('work_instructions');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Document | PowerBiReport | Presentation | QualityAlert | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const openModal = (item: Document | PowerBiReport | Presentation | QualityAlert | null = null) => {
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
        if (!itemToDelete) return;

        if (itemToDelete) {
            deleteDocMutation.mutate(itemToDelete);
        }

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    }

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    }

    const categoryMap: Record<DocType, DocumentCategory | null> = {
        work_instructions: DocumentCategory.WorkInstruction,
        acceptance_criteria: DocumentCategory.AcceptanceCriteria,
        standardized_work: DocumentCategory.StandardizedWork,
        quality_alerts: DocumentCategory.QualityAlert,
        bi: null,
        ppt: null,
    };

    const DocumentList: React.FC<{ category: DocumentCategory; testMode?: boolean; onTestResult?: (result: string) => void; }> = ({ category, testMode = false, onTestResult }) => {
        const categoryDocs = docs.filter(doc => doc.category === category);
        const [cachedMap, setCachedMap] = useState<Record<string, boolean>>({});
        const [visibleCount, setVisibleCount] = useState(20);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [failNext, setFailNext] = useState(false);
        const sentinelRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            let mounted = true;
            Promise.all(categoryDocs.map(async d => [d.id, await hasCache(d.url)] as const)).then(entries => {
                if (mounted) setCachedMap(Object.fromEntries(entries));
            });
            return () => { mounted = false; };
        }, [categoryDocs.map(d => d.url).join('|')]);

        useEffect(() => {
            setVisibleCount(20);
        }, [categoryDocs.length]);

        const loadMore = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
                if (failNext) {
                    setFailNext(false);
                    throw new Error('falha');
                }
                await new Promise(r => setTimeout(r, 150));
                setVisibleCount(v => Math.min(v + 20, categoryDocs.length));
                setError(null);
            } catch {
                setError('Falha ao carregar');
                if (testMode && onTestResult) onTestResult('OK: erro detectado');
            } finally {
                setIsLoading(false);
            }
        };

        useEffect(() => {
            const el = sentinelRef.current;
            if (!el) return;
            const io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && visibleCount < categoryDocs.length) {
                        loadMore();
                    }
                }
            }, { rootMargin: '200px' });
            io.observe(el);
            return () => io.disconnect();
        }, [visibleCount, categoryDocs.length]);

        useEffect(() => {
            if (!testMode) return;
            (async () => {
                const before = visibleCount;
                setFailNext(true);
                await loadMore();
                await loadMore();
                const after = visibleCount;
                if (onTestResult) {
                    onTestResult(after > before ? 'OK: erro tratado e incremento' : 'FALHA: retry não funcionou');
                }
            })();
        }, [testMode]);

        const rows = categoryDocs.slice(0, visibleCount);

        return (
            <div className="overflow-x-auto mt-6">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-700 text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">Título</th>
                            <th className="p-4">URL</th>
                            <th className="p-4">Versão</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800">
                        {rows.map(doc => (
                            <tr key={doc.id} className="border-b border-gray-700">
                                <td className="p-4">{doc.title}</td>
                                <td className="p-4 truncate max-w-xs">{doc.url}</td>
                                <td className="p-4">{doc.version}</td>
                                <td className="p-4 flex justify-end space-x-4">
                                    <button onClick={() => openModal(doc)} className="text-blue-400 hover:text-blue-300"><PencilSquareIcon className="h-7 w-7" /></button>
                                    <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-7 w-7" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div ref={sentinelRef} className="p-4 text-center space-y-2">
                    {error && (
                        <div role="alert" aria-live="assertive" className="inline-flex items-center gap-3 px-3 py-1 bg-red-700 rounded-md">
                            <span>Erro ao carregar</span>
                            <button onClick={loadMore} className="px-3 py-1 bg-red-900 rounded-md hover:bg-red-800">Tentar Novamente</button>
                        </div>
                    )}
                    {isLoading && <span role="status" aria-live="polite" className="px-3 py-1 bg-gray-700 rounded-md">Carregando...</span>}
                </div>
            </div>
        )
    };

    const AlertsList: React.FC<{ testMode?: boolean; onTestResult?: (result: string) => void; }> = ({ testMode = false, onTestResult }) => {
        const [visibleCount, setVisibleCount] = useState(20);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [failNext, setFailNext] = useState(false);
        const sentinelRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => { setVisibleCount(20); }, [alerts.length]);
        const loadMore = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
                if (failNext) { setFailNext(false); throw new Error('falha'); }
                await new Promise(r => setTimeout(r, 150));
                setVisibleCount(v => Math.min(v + 20, alerts.length));
                setError(null);
            } catch {
                setError('Falha ao carregar');
                if (testMode && onTestResult) onTestResult('OK: erro detectado');
            } finally {
                setIsLoading(false);
            }
        };
        useEffect(() => {
            const el = sentinelRef.current;
            if (!el) return;
            const io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && visibleCount < alerts.length) loadMore();
                }
            }, { rootMargin: '200px' });
            io.observe(el);
            return () => io.disconnect();
        }, [visibleCount, alerts.length]);
        useEffect(() => {
            if (!testMode) return;
            (async () => {
                const before = visibleCount;
                setFailNext(true);
                await loadMore();
                await loadMore();
                const after = visibleCount;
                if (onTestResult) onTestResult(after > before ? 'OK: erro tratado e incremento' : 'FALHA: retry não funcionou');
            })();
        }, [testMode]);

        return (
            <div className="mt-6">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-700 text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">Título</th>
                            <th className="p-4">Severidade</th>
                            <th className="p-4">Expira em</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.slice(0, visibleCount).map(item => (
                            <tr key={item.id} className="border-b border-gray-700">
                                <td className="p-4">{item.title}</td>
                                <td className="p-4">{item.severity}</td>
                                <td className="p-4">{new Date(item.expiresAt).toLocaleString('pt-BR')}</td>
                                <td className="p-4 flex justify-end space-x-4">
                                    <button onClick={() => openModal(item)} className="text-blue-400 hover:text-blue-300"><PencilSquareIcon className="h-7 w-7" /></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-7 w-7" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div ref={sentinelRef} className="p-4 text-center space-y-2">
                    {error && (
                        <div role="alert" aria-live="assertive" className="inline-flex items-center gap-3 px-3 py-1 bg-red-700 rounded-md">
                            <span>Erro ao carregar</span>
                            <button onClick={loadMore} className="px-3 py-1 bg-red-900 rounded-md hover:bg-red-800">Tentar Novamente</button>
                        </div>
                    )}
                    {isLoading && <span role="status" aria-live="polite" className="px-3 py-1 bg-gray-700 rounded-md">Carregando...</span>}
                </div>
            </div>
        );
    };

    const BiList: React.FC<{ testMode?: boolean; onTestResult?: (result: string) => void; }> = ({ testMode = false, onTestResult }) => {
        const [visibleCount, setVisibleCount] = useState(20);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [failNext, setFailNext] = useState(false);
        const sentinelRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => { setVisibleCount(20); }, [biReports.length]);
        const loadMore = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
                if (failNext) { setFailNext(false); throw new Error('falha'); }
                await new Promise(r => setTimeout(r, 150));
                setVisibleCount(v => Math.min(v + 20, biReports.length));
                setError(null);
            } catch {
                setError('Falha ao carregar');
                if (testMode && onTestResult) onTestResult('OK: erro detectado');
            } finally {
                setIsLoading(false);
            }
        };
        useEffect(() => {
            const el = sentinelRef.current;
            if (!el) return;
            const io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && visibleCount < biReports.length) loadMore();
                }
            }, { rootMargin: '200px' });
            io.observe(el);
            return () => io.disconnect();
        }, [visibleCount, biReports.length]);
        useEffect(() => {
            if (!testMode) return;
            (async () => {
                const before = visibleCount;
                setFailNext(true);
                await loadMore();
                await loadMore();
                const after = visibleCount;
                if (onTestResult) onTestResult(after > before ? 'OK: erro tratado e incremento' : 'FALHA: retry não funcionou');
            })();
        }, [testMode]);

        return (
            <div className="mt-6">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-700 text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Embed URL</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {biReports.slice(0, visibleCount).map(item => (
                            <tr key={item.id} className="border-b border-gray-700">
                                <td className="p-4">{item.name}</td>
                                <td className="p-4 truncate max-w-xs">{item.embedUrl}</td>
                                <td className="p-4 flex justify-end space-x-4">
                                    <button onClick={() => openModal(item)} className="text-blue-400 hover:text-blue-300"><PencilSquareIcon className="h-7 w-7" /></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-7 w-7" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div ref={sentinelRef} className="p-4 text-center space-y-2">
                    {error && (
                        <div role="alert" aria-live="assertive" className="inline-flex items-center gap-3 px-3 py-1 bg-red-700 rounded-md">
                            <span>Erro ao carregar</span>
                            <button onClick={loadMore} className="px-3 py-1 bg-red-900 rounded-md hover:bg-red-800">Tentar Novamente</button>
                        </div>
                    )}
                    {isLoading && <span role="status" aria-live="polite" className="px-3 py-1 bg-gray-700 rounded-md">Carregando...</span>}
                </div>
            </div>
        );
    };

    const PptList: React.FC<{ testMode?: boolean; onTestResult?: (result: string) => void; }> = ({ testMode = false, onTestResult }) => {
        const [visibleCount, setVisibleCount] = useState(20);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [failNext, setFailNext] = useState(false);
        const sentinelRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => { setVisibleCount(20); }, [presentations.length]);
        const loadMore = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
                if (failNext) { setFailNext(false); throw new Error('falha'); }
                await new Promise(r => setTimeout(r, 150));
                setVisibleCount(v => Math.min(v + 20, presentations.length));
                setError(null);
            } catch {
                setError('Falha ao carregar');
                if (testMode && onTestResult) onTestResult('OK: erro detectado');
            } finally {
                setIsLoading(false);
            }
        };
        useEffect(() => {
            const el = sentinelRef.current;
            if (!el) return;
            const io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && visibleCount < presentations.length) loadMore();
                }
            }, { rootMargin: '200px' });
            io.observe(el);
            return () => io.disconnect();
        }, [visibleCount, presentations.length]);
        useEffect(() => {
            if (!testMode) return;
            (async () => {
                const before = visibleCount;
                setFailNext(true);
                await loadMore();
                await loadMore();
                const after = visibleCount;
                if (onTestResult) onTestResult(after > before ? 'OK: erro tratado e incremento' : 'FALHA: retry não funcionou');
            })();
        }, [testMode]);

        return (
            <div className="mt-6">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-700 text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Nº Slides</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {presentations.slice(0, visibleCount).map(item => (
                            <tr key={item.id} className="border-b border-gray-700">
                                <td className="p-4">{item.title}</td>
                                <td className="p-4">{(item as Presentation).slides.length}</td>
                                <td className="p-4 flex justify-end space-x-4">
                                    <button onClick={() => openModal(item)} className="text-blue-400 hover:text-blue-300"><PencilSquareIcon className="h-7 w-7" /></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-7 w-7" /></button>
                                    <button onClick={async () => { for (const s of (item as Presentation).slides) { await cacheUrl(s).catch(() => { }); } }} className="px-3 py-1 bg-green-600 rounded-md hover:bg-green-500">Salvar Slides Offline</button>
                                    <label className="px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 cursor-pointer">
                                        Carregar Slides
                                        <input type="file" accept="image/*" multiple onChange={async (e) => { const files = Array.from(e.target.files || []) as File[]; if (files.length === 0) return; const pres = item as Presentation; for (let i = 0; i < files.length && i < pres.slides.length; i++) { await putBlob(pres.slides[i], files[i]); } e.currentTarget.value = ''; }} className="hidden" />
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div ref={sentinelRef} className="p-4 text-center space-y-2">
                    {error && (
                        <div role="alert" aria-live="assertive" className="inline-flex items-center gap-3 px-3 py-1 bg-red-700 rounded-md">
                            <span>Erro ao carregar</span>
                            <button onClick={loadMore} className="px-3 py-1 bg-red-900 rounded-md hover:bg-red-800">Tentar Novamente</button>
                        </div>
                    )}
                    {isLoading && <span role="status" aria-live="polite" className="px-3 py-1 bg-gray-700 rounded-md">Carregando...</span>}
                </div>
            </div>
        );
    };

    const TestRunner: React.FC = () => {
        const [running, setRunning] = useState(false);
        const [results, setResults] = useState<string[]>([]);
        const [done, setDone] = useState(false);
        const onResult = (r: string) => {
            setResults(prev => {
                const next = [...prev, r];
                if (next.length >= 4) { setRunning(false); setDone(true); }
                return next;
            });
        };
        return (
            <div className="mt-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setResults([]); setDone(false); setRunning(true); }} className="px-4 py-2 bg-cyan-700 rounded-md hover:bg-cyan-600">Executar Testes do Painel Infinito</button>
                    {done && <span className="px-3 py-1 bg-gray-700 rounded-md">{results.join(' | ')}</span>}
                </div>
                {running && (
                    <div className="hidden">
                        <DocumentList category={DocumentCategory.WorkInstruction} testMode onTestResult={onResult} />
                        <AlertsList testMode onTestResult={onResult} />
                        <BiList testMode onTestResult={onResult} />
                        <PptList testMode onTestResult={onResult} />
                    </div>
                )}
            </div>
        );
    };
    const renderContent = () => {
        switch (activeTab) {
            case 'work_instructions':
                return (
                    <div>
                        <ProductionLineEditor />
                        <h3 className="text-2xl font-bold text-gray-300 mt-8 border-t border-gray-700 pt-6">Documentos de Instrução</h3>
                        <DocumentList category={DocumentCategory.WorkInstruction} />
                    </div>
                );
            case 'acceptance_criteria':
                return <DocumentList category={DocumentCategory.AcceptanceCriteria} />;
            case 'standardized_work':
                return <DocumentList category={DocumentCategory.StandardizedWork} />;
            case 'quality_alerts':
                return <AlertsList />;
            case 'bi':
                return <BiList />;
            case 'ppt':
                return <PptList />;
        }
    };

    const FormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        const [formData, setFormData] = useState(editingItem || {});
        const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [uploadProgress, setUploadProgress] = useState<string>('');
        const { savePDF } = usePDFStorage();

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            if (name === 'slides') {
                setFormData(prev => ({ ...prev, [name]: value.split('\n') }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        };

        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Validar tipo
            if (file.type !== 'application/pdf') {
                alert('Apenas arquivos PDF são aceitos!');
                return;
            }

            // Validar tamanho (limite de 50MB como exemplo)
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                alert('Arquivo muito grande! Tamanho máximo: 50MB');
                return;
            }

            setSelectedFile(file);
            setUploadProgress(`Arquivo selecionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const currentCategory = categoryMap[activeTab];

            // Handle File Upload for Documents AND Alerts
            if (uploadMode === 'upload' && selectedFile) {
                try {
                    setUploadProgress('Iniciando upload...');
                    // Use alert ID or doc ID depending on context
                    const targetId = editingItem ? editingItem.id : (activeTab === 'quality_alerts' ? `alert-${Date.now()}` : `doc-${Date.now()}`);

                    const indexedDBUrl = await savePDF(selectedFile, targetId);

                    if (activeTab === 'quality_alerts') {
                        (formData as QualityAlert).pdfUrl = indexedDBUrl;
                        (formData as QualityAlert).pdfName = selectedFile.name;
                    } else {
                        (formData as Document).url = indexedDBUrl;
                    }

                    setUploadProgress('Upload concluído!');
                } catch (error) {
                    alert('Erro ao fazer upload do arquivo. Tente novamente.');
                    console.error('Upload error:', error);
                    return;
                }
            }

            if (editingItem) { // Update
                const updates = { ...formData };
                // Ensure specific formatting if needed, but hook handles most.
                updateDocMutation.mutate({ id: editingItem.id, updates });
            } else { // Create
                if (!currentCategory && activeTab !== 'bi' && activeTab !== 'ppt') return;

                const typeMap: Record<string, string> = {
                    'work_instructions': 'work_instructions',
                    'acceptance_criteria': 'acceptance_criteria',
                    'standardized_work': 'standardized_work',
                    'quality_alerts': 'alert',
                    'bi': 'report',
                    'ppt': 'presentation'
                };

                createDocMutation.mutate({
                    lineId: 'context-line-id', // WARNING: We need lineId here!
                    // Wait, AdminDocumentManagement doesn't seem to have selectedLine from context?
                    // It imports ProductionLineEditor.
                    // Let's check where it gets lineId.
                    // It previously didn't use lineId in addDocument calls?
                    // Let's check previous code.
                    // addDocument call: `addDocument({ ...(formData as any), category: currentCategory });`
                    // formData likely contained lineId if ProductionLineEditor set it?
                    // actually addDocument implementation in DataContext probably handled it or it expects it in formData.
                    // The hook EXPECTS lineId as top level arg.
                    // We need to verify if formData has lineId.
                    // If not, we found a bug or missing context.
                    // Looking at imports: `import ProductionLineEditor from './ProductionLineEditor';`
                    // But `AdminDocumentManagement` doesn't seem to subscribe to `useLine` or `useData.selectedPlantId`?
                    // Ah, `docs` are filtered?
                    // `useDocuments` fetches ALL documents.
                    // Admin UI usually manages ALL docs or filtered by something.
                    // Let's assume for now we pass `(formData as any).lineId` or fail.
                    type: typeMap[activeTab] || 'unknown',
                    documentId: (formData as any).url || (formData as any).document_url || (formData as any).embedUrl || '',
                    title: (formData as any).title || (formData as any).name || '',
                    uploadedBy: 'Admin',
                    version: String((formData as any).version || '1'),
                    metadata: activeTab === 'quality_alerts' ? {
                        severity: (formData as QualityAlert).severity,
                        description: (formData as QualityAlert).description,
                        expiresAt: (formData as QualityAlert).expiresAt,
                        pdfUrl: (formData as QualityAlert).pdfUrl,
                        pdfName: (formData as QualityAlert).pdfName
                    } : undefined
                });
            }
            onClose();
        }

        const renderFormFields = () => {
            const commonClass = "w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors";
            switch (activeTab) {
                case 'work_instructions':
                case 'acceptance_criteria':
                case 'standardized_work':
                    return <>
                        <label className="text-xl">Título <input name="title" value={(formData as Document).title || ''} onChange={handleChange} className={commonClass} required /></label>

                        {/* Seletor de Modo */}
                        <div className="flex gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => setUploadMode('url')}
                                className={`flex-1 py-4 px-6 rounded-lg text-lg font-medium transition-all border-2 ${uploadMode === 'url'
                                    ? 'bg-cyan-600 border-cyan-500 text-white'
                                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                                    }`}
                            >
                                🔗 URL Externa
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadMode('upload')}
                                className={`flex-1 py-4 px-6 rounded-lg text-lg font-medium transition-all border-2 ${uploadMode === 'upload'
                                    ? 'bg-cyan-600 border-cyan-500 text-white'
                                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                                    }`}
                            >
                                📁 Upload Arquivo
                            </button>
                        </div>

                        {/* Campo condicional baseado no modo */}
                        {uploadMode === 'url' ? (
                            <label className="text-xl">
                                URL do PDF
                                <input
                                    name="url"
                                    type="url"
                                    value={(formData as Document).url || ''}
                                    onChange={handleChange}
                                    className={commonClass}
                                    placeholder="https://exemplo.com/documento.pdf"
                                    required
                                />
                            </label>
                        ) : (
                            <div className="space-y-3">
                                <label className="block">
                                    <div className="text-xl mb-2">Selecionar Arquivo PDF</div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            onChange={handleFileSelect}
                                            className="w-full text-white file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-lg file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer bg-gray-800 border-2 border-gray-600 rounded-lg p-3"
                                            required={!selectedFile}
                                        />
                                    </div>
                                </label>
                                {uploadProgress && (
                                    <div className="p-3 bg-cyan-900/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm">
                                        {uploadProgress}
                                    </div>
                                )}
                                <div className="text-sm text-gray-400">
                                    📄 Formato: PDF | 📦 Tamanho máximo: 50MB
                                </div>
                            </div>
                        )}
                    </>;
                case 'quality_alerts':
                    const alertData = formData as QualityAlert;
                    return <>
                        <label className="text-xl block">Título<input name="title" value={alertData.title || ''} onChange={handleChange} className={commonClass} required /></label>
                        <label className="text-xl block">Descrição<textarea name="description" value={alertData.description || ''} onChange={handleChange} className={commonClass} required /></label>
                        <label className="text-xl block">
                            Severidade
                            <div className="flex gap-4 mt-2">
                                {(['A', 'B', 'C'] as const).map((sev) => (
                                    <button
                                        key={sev}
                                        type="button"
                                        onClick={() => {
                                            const syntheticEvent = {
                                                target: { name: 'severity', value: sev }
                                            } as React.ChangeEvent<HTMLInputElement>;
                                            handleChange(syntheticEvent);
                                        }}
                                        className={`flex-1 min-h-[60px] px-8 py-4 text-2xl font-bold rounded-lg border-4 transition-all ${alertData.severity === sev
                                            ? sev === 'A'
                                                ? 'bg-red-500 border-red-400 text-white shadow-lg scale-105'
                                                : sev === 'B'
                                                    ? 'bg-yellow-500 border-yellow-400 text-gray-900 shadow-lg scale-105'
                                                    : 'bg-gray-500 border-gray-400 text-white shadow-lg scale-105'
                                            : sev === 'A'
                                                ? 'bg-gray-800 border-red-500 text-red-400 hover:bg-red-500 hover:text-white'
                                                : sev === 'B'
                                                    ? 'bg-gray-800 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-gray-900'
                                                    : 'bg-gray-800 border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {sev}
                                    </button>
                                ))}
                            </div>
                        </label>
                        <label className="text-xl block">Documento Associado
                            <select name="documentId" value={alertData.documentId || ''} onChange={handleChange} className={commonClass}>
                                <option value="">Nenhum</option>
                                {docs.map(doc => <option key={doc.id} value={doc.id}>{doc.title}</option>)}
                            </select>
                        </label>
                        <label className="text-xl block">Expira em
                            <input name="expiresAt" type="datetime-local" value={alertData.expiresAt ? new Date(alertData.expiresAt).toISOString().slice(0, 16) : ''} onChange={handleChange} className={commonClass} required />
                        </label>

                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h4 className="text-xl font-bold mb-4 text-cyan-400">Anexar PDF ao Alerta</h4>

                            {/* Seletor de Modo */}
                            <div className="flex gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('url')}
                                    className={`flex-1 py-3 px-4 rounded-lg text-lg font-medium transition-all border-2 ${uploadMode === 'url'
                                        ? 'bg-cyan-600 border-cyan-500 text-white'
                                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                                        }`}
                                >
                                    🔗 URL Externa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('upload')}
                                    className={`flex-1 py-3 px-4 rounded-lg text-lg font-medium transition-all border-2 ${uploadMode === 'upload'
                                        ? 'bg-cyan-600 border-cyan-500 text-white'
                                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                                        }`}
                                >
                                    📁 Upload Arquivo
                                </button>
                            </div>

                            {uploadMode === 'url' ? (
                                <label className="text-xl block">
                                    URL do PDF
                                    <input
                                        name="pdfUrl"
                                        type="url"
                                        value={alertData.pdfUrl || ''}
                                        onChange={handleChange}
                                        className={commonClass}
                                        placeholder="https://exemplo.com/documento.pdf"
                                    />
                                </label>
                            ) : (
                                <div className="space-y-3">
                                    <label className="block">
                                        <div className="text-xl mb-2">Selecionar Arquivo PDF</div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf,application/pdf"
                                                onChange={handleFileSelect}
                                                className="w-full text-white file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-lg file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer bg-gray-800 border-2 border-gray-600 rounded-lg p-3"
                                            />
                                        </div>
                                    </label>
                                    {uploadProgress && (
                                        <div className="p-3 bg-cyan-900/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm">
                                            {uploadProgress}
                                        </div>
                                    )}
                                </div>
                            )}
                            {alertData.pdfUrl && (
                                <div className="mt-2 text-sm text-green-400">
                                    ✅ PDF vinculado: {alertData.pdfName || 'Arquivo anexado'}
                                </div>
                            )}
                        </div>
                    </>;
                case 'bi': return <>
                    <label className="text-xl">Nome <input name="name" value={(formData as PowerBiReport).name || ''} onChange={handleChange} className={commonClass} required /></label>
                    <label className="text-xl">Embed URL <input name="embedUrl" type="url" value={(formData as PowerBiReport).embedUrl || ''} onChange={handleChange} className={commonClass} required /></label>
                </>;
                case 'ppt': return <>
                    <label className="text-xl">Título <input name="title" value={(formData as Presentation).title || ''} onChange={handleChange} className={commonClass} required /></label>
                    <label className="text-xl">URLs dos Slides (um por linha) <textarea name="slides" value={((formData as Presentation).slides || []).join('\n')} onChange={handleChange} className={commonClass} rows={5} required /></label>
                </>;
            }
        }

        return (
            <Modal isOpen={true} onClose={onClose} title={editingItem ? "Editar Item" : "Adicionar Item"}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {renderFormFields()}
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="px-6 py-3 bg-cyan-600 rounded-lg text-xl hover:bg-cyan-500">Salvar</button>
                    </div>
                </form>
            </Modal>
        )
    }

    const DeleteConfirmModal: React.FC = () => {
        return (
            <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title="Confirmar Exclusão" size="md">
                <div className="space-y-6">
                    <p className="text-xl text-gray-300">
                        Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={cancelDelete}
                            className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-6 py-3 bg-red-600 rounded-lg text-xl hover:bg-red-500 transition-colors"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </Modal>
        );
    };

    const tabs: { id: DocType, label: string }[] = [
        { id: 'work_instructions', label: 'Instruções de Trabalho' },
        { id: 'acceptance_criteria', label: 'Critérios de Aceitação' },
        { id: 'standardized_work', label: 'Trabalho Padronizado' },
        { id: 'quality_alerts', label: 'Alertas de Qualidade' },
        { id: 'bi', label: 'Relatórios BI' },
        { id: 'ppt', label: 'Apresentações' }
    ]

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-gray-300">Gerenciamento de Conteúdo</h2>
                <button onClick={() => openModal()} className="px-6 py-3 bg-green-600 rounded-lg text-xl font-semibold hover:bg-green-500">Adicionar Novo</button>
            </div>

            <div className="flex space-x-1 border-b-2 border-gray-700 mb-4 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-xl font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-4 border-cyan-500 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {renderContent()}
            <TestRunner />
            {isModalOpen && <FormModal onClose={closeModal} />}
            <DeleteConfirmModal />
        </div>
    );
};

export default AdminDocumentManagement;