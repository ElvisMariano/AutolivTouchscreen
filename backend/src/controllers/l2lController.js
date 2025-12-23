const l2lApiService = require('../services/l2lApiService');
const l2lSyncService = require('../services/l2lSyncService');

/**
 * GET /api/l2l/test-connection
 * Testar conexão com API L2L
 */
async function testConnection(req, res, next) {
    try {
        const isConnected = await l2lApiService.testConnection();
        res.json({
            status: isConnected ? 'connected' : 'disconnected',
            message: isConnected ? 'Conexão com API L2L OK' : 'Falha ao conectar com API L2L',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/l2l/sync/plants
 * Sincronizar plantas de L2L
 */
async function syncPlants(req, res, next) {
    try {
        const userId = req.body.userId || null;
        const result = await l2lSyncService.syncPlants(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/l2l/sync/lines
 * Sincronizar lines para todas as plantas com Site ID configurado
 */
async function syncLines(req, res, next) {
    try {
        const userId = req.body.userId || null;
        const result = await l2lSyncService.syncLines(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/l2l/sync/machines
 * Sincronizar machines para todas as linhas
 */
async function syncMachines(req, res, next) {
    try {
        const userId = req.body.userId || null;
        const result = await l2lSyncService.syncMachines(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/l2l/sync/documents
 * Sincronizar documentos (Work Instructions)
 */
async function syncDocuments(req, res, next) {
    try {
        const userId = req.body.userId || null;
        const result = await l2lSyncService.syncDocuments(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/l2l/sync/all
 * Sincronizar tudo
 */
async function syncAll(req, res, next) {
    try {
        const userId = req.body.userId || null;
        const result = await l2lSyncService.syncAll(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/l2l/logs
 * Obter logs de sincronização
 */
async function getLogs(req, res, next) {
    try {
        const { getPool } = require('../config/database');
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT TOP 50 
                    id, sync_type, status, records_created, records_updated, 
                    records_deactivated, errors, synced_by, synced_at
                FROM l2l_sync_logs
                ORDER BY synced_at DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    testConnection,
    syncPlants,
    syncLines,
    syncMachines,
    syncDocuments,
    syncAll,
    getLogs,
};
