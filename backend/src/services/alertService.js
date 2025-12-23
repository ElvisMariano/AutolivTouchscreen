const { getPool, sql } = require('../config/database');

/**
 * Obter todos os alertas (com filtros opcionais)
 */
async function getAllAlerts(filters = {}) {
    const pool = await getPool();

    let query = `
        SELECT 
            a.id, a.line_id, a.title, a.description, a.priority, a.status,
            a.created_by, a.resolved_by, a.resolved_at,
            a.created_at, a.updated_at,
            l.name as line_name,
            u1.name as creator_name,
            u2.name as resolver_name
        FROM quality_alerts a
        LEFT JOIN production_lines l ON a.line_id = l.id
        LEFT JOIN users u1 ON a.created_by = u1.id
        LEFT JOIN users u2 ON a.resolved_by = u2.id
        WHERE 1=1
    `;

    const request = pool.request();

    if (filters.lineId) {
        query += ` AND a.line_id = @lineId`;
        request.input('lineId', sql.UniqueIdentifier, filters.lineId);
    }

    if (filters.status) {
        query += ` AND a.status = @status`;
        request.input('status', sql.NVarChar(20), filters.status);
    }

    if (filters.priority) {
        query += ` AND a.priority = @priority`;
        request.input('priority', sql.NVarChar(20), filters.priority);
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await request.query(query);
    return result.recordset;
}

/**
 * Obter alertas ativos (não resolvidos)
 */
async function getActiveAlerts(lineId = null) {
    const filters = { status: 'active' };
    if (lineId) {
        filters.lineId = lineId;
    }
    return getAllAlerts(filters);
}

/**
 * Obter alerta por ID
 */
async function getAlertById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            SELECT 
                a.id, a.line_id, a.title, a.description, a.priority, a.status,
                a.created_by, a.resolved_by, a.resolved_at,
                a.created_at, a.updated_at,
                l.name as line_name,
                u1.name as creator_name,
                u2.name as resolver_name
            FROM quality_alerts a
            LEFT JOIN production_lines l ON a.line_id = l.id
            LEFT JOIN users u1 ON a.created_by = u1.id
            LEFT JOIN users u2 ON a.resolved_by = u2.id
            WHERE a.id = @id
        `);
    return result.recordset[0];
}

/**
 * Criar novo alerta
 */
async function createAlert(alertData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('line_id', sql.UniqueIdentifier, alertData.line_id)
        .input('title', sql.NVarChar(500), alertData.title)
        .input('description', sql.NVarChar(sql.MAX), alertData.description || null)
        .input('priority', sql.NVarChar(20), alertData.priority || 'medium')
        .input('created_by', sql.UniqueIdentifier, alertData.created_by)
        .query(`
            INSERT INTO quality_alerts (line_id, title, description, priority, status, created_by)
            OUTPUT INSERTED.*
            VALUES (@line_id, @title, @description, @priority, 'active', @created_by)
        `);
    return result.recordset[0];
}

/**
 * Atualizar alerta
 */
async function updateAlert(id, alertData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('title', sql.NVarChar(500), alertData.title)
        .input('description', sql.NVarChar(sql.MAX), alertData.description || null)
        .input('priority', sql.NVarChar(20), alertData.priority)
        .query(`
            UPDATE quality_alerts
            SET 
                title = @title,
                description = @description,
                priority = @priority,
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

/**
 * Resolver alerta
 */
async function resolveAlert(id, userId) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('resolved_by', sql.UniqueIdentifier, userId)
        .query(`
            UPDATE quality_alerts
            SET 
                status = 'resolved',
                resolved_by = @resolved_by,
                resolved_at = SYSDATETIMEOFFSET(),
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

/**
 * Deletar alerta
 */
async function deleteAlert(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            DELETE FROM quality_alerts
            OUTPUT DELETED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

module.exports = {
    getAllAlerts,
    getActiveAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    resolveAlert,
    deleteAlert,
};
