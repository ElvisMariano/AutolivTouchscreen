const { getPool, sql } = require('../config/database');

/**
 * Obter todos os usuários
 */
async function getAllUsers() {
    const pool = await getPool();
    const result = await pool.request()
        .query(`
            SELECT 
                u.id, u.name, u.email, u.role_id, u.status,
                u.created_at, u.updated_at,
                r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.status = 'active'
            ORDER BY u.name
        `);
    return result.recordset;
}

/**
 * Obter usuário por ID
 */
async function getUserById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            SELECT 
                u.id, u.name, u.email, u.role_id, u.status,
                u.created_at, u.updated_at,
                r.name as role_name,
                r.allowed_resources
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = @id
        `);
    return result.recordset[0];
}

/**
 * Obter usuário por email (para autenticação)
 */
async function getUserByEmail(email) {
    const pool = await getPool();
    const result = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query(`
            SELECT 
                u.id, u.name, u.email, u.role_id, u.status,
                u.created_at, u.updated_at,
                r.name as role_name,
                r.allowed_resources
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.email = @email AND u.status = 'active'
        `);
    return result.recordset[0];
}

/**
 * Criar novo usuário
 */
async function createUser(userData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('name', sql.NVarChar(200), userData.name)
        .input('email', sql.NVarChar(255), userData.email)
        .input('role_id', sql.UniqueIdentifier, userData.role_id)
        .query(`
            INSERT INTO users (name, email, role_id, status)
            OUTPUT INSERTED.*
            VALUES (@name, @email, @role_id, 'active')
        `);
    return result.recordset[0];
}

/**
 * Atualizar usuário
 */
async function updateUser(id, userData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('name', sql.NVarChar(200), userData.name)
        .input('email', sql.NVarChar(255), userData.email)
        .input('role_id', sql.UniqueIdentifier, userData.role_id)
        .query(`
            UPDATE users
            SET 
                name = @name,
                email = @email,
                role_id = @role_id,
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

/**
 * Deletar usuário (soft delete)
 */
async function deleteUser(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            UPDATE users
            SET 
                status = 'inactive',
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

/**
 * Obter plantas de um usuário
 */
async function getUserPlants(userId) {
    const pool = await getPool();
    const result = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
            SELECT 
                p.id, p.name, p.location, p.status, p.external_id,
                up.created_at as assigned_at
            FROM plants p
            INNER JOIN user_plants up ON p.id = up.plant_id
            WHERE up.user_id = @user_id AND p.status = 'active'
            ORDER BY p.name
        `);
    return result.recordset;
}

/**
 * Associar usuário a uma planta
 */
async function assignUserToPlant(userId, plantId) {
    const pool = await getPool();

    // Verificar se já existe
    const existing = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .input('plant_id', sql.UniqueIdentifier, plantId)
        .query('SELECT user_id FROM user_plants WHERE user_id = @user_id AND plant_id = @plant_id');

    if (existing.recordset.length > 0) {
        return existing.recordset[0];
    }

    const result = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .input('plant_id', sql.UniqueIdentifier, plantId)
        .query(`
            INSERT INTO user_plants (user_id, plant_id)
            OUTPUT INSERTED.*
            VALUES (@user_id, @plant_id)
        `);
    return result.recordset[0];
}

/**
 * Remover associação usuário-planta
 */
async function removeUserFromPlant(userId, plantId) {
    const pool = await getPool();
    await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .input('plant_id', sql.UniqueIdentifier, plantId)
        .query('DELETE FROM user_plants WHERE user_id = @user_id AND plant_id = @plant_id');
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    deleteUser,
    getUserPlants,
    assignUserToPlant,
    removeUserFromPlant,
};
