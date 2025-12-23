import apiClient, { getData, handleApiError } from '../apiClient';

export interface LineDocument {
    id: string;
    line_id?: string;
    station_id?: string;
    title: string;
    document_url: string;
    viewinfo?: string; // PDF data URL
    category: string;
    version?: number;
    metadata?: any;
    uploaded_by?: string;
    created_at: string;
    updated_at: string;
    line_name?: string; // JOIN field
    station_name?: string; // JOIN field
    station_external_id?: string; // JOIN field
}

export interface CreateDocumentDTO {
    line_id?: string;
    station_id?: string;
    title: string;
    document_url: string;
    viewinfo?: string;
    category: string;
    version?: number;
    metadata?: any;
    uploaded_by?: string;
}

export interface UpdateDocumentDTO {
    line_id?: string;
    station_id?: string;
    title?: string;
    document_url?: string;
    viewinfo?: string;
    category?: string;
    version?: number;
    metadata?: any;
}

export interface DocumentFilters {
    lineId?: string;
    stationId?: string;
    category?: string;
}

/**
 * Buscar todos os documentos (com filtros opcionais)
 */
export async function getDocuments(filters?: DocumentFilters): Promise<LineDocument[]> {
    try {
        const response = await apiClient.get('/documents', { params: filters });
        return getData<LineDocument[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar documento por ID
 */
export async function getDocument(id: string): Promise<LineDocument> {
    try {
        const response = await apiClient.get(`/documents/${id}`);
        return getData<LineDocument>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar Work Instruction de uma estação por external_id
 * ENDPOINT ESSENCIAL PARA DASHBOARD
 */
export async function getWorkInstructionByStation(externalId: string): Promise<LineDocument> {
    try {
        const response = await apiClient.get(`/documents/station/${externalId}/work-instruction`);
        return getData<LineDocument>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Criar novo documento
 */
export async function createDocument(data: CreateDocumentDTO): Promise<LineDocument> {
    try {
        const response = await apiClient.post('/documents', data);
        return getData<LineDocument>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Atualizar documento
 */
export async function updateDocument(id: string, data: UpdateDocumentDTO): Promise<LineDocument> {
    try {
        const response = await apiClient.put(`/documents/${id}`, data);
        return getData<LineDocument>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Deletar documento
 */
export async function deleteDocument(id: string): Promise<void> {
    try {
        await apiClient.delete(`/documents/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}
