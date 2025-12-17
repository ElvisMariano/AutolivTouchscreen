import { useState, useEffect } from 'react';
import { Plant } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export const useShiftLogic = (selectedPlant: Plant | undefined) => {
    const { settings } = useSettings();
    const [currentShift, setCurrentShiftState] = useState<string>('1º Turno');

    const getShiftByTime = (plant: Plant | undefined): string => {
        if (!plant || !plant.shift_config) return '1º Turno';
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const activeShifts = plant.shift_config.filter(s => s.isActive);

        for (const shift of activeShifts) {
            const [startH, startM] = shift.startTime.split(':').map(Number);
            const [endH, endM] = shift.endTime.split(':').map(Number);
            const start = startH * 60 + startM;
            const end = endH * 60 + endM;

            if (end < start) { // Crosses midnight
                if (currentMinutes >= start || currentMinutes < end) return shift.name;
            } else {
                if (currentMinutes >= start && currentMinutes < end) return shift.name;
            }
        }
        return '1º Turno';
    };

    useEffect(() => {
        const updateShift = () => {
            const shift = getShiftByTime(selectedPlant);
            if (shift !== currentShift) {
                console.log(`Auto-switching shift to: ${shift}`);
                setCurrentShiftState(shift);
            }
        };

        updateShift();
        const intervalId = setInterval(updateShift, (settings.shiftCheckInterval || 60) * 1000);
        return () => clearInterval(intervalId);
    }, [selectedPlant, settings.shiftCheckInterval, currentShift]);

    // Derived active shifts
    const activeShifts = selectedPlant?.shift_config?.filter(s => s.isActive).map(s => s.name) || ['1º Turno', '2º Turno', '3º Turno'];

    return {
        currentShift,
        setCurrentShift: setCurrentShiftState, // Expose setter if manual override is needed (though deprecated)
        activeShifts
    };
};
