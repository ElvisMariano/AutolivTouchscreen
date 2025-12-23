import apiClient, { getData, handleApiError } from '../apiClient';

export interface WorkStation {
    id: string;
    name: string;
    line_id: string;
    station_number?: number;
    status: string;
    external_id?: string;
    created_at: string;
    updated_at: string;
    line_name?: string; // JOIN field
    plant_name?: string; // JOIN field
    description?: string;
}

export interface CreateStationDTO {
    name: string;
    line_id: string;
    station_number?: number;
    external_id?: string;
}

export interface UpdateStationDTO {
    name?: string;
    line_id?: string;
    station_number?: number;
    external_id?: string;
}

/**
 * Buscar todas as estações (com filtro opcional por linha)
 */
export async function getStations(lineId?: string): Promise<WorkStation[]> {
    try {
        const params = lineId ? { lineId } : {};
        const response = await apiClient.get('/stations', { params });
        return getData<WorkStation[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar estação por ID
 */
export async function getStation(id: string): Promise<WorkStation> {
    try {
        const response = await apiClient.get(`/stations/${id}`);
        return getData<WorkStation>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar estação por external_id (L2L ID)
 */
export async function getStationByExternalId(externalId: string): Promise<WorkStation> {
    try {
        const response = await apiClient.get(`/stations/external/${externalId}`);
        return getData<WorkStation>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Criar nova estação
 */
export async function createStation(data: CreateStationDTO): Promise<WorkStation> {
    try {
        const response = await apiClient.post('/stations', data);
        return getData<WorkStation>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Atualizar estação
 */
export async function updateStation(id: string, data: UpdateStationDTO): Promise<WorkStation> {
    try {
        const response = await apiClient.put(`/stations/${id}`, data);
        return getData<WorkStation>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Deletar estação (soft delete)
 */
export async function deleteStation(id: string): Promise<void> {
    try {
        await apiClient.delete(`/stations/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}
