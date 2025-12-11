import { supabase } from './supabaseClient';

export interface WorkStation {
    id: string;
    line_id: string;
    name: string;
    position: number;
    description?: string;
    status: 'active' | 'inactive';
    created_at: string;
    created_by?: string;
}

export interface CreateStationData {
    line_id: string;
    name: string;
    position: number;
    description?: string;
}

export interface StationInstruction {
    id: string;
    station_id: string;
    document_id: string;
    title: string;
    version?: string;
    uploaded_by?: string;
    uploaded_at: string;
    metadata?: any;
    work_stations?: {
        name: string;
    };
}

/**
 * Obter estações de uma linha
 */
export async function getStationsByLine(lineId: string): Promise<WorkStation[]> {
    const { data, error } = await supabase
        .from('work_stations')
        .select('*')
        .eq('line_id', lineId)
        .order('position');

    if (error) {
        console.error('Error fetching stations:', error);
        throw error;
    }

    return data || [];
}

/**
 * Criar nova estação
 */
export async function createStation(stationData: CreateStationData, userId: string): Promise<WorkStation | null> {
    const { data, error } = await supabase
        .from('work_stations')
        .insert({
            ...stationData,
            created_by: userId
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating station:', error);
        throw error;
    }

    return data;
}

/**
 * Atualizar estação
 */
export async function updateStation(stationId: string, updates: Partial<CreateStationData>): Promise<WorkStation | null> {
    const { data, error } = await supabase
        .from('work_stations')
        .update(updates)
        .eq('id', stationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating station:', error);
        throw error;
    }

    return data;
}

/**
 * Deletar estação
 */
export async function deleteStation(stationId: string): Promise<boolean> {
    const { error } = await supabase
        .from('work_stations')
        .delete()
        .eq('id', stationId);

    if (error) {
        console.error('Error deleting station:', error);
        throw error;
    }

    return true;
}

/**
 * Reordenar estações
 */
export async function reorderStations(stations: { id: string; position: number }[]): Promise<boolean> {
    try {
        for (const station of stations) {
            await supabase
                .from('work_stations')
                .update({ position: station.position })
                .eq('id', station.id);
        }
        return true;
    } catch (error) {
        console.error('Error reordering stations:', error);
        throw error;
    }
}

/**
 * Obter instruções de uma estação
 */
export async function getStationInstructions(stationId: string): Promise<StationInstruction[]> {
    const { data, error } = await supabase
        .from('station_instructions')
        .select('*')
        .eq('station_id', stationId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error('Error fetching instructions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Adicionar instrução a uma estação
 */
export async function addStationInstruction(
    stationId: string,
    documentId: string,
    title: string,
    userId: string,
    version?: string,
    metadata?: any
): Promise<StationInstruction | null> {
    const { data, error } = await supabase
        .from('station_instructions')
        .insert({
            station_id: stationId,
            document_id: documentId,
            title,
            version,
            uploaded_by: userId,
            metadata
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding instruction:', error);
        throw error;
    }

    return data;
}

/**
 * Remover instrução
 */
export async function deleteStationInstruction(instructionId: string): Promise<boolean> {
    const { error } = await supabase
        .from('station_instructions')
        .delete()
        .eq('id', instructionId);

    if (error) {
        console.error('Error deleting instruction:', error);
        throw error;
    }

    return true;
}

/**
 * Buscar instruções de uma estação específica
 */
export async function getInstructionsByStation(stationId: string): Promise<StationInstruction[]> {
    const { data, error } = await supabase
        .from('station_instructions')
        .select('*')
        .eq('station_id', stationId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error('Error fetching instructions by station:', error);
        throw error;
    }

    return data || [];
}

/**
 * Buscar todas as instruções de uma linha (de todas as estações)
 */
export async function getInstructionsByLine(lineId: string): Promise<StationInstruction[]> {
    const { data, error } = await supabase
        .from('station_instructions')
        .select('*, work_stations!inner(line_id, name)')
        .eq('work_stations.line_id', lineId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error('Error fetching instructions by line:', error);
        throw error;
    }

    return data || [];
}
