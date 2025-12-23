import apiClient, { getData, handleApiError } from '../apiClient';

export interface User {
    id: string;
    name: string;
    email: string;
    role_id: string;
    status: string;
    username: string;
    role?: any; // Mapped from role_name/id or join
    settings?: any; // User settings
    plant_ids?: string[]; // User plants
    created_at: string;
    updated_at: string;
    role_name?: string; // JOIN field
    allowed_resources?: string; // JOIN field
}

export interface CreateUserDTO {
    name: string;
    email: string;
    role_id: string;
}

export interface UpdateUserDTO {
    name?: string;
    email?: string;
    role_id?: string;
}

/**
 * Buscar todos os usuários
 */
export async function getUsers(): Promise<User[]> {
    try {
        const response = await apiClient.get('/users');
        return getData<User[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar usuário por ID
 */
export async function getUser(id: string): Promise<User> {
    try {
        const response = await apiClient.get(`/users/${id}`);
        return getData<User>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Criar novo usuário
 */
export async function createUser(data: CreateUserDTO): Promise<User> {
    try {
        const response = await apiClient.post('/users', data);
        return getData<User>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Atualizar usuário
 */
export async function updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    try {
        const response = await apiClient.put(`/users/${id}`, data);
        return getData<User>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Deletar usuário (soft delete)
 */
export async function deleteUser(id: string): Promise<void> {
    try {
        await apiClient.delete(`/users/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Buscar plantas de um usuário
 */
export async function getUserPlants(userId: string): Promise<any[]> {
    try {
        const response = await apiClient.get(`/users/${userId}/plants`);
        return getData<any[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Associar usuário a uma planta
 */
export async function assignUserToPlant(userId: string, plantId: string): Promise<void> {
    try {
        await apiClient.post(`/users/${userId}/plants`, { plantId });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Remover associação usuário-planta
 */
export async function removeUserFromPlant(userId: string, plantId: string): Promise<void> {
    try {
        await apiClient.delete(`/users/${userId}/plants/${plantId}`);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Sync MSAL User (Frontend emulation enabled by fetching all users)
 */
export async function syncMsalUser(username: string, name: string): Promise<User | null> {
    try {
        if (!username) {
            console.warn('Sync skipped: No username provided.');
            return null;
        }

        const users = await getUsers();
        const user = users.find(u =>
            (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === username.toLowerCase())
        );

        if (user) {
            console.log(`✅ MSAL User sync logic matched user: ${user.username} (${user.email})`);
            return user;
        }

        console.warn(`User ${username} (${name}) not found in database.`);
        return null;
    } catch (error) {
        console.error('Error verifying MSAL user:', error);
        return null;
    }
}

/**
 * Log Access (Placeholder)
 */
export async function logAccess(userId: string | null, action: string, details: string): Promise<void> {
    // TODO: Implement backend log endpoint
    console.log(`[Access Log] User: ${userId}, Action: ${action}, Details: ${details}`);
}
