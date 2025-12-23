const { getPool, sql } = require('../config/database');

/**
 * Obter todas as estações
 */
async function getAllStations(lineId = null) {
    const pool = await getPool();

    let query = `
        SELECT 
            s.id, s.name, s.description, s.line_id, s.station_number, s.status, s.external_id,
            s.created_at, s.updated_at,
            l.name as line_name,
            p.name as plant_name
        FROM work_stations s
        LEFT JOIN production_lines l ON s.line_id = l.id
        LEFT JOIN plants p ON l.plant_id = p.id
        WHERE s.status = 'active'
    `;

    if (lineId) {
        query += ` AND s.line_id = @lineId`;
    }

    query += ` ORDER BY l.name, s.station_number, s.name`;

    const request = pool.request();
    if (lineId) {
        request.input('lineId', sql.UniqueIdentifier, lineId);
    }

    const result = await request.query(query);
    return result.recordset;
}

/**
 * Obter estação por ID
 */
async function getStationById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            SELECT 
                s.id, s.name, s.description, s.line_id, s.station_number, s.status, s.external_id,
                s.created_at, s.updated_at,
                l.name as line_name,
                p.name as plant_name
            FROM work_stations s
            LEFT JOIN production_lines l ON s.line_id = l.id
            LEFT JOIN plants p ON l.plant_id = p.id
            WHERE s.id = @id
        `);
    return result.recordset[0];
}

/**
 * Obter estação por external_id
 */
async function getStationByExternalId(externalId) {
    const pool = await getPool();
    const result = await pool.request()
        .input('external_id', sql.NVarChar(100), externalId)
        .query(`
            SELECT 
                s.id, s.name, s.description, s.line_id, s.station_number, s.status, s.external_id,
                s.created_at, s.updated_at,
                l.name as line_name,
                p.name as plant_name
            FROM work_stations s
            LEFT JOIN production_lines l ON s.line_id = l.id
            LEFT JOIN plants p ON l.plant_id = p.id
            WHERE s.external_id = @external_id
        `);
    return result.recordset[0];
}

/**
 * Criar nova estação
 */
async function createStation(stationData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('name', sql.NVarChar(200), stationData.name)
        .input('line_id', sql.UniqueIdentifier, stationData.line_id)
        .input('station_number', sql.Int, stationData.station_number || null)
        .input('external_id', sql.NVarChar(100), stationData.external_id || null)
        .input('station_id', sql.NVarChar(50), stationData.station_id || null)
        .input('description', sql.NVarChar(200), stationData.description || null)
        .query(`
            INSERT INTO work_stations (name, line_id, station_number, external_id, station_id, description, status)
            OUTPUT INSERTED.*
            VALUES (@name, @line_id, @station_number, @external_id, @station_id, @description, 'active')
        `);
    return result.recordset[0];
}

/**
 * Atualizar estação
 */
async function updateStation(id, stationData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('name', sql.NVarChar(200), stationData.name)
        .input('line_id', sql.UniqueIdentifier, stationData.line_id)
        .input('station_number', sql.Int, stationData.station_number || null)
        .input('external_id', sql.NVarChar(100), stationData.external_id || null)
        .input('station_id', sql.NVarChar(50), stationData.station_id || null)
        .input('description', sql.NVarChar(sql.MAX), stationData.description || null)
        .query(`
            UPDATE work_stations
            SET 
                name = @name,
                line_id = @line_id,
                station_number = @station_number,
                external_id = @external_id,
                station_id = @station_id,
                description = @description,
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

/**
 * Deletar estação (soft delete)
 */
async function deleteStation(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            UPDATE work_stations
            SET 
                status = 'inactive',
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return result.recordset[0];
}

module.exports = {
    getAllStations,
    getStationById,
    getStationByExternalId,
    createStation,
    updateStation,
    deleteStation,
};
