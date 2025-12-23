import * as api from '@/services/api';
import { Plant, User } from '@/types';

/**
 * Buscar todas as plantas (para administradores)
 */
export async function getAllPlants(): Promise<Plant[]> {
    try {
        const data = await api.plants.getPlants();
        return data as unknown as Plant[];
    } catch (error) {
        console.error('Error fetching all plants:', error);
        return [];
    }
}

/**
 * Buscar plantas ativas
 */
export async function getActivePlants(): Promise<Plant[]> {
    try {
        // Backend já filtra por status='active' por padrão
        const data = await api.plants.getPlants();
        return data.filter(p => p.status === 'active') as unknown as Plant[];
    } catch (error) {
        console.error('Error fetching active plants:', error);
        return [];
    }
}

/**
 * Buscar plantas que o usuário tem acesso
 */
export async function getPlantsByUser(userId: string): Promise<Plant[]> {
    try {
        const data = await api.users.getUserPlants(userId);
        return data.filter(p => p.status === 'active') as unknown as Plant[];
    } catch (error) {
        console.error('Error fetching user plants:', error);
        return [];
    }
}

/**
 * Criar nova planta
 */
export async function createPlant(name: string, location: string, createdBy: string | undefined): Promise<{ success: boolean; data?: Plant; error?: string }> {
    try {
        const data = await api.plants.createPlant({
            name,
            location
        });

        return { success: true, data: data as unknown as Plant };
    } catch (error: any) {
        console.error('Error creating plant:', error);
        return { success: false, error: error.message || 'Failed to create plant' };
    }
}

/**
 * Atualizar planta
 */
export async function updatePlant(plantId: string, updates: Partial<Plant>): Promise<{ success: boolean; error?: string }> {
    try {
        await api.plants.updatePlant(plantId, updates);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating plant:', error);
        return { success: false, error: error.message || 'Failed to update plant' };
    }
}

/**
 * 'Excluir' planta (soft delete ou marcar como inativa)
 */
/**
 * 'Excluir' planta (soft delete ou marcar como inativa)
 */
export async function deletePlant(plantId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await api.plants.deletePlant(plantId);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting plant:', error);
        return { success: false, error: error.message || 'Failed to delete plant' };
    }
}

/**
 * Atualizar lista de plantas de um usuário
 */
export async function updateUserPlants(userId: string, plantIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        // Remove todas as associações atuais
        const currentPlants = await api.users.getUserPlants(userId);
        for (const plant of currentPlants) {
            await api.users.removeUserFromPlant(userId, plant.id);
        }

        // Adiciona novas associações
        for (const plantId of plantIds) {
            await api.users.assignUserToPlant(userId, plantId);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error updating user plants:', error);
        return { success: false, error: error.message || 'Failed to update user plants' };
    }
}
