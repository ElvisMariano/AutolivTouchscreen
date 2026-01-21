const { getPool, sql } = require('../config/database');

/**
 * Obter todos os documentos
 */
async function getAllDocuments(filters = {}) {
    const pool = await getPool();

    let query = `
        SELECT 
            d.id, d.line_id, d.station_id, d.title, d.document_url, d.viewinfo,
            d.category, d.version, d.metadata, d.uploaded_by,
            d.created_at, d.updated_at,
            l.name as line_name,
            s.name as station_name,
            s.external_id as station_external_id
        FROM line_documents d
        LEFT JOIN production_lines l ON d.line_id = l.id
        LEFT JOIN work_stations s ON d.station_id = s.id
        WHERE 1=1
    `;

    const request = pool.request();

    if (filters.lineId) {
        query += ` AND d.line_id = @lineId`;
        request.input('lineId', sql.UniqueIdentifier, filters.lineId);
    }

    if (filters.stationId) {
        query += ` AND d.station_id = @stationId`;
        request.input('stationId', sql.UniqueIdentifier, filters.stationId);
    }

    if (filters.category) {
        query += ` AND d.category = @category`;
        request.input('category', sql.NVarChar(100), filters.category);
    }

    query += ` ORDER BY d.created_at DESC`;

    const result = await request.query(query);
    return result.recordset;
}

/**
 * Obter Work Instruction de uma estação por external_id
 * Essencial para dashboard - retorna PDF URL
 */
async function getWorkInstructionByStationExternalId(stationExternalId) {
    const pool = await getPool();
    const result = await pool.request()
        .input('station_external_id', sql.NVarChar(100), stationExternalId)
        .query(`
            SELECT TOP 1
                d.id, d.line_id, d.station_id, d.title, d.document_url, d.viewinfo,
                d.category, d.version, d.metadata,
                d.created_at, d.updated_at,
                l.name as line_name,
                s.name as station_name,
                s.external_id as station_external_id
            FROM line_documents d
            INNER JOIN work_stations s ON d.station_id = s.id
            LEFT JOIN production_lines l ON d.line_id = l.id
            WHERE s.external_id = @station_external_id
              AND d.category = 'Work Instruction'
            ORDER BY d.version DESC, d.created_at DESC
        `);
    return result.recordset[0];
}

/**
 * Obter documento por ID
 */
async function getDocumentById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            SELECT 
                d.id, d.line_id, d.station_id, d.title, d.document_url, d.viewinfo,
                d.category, d.version, d.metadata, d.uploaded_by,
                d.created_at, d.updated_at,
                l.name as line_name,
                s.name as station_name,
                s.external_id as station_external_id
            FROM line_documents d
            LEFT JOIN production_lines l ON d.line_id = l.id
            LEFT JOIN work_stations s ON d.station_id = s.id
            WHERE d.id = @id
        `);
    return result.recordset[0];
}

/**
 * Criar novo documento
 */
async function createDocument(documentData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('line_id', sql.UniqueIdentifier, documentData.line_id || null)
        .input('station_id', sql.UniqueIdentifier, documentData.station_id || null)
        .input('title', sql.NVarChar(500), documentData.title)
        .input('document_url', sql.NVarChar(sql.MAX), documentData.document_url)
        .input('viewinfo', sql.NVarChar(sql.MAX), documentData.viewinfo || null)
        .input('category', sql.NVarChar(100), documentData.category)
        .input('version', sql.Int, documentData.version || 1)
        .input('metadata', sql.NVarChar(sql.MAX), documentData.metadata ? JSON.stringify(documentData.metadata) : null)
        .input('uploaded_by', sql.UniqueIdentifier, documentData.uploaded_by || null)
        .query(`
            INSERT INTO line_documents 
            (line_id, station_id, title, document_url, viewinfo, category, version, metadata, uploaded_by)
            OUTPUT INSERTED.*
            VALUES 
            (@line_id, @station_id, @title, @document_url, @viewinfo, @category, @version, @metadata, @uploaded_by)
        `);
    return result.recordset[0];
}

/**
 * Atualizar documento
 */
async function updateDocument(id, documentData) {
    const pool = await getPool();

    // Construir query dinâmica para suportar atualizações parciais
    const fields = [];
    const request = pool.request();
    request.input('id', sql.UniqueIdentifier, id);

    if (documentData.line_id !== undefined) {
        fields.push('line_id = @line_id');
        request.input('line_id', sql.UniqueIdentifier, documentData.line_id || null);
    }

    if (documentData.station_id !== undefined) {
        fields.push('station_id = @station_id');
        request.input('station_id', sql.UniqueIdentifier, documentData.station_id || null);
    }

    if (documentData.title !== undefined) {
        fields.push('title = @title');
        request.input('title', sql.NVarChar(500), documentData.title);
    }

    if (documentData.document_url !== undefined) {
        fields.push('document_url = @document_url');
        request.input('document_url', sql.NVarChar(sql.MAX), documentData.document_url);
    }

    if (documentData.viewinfo !== undefined) {
        fields.push('viewinfo = @viewinfo');
        request.input('viewinfo', sql.NVarChar(sql.MAX), documentData.viewinfo || null);
    }

    if (documentData.category !== undefined) {
        fields.push('category = @category');
        request.input('category', sql.NVarChar(100), documentData.category);
    }

    if (documentData.version !== undefined) {
        fields.push('version = @version');
        request.input('version', sql.Int, documentData.version || 1);
    }

    if (documentData.metadata !== undefined) {
        fields.push('metadata = @metadata');
        request.input('metadata', sql.NVarChar(sql.MAX), documentData.metadata ? JSON.stringify(documentData.metadata) : null);
    }

    if (fields.length === 0) {
        // Nada para atualizar
        return getDocumentById(id);
    }

    fields.push('updated_at = SYSDATETIMEOFFSET()');

    const query = `
        UPDATE line_documents
        SET ${fields.join(', ')}
        OUTPUT INSERTED.*
        WHERE id = @id
    `;

    const result = await request.query(query);
    return result.recordset[0];
}

/**
 * Deletar documento
 */
async function deleteDocument(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            DELETE FROM line_documents
            OUTPUT DELETED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

module.exports = {
    getAllDocuments,
    getWorkInstructionByStationExternalId,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
};
