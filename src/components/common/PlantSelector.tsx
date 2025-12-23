import React from 'react';
import { useData } from '../../contexts/DataContext';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

import { useSettings } from '../../contexts/SettingsContext';

const PlantSelector: React.FC = () => {
    const { plants, selectedPlantId, setSelectedPlantId } = useData();
    const { settings } = useSettings();

    if (!plants || plants.length === 0) {
        return null; // Don't show if no plants available
    }

    const selectedPlant = plants.find(p => p.id === selectedPlantId);

    return (
        <div className={`mb-6 ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                Planta / Unidade
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <select
                    value={selectedPlantId}
                    onChange={(e) => setSelectedPlantId(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm transition-colors duration-200 cursor-pointer
                        ${settings.theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-600'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <option value="" disabled>Selecione uma planta</option>
                    {plants.map((plant) => (
                        <option key={plant.id} value={plant.id}>
                            {plant.name}
                        </option>
                    ))}
                </select>
                {/* Status indicator */}
                <span className={`absolute inset-y-0 right-8 flex items-center pr-2 pointer-events-none`}>
                    <span className={`h-2 w-2 rounded-full ${selectedPlant ? 'bg-green-400' : 'bg-red-400'}`}></span>
                </span>
            </div>
            {selectedPlant && (
                <p className="mt-1 text-xs text-gray-500 truncate pl-1">
                    {selectedPlant.location}
                </p>
            )}
        </div>
    );
};

export default PlantSelector;
