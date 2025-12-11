import { supabase } from './supabaseClient';

export interface ProductionLine {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'inactive';
    created_at: string;
    created_by?: string;
    updated_at: string;
    station_count?: number;
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
        .select('*, work_stations(id)')
        .order('name');

    if (error) {
        console.error('Error fetching lines:', error);
        throw error;
    }

    return (data || []).map((line: any) => ({
        ...line,
        station_count: line.work_stations?.length || 0,
        work_stations: undefined
    }));
}

/**
 * Obter apenas linhas ativas
 */
export async function getActiveLines(): Promise<ProductionLine[]> {
    const { data, error } = await supabase
        .from('production_lines')
        .select('*, work_stations(id)')
        .eq('status', 'active')
        .order('name');

    if (error) {
        console.error('Error fetching active lines:', error);
        throw error;
    }

    return (data || []).map((line: any) => ({
        ...line,
        station_count: line.work_stations?.length || 0,
        work_stations: undefined
    }));
}

/**
 * Criar nova linha de produção (apenas admin)
 */
export async function createLine(
    name: string,
    description: string,
    createdBy: string
): Promise<ProductionLine | null> {
    console.log('🔍 Creating line with:', { name, description, createdBy });
    console.log('🔑 Supabase client configured:', {
        url: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });

    const { data, error } = await supabase
        .from('production_lines')
        .insert({
            name,
            description,
            status: 'active',
            created_by: createdBy
        })
        .select('*')
        .single();

    if (error) {
        console.error('Error creating line:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
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

/**
 * Adicionar documento à linha
 */
export async function addLineDocument(
    lineId: string,
    documentType: 'acceptance_criteria' | 'standardized_work' | 'presentation' | 'report',
    documentId: string,
    title: string,
    uploadedBy: string,
    version?: string,
    metadata?: Record<string, any>
): Promise<boolean> {
    const { error } = await supabase
        .from('line_documents')
        .insert({
            line_id: lineId,
            document_type: documentType,
            document_id: documentId,
            title,
            uploaded_by: uploadedBy,
            version,
            metadata
        });

    if (error) {
        console.error('Error adding line document:', error);
        return false;
    }

    return true;
}

/**
 * Buscar documentos de uma linha
 */
export async function getLineDocuments(lineId: string, documentType?: string) {
    let query = supabase
        .from('line_documents')
        .select('*')
        .eq('line_id', lineId);

    if (documentType) {
        query = query.eq('document_type', documentType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching line documents:', error);
        return [];
    }

    return data || [];
}
