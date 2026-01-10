import apiClient, { getData, handleApiError } from '../apiClient';

export interface Role {
    id: string;
    name: string;
    description?: string;
    allowed_resources: string[]; // Parsed JSON
    created_at: string;
    updated_at: string;
}

export interface CreateRoleDTO {
    name: string;
    description?: string;
    allowed_resources?: any; // Will be stringified to JSON
}

export interface UpdateRoleDTO {
    name?: string;
    description?: string;
    allowed_resources?: any; // Will be stringified to JSON
}

/**
 * Buscar todas as roles
 */
export async function getRoles(): Promise<Role[]> {
    try {
        const response = await apiClient.get('/roles');
        const raw = getData<any[]>(response);
        return raw.map(r => {
            let parsed = r.allowed_resources;
            if (typeof r.allowed_resources === 'string') {
                try {
                    parsed = JSON.parse(r.allowed_resources);
                } catch (e) {
                    console.warn('Falha ao fazer parse de allowed_resources para role:', r.id, e);
                    parsed = [];
                }
            }
            return {
                ...r,
                allowed_resources: Array.isArray(parsed) ? parsed : []
            };
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar role por ID
 */
export async function getRole(id: string): Promise<Role> {
    try {
        const response = await apiClient.get(`/roles/${id}`);
        return getData<Role>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Criar nova role
 */
export async function createRole(data: CreateRoleDTO): Promise<Role> {
    try {
        const response = await apiClient.post('/roles', data);
        return getData<Role>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Atualizar role
 */
export async function updateRole(id: string, data: UpdateRoleDTO): Promise<Role> {
    try {
        const response = await apiClient.put(`/roles/${id}`, data);
        return getData<Role>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Deletar role
 */
export async function deleteRole(id: string): Promise<void> {
    try {
        await apiClient.delete(`/roles/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}
