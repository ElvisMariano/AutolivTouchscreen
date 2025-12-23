import React, { useMemo, useState } from 'react';
import { useLine } from '../contexts/LineContext';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { createLine, updateLine, deleteLine, getLines as getAllLines } from '@/services/api/lines';
import { getStations as getStationsByLine, createStation, deleteStation, updateStation, WorkStation } from '@/services/api/stations';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useData } from '../contexts/DataContext';

const getLineName = (name: string) => {
    try {
        if (name.startsWith('{')) {
            const parsed = JSON.parse(name);
            return parsed.name || name;
        }
    } catch {
        return name;
    }
    return name;
};

const getLineDescription = (line: { name: string; description?: string }) => {
    // Tenta recuperar descrição do JSON no nome (bug anterior)
    try {
        if (line.name.startsWith('{')) {
            const parsed = JSON.parse(line.name);
            if (parsed.description) return parsed.description;
        }
    } catch {
        // Ignora erro de parse
    }

    // Valida descrição normal
    if (!line.description) return null;

    // Filtra se for UUID (bug anterior onde ID do usuário foi salvo como descrição)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(line.description)) {
        return null;
    }

    return line.description;
};

const AdminLineManagement: React.FC = () => {
    const { lines, refreshLines } = useLine();
    const { currentUser } = useAuth();
    const { t } = useI18n();
    const { selectedPlantId } = useData();

    const [isCreatingLine, setIsCreatingLine] = useState(false);
    const [editingLine, setEditingLine] = useState<string | null>(null);
    const [selectedLineForStations, setSelectedLineForStations] = useState<string | null>(null);
    const [stations, setStations] = useState<WorkStation[]>([]);
    const [isLoadingStations, setIsLoadingStations] = useState(false);
    const [editingStationId, setEditingStationId] = useState<string | null>(null);

    // Form states
    const [lineName, setLineName] = useState('');
    const [lineDescription, setLineDescription] = useState('');
    const [externalId, setExternalId] = useState('');
    const [stationName, setStationName] = useState('');
    const [stationDescription, setStationDescription] = useState('');

    const filteredLines = useMemo(() => {
        if (!selectedPlantId) return lines;
        return lines.filter(l => l.plant_id === selectedPlantId);
    }, [lines, selectedPlantId]);

    const handleUpdateLine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLine || !lineName.trim()) return;

        try {
            await updateLine(editingLine, {
                name: lineName,
                external_id: externalId || undefined
                // description not supported in new API
            });
            await refreshLines();
            setEditingLine(null);
            setLineName('');
            setLineDescription('');
            setExternalId('');
        } catch (error) {
            console.error('Error updating line:', error);
            alert('Erro ao atualizar linha');
        }
    };

    const startEditing = (line: any) => {
        setEditingLine(line.id);
        setLineName(getLineName(line.name));
        setLineDescription(getLineDescription(line) || '');
        setExternalId(line.external_id || '');
        setIsCreatingLine(false);
    };

    const cancelEditing = () => {
        setEditingLine(null);
        setLineName('');
        setLineDescription('');
        setExternalId('');
    };

    const handleCreateLine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !lineName.trim()) return;
        if (!selectedPlantId) {
            alert('Selecione uma planta antes de criar a linha.');
            return;
        }

        try {
            await createLine({
                name: lineName,
                plant_id: selectedPlantId,
                external_id: externalId || undefined
            });
            await refreshLines();
            setLineName('');
            setLineDescription('');
            setExternalId('');
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
            if (editingStationId) {
                // Update existing station
                await updateStation(editingStationId, {
                    line_id: selectedLineForStations,
                    name: stationName,
                    station_number: stations.find(s => s.id === editingStationId)?.station_number || stations.length + 1,
                    // description not supported
                });
                setEditingStationId(null);
            } else {
                // Create new station
                const nextPosition = stations.length + 1;
                await createStation({
                    line_id: selectedLineForStations,
                    name: stationName,
                    station_number: nextPosition,
                    // description not supported
                });
            }

            await loadStations(selectedLineForStations);
            setStationName('');
            setStationDescription('');
        } catch (error) {
            console.error('Error saving station:', error);
            alert('Erro ao salvar estação');
        }
    };

    const startEditingStation = (station: WorkStation) => {
        setEditingStationId(station.id);
        setStationName(station.name);
        // setStationDescription(station.description || ''); // Not supported
    };

    const cancelEditingStation = () => {
        setEditingStationId(null);
        setStationName('');
        setStationDescription('');
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

            {/* Criar/Editar Linha */}
            <div className="mb-8">
                {!isCreatingLine && !editingLine ? (
                    <button
                        onClick={() => setIsCreatingLine(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nova Linha
                    </button>
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {editingLine ? 'Editar Linha' : 'Nova Linha'}
                        </h3>
                        <form onSubmit={editingLine ? handleUpdateLine : handleCreateLine} className="space-y-4">
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
                                    ID Externo (Leading2Lean)
                                </label>
                                <input
                                    type="text"
                                    value={externalId}
                                    onChange={(e) => setExternalId(e.target.value)}
                                    placeholder="Ex: 902B01"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                                    {editingLine ? 'Salvar Alterações' : 'Criar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (editingLine) {
                                            cancelEditing();
                                        } else {
                                            setIsCreatingLine(false);
                                            setLineName('');
                                            setLineDescription('');
                                            setExternalId('');
                                        }
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
                {filteredLines.map(line => (
                    <div key={line.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {getLineName(line.name)}
                                    </h3>
                                    {/* <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {line.station_count || 0} estações
                                    </span> */}
                                    {line.external_id && (
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                            ID: {line.external_id}
                                        </span>
                                    )}
                                </div>
                                {getLineDescription(line) ? (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{getLineDescription(line)}</p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic mt-1">Sem descrição</p>
                                )}
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button
                                    onClick={() => startEditing(line)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                    title="Editar Linha"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
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
                                    <div className="flex gap-2">
                                        <button type="submit" className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center">
                                            {editingStationId ? (
                                                <>
                                                    <PencilIcon className="w-4 h-4 mr-1" />
                                                    Salvar Alterações
                                                </>
                                            ) : (
                                                <>
                                                    <PlusIcon className="w-4 h-4 mr-1" />
                                                    Adicionar Estação
                                                </>
                                            )}
                                        </button>
                                        {editingStationId && (
                                            <button
                                                type="button"
                                                onClick={cancelEditingStation}
                                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
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
                                                        {station.station_number}. {station.name}
                                                    </span>
                                                    {/* Description not supported
                                                    {station.description && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                            - {station.description}
                                                        </span>
                                                    )} */}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEditingStation(station)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                        title="Editar Estação"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStation(station.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        title="Excluir Estação"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
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
