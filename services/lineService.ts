import { supabase } from './supabaseClient';

export interface ProductionLine {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'inactive';
    created_at: string;
    created_by?: string;
    updated_at: string;
}

export interface CreateLineData {
    name: string;
    description?: string;
}

/**
 * Obter todas as linhas de produção
 */
export async function getAllLines(): Promise<ProductionLine[]> {
    const { data, error } = await supabase
        .from('production_lines')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching lines:', error);
        throw error;
    }

    return data || [];
}

/**
 * Obter apenas linhas ativas
 */
export async function getActiveLines(): Promise<ProductionLine[]> {
    const { data, error } = await supabase
        .from('production_lines')
        .select('*')
        .eq('status', 'active')
        .order('name');

    if (error) {
        console.error('Error fetching active lines:', error);
        throw error;
    }

    return data || [];
}

/**
 * Criar nova linha de produção (apenas admin)
 */
export async function createLine(lineData: CreateLineData, userId: string): Promise<ProductionLine | null> {
    const { data, error } = await supabase
        .from('production_lines')
        .insert({
            name: lineData.name,
            description: lineData.description,
            created_by: userId
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating line:', error);
        throw error;
    }

    return data;
}

/**
 * Atualizar linha de produção
 */
export async function updateLine(lineId: string, updates: Partial<CreateLineData>): Promise<ProductionLine | null> {
    const { data, error } = await supabase
        .from('production_lines')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', lineId)
        .select()
        .single();

    if (error) {
        console.error('Error updating line:', error);
        throw error;
    }

    return data;
}

/**
 * Marcar linha como inativa
 */
export async function deleteLine(lineId: string): Promise<boolean> {
    const { error } = await supabase
        .from('production_lines')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', lineId);

    if (error) {
        console.error('Error deleting line:', error);
        throw error;
    }

    return true;
}

/**
 * Obter linha por ID
 */
export async function getLineById(lineId: string): Promise<ProductionLine | null> {
    const { data, error } = await supabase
        .from('production_lines')
        .select('*')
        .eq('id', lineId)
        .single();

    if (error) {
        console.error('Error fetching line:', error);
        return null;
    }

    return data;
}
