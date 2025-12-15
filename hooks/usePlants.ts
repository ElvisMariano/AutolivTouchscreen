import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllPlants,
    getPlantsByUser,
    createPlant as createPlantService,
    updatePlant as updatePlantService,
    deletePlant as deletePlantService
} from '../services/plantService';
import { Plant } from '../types';

export const usePlants = (isAdmin: boolean, userId?: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['plants', isAdmin, userId],
        queryFn: async () => {
            if (isAdmin) {
                return await getAllPlants();
            } else if (userId) {
                return await getPlantsByUser(userId);
            }
            return [];
        },
        enabled: isAdmin || !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const createPlant = useMutation({
        mutationFn: async ({ name, location }: { name: string; location: string }) => {
            if (!userId && !isAdmin) throw new Error('User not authenticated');
            // If admin creates, we might need a userId to associate? Service signature: createPlant(name, location, createdBy)
            // Assuming current user is creator
            return await createPlantService(name, location, userId || 'admin');
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
