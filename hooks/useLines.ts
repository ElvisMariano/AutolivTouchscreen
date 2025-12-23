import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getLines,
    createLine as createLineApi,
    updateLine as updateLineApi,
    deleteLine as deleteLineApi
} from '../src/services/api/lines';
import { CreateLineDTO, ProductionLine as ApiProductionLine } from '../src/services/api/lines';
// Import ProductionLine from types because it matches the app usage (with machines [])
import { ProductionLine as AppProductionLine } from '../types';

export const useLines = (plantIds: string[]) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['lines', plantIds],
        queryFn: async () => {
            if (plantIds.length === 0) return [];

            // Parallel fetch for selected plants
            const promises = plantIds.map(id => getLines(id));
            const outcomes = await Promise.all(promises);
            const flatLines = outcomes.flat();

            // Map to AppProductionLine
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
            if (!plantId) throw new Error("Plant ID required");
            return await createLineApi({ name, plant_id: plantId, external_id: description }); // Mapping description to external_id? Or logic was description? 
            // Previous logic passed description. Api CreateLineDTO has external_id. 
            // Actually AdminLineManagement input says "ID Externo". Description is separate?
            // Let's check api/lines.ts. CreateLineDTO: { name, plant_id, external_id }.
            // Old service signature: createLine(name, description, userId, plantId, externalId)
            // useLines passed: name, description, createdBy, plantId.
            // Wait, look at AdminLineManagement createLine call: createLine(lineName, lineDescription, currentUser.id, selectedPlantId, externalId || undefined);
            // useLines wrapper def: mutationFn: async ({ name, description, createdBy, plantId })
            // It seems useLines internal definition was slightly different from component usage? 
            // AdminLineManagement imports createLine FROM service directly?
            // Step 186: `import { createLine... } from '../services/lineService';`
            // So AdminLineManagement uses SERVICE directly, NOT the hook.
            // The hook useLines seems unused for CREATION in AdminLineManagement?
            // AdminLineManagement uses useLine() CONTEXT for listing? No, it uses `useLine` context `lines`.
            // BUT it imports mutation functions from service directly.

            // I need to update AdminLineManagement to use API functions directly or use the hook properly.
            // Updating AdminLineManagement to use API directly is easier for now to match current pattern.
            // But useLines HOOK is likely used by DataContext or others.

            // I will update useLines hook to match better.
            // Assuming description was misused or needs to be dropped if API doesn't support it?
            // API ProductionLine has no description field?
            // Step 183: ProductionLine interface: id, name, plant_id, status, external_id, created_at, updated_at, plant_name. NO DESCRIPTION.
            // So description is lost in new API?
            // AdminLineManagement `getLineDescription` logic tries to parse JSON in name.
            // If new API doesn't support description, I must accept loss or use name JSON hack.
            // Or implementation plan said "Remove Supabase".

            return await createLineApi({ name, plant_id: plantId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lines'] });
        },
    });

    const updateLine = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<ApiProductionLine> }) => {
            // Mapping updates
            return await updateLineApi(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lines'] });
        },
    });

    const deleteLine = useMutation({
        mutationFn: async (id: string) => {
            return await deleteLineApi(id);
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
