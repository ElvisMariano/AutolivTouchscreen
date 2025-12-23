import apiClient, { getData, handleApiError } from '../apiClient';

export interface ProductionLine {
    id: string;
    name: string;
    plant_id: string;
    status: string;
    external_id?: string;
    created_at: string;
    updated_at: string;
    plant_name?: string; // JOIN field
}

export interface CreateLineDTO {
    name: string;
    plant_id: string;
    external_id?: string;
}

export interface UpdateLineDTO {
    name?: string;
    plant_id?: string;
    external_id?: string;
}

/**
 * Buscar todas as linhas (com filtro opcional por planta)
 */
export async function getLines(plantId?: string): Promise<ProductionLine[]> {
    try {
        const params = plantId ? { plantId } : {};
        const response = await apiClient.get('/lines', { params });
        return getData<ProductionLine[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar linha por ID
 */
export async function getLine(id: string): Promise<ProductionLine> {
    try {
        const response = await apiClient.get(`/lines/${id}`);
        return getData<ProductionLine>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Criar nova linha
 */
export async function createLine(data: CreateLineDTO): Promise<ProductionLine> {
    try {
        const response = await apiClient.post('/lines', data);
        return getData<ProductionLine>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Atualizar linha
 */
export async function updateLine(id: string, data: UpdateLineDTO): Promise<ProductionLine> {
    try {
        const response = await apiClient.put(`/lines/${id}`, data);
        return getData<ProductionLine>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Deletar linha (soft delete)
 */
export async function deleteLine(id: string): Promise<void> {
    try {
        await apiClient.delete(`/lines/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}
