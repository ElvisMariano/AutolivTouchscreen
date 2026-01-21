const { getPool, sql } = require('../config/database');

/**
 * Obter todas as linhas de produção
 */
async function getAllLines(plantId = null) {
    const pool = await getPool();

    let query = `
        SELECT 
            l.id, l.name, l.plant_id, l.status, l.external_id, l.metadata,
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
                l.id, l.name, l.plant_id, l.status, l.external_id, l.metadata,
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
        .input('metadata', sql.NVarChar(sql.MAX), lineData.metadata ? JSON.stringify(lineData.metadata) : null)
        .query(`
            INSERT INTO production_lines (name, plant_id, external_id, status, metadata)
            OUTPUT INSERTED.*
            VALUES (@name, @plant_id, @external_id, 'active', @metadata)
        `);
    return result.recordset[0];
}

/**
 * Atualizar linha
 */
async function updateLine(id, lineData) {
    const pool = await getPool();

    // Construir query dinâmica para suportar atualizações parciais
    const fields = [];
    const request = pool.request();
    request.input('id', sql.UniqueIdentifier, id);

    if (lineData.name !== undefined) {
        fields.push('name = @name');
        request.input('name', sql.NVarChar(200), lineData.name);
    }

    if (lineData.plant_id !== undefined) {
        fields.push('plant_id = @plant_id');
        request.input('plant_id', sql.UniqueIdentifier, lineData.plant_id);
    }

    if (lineData.external_id !== undefined) {
        fields.push('external_id = @external_id');
        request.input('external_id', sql.NVarChar(100), lineData.external_id || null);
    }

    if (lineData.metadata !== undefined) {
        fields.push('metadata = @metadata');
        request.input('metadata', sql.NVarChar(sql.MAX), lineData.metadata ? JSON.stringify(lineData.metadata) : null);
    }

    if (lineData.status !== undefined) {
        fields.push('status = @status');
        request.input('status', sql.NVarChar(50), lineData.status);
    }

    if (fields.length === 0) {
        // Nada para atualizar, retornar o registro atual
        return getLineById(id);
    }

    fields.push('updated_at = SYSDATETIMEOFFSET()');

    const query = `
        UPDATE production_lines
        SET ${fields.join(', ')}
        OUTPUT INSERTED.*
        WHERE id = @id
    `;

    const result = await request.query(query);
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
