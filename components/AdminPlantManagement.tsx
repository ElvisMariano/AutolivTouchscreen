import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plant } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const AdminPlantManagement: React.FC = () => {
    const { plants, addPlant, updatePlant, deletePlant, settings } = useData();
    const { currentUser } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', location: '' });
    const [error, setError] = useState('');

    const resetForm = () => {
        setFormData({ name: '', location: '' });
        setIsAdding(false);
        setEditingId(null);
        setError('');
    };

    const handleEdit = (plant: Plant) => {
        setFormData({ name: plant.name, location: plant.location });
        setEditingId(plant.id);
        setIsAdding(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Nome é obrigatório');
            return;
        }

        try {
            if (isAdding) {
                const success = await addPlant(formData.name, formData.location);
                if (success) resetForm();
                else setError('Falha ao criar planta');
            } else if (editingId) {
                const success = await updatePlant(editingId, formData);
                if (success) resetForm();
                else setError('Falha ao atualizar planta');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao salvar dados');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja inativar esta planta?')) {
            await deletePlant(id);
        }
    };

    return (
        <div className={`p-6 rounded-lg ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gerenciamento de Plantas</h2>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Nova Planta
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">{isAdding ? 'Nova Planta' : 'Editar Planta'}</h3>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                                placeholder="Ex: Planta Taubaté"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Localização</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                                placeholder="Ex: Taubaté, SP"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                            >
                                Salvar
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
                                    {plant.status === 'active' ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{plant.location}</p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => handleEdit(plant)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                                title="Editar"
                            >
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            {plant.status === 'active' && (
                                <button
                                    onClick={() => handleDelete(plant.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                                    title="Inativar"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPlantManagement;
