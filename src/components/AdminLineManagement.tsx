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
    const [showProductionInStandby, setShowProductionInStandby] = useState(true);
    const [productionDuration, setProductionDuration] = useState(15);
    const [presentationDuration, setPresentationDuration] = useState(20);
    const [alertDuration, setAlertDuration] = useState(15);
    const [stationName, setStationName] = useState('');
    const [stationDescription, setStationDescription] = useState('');

    const filteredLines = useMemo(() => {
        if (!selectedPlantId) return lines;
        return lines.filter(l => l.plant_id === selectedPlantId);
    }, [lines, selectedPlantId]);

    const handleUpdateLine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLine || !lineName.trim()) return;

        const currentLine = lines.find(l => l.id === editingLine);

        try {
            await updateLine(editingLine, {
                name: lineName,
                plant_id: currentLine?.plant_id, // Explicitly keep existing plant_id
                external_id: externalId || undefined,
                metadata: {
                    standby_config: {
                        show_production: showProductionInStandby,
                        production_duration: productionDuration,
                        presentation_duration: presentationDuration,
                        alert_duration: alertDuration
                    }
                }
            });
            await refreshLines();
            setEditingLine(null);
            setLineName('');
            setLineDescription('');
            setExternalId('');
            setShowProductionInStandby(true);
        } catch (error) {
            console.error('Error updating line:', error);
            alert(t('admin.errorUpdatingLine'));
        }
    };

    const startEditing = (line: any) => {
        setEditingLine(line.id);
        setLineName(getLineName(line.name));
        setLineDescription(getLineDescription(line) || '');
        setExternalId(line.external_id || '');

        // Load standby config
        if (line.metadata?.standby_config?.show_production !== undefined) {
            setShowProductionInStandby(line.metadata.standby_config.show_production);
        } else {
            setShowProductionInStandby(true); // Default
        }
        setProductionDuration(line.metadata?.standby_config?.production_duration || 15);
        setPresentationDuration(line.metadata?.standby_config?.presentation_duration || 20);
        setAlertDuration(line.metadata?.standby_config?.alert_duration || 15);

        setIsCreatingLine(false);
    };

    const cancelEditing = () => {
        setEditingLine(null);
        setLineName('');
        setLineDescription('');
        setExternalId('');
        setShowProductionInStandby(true);
    };

    const handleCreateLine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !lineName.trim()) return;
        if (!selectedPlantId) {
            alert(t('admin.selectPlantFirst'));
            return;
        }

        try {
            await createLine({
                name: lineName,
                plant_id: selectedPlantId,
                external_id: externalId || undefined,
                metadata: {
                    standby_config: {
                        show_production: showProductionInStandby,
                        production_duration: productionDuration,
                        presentation_duration: presentationDuration,
                        alert_duration: alertDuration
                    }
                }
            });
            await refreshLines();
            setLineName('');
            setLineDescription('');
            setExternalId('');
            setExternalId('');
            setShowProductionInStandby(true);
            setProductionDuration(15);
            setPresentationDuration(20);
            setAlertDuration(15);
            setIsCreatingLine(false);
        } catch (error) {
            console.error('Error creating line:', error);
            alert(t('admin.errorCreatingLine'));
        }
    };

    const handleDeleteLine = async (lineId: string) => {
        if (!confirm(t('admin.deleteLineConfirm'))) return;

        try {
            await deleteLine(lineId);
            await refreshLines();
        } catch (error) {
            console.error('Error deleting line:', error);
            alert(t('admin.errorDeletingLine'));
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
            alert(t('admin.errorSavingStation'));
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
        if (!confirm(t('admin.deleteStationConfirm'))) return;

        try {
            await deleteStation(stationId);
            if (selectedLineForStations) {
                await loadStations(selectedLineForStations);
            }
        } catch (error) {
            console.error('Error deleting station:', error);
            alert(t('admin.errorDeletingStation'));
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t('admin.productionLines')}
            </h2>

            {/* Criar/Editar Linha */}
            <div className="mb-8">
                {!isCreatingLine && !editingLine ? (
                    <button
                        onClick={() => setIsCreatingLine(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        {t('admin.newLine')}
                    </button>
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {editingLine ? t('admin.editLine') : t('admin.newLine')}
                        </h3>
                        <form onSubmit={editingLine ? handleUpdateLine : handleCreateLine} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('admin.lineName')} *
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
                                    {t('admin.externalIdL2L')}
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
                                    {t('common.description')}
                                </label>
                                <textarea
                                    value={lineDescription}
                                    onChange={(e) => setLineDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showProductionInStandby"
                                    checked={showProductionInStandby}
                                    onChange={(e) => setShowProductionInStandby(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label htmlFor="showProductionInStandby" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('admin.showProductionInStandby')}
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('admin.productionDuration')}
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        value={productionDuration}
                                        onChange={(e) => setProductionDuration(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('admin.presentationDuration')}
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        value={presentationDuration}
                                        onChange={(e) => setPresentationDuration(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('admin.alertDuration')}
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        value={alertDuration}
                                        onChange={(e) => setAlertDuration(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    {editingLine ? t('admin.saveChanges') : t('common.create')}
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
                                            setExternalId('');
                                            setShowProductionInStandby(true);
                                            setProductionDuration(15);
                                            setPresentationDuration(20);
                                            setAlertDuration(15);
                                        }
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                    {t('common.cancel')}
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
                                    <p className="text-sm text-gray-400 italic mt-1">{t('common.noDescription') || 'Sem descrição'}</p>
                                )}
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button
                                    onClick={() => startEditing(line)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                    title={t('admin.editLine')}
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => loadStations(line.id)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    {t('admin.manageStations') || 'Gerenciar Estações'}
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
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('admin.workStations') || 'Estações de Trabalho'}</h4>

                                {/* Adicionar Estação */}
                                <form onSubmit={handleCreateStation} className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <input
                                            type="text"
                                            value={stationName}
                                            onChange={(e) => setStationName(e.target.value)}
                                            placeholder={t('admin.stationName') || "Nome da estação"}
                                            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={stationDescription}
                                            onChange={(e) => setStationDescription(e.target.value)}
                                            placeholder={t('common.descriptionOptional') || "Descrição (opcional)"}
                                            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center">
                                            {editingStationId ? (
                                                <>
                                                    <PencilIcon className="w-4 h-4 mr-1" />
                                                    {t('admin.saveChanges')}
                                                </>
                                            ) : (
                                                <>
                                                    <PlusIcon className="w-4 h-4 mr-1" />
                                                    {t('admin.addStation') || 'Adicionar Estação'}
                                                </>
                                            )}
                                        </button>
                                        {editingStationId && (
                                            <button
                                                type="button"
                                                onClick={cancelEditingStation}
                                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        )}
                                    </div>
                                </form>

                                {/* Lista de Estações */}
                                {isLoadingStations ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading') || 'Carregando...'}</p>
                                ) : stations.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.noStationsRegistered') || 'Nenhuma estação cadastrada'}</p>
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
                                                        title={t('admin.editStation') || "Editar Estação"}
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStation(station.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        title={t('common.delete')}
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
