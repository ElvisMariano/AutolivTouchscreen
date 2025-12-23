import React, { useEffect, useState } from 'react';
import { useLine } from '../../contexts/LineContext';
import { useI18n } from '../../contexts/I18nContext';
import { getStations as getStationsByLine, WorkStation } from '../../src/services/api/stations';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface StationSelectorProps {
    selectedStation: WorkStation | null;
    onStationChange: (station: WorkStation | null) => void;
}

const StationSelector: React.FC<StationSelectorProps> = ({ selectedStation, onStationChange }) => {
    const { selectedLine } = useLine();
    const { t } = useI18n();
    const [stations, setStations] = useState<WorkStation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadStations = async () => {
            if (!selectedLine) {
                setStations([]);
                onStationChange(null);
                return;
            }

            setIsLoading(true);
            try {
                const stationsData = await getStationsByLine(selectedLine.id);
                setStations(stationsData);

                // Se havia uma estação selecionada, verificar se ainda existe
                if (selectedStation) {
                    const stillExists = stationsData.find(s => s.id === selectedStation.id);
                    if (!stillExists) {
                        onStationChange(null);
                    }
                }
            } catch (error) {
                console.error('Error loading stations:', error);
                setStations([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadStations();
    }, [selectedLine]);

    if (!selectedLine) {
        return (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ Por favor, selecione uma linha de produção primeiro
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Carregando estações...</p>
            </div>
        );
    }

    if (stations.length === 0) {
        return (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ Esta linha não possui estações cadastradas. Cadastre estações na área de Gestão de Linhas.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.selectStation')} *
            </label>
            <div className="relative">
                <select
                    value={selectedStation?.id || ''}
                    onChange={(e) => {
                        const station = stations.find(s => s.id === e.target.value);
                        onStationChange(station || null);
                    }}
                    className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-green-500 dark:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer transition-all"
                    required
                >
                    <option value="">{t('admin.selectStationPlaceholder')}</option>
                    {stations
                        .sort((a, b) => (a.station_number || 0) - (b.station_number || 0))
                        .map(station => (
                            <option key={station.id} value={station.id}>
                                {station.station_number}. {station.name}
                            </option>
                        ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 dark:text-green-400 pointer-events-none" />
            </div>
            {selectedStation && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="text-sm text-green-700 dark:text-green-300">
                        ✓ Estação selecionada:
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedStation.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">#{selectedStation.station_number}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StationSelector;
