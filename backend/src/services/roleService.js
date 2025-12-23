const { getPool, sql } = require('../config/database');

/**
 * Obter todas as roles
 */
async function getAllRoles() {
    const pool = await getPool();
    const result = await pool.request()
        .query(`
            SELECT 
                id, name, description, allowed_resources, created_at, updated_at
            FROM roles
            ORDER BY name
        `);
    return result.recordset;
}

/**
 * Obter role por ID
 */
async function getRoleById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            SELECT 
                id, name, description, allowed_resources, created_at, updated_at
            FROM roles
            WHERE id = @id
        `);
    return result.recordset[0];
}

/**
 * Criar nova role
 */
async function createRole(roleData) {
    const pool = await getPool();
    const allowedResourcesJson = roleData.allowed_resources ? JSON.stringify(roleData.allowed_resources) : null;

    const result = await pool.request()
        .input('name', sql.NVarChar(100), roleData.name)
        .input('description', sql.NVarChar(500), roleData.description || null)
        .input('allowed_resources', sql.NVarChar(sql.MAX), allowedResourcesJson)
        .query(`
            INSERT INTO roles (name, description, allowed_resources)
            OUTPUT INSERTED.*
            VALUES (@name, @description, @allowed_resources)
        `);
    return result.recordset[0];
}

/**
 * Atualizar role
 */
async function updateRole(id, roleData) {
    const pool = await getPool();
    const allowedResourcesJson = roleData.allowed_resources ? JSON.stringify(roleData.allowed_resources) : null;

    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('name', sql.NVarChar(100), roleData.name)
        .input('description', sql.NVarChar(500), roleData.description || null)
        .input('allowed_resources', sql.NVarChar(sql.MAX), allowedResourcesJson)
        .query(`
            UPDATE roles
            SET 
                name = @name,
                description = @description,
                allowed_resources = @allowed_resources,
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

/**
 * Deletar role
 */
async function deleteRole(id) {
    const pool = await getPool();

    // Verificar se há usuários com esta role
    const users = await pool.request()
        .input('role_id', sql.UniqueIdentifier, id)
        .query('SELECT COUNT(*) as count FROM users WHERE role_id = @role_id AND status = \'active\'');

    if (users.recordset[0].count > 0) {
        throw new Error('Não é possível deletar role com usuários ativos associados');
    }

    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            DELETE FROM roles
            OUTPUT DELETED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

module.exports = {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
};
