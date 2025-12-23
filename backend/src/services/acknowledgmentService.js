
const { getPool, sql } = require('../config/database');

/**
 * Obter acknowledgments (filtros opcionais)
 */
async function getAcknowledgments({ documentIds, shift }) {
    const pool = await getPool();
    let query = `
        SELECT 
            da.id, da.document_id, da.user_id, da.shift, da.acknowledged_at as created_at,
            u.name as user_name
        FROM document_acknowledgments da
        LEFT JOIN users u ON da.user_id = u.id
        WHERE 1=1
    `;
    console.log('🔍 DEBUG: Executing Query from acknowledgmentService:', query);
    const request = pool.request();

    if (shift) {
        query += ' AND da.shift = @shift';
        request.input('shift', sql.NVarChar(50), shift);
    }

    if (documentIds) {
        if (typeof documentIds === 'string') {
            query += ` AND da.document_id IN (SELECT value FROM STRING_SPLIT(@docIds, ','))`;
            request.input('docIds', sql.NVarChar(sql.MAX), documentIds);
        } else if (Array.isArray(documentIds)) {
            query += ` AND da.document_id IN (SELECT value FROM STRING_SPLIT(@docIds, ','))`;
            request.input('docIds', sql.NVarChar(sql.MAX), documentIds.join(','));
        }
    }

    query += ' ORDER BY da.acknowledged_at DESC';

    const result = await request.query(query);
    return result.recordset;
}

/**
 * Criar novo acknowledgment
 */
async function createAcknowledgment({ document_id, shift, user_id }) {
    const pool = await getPool();

    const result = await pool.request()
        .input('document_id', sql.UniqueIdentifier, document_id)
        .input('user_id', sql.UniqueIdentifier, user_id)
        .input('shift', sql.NVarChar(50), shift)
        .query(`
            IF NOT EXISTS (SELECT 1 FROM document_acknowledgments WHERE document_id = @document_id AND user_id = @user_id AND shift = @shift)
            BEGIN
                INSERT INTO document_acknowledgments (document_id, user_id, shift)
                OUTPUT INSERTED.*
                VALUES (@document_id, @user_id, @shift)
            END
            ELSE
            BEGIN
                SELECT * FROM document_acknowledgments WHERE document_id = @document_id AND user_id = @user_id AND shift = @shift
            END
        `);

    return result.recordset[0];
}

module.exports = {
    getAcknowledgments,
    createAcknowledgment
};
