import React, { useState } from 'react';
// import { useData } from '../contexts/DataContext';
import { usePlants } from '../hooks/usePlants';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Plant } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../contexts/SettingsContext';
import Modal from './common/Modal'; // Importando Modal

const AdminPlantManagement: React.FC = () => {
    const { t } = useI18n();
    const { currentUser } = useAuth();
    // Use usePlants directly instead of DataContext wrappers
    const { plants: apiPlants, createPlant, updatePlant, deletePlant } = usePlants(true, currentUser?.id);
    const plants = apiPlants as Plant[]; // Cast if necessary depending on hook typing, or fix hook typing later.

    const { settings } = useSettings();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        location: string;
        external_id: string;
        shift_config: { name: string; startTime: string; endTime: string; isActive: boolean }[];
    }>({
        name: '',
        location: '',
        external_id: '',
        shift_config: [
            { name: '1º Turno', startTime: '06:00', endTime: '14:00', isActive: true },
            { name: '2º Turno', startTime: '14:00', endTime: '22:00', isActive: true },
            { name: '3º Turno', startTime: '22:00', endTime: '06:00', isActive: true },
        ]
    });
    const [error, setError] = useState('');

    // Estado do Modal de Exclusão
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
            external_id: '',
            shift_config: [
                { name: '1º Turno', startTime: '06:00', endTime: '14:00', isActive: true },
                { name: '2º Turno', startTime: '14:00', endTime: '22:00', isActive: true },
                { name: '3º Turno', startTime: '22:00', endTime: '06:00', isActive: true },
            ]
        });
        setIsAdding(false);
        setEditingId(null);
        setError('');
    };

    const handleEdit = (plant: Plant) => {
        setFormData({
            name: plant.name,
            location: plant.location,
            external_id: plant.external_id || '',
            shift_config: plant.shift_config || [
                { name: '1º Turno', startTime: '06:00', endTime: '14:00', isActive: true },
                { name: '2º Turno', startTime: '14:00', endTime: '22:00', isActive: true },
                { name: '3º Turno', startTime: '22:00', endTime: '06:00', isActive: true },
            ]
        });
        setEditingId(plant.id);
        setIsAdding(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError(t('admin.plantName') + ' ' + t('common.required'));
            return;
        }

        try {
            if (isAdding) {
                // Create Plant
                // usePlants createPlant signature: mutateAsync({ name, location }) -> returns Object or throws
                let newPlant: Plant | undefined;
                try {
                    newPlant = await createPlant.mutateAsync({
                        name: formData.name,
                        location: formData.location
                    }) as unknown as Plant;
                } catch (err: any) {
                    setError(t('admin.plantCreatedError', { error: err.message || String(err) }));
                    return;
                }

                if (newPlant) {
                    // Update details
                    try {
                        await updatePlant.mutateAsync({
                            id: newPlant.id,
                            updates: {
                                shift_config: formData.shift_config,
                                external_id: formData.external_id || null
                            }
                        });
                        resetForm();
                    } catch (err: any) {
                        const errorMsg = String(err.message || err);
                        if (errorMsg.includes('duplicate key')) {
                            setError(t('admin.duplicateSiteId'));
                            setEditingId(newPlant.id); // Allow user to fix
                            setIsAdding(false);
                        } else {
                            setError(t('admin.plantCreatedError', { error: errorMsg }));
                        }
                    }
                }
            } else if (editingId) {
                try {
                    await updatePlant.mutateAsync({
                        id: editingId,
                        updates: {
                            ...formData,
                            external_id: formData.external_id || null
                        }
                    });
                    resetForm();
                } catch (err: any) {
                    const errorMsg = String(err.message || err);
                    if (errorMsg.includes('duplicate key') || errorMsg.includes('IX_plants_external_id')) {
                        setError(t('admin.duplicateSiteId'));
                    } else {
                        setError(t('admin.plantUpdateError', { error: errorMsg }));
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            setError('Erro ao salvar dados: ' + (err.message || String(err)));
        }
    };

    const confirmDelete = async () => {
        if (!plantToDelete) return;

        try {
            await deletePlant.mutateAsync(plantToDelete.id);
            // Success is implied if no error thrown
        } catch (err) {
            console.error('Erro ao inativar:', err);
            setError(t('admin.errorInactivatingPlant'));
        } finally {
            setIsDeleteModalOpen(false);
            setPlantToDelete(null);
        }
    };

    const openDeleteModal = (plant: Plant) => {
        setPlantToDelete(plant);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className={`p-6 rounded-lg ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            {/* Header ... */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t('admin.plantManagement')}</h2>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
                    >
                        <PlusIcon className="h-5 w-5" />
                        {t('admin.newPlant')}
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">{isAdding ? t('admin.newPlant') : t('admin.editPlant')}</h3>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin.plantName')}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                                    placeholder={t('admin.plantNamePlaceholder') || "Ex: Planta Taubaté"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin.plantLocation')}</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                                    placeholder={t('admin.plantLocationPlaceholder') || "Ex: Taubaté, SP"}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">{t('admin.siteIdOptional')}</label>
                                <input
                                    type="text"
                                    value={formData.external_id}
                                    onChange={e => setFormData({ ...formData, external_id: e.target.value })}
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                                    placeholder={t('admin.siteIdPlaceholder')}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            {/* ... Turnos ... */}
                            <div className="space-y-3">
                                {formData.shift_config.map((shift, index) => (
                                    <div key={index} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                                        <div className="w-32">
                                            <span className="font-medium">{shift.name}</span>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block">{t('admin.startTime')}</label>
                                            <input
                                                type="time"
                                                value={shift.startTime}
                                                onChange={(e) => {
                                                    const newShifts = [...formData.shift_config];
                                                    newShifts[index].startTime = e.target.value;
                                                    setFormData({ ...formData, shift_config: newShifts });
                                                }}
                                                className="p-1 rounded border dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block">{t('admin.endTime')}</label>
                                            <input
                                                type="time"
                                                value={shift.endTime}
                                                onChange={(e) => {
                                                    const newShifts = [...formData.shift_config];
                                                    newShifts[index].endTime = e.target.value;
                                                    setFormData({ ...formData, shift_config: newShifts });
                                                }}
                                                className="p-1 rounded border dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer ml-auto">
                                            <input
                                                type="checkbox"
                                                checked={shift.isActive}
                                                onChange={(e) => {
                                                    const newShifts = [...formData.shift_config];
                                                    newShifts[index].isActive = e.target.checked;
                                                    setFormData({ ...formData, shift_config: newShifts });
                                                }}
                                            />
                                            <span className="text-sm">{t('admin.active')}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                            >
                                {t('common.save')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plants.map(plant => (
                    <div key={plant.id} className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-semibold text-cyan-600">{plant.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs ${plant.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                    {plant.status === 'active' ? t('admin.active') : t('admin.inactive')}
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{plant.location}</p>
                            {plant.external_id && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Site ID: {plant.external_id}</p>}
                        </div>
                        <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => handleEdit(plant)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                                title={t('common.edit')}
                            >
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            {plant.status === 'active' && (
                                <button
                                    onClick={() => openDeleteModal(plant)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                                    title={t('admin.inactivatePlant')}
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Confirmação de Exclusão */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title={t('admin.inactivatePlant')}
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        {t('admin.confirmInactivatePlant', { name: plantToDelete?.name })}
                        <br />
                        {t('admin.actionCannotBeUndone')}
                    </p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <TrashIcon className="h-4 w-4" />
                            {t('admin.inactivatePlant')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPlantManagement;
