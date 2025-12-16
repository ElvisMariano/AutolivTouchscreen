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
    plant_id?: string;
    plantName?: string;
}

export interface CreateLineData {
    name: string;
    description?: string;
}

export interface LineDocument {
    id: string;
    line_id: string;
    document_id: string;
    document_type: string;
    title: string;
    version?: string;
    uploaded_by?: string;
    uploaded_at: string;
    metadata?: any;
}

/**
 * Obter todas as linhas de produção (com filtro opcional por planta)
 */
export async function getAllLines(plantId?: string): Promise<ProductionLine[]> {
    let query = supabase
        .from('production_lines')
        .select('*, work_stations(id), plants(name)')
        .order('name');

    if (plantId) {
        query = query.eq('plant_id', plantId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching lines:', error);
        throw error;
    }

    return (data || []).map((line: any) => ({
        ...line,
        station_count: line.work_stations?.length || 0,
        work_stations: undefined,
        plantName: line.plants?.name
    }));
}

/**
 * Obter apenas linhas ativas (com filtro opcional por planta)
 */
export async function getActiveLines(plantId?: string): Promise<ProductionLine[]> {
    let query = supabase
        .from('production_lines')
        .select('*, work_stations(id), plants(name)')
        .eq('status', 'active')
        .order('name');

    if (plantId) {
        query = query.eq('plant_id', plantId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching active lines:', error);
        throw error;
    }

    return (data || []).map((line: any) => ({
        ...line,
        station_count: line.work_stations?.length || 0,
        work_stations: undefined,
        plantId: line.plant_id,
        plantName: line.plants?.name
    }));
}

/**
 * Buscar linhas de uma planta específica (atalho)
 */
export async function getLinesByPlant(plantId: string): Promise<ProductionLine[]> {
    return getActiveLines(plantId);
}

/**
 * Criar nova linha de produção (apenas admin)
 */
export async function createLine(
    name: string,
    description: string,
    createdBy: string,
    plantId?: string // Opcional por enquanto para compatibilidade
): Promise<ProductionLine | null> {
    console.log('🔍 Creating line with:', { name, description, createdBy, plantId });
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
            created_by: createdBy,
            plant_id: plantId
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
    documentType: 'acceptance_criteria' | 'standardized_work' | 'presentation' | 'report' | 'alert',
    documentId: string,
    title: string,
    uploadedBy: string | null, // Allow null for system-created documents
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
 * Atualizar documento da linha
 */
export async function updateLineDocument(
    documentId: string, // ID no banco (não o ID local se forem diferentes, mas aqui assumimos que usamos o ID do banco)
    updates: {
        title?: string;
        document_id?: string; // URL
        version?: string;
        metadata?: any;
    }
): Promise<boolean> {
    const { error } = await supabase
        .from('line_documents')
        .update({
            ...updates,
            uploaded_at: new Date().toISOString()
            // não atualizamos line_id ou document_type normalmente
        })
        .eq('id', documentId); // Importante: O ID do documento local deve corresponder ao ID da tabela line_documents se foi carregado do banco.

    if (error) {
        console.error('Error updating line document:', error);
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

    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error) {
        console.error('Error fetching line documents:', error);
        return [];
    }

    return data || [];
}

/**
 * Deletar documento da linha
 */
export async function deleteLineDocument(documentId: string): Promise<boolean> {
    const { error } = await supabase
        .from('line_documents')
        .delete()
        .eq('id', documentId);

    if (error) {
        console.error('Error deleting line document:', error);
        return false;
    }

    return true;
}

/**
 * Buscar todos os documentos de linha cadastrados (todos os tipos)
 */
export async function getAllLineDocumentsFromDB() {
    const { data, error } = await supabase
        .from('line_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error('Error fetching all line documents:', error);
        return [];
    }

    return data || [];
}

/**
 * Confirmar leitura de documento por turno
 */
export async function acknowledgeDocument(documentId: string, shift: string, userId?: string) {
    // Upsert acknowledgment (if not exists or update it? Actually insert is enough, handling unique constraint)
    // Constraint is unique(document_id, shift).
    // If we want to support multiple re-acks (for new versions), we need to handle it.
    // Logic: 
    // If acknowledgment exists: UPDATE acknowledged_at = now()
    // If not exists: INSERT

    // Check if exists first? Or upsert.
    const { error } = await supabase
        .from('document_acknowledgments')
        .upsert({
            document_id: documentId,
            shift,
            acknowledged_by: userId,
            acknowledged_at: new Date().toISOString()
        }, { onConflict: 'document_id, shift' });

    if (error) {
        console.error('Error acknowledging document:', error);
        return false;
    }
    return true;
}

/**
 * Buscar confirmações de leitura para uma lista de documentos e turno
 */
export async function getDocumentAcknowledgments(documentIds: string[], shift: string) {
    if (documentIds.length === 0) return [];

    const { data, error } = await supabase
        .from('document_acknowledgments')
        .select('*')
        .in('document_id', documentIds)
        .eq('shift', shift);

    if (error) {
        console.error('Error fetching acknowledgments:', error);
        return [];
    }
    return data || [];
}
