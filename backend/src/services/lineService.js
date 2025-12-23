const { getPool, sql } = require('../config/database');

/**
 * Obter todas as linhas de produção
 */
async function getAllLines(plantId = null) {
    const pool = await getPool();

    let query = `
        SELECT 
            l.id, l.name, l.plant_id, l.status, l.external_id,
            l.created_at, l.updated_at,
            p.name as plant_name
        FROM production_lines l
        LEFT JOIN plants p ON l.plant_id = p.id
        WHERE l.status = 'active'
    `;

    if (plantId) {
        query += ` AND l.plant_id = @plantId`;
    }

    query += ` ORDER BY p.name, l.name`;

    const request = pool.request();
    if (plantId) {
        request.input('plantId', sql.UniqueIdentifier, plantId);
    }

    const result = await request.query(query);
    return result.recordset;
}

/**
 * Obter linha por ID
 */
async function getLineById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            SELECT 
                l.id, l.name, l.plant_id, l.status, l.external_id,
                l.created_at, l.updated_at,
                p.name as plant_name
            FROM production_lines l
            LEFT JOIN plants p ON l.plant_id = p.id
            WHERE l.id = @id
        `);
    return result.recordset[0];
}

/**
 * Criar nova linha
 */
async function createLine(lineData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('name', sql.NVarChar(200), lineData.name)
        .input('plant_id', sql.UniqueIdentifier, lineData.plant_id)
        .input('external_id', sql.NVarChar(100), lineData.external_id || null)
        .query(`
            INSERT INTO production_lines (name, plant_id, external_id, status)
            OUTPUT INSERTED.*
            VALUES (@name, @plant_id, @external_id, 'active')
        `);
    return result.recordset[0];
}

/**
 * Atualizar linha
 */
async function updateLine(id, lineData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('name', sql.NVarChar(200), lineData.name)
        .input('plant_id', sql.UniqueIdentifier, lineData.plant_id)
        .input('external_id', sql.NVarChar(100), lineData.external_id || null)
        .query(`
            UPDATE production_lines
            SET 
                name = @name,
                plant_id = @plant_id,
                external_id = @external_id,
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

/**
 * Deletar linha (soft delete)
 */
async function deleteLine(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            UPDATE production_lines
            SET 
                status = 'inactive',
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

module.exports = {
    getAllLines,
    getLineById,
    createLine,
    updateLine,
    deleteLine,
};
