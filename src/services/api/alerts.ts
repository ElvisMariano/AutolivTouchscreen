import apiClient, { getData, handleApiError } from '../apiClient';

export interface QualityAlert {
    id: string;
    line_id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved';
    created_by: string;
    resolved_by?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
    line_name?: string; // JOIN field
    creator_name?: string; // JOIN field
    resolver_name?: string; // JOIN field
}

export interface CreateAlertDTO {
    line_id: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    created_by: string;
}

export interface UpdateAlertDTO {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertFilters {
    lineId?: string;
    status?: 'active' | 'resolved';
    priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Buscar todos os alertas (com filtros opcionais)
 */
export async function getAlerts(filters?: AlertFilters): Promise<QualityAlert[]> {
    try {
        const response = await apiClient.get('/alerts', { params: filters });
        return getData<QualityAlert[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar alertas ativos
 */
export async function getActiveAlerts(lineId?: string): Promise<QualityAlert[]> {
    try {
        const params = lineId ? { lineId } : {};
        const response = await apiClient.get('/alerts/active', { params });
        return getData<QualityAlert[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar alerta por ID
 */
export async function getAlert(id: string): Promise<QualityAlert> {
    try {
        const response = await apiClient.get(`/alerts/${id}`);
        return getData<QualityAlert>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Criar novo alerta
 */
export async function createAlert(data: CreateAlertDTO): Promise<QualityAlert> {
    try {
        const response = await apiClient.post('/alerts', data);
        return getData<QualityAlert>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Resolver alerta
 */
export async function resolveAlert(id: string, userId: string): Promise<QualityAlert> {
    try {
        const response = await apiClient.post(`/alerts/${id}/resolve`, { userId });
        return getData<QualityAlert>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Atualizar alerta
 */
export async function updateAlert(id: string, data: UpdateAlertDTO): Promise<QualityAlert> {
    try {
        const response = await apiClient.put(`/alerts/${id}`, data);
        return getData<QualityAlert>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Deletar alerta
 */
export async function deleteAlert(id: string): Promise<void> {
    try {
        await apiClient.delete(`/alerts/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}
