
// services/roleService.ts

import { supabase } from './supabaseClient';
import { Role, RoleAuditLog, AVAILABLE_RESOURCES } from '../types';

export const getRoles = async (): Promise<Role[]> => {
    const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching roles:', error);
        throw error;
    }

    return data as Role[];
};

export const createRole = async (name: string, allowed_resources: string[], currentUserId: string): Promise<Role> => {
    const { data, error } = await supabase.rpc('create_role_admin', {
        new_name: name,
        new_resources: allowed_resources
    });

    if (error) throw error;

    // RPC returns the object directly, maybe wrapped or as JSONB. 
    // Typescript might need casting depending on the exact return shape you expect.
    // Based on the SQL `RETURNING to_jsonb(permissions.*)`, `data` is the role object.

    const newRole = data as Role;

    await logRoleChange(currentUserId, newRole.id, 'create', `Created role "${name}"`, newRole.name);
    return newRole;
};

export const updateRole = async (id: string, updates: Partial<Role>, currentUserId: string): Promise<Role> => {
    // If name or allowed_resources aren't in updates, we pass null to let the SQL COALESCE handle it (or pass current values if we had them, but null is safer for partials)
    // However, our UI passes the full object state usually. Let's assume passed updates contain what we need or we might need to fetch first if we wanted to be partial-strict.
    // Given the UI in AdminRoleManagement.tsx sends `formData` which has name and allowed_resources, we are good.

    const { data: roleBefore } = await supabase.from('permissions').select('name').eq('id', id).single();

    const { data, error } = await supabase.rpc('update_role_admin', {
        role_id: id,
        new_name: updates.name || null,
        new_resources: updates.allowed_resources || null
    });

    if (error) throw error;

    const updatedRole = data as Role;

    await logRoleChange(currentUserId, id, 'update', `Updated role details`, updatedRole.name);
    return updatedRole;
};

export const deleteRole = async (id: string, currentUserId: string): Promise<void> => {
    const { data: roleBefore } = await supabase.from('permissions').select('name').eq('id', id).single();

    const { error } = await supabase.rpc('delete_role_admin', { target_role_id: id });

    if (error) throw error;

    await logRoleChange(currentUserId, id, 'delete', `Deleted role`, roleBefore?.name);
};

export const logRoleChange = async (actorId: string, roleId: string, action: string, details: string, roleName?: string) => {
    const { error } = await supabase.rpc('log_role_change_admin', {
        p_actor_id: actorId,
        p_role_id: roleId,
        p_action: action,
        p_details: details,
        p_role_name: roleName || null
    });

    if (error) {
        console.error('Error logging role change:', error);
        // We don't throw here to avoid failing the main operation if logging fails, 
        // but in a strict audit environment we might want to.
    }
};

export const getRoleAuditLogs = async (): Promise<RoleAuditLog[]> => {
    const { data, error } = await supabase
        .from('role_audit_logs')
        .select(`
            *,
            users:actor_id (name),
            permissions:role_id (name)
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

    if (error) throw error;

    return data.map((log: any) => ({
        ...log,
        actor_name: log.users?.name || 'Sistema',
        role_name: log.permissions?.name || 'Role Excluída'
    }));
};
