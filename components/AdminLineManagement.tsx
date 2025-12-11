import React, { useState } from 'react';
import { useLine } from '../contexts/LineContext';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { createLine, updateLine, deleteLine, getAllLines } from '../services/lineService';
import { getStationsByLine, createStation, deleteStation, WorkStation } from '../services/stationService';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AdminLineManagement: React.FC = () => {
    const { lines, refreshLines } = useLine();
    const { currentUser } = useAuth();
    const { t } = useI18n();

    const [isCreatingLine, setIsCreatingLine] = useState(false);
    const [editingLine, setEditingLine] = useState<string | null>(null);
    const [selectedLineForStations, setSelectedLineForStations] = useState<string | null>(null);
    const [stations, setStations] = useState<WorkStation[]>([]);
    const [isLoadingStations, setIsLoadingStations] = useState(false);

    // Form states
    const [lineName, setLineName] = useState('');
    const [lineDescription, setLineDescription] = useState('');
    const [stationName, setStationName] = useState('');
    const [stationDescription, setStationDescription] = useState('');

    const handleCreateLine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !lineName.trim()) return;

        try {
            await createLine({ name: lineName, description: lineDescription }, currentUser.id);
            await refreshLines();
            setLineName('');
            setLineDescription('');
            setIsCreatingLine(false);
        } catch (error) {
            console.error('Error creating line:', error);
            alert('Erro ao criar linha');
        }
    };

    const handleDeleteLine = async (lineId: string) => {
        if (!confirm('Tem certeza que deseja desativar esta linha?')) return;

        try {
            await deleteLine(lineId);
            await refreshLines();
        } catch (error) {
            console.error('Error deleting line:', error);
            alert('Erro ao deletar linha');
        }
    };

    const loadStations = async (lineId: string) => {
        setIsLoadingStations(true);
        try {
            const stationsData = await getStationsByLine(lineId);
            setStations(stationsData);
            setSelectedLineForStations(lineId);
        } catch (error) {
            console.error('Error loading stations:', error);
        } finally {
            setIsLoadingStations(false);
        }
    };

    const handleCreateStation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedLineForStations || !stationName.trim()) return;

        try {
            const nextPosition = stations.length + 1;
            await createStation({
                line_id: selectedLineForStations,
                name: stationName,
                position: nextPosition,
                description: stationDescription
            }, currentUser.id);

            await loadStations(selectedLineForStations);
            setStationName('');
            setStationDescription('');
        } catch (error) {
            console.error('Error creating station:', error);
            alert('Erro ao criar estação');
        }
    };

    const handleDeleteStation = async (stationId: string) => {
        if (!confirm('Tem certeza que deseja deletar esta estação?')) return;

        try {
            await deleteStation(stationId);
            if (selectedLineForStations) {
                await loadStations(selectedLineForStations);
            }
        } catch (error) {
            console.error('Error deleting station:', error);
            alert('Erro ao deletar estação');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Gestão de Linhas de Produção
            </h2>

            {/* Criar Nova Linha */}
            <div className="mb-8">
                {!isCreatingLine ? (
                    <button
                        onClick={() => setIsCreatingLine(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nova Linha
                    </button>
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700">
                        <form onSubmit={handleCreateLine} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome da Linha *
                                </label>
                                <input
                                    type="text"
                                    value={lineName}
                                    onChange={(e) => setLineName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descrição
                                </label>
                                <textarea
                                    value={lineDescription}
                                    onChange={(e) => setLineDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    Criar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreatingLine(false);
                                        setLineName('');
                                        setLineDescription('');
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Lista de Linhas */}
            <div className="grid gap-4">
                {lines.map(line => (
                    <div key={line.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{line.name}</h3>
                                {line.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{line.description}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => loadStations(line.id)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    Gerenciar Estações
                                </button>
                                <button
                                    onClick={() => handleDeleteLine(line.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Gestão de Estações */}
                        {selectedLineForStations === line.id && (
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Estações de Trabalho</h4>

                                {/* Adicionar Estação */}
                                <form onSubmit={handleCreateStation} className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <input
                                            type="text"
                                            value={stationName}
                                            onChange={(e) => setStationName(e.target.value)}
                                            placeholder="Nome da estação"
                                            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={stationDescription}
                                            onChange={(e) => setStationDescription(e.target.value)}
                                            placeholder="Descrição (opcional)"
                                            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <button type="submit" className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                                        <PlusIcon className="w-4 h-4 inline mr-1" />
                                        Adicionar Estação
                                    </button>
                                </form>

                                {/* Lista de Estações */}
                                {isLoadingStations ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando...</p>
                                ) : stations.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma estação cadastrada</p>
                                ) : (
                                    <div className="space-y-2">
                                        {stations.map(station => (
                                            <div key={station.id} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                                <div>
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                        {station.position}. {station.name}
                                                    </span>
                                                    {station.description && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                            - {station.description}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteStation(station.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminLineManagement;
