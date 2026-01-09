import React, { createContext, useContext, ReactNode } from 'react';
import { useShiftLogic } from '../hooks/useShiftLogic';
// import { useData } from './DataContext';
// Actually DataContext had selectedPlantId. But useShiftLogic uses "selectedPlant". 
// We should check where selectedPlant comes from.
// In DataContext it came from `plants.find(p => p.id === selectedPlantId)`.
// We need to decide if ShiftContext manages "Selected Plant" or if we use DataContext for that still.
// Plan said: "Remover useShiftLogic e estados de turno [de DataContext]".
// So ShiftContext needs access to selectedPlant.
// Ideally ShiftContext shouldn't depend on DataContext to avoid circular dep if DataContext depends on ShiftContext (it shouldn't).
// But DataContext consumers might need shift.
// Let's import useData for now to get selectedPlantId, or better:
// Use `Custom Hooks` approach: ShiftContext just provides the logic.
// But wait, `useShiftLogic` depends on `selectedPlant`.
// If `DataContext` holds `selectedPlantId` and `plants`, then `ShiftContext` needs those.
// If I use `useData` inside `ShiftContext`, and `DataContext` is invalid/refactored, it might be risky.
// However, `selectedPlantId` logic is simple.
// Let's see `DataContext`: `const [selectedPlantId, setSelectedPlantId] = useLocalStorage<string>('selectedPlantId', '');`
// We should probably move `selectedPlantId` to `ShiftContext` OR `SettingsContext` OR keeping it in `DataContext` but exposing it.
// Refactoring `DataContext`: "Remover fetching...". So `plants` might disappear from DataContext if we strictly use hooks?
// "Remove fetching de usePlants". Yes.
// So `ShiftContext` needs to fetch plants OR use `usePlants` itself.

// Let's make ShiftContext self-sufficient for what it needs.
import { useData } from './DataContext';
// import { usePlants } from '../hooks/usePlants';
// import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plant } from '../types';

interface ShiftContextType {
    currentShift: string;
    activeShifts: string[];
    setCurrentShift: (shift: string) => void;
    // We might want to expose selectedPlant here if it's strictly related to shift, OR keep it in a "PlantContext" or similar.
    // For now, let's keep it minimal. But useShiftLogic NEEDS a plant.
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // We consume selectedPlantId from DataContext to ensure sync with PlantSelector
    const { selectedPlantId, plants } = useData();

    // Find the plant object from the provided list (which useData has) or fetch if strictly needed?
    // useData already exposes plants.
    const selectedPlant = plants.find(p => p.id === selectedPlantId);

    const { currentShift, setCurrentShift, activeShifts } = useShiftLogic(selectedPlant);

    return (
        <ShiftContext.Provider value={{
            currentShift,
            activeShifts,
            setCurrentShift
        }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShift = () => {
    const context = useContext(ShiftContext);
    if (context === undefined) {
        throw new Error('useShift must be used within a ShiftProvider');
    }
    return context;
};
