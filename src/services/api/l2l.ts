import apiClient, { getData, handleApiError } from '../apiClient';

export interface L2LSyncResult {
    success: boolean;
    created: number;
    updated: number;
    deactivated: number;
    errors: string[];
    timestamp?: string;
}

export interface L2LSyncAllResult {
    plants: L2LSyncResult;
    lines: L2LSyncResult;
    machines: L2LSyncResult;
    documents: L2LSyncResult;
    overall: L2LSyncResult;
}

export interface L2LSyncLog {
    id: string;
    sync_type: string;
    status: string;
    records_created: number;
    records_updated: number;
    records_deactivated: number;
    errors?: string;
    synced_by?: string;
    synced_at: string;
}

/**
 * Testar conexão com API L2L
 */
export async function testL2LConnection(): Promise<{ status: string; message: string }> {
    try {
        const response = await apiClient.get('/l2l/test-connection');
        return getData(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Sincronizar lines da API L2L
 */
export async function syncLines(userId?: string): Promise<L2LSyncResult> {
    try {
        const response = await apiClient.post('/l2l/sync/lines', { userId }, { timeout: 300000 }); // 5 min timeout
        return getData<L2LSyncResult>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Sincronizar machines (stations) da API L2L
 */
export async function syncMachines(userId?: string): Promise<L2LSyncResult> {
    try {
        const response = await apiClient.post('/l2l/sync/machines', { userId }, { timeout: 300000 }); // 5 min timeout
        return getData<L2LSyncResult>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Sincronizar documents (Work Instructions) da API L2L
 */
export async function syncDocuments(userId?: string): Promise<L2LSyncResult> {
    try {
        const response = await apiClient.post('/l2l/sync/documents', { userId }, { timeout: 300000 }); // 5 min timeout
        return getData<L2LSyncResult>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Sincronizar tudo (lines + machines + documents)
 */
export async function syncAll(userId?: string): Promise<L2LSyncAllResult> {
    try {
        const response = await apiClient.post('/l2l/sync/all', { userId }, { timeout: 600000 }); // 10 min timeout
        return getData<L2LSyncAllResult>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Obter logs de sincronização
 */
export async function getL2LLogs(limit?: number): Promise<L2LSyncLog[]> {
    try {
        const params = limit ? { limit } : {};
        const response = await apiClient.get('/l2l/logs', { params });
        return getData<L2LSyncLog[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Sincronizar plants (sites) da API L2L
 */
export async function syncPlants(userId?: string): Promise<L2LSyncResult> {
    try {
        const response = await apiClient.post('/l2l/sync/plants', { userId }, { timeout: 300000 }); // 5 min timeout
        return getData<L2LSyncResult>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Busca último log de sincronização
 */
export async function getLastSyncLog(syncType?: string): Promise<L2LSyncLog | null> {
    const logs = await getL2LLogs(1);
    return logs.length > 0 ? logs[0] : null;
}

/**
 * Busca histórico de logs de sincronização
 */
export async function getSyncHistory(limit: number = 10): Promise<L2LSyncLog[]> {
    return getL2LLogs(limit);
}
