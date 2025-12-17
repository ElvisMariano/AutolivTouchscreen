import { renderHook } from '@testing-library/react';
import { useShiftLogic } from '../../../hooks/useShiftLogic';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Plant } from '../../../types';

// Mock useSettings
vi.mock('../../../contexts/SettingsContext', () => ({
    useSettings: () => ({
        settings: { shiftCheckInterval: 60 }
    })
}));

const mockPlant: Plant = {
    id: '1',
    name: 'Plant A',
    location: 'Loc',
    status: 'active',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    shift_config: [
        { name: '1º Turno', startTime: '06:00', endTime: '14:00', isActive: true },
        { name: '2º Turno', startTime: '14:00', endTime: '22:00', isActive: true },
        { name: '3º Turno', startTime: '22:00', endTime: '06:00', isActive: true },
    ]
};

describe('useShiftLogic', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return correct shift for a specific time (Shift 1 morning)', () => {
        // Mock time to 07:00 AM
        const date = new Date(2023, 1, 1, 7, 0, 0);
        vi.setSystemTime(date);

        const { result } = renderHook(() => useShiftLogic(mockPlant));
        // Considerando Shift 1: 06:00 - 14:00
        expect(result.current.currentShift).toBe('1º Turno');
    });

    it('should return correct shift for a specific time (Shift 2 afternoon)', () => {
        // Mock time to 15:00 PM
        const date = new Date(2023, 1, 1, 15, 0, 0);
        vi.setSystemTime(date);

        const { result } = renderHook(() => useShiftLogic(mockPlant));
        // Considerando Shift 2: 14:00 - 22:00
        expect(result.current.currentShift).toBe('2º Turno');
    });

    it('should return correct shift for a specific time (Shift 3 night)', () => {
        // Mock time to 23:00 PM
        const date = new Date(2023, 1, 1, 23, 0, 0);
        vi.setSystemTime(date);

        const { result } = renderHook(() => useShiftLogic(mockPlant));
        // Considerando Shift 3: 22:00 - 06:00
        expect(result.current.currentShift).toBe('3º Turno');
    });
});
