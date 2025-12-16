import { supabase } from './supabaseClient';
import { Plant, User } from '../types';

/**
 * Buscar todas as plantas (para administradores)
 */
export async function getAllPlants(): Promise<Plant[]> {
    const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching all plants:', error);
        return [];
    }

    return data || [];
}

/**
 * Buscar plantas ativas
 * A política RLS filtra automaticamente com base nas permissões do usuário
 */
export async function getActivePlants(): Promise<Plant[]> {
    const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('status', 'active')
        .order('name');

    if (error) {
        console.error('Error fetching active plants:', error);
        return [];
    }

    return data || [];
}

/**
 * Buscar plantas que o usuário tem acesso (uso explícito, embora RLS já trate)
 */
export async function getPlantsByUser(userId: string): Promise<Plant[]> {
    // Busca usuário para pegar os IDs das plantas
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plant_ids')
        .eq('id', userId)
        .single();

    if (userError || !userData || !userData.plant_ids || userData.plant_ids.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('plants')
        .select('*')
        .in('id', userData.plant_ids)
        .eq('status', 'active')
        .order('name');

    if (error) {
        console.error('Error fetching user plants:', error);
        return [];
    }

    return data || [];
}

/**
 * Criar nova planta
 */
export async function createPlant(name: string, location: string, createdBy: string | undefined): Promise<{ success: boolean; data?: Plant; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('plants')
            .insert({
                name,
                location,
                status: 'active',
                created_by: createdBy
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating plant:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Atualizar planta
 */
export async function updatePlant(plantId: string, updates: Partial<Plant>): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('plants')
            .update({
                name: updates.name,
                location: updates.location,
                status: updates.status,
                shift_config: updates.shift_config,
                updated_at: new Date().toISOString()
            })
            .eq('id', plantId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error updating plant:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 'Excluir' planta (soft delete ou marcar como inativa)
 */
export async function deletePlant(plantId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Opção 1: Soft delete (inativar)
        const { error } = await supabase
            .from('plants')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', plantId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting plant:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Atualizar lista de plantas de um usuário
 */
export async function updateUserPlants(userId: string, plantIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('users')
            .update({ plant_ids: plantIds })
            .eq('id', userId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error updating user plants:', error);
        return { success: false, error: error.message };
    }
}
