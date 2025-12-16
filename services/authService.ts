import { supabase } from './supabaseClient';

export interface User {
    id: string;
    username: string;
    name?: string;
    role: {
        id: string;
        name: string;
        allowed_resources: string[];
    };
}

export interface AuthResult {
    success: boolean;
    user?: User;
    error?: string;
}

/**
 * Hash a password with salt using Web Crypto API (SHA-256)
 */
async function hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random salt
 */
function generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if user exists and get their role
 */
export async function checkUserPermission(username: string): Promise<{ exists: boolean; role?: string; userId?: string }> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
        id,
        username,
        role:permissions(name)
      `)
            .eq('username', username.toLowerCase())
            .is('deleted_at', null)
            .single();

        if (error || !data) {
            return { exists: false };
        }

        const roleName = (Array.isArray(data.role) ? (data.role[0] as any)?.name : (data.role as any)?.name) as string | undefined;

        return {
            exists: true,
            role: roleName,
            userId: data.id
        };
    } catch (error) {
        console.error('Error checking user permission:', error);
        return { exists: false };
    }
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<AuthResult> {
    try {
        // Get user with role info
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
        id,
        username,
        name,
        password_hash,
        salt,
        role:permissions(
          id,
          name,
          allowed_resources
        )
      `)
            .eq('username', username.toLowerCase())
            .is('deleted_at', null)
            .single();

        if (userError || !userData) {
            await logAccess(null, 'login_failed', 'User not found');
            return { success: false, error: 'Usuário não encontrado' };
        }

        // Verify password
        const hashedPassword = await hashPassword(password, userData.salt);
        if (hashedPassword !== userData.password_hash) {
            await logAccess(userData.id, 'login_failed', 'Invalid password');
            return { success: false, error: 'Senha inválida' };
        }

        // Log successful access
        await logAccess(userData.id, 'login_success', 'User logged in successfully');

        return {
            success: true,
            user: {
                id: userData.id,
                username: userData.username,
                name: userData.name,
                role: userData.role as any
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Erro ao fazer login' };
    }
}

/**
 * Auto-login for operator role (OS username based)
 */
export async function autoLoginOperator(username: string): Promise<AuthResult> {
    try {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
        id,
        username,
        name,
        role:permissions(
          id,
          name,
          allowed_resources
        )
      `)
            .eq('username', username.toLowerCase())
            .is('deleted_at', null)
            .single();

        if (userError || !userData) {
            return { success: false, error: 'Usuário não cadastrado' };
        }

        // Extract role from response (handle array structure)
        const userRole = Array.isArray(userData.role) ? userData.role[0] : userData.role;

        // Only allow auto-login for operators
        if (userRole?.name !== 'Operador') {
            return { success: false, error: 'Usuário requer autenticação por senha' };
        }

        await logAccess(userData.id, 'auto_login_success', 'Operator auto-logged in');

        return {
            success: true,
            user: {
                id: userData.id,
                username: userData.username,
                name: userData.name,
                role: userRole as any
            }
        };
    } catch (error) {
        console.error('Auto-login error:', error);
        return { success: false, error: 'Erro ao fazer login automático' };
    }
}

/**
 * Log access attempt
 */
export async function logAccess(
    userId: string | null,
    action: string,
    details: string
): Promise<void> {
    try {
        await supabase.from('access_logs').insert({
            user_id: userId,
            action,
            status: action.includes('success') ? 'success' : 'failed',
            details,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error logging access:', error);
    }
}

/**
 * Create a new user (for admin panel)
 */
export async function createUser(
    username: string,
    password: string,
    roleId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);

        const { error } = await supabase.from('users').insert({
            username: username.toLowerCase(),
            password_hash: passwordHash,
            salt,
            role_id: roleId
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error creating user:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all roles/permissions
 */
export async function getRoles(): Promise<Array<{ id: string; name: string }>> {
    try {
        const { data, error } = await supabase
            .from('permissions')
            .select('id, name')
            .order('name');

        if (error) {
            console.error('Error fetching roles:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
}
/**
 * Verify if MSAL user exists in database
 * Returns the user from DB (with ID) if exists, null otherwise.
 */
export async function syncMsalUser(username: string, name: string): Promise<User | null> {
    try {
        // 1. Check if user exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select(`
                id,
                username,
                name,
                role:permissions(
                    id,
                    name,
                    allowed_resources
                )
            `)
            .eq('username', username.toLowerCase())
            .is('deleted_at', null)
            .single();

        if (existingUser && !checkError) {
            // User exists, return it
            const userRole = Array.isArray(existingUser.role) ? existingUser.role[0] : existingUser.role;
            return {
                id: existingUser.id,
                username: existingUser.username,
                name: existingUser.name,
                role: userRole as any
            };
        }

        // User does not exist - Strict Mode: Do not create.
        console.warn(`User ${username} (${name}) not found in database.`);
        return null;

    } catch (error) {
        console.error('Error verifying MSAL user:', error);
        return null;
    }
}
/**
 * Get all users with their roles
 */
export async function getAllUsers(): Promise<User[]> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id,
                username,
                name,
                plant_ids,
                role:permissions(
                    id,
                    name,
                    allowed_resources
                )
            `)
            .is('deleted_at', null)
            .order('username');

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return data.map((u: any) => ({
            id: u.id,
            username: u.username,
            name: u.name || u.username, // Fallback to username if name is null
            role: Array.isArray(u.role) ? u.role[0] : u.role,
            plant_ids: u.plant_ids // Include plant_ids
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}


/**
 * Add a new user to the database
 */
export async function addUserToDB(user: any): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
        // First resolve role_id from role name or ID
        let roleId = '';
        const { data: roles } = await supabase.from('permissions').select('id, name');

        let targetRole: any = null;

        if (roles) {
            const lowerRole = user.role.toLowerCase();
            targetRole = roles.find(r => r.name.toLowerCase() === lowerRole);
            if (targetRole) roleId = targetRole.id;
            // Fallback for 'operator' if not found exactly
            if (!roleId && lowerRole === 'operator') {
                const opRole = roles.find(r => r.name.toLowerCase() === 'operador');
                if (opRole) {
                    roleId = opRole.id;
                    targetRole = opRole;
                }
            }
            // Fallback for 'admin'
            if (!roleId && lowerRole === 'admin') {
                const admRole = roles.find(r => r.name.toLowerCase() === 'administrador');
                if (admRole) {
                    roleId = admRole.id;
                    targetRole = admRole;
                }
            }
        }

        if (!roleId) return { success: false, error: 'Role not found' };

        const salt = generateSalt();
        const passwordHash = await hashPassword(user.password || '123456', salt); // Default password if empty

        // 1. Tenta usar RPC (Secure Store Procedure)
        // Tentando passar plant_ids para o RPC (se atualizado)
        try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_admin', {
                new_username: user.username.toLowerCase(),
                new_name: user.name,
                new_password_hash: passwordHash,
                new_salt: salt,
                new_role_id: roleId,
                new_plant_ids: user.plant_ids || []
            });

            if (!rpcError) {
                console.log('Usuário criado via RPC com sucesso.');
                return { success: true, data: { ...user, role: targetRole, id: rpcData || 'new-id' } };
            }
            console.warn('RPC de criação falhou (possível erro de assinatura), tentando insert direto...', rpcError.message);
        } catch (e) {
            console.warn('Exceção ao chamar RPC (assinatura inválida?), tentando fallback...', e);
        }

        // 2. Fallback Insert Direto
        const { data, error } = await supabase.from('users').insert({
            username: user.username.toLowerCase(),
            name: user.name,
            password_hash: passwordHash,
            salt,
            role_id: roleId,
            plant_ids: user.plant_ids || []
        }).select().single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error adding user:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update user in database
 */
export async function updateUserInDB(user: any): Promise<{ success: boolean; error?: string }> {
    try {
        // Resolve role again if needed.
        let roleId = '';

        const { data: roles } = await supabase.from('permissions').select('id, name');
        if (roles) {
            const lowerRole = (typeof user.role === 'string' ? user.role : user.role.name).toLowerCase();
            const targetRole = roles.find(r => r.name.toLowerCase() === lowerRole);
            if (targetRole) roleId = targetRole.id;
            if (!roleId && lowerRole === 'operator') {
                const opRole = roles.find(r => r.name.toLowerCase() === 'operador');
                if (opRole) roleId = opRole.id;
            }
            if (!roleId && lowerRole === 'admin') {
                const admRole = roles.find(r => r.name.toLowerCase() === 'administrador');
                if (admRole) roleId = admRole.id;
            }
        }

        const updates: any = {
            username: user.username.toLowerCase(),
            name: user.name,
            plant_ids: user.plant_ids
        };

        if (roleId) updates.role_id = roleId;

        // If password provided
        if (user.password) {
            const salt = generateSalt();
            updates.password_hash = await hashPassword(user.password, salt);
            updates.salt = salt;
        }

        // 1. Tenta usar RPC (Secure Store Procedure that bypasses RLS)
        try {
            const { error: rpcError } = await supabase.rpc('update_user_admin', {
                target_user_id: user.id,
                new_username: updates.username,
                new_name: updates.name,
                new_role_id: updates.role_id || null,
                new_password_hash: updates.password_hash || null,
                new_salt: updates.salt || null,
                new_plant_ids: updates.plant_ids || null
            });

            if (!rpcError) {
                console.log('Usuário atualizado via RPC com sucesso.');
                return { success: true };
            }
            console.warn('RPC de atualização falhou, tentando update direto...', rpcError.message);
        } catch (e) {
            console.warn('RPC exception, falling back to direct update:', e);
        }

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        return { success: true };

    } catch (error: any) {
        console.error('Error updating user:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete user from database (Soft Delete)
 */
export async function deleteUserInDB(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`Tentando excluir (soft delete) usuário ${id}...`);
        // 1. Tenta usar RPC (Secure Store Procedure that bypasses RLS)
        const { error: rpcError } = await supabase.rpc('soft_delete_user', { target_user_id: id });

        if (!rpcError) {
            console.log('Usuário excluído via RPC com sucesso.');
            return { success: true };
        }

        console.warn('RPC falhou ou não existe, tentando update direto...', rpcError?.message);

        // 2. Fallback para Update Direto (pode falhar por RLS)
        const { data, error, status, statusText } = await supabase
            .from('users')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Supabase Error deleting user:', error);
            console.error('Status:', status, statusText);
            throw error;
        }

        console.log('Update direto realizado. Dados:', data);
        if (!data || data.length === 0) {
            console.warn('ATENÇÃO: Nenhum registro atualizado via Update direto via RLS.');
        }

        return { success: true };
    } catch (error: any) {
        console.error('Exception deleting user:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all deleted users
 */
export async function getDeletedUsers(): Promise<User[]> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id,
                username,
                name,
                role:permissions(
                    id,
                    name,
                    allowed_resources
                )
            `)
            .not('deleted_at', 'is', null) // Filter where deleted_at IS NOT NULL
            .order('username');

        if (error) {
            console.error('Error fetching deleted users:', error);
            return [];
        }

        return data.map((u: any) => ({
            id: u.id,
            username: u.username,
            name: u.name || u.username,
            role: Array.isArray(u.role) ? u.role[0] : u.role
        }));
    } catch (error) {
        console.error('Error fetching deleted users:', error);
        return [];
    }
}

/**
 * Restore user in database
 */
export async function restoreUserInDB(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('users')
            .update({ deleted_at: null })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error restoring user:', error);
        return { success: false, error: error.message };
    }
}
