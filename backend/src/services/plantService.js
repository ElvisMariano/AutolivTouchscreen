const { getPool, sql } = require('../config/database');

/**
 * Helper para parsear dados da planta (JSON strings)
 */
function parsePlant(plant) {
    if (!plant) return null;
    if (plant.shift_config && typeof plant.shift_config === 'string') {
        try {
            plant.shift_config = JSON.parse(plant.shift_config);
        } catch (e) {
            console.error('Erro ao parsear shift_config:', e);
            plant.shift_config = [];
        }
    }
    return plant;
}

/**
 * Obter todas as plantas ativas
 */
async function getAllPlants() {
    const pool = await getPool();
    const result = await pool.request()
        .query(`
            SELECT 
                id, name, location, status, shift_config, 
                external_id, created_at, updated_at, created_by
            FROM plants
            WHERE status = 'active'
            ORDER BY name
        `);
    return result.recordset.map(parsePlant);
}

/**
 * Obter planta por ID
 */
async function getPlantById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            SELECT 
                id, name, location, status, shift_config,
                external_id, created_at, updated_at, created_by
            FROM plants
            WHERE id = @id
        `);
    return parsePlant(result.recordset[0]);
}

/**
 * Criar nova planta
 */
async function createPlant(plantData) {
    const pool = await getPool();
    const result = await pool.request()
        .input('name', sql.NVarChar(200), plantData.name)
        .input('location', sql.NVarChar(500), plantData.location || null)
        .input('shift_config', sql.NVarChar(sql.MAX), plantData.shift_config ? JSON.stringify(plantData.shift_config) : null)
        .input('external_id', sql.NVarChar(100), plantData.external_id || null)
        .input('created_by', sql.UniqueIdentifier, plantData.created_by || null)
        .query(`
            INSERT INTO plants (name, location, shift_config, external_id, created_by, status)
            OUTPUT INSERTED.*
            VALUES (@name, @location, @shift_config, @external_id, @created_by, 'active')
        `);
    return parsePlant(result.recordset[0]);
}

/**
 * Atualizar planta
 */
async function updatePlant(id, plantData) {
    const pool = await getPool();

    // Construção dinâmica da query de update
    const updates = [];
    const request = pool.request().input('id', sql.UniqueIdentifier, id);

    if (plantData.name !== undefined) {
        request.input('name', sql.NVarChar(200), plantData.name);
        updates.push('name = @name');
    }

    if (plantData.location !== undefined) {
        request.input('location', sql.NVarChar(500), plantData.location);
        updates.push('location = @location');
    }

    if (plantData.shift_config !== undefined) {
        const shiftsJson = plantData.shift_config ? JSON.stringify(plantData.shift_config) : null;
        request.input('shift_config', sql.NVarChar(sql.MAX), shiftsJson);
        updates.push('shift_config = @shift_config');
    }

    if (plantData.external_id !== undefined) {
        request.input('external_id', sql.NVarChar(100), plantData.external_id);
        updates.push('external_id = @external_id');
    }

    if (plantData.status !== undefined) {
        // Permitir atualizar status também se necessário
        request.input('status', sql.NVarChar(50), plantData.status);
        updates.push('status = @status');
    }

    if (updates.length === 0) {
        // Nada para atualizar, retornar registro atual
        return getPlantById(id);
    }

    updates.push('updated_at = SYSDATETIMEOFFSET()');

    const query = `
        UPDATE plants
        SET 
            ${updates.join(', ')}
        OUTPUT INSERTED.*
        WHERE id = @id
    `;

    const result = await request.query(query);
    return parsePlant(result.recordset[0]);
}

/**
 * Deletar planta (soft delete)
 */
async function deletePlant(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
            UPDATE plants
            SET 
                status = 'inactive',
                updated_at = SYSDATETIMEOFFSET()
            OUTPUT INSERTED.*
            WHERE id = @id
        `);
    return parsePlant(result.recordset[0]);
}

module.exports = {
    getAllPlants,
    getPlantById,
    createPlant,
    updatePlant,
    deletePlant,
};
