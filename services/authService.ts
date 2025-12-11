import { supabase } from './supabaseClient';

export interface User {
    id: string;
    username: string;
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
        password_hash,
        salt,
        role:permissions(
          id,
          name,
          allowed_resources
        )
      `)
            .eq('username', username.toLowerCase())
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
        role:permissions(
          id,
          name,
          allowed_resources
        )
      `)
            .eq('username', username.toLowerCase())
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
                role:permissions(
                    id,
                    name,
                    allowed_resources
                )
            `)
            .eq('username', username.toLowerCase())
            .single();

        if (existingUser && !checkError) {
            // User exists, return it
            const userRole = Array.isArray(existingUser.role) ? existingUser.role[0] : existingUser.role;
            return {
                id: existingUser.id,
                username: existingUser.username,
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
