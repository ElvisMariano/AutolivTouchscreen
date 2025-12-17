import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getLinesByPlant,
    createLine as createLineService,
    updateLine as updateLineService,
    deleteLine as deleteLineService
} from '../services/lineService';
import { CreateLineData, ProductionLine } from '../services/lineService';
// Import ProductionLine from types because it matches the app usage (with machines [])
import { ProductionLine as AppProductionLine } from '../types';

export const useLines = (plantIds: string[]) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['lines', plantIds],
        queryFn: async () => {
            // In case no plants selected, return empty? 
            // DataContext fetches for availablePlants. 
            if (plantIds.length === 0) return [];

            const promises = plantIds.map(id => getLinesByPlant(id));
            const outcomes = await Promise.all(promises);
            const flatLines = outcomes.flat();

            // Map to AppProductionLine to ensure 'machines' property exists
            return flatLines.map(l => ({
                ...l,
                machines: []
            })) as AppProductionLine[];
        },
        enabled: plantIds.length > 0,
        staleTime: 1000 * 60 * 5,
    });

    const createLine = useMutation({
        mutationFn: async ({ name, description, createdBy, plantId }: { name: string; description: string; createdBy: string; plantId?: string }) => {
            return await createLineService(name, description, createdBy, plantId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lines'] });
        },
    });

    const updateLine = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateLineData> }) => {
            return await updateLineService(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lines'] });
        },
    });

    const deleteLine = useMutation({
        mutationFn: async (id: string) => {
            return await deleteLineService(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lines'] });
        },
    });

    return {
        lines: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        createLine,
        updateLine,
        deleteLine,
    };
};
