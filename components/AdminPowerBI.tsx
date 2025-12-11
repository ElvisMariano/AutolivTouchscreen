import React, { useEffect, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { PowerBiReport, Document } from '../types';
import Modal from './common/Modal';
import { PencilSquareIcon, TrashIcon } from './common/Icons';
import { useI18n } from '../contexts/I18nContext';
import { useLine } from '../contexts/LineContext';
import { addLineDocument } from '../services/lineService';
import { useAuth } from '../contexts/AuthContext';

const AdminPowerBI: React.FC = () => {
    const { biReports, addBiReport, updateBiReport, deleteBiReport, addDocument, updateDocument } = useData();
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PowerBiReport | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const openModal = (item: PowerBiReport | null = null) => {
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
            deleteBiReport(itemToDelete);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    }

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    }

    const BiList: React.FC = () => {
        const [visibleCount, setVisibleCount] = useState(20);
        const [isLoading, setIsLoading] = useState(false);
        const sentinelRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => { setVisibleCount(20); }, [biReports.length]);

        const loadMore = async () => {
            if (isLoading) return;
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 150));
            setVisibleCount(v => Math.min(v + 20, biReports.length));
            setIsLoading(false);
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

        return (
            <div className="overflow-x-auto mt-6">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">{t('common.name')}</th>
                            <th className="p-4">Embed URL</th>
                            <th className="p-4 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {biReports.slice(0, visibleCount).map(item => (
                            <tr key={item.id} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium">{item.name}</td>
                                <td className="p-4 truncate max-w-xs text-gray-600 dark:text-gray-300">{item.embedUrl}</td>
                                <td className="p-4 flex justify-end space-x-3">
                                    <button onClick={() => openModal(item)} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                                        <PencilSquareIcon className="h-6 w-6" />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('common.delete')}>
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
        );
    };

    const FormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        const { selectedLine } = useLine();
        const { currentUser } = useAuth();
        const [formData, setFormData] = useState<Partial<Document>>(editingItem || {});

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
            if (editingItem) {
                updateDocument(formData as Document);
            } else {
                addDocument({ ...(formData as any), category: `PowerBI` });

                if (currentUser && formData.embedUrl && formData.name) { // Changed formData.url to formData.embedUrl and formData.title to formData.name
                    try {
                        await addLineDocument(
                            selectedLine.id,
                            'report',
                            formData.embedUrl, // Changed formData.url to formData.embedUrl
                            formData.name, // Changed formData.title to formData.name
                            currentUser.id,
                            formData.version,
                            { line_name: selectedLine.name }
                        );
                        console.log('Relatório vinculado à linha');
                    } catch (error) {
                        console.error('Erro ao vincular:', error);
                    }
                }
            }
            onClose();
        }

        const commonClass = "w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors";

        return (
            <Modal isOpen={true} onClose={onClose} title={editingItem ? t('admin.editReport') : t('admin.addReport')}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {!selectedLine && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                ⚠️ Selecione uma linha no seletor acima.
                            </p>
                        </div>
                    )}
                    <label className="text-xl block text-gray-900 dark:text-white">{t('common.name')} <input name="name" value={formData.name || ''} onChange={handleChange} className={commonClass} required /></label>
                    <label className="text-xl block text-gray-900 dark:text-white">Embed URL <input name="embedUrl" type="url" value={formData.embedUrl || ''} onChange={handleChange} className={commonClass} required /></label>

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
                <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{t('admin.powerBiReports')}</h2>
                <button onClick={() => openModal()} className="px-6 py-3 bg-cyan-600 rounded-lg text-xl font-bold text-white hover:bg-cyan-500 shadow-lg transition-transform transform hover:scale-105">
                    + {t('admin.newReport')}
                </button>
            </div>

            <BiList />

            {isModalOpen && <FormModal onClose={closeModal} />}

            <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title={t('admin.confirmDelete')}>
                <div className="space-y-6">
                    <p className="text-xl text-gray-800 dark:text-gray-300">{t('admin.deleteReportConfirm')}</p>
                    <div className="flex justify-end space-x-4">
                        <button onClick={cancelDelete} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
                        <button onClick={confirmDelete} className="px-6 py-3 bg-red-600 rounded-lg text-xl hover:bg-red-500 text-white">{t('common.delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPowerBI;
