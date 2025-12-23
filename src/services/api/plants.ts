import apiClient, { getData, handleApiError } from '../apiClient';

export interface Plant {
    id: string;
    name: string;
    location?: string;
    status: string;
    external_id?: string;
    shift_config?: any;
    created_at: string;
    updated_at: string;
}

export interface CreatePlantDTO {
    name: string;
    location?: string;
    external_id?: string;
    shift_config?: any;
}

export interface UpdatePlantDTO {
    name?: string;
    location?: string;
    external_id?: string;
    shift_config?: any;
}

/**
 * Buscar todas as plantas
 */
export async function getPlants(): Promise<Plant[]> {
    try {
        const response = await apiClient.get('/plants');
        return getData<Plant[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar planta por ID
 */
export async function getPlant(id: string): Promise<Plant> {
    try {
        const response = await apiClient.get(`/plants/${id}`);
        return getData<Plant>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Criar nova planta
 */
export async function createPlant(data: CreatePlantDTO): Promise<Plant> {
    try {
        const response = await apiClient.post('/plants', data);
        return getData<Plant>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Atualizar planta
 */
export async function updatePlant(id: string, data: UpdatePlantDTO): Promise<Plant> {
    try {
        const response = await apiClient.put(`/plants/${id}`, data);
        return getData<Plant>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Deletar planta (soft delete)
 */
export async function deletePlant(id: string): Promise<void> {
    try {
        await apiClient.delete(`/plants/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}
