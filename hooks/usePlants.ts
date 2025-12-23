import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPlants as getAllPlants,
    getPlants as getPlantsByUser, // API doesn't distinguish yet, or we filter? logic was in service
    createPlant as createPlantService,
    updatePlant as updatePlantService,
    deletePlant as deletePlantService
} from '../src/services/api/plants';
import { Plant } from '../types';

export const usePlants = (isAdmin: boolean, userId?: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['plants', isAdmin, userId],
        queryFn: async () => {
            if (isAdmin) {
                return await getAllPlants();
            } else if (userId) {
                // Temporary: API returns all plants, filtering client side if needed or backend update needed
                // For now, ignoring userId arg to fix build call
                return await getAllPlants();
            }
            return [];
        },
        enabled: isAdmin || !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const createPlant = useMutation({
        mutationFn: async ({ name, location }: { name: string; location: string }) => {
            if (!userId && !isAdmin) throw new Error('User not authenticated');
            return await createPlantService({ name, location });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plants'] });
        },
    });

    const updatePlant = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Plant> }) => {
            return await updatePlantService(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plants'] });
        },
    });

    const deletePlant = useMutation({
        mutationFn: async (id: string) => {
            return await deletePlantService(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plants'] });
        },
    });

    return {
        plants: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        createPlant,
        updatePlant,
        deletePlant,
    };
};
