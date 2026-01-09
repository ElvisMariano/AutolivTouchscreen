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

/**
 * GET /api/l2l/shift-production
 * Obter dados agregados de produção do turno
 * Query params: lineId, shiftStart, shiftEnd, siteId
 */
async function getShiftProductionData(req, res, next) {
    try {
        const { lineId, shiftStart, shiftEnd, siteId } = req.query;

        // Validação de parâmetros obrigatórios
        if (!lineId || !shiftStart || !shiftEnd || !siteId) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros obrigatórios: lineId, shiftStart, shiftEnd, siteId'
            });
        }

        console.log(`🔄 [Shift Production] Buscando dados do turno para linha ${lineId}, turno ${shiftStart} - ${shiftEnd}`);

        // Buscar todos os pitches do turno
        const pitches = await l2lApiService.getShiftProduction(
            lineId,
            shiftStart,
            shiftEnd,
            siteId
        );

        console.log(`✅ [Shift Production] ${pitches.length} pitches encontrados para o turno`);

        // Calcular métricas agregadas
        // demand = target (meta estabelecida)
        // actual = produção real
        // downtime_minutes = tempo de parada
        const target = pitches.reduce((sum, p) => sum + (parseFloat(p.demand) || 0), 0);
        const actuals = pitches.reduce((sum, p) => sum + (parseFloat(p.actual) || 0), 0);
        const scrap = pitches.reduce((sum, p) => sum + (parseFloat(p.scrap) || 0), 0);
        const downtimeMinutes = pitches.reduce((sum, p) => sum + (parseFloat(p.downtime_minutes) || 0), 0);

        // Calcular duração total do turno em minutos
        const shiftStartDate = new Date(shiftStart);
        const shiftEndDate = new Date(shiftEnd);
        const totalShiftMinutes = (shiftEndDate - shiftStartDate) / (1000 * 60);

        // Calcular tempo disponível (descontando downtime)
        const availableMinutes = Math.max(0, totalShiftMinutes - downtimeMinutes);

        // Calcular target ajustado pelo tempo disponível
        const targetAdjusted = totalShiftMinutes > 0
            ? target * (availableMinutes / totalShiftMinutes)
            : target;

        // Calcular eficiência sobre o tempo disponível: (actual / target ajustado) * 100
        const efficiency = targetAdjusted > 0 ? ((actuals / targetAdjusted) * 100) : 0;

        console.log(`📊 [Shift Production] Cálculo de eficiência:`, {
            totalShiftMinutes: totalShiftMinutes.toFixed(1),
            downtimeMinutes: downtimeMinutes.toFixed(1),
            availableMinutes: availableMinutes.toFixed(1),
            targetOriginal: Math.floor(target),
            targetAdjusted: Math.floor(targetAdjusted),
            actuals: Math.floor(actuals),
            efficiency: efficiency.toFixed(1) + '%'
        });

        // Converter downtime para formato HH:MM:SS
        const hours = Math.floor(downtimeMinutes / 60);
        const minutes = Math.floor(downtimeMinutes % 60);
        const seconds = Math.floor((downtimeMinutes % 1) * 60);
        const downtimeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const responseData = {
            target: Math.floor(target),
            actuals: Math.floor(actuals),
            efficiency: parseFloat(efficiency.toFixed(1)),
            downtimeMinutes: Math.floor(downtimeMinutes),
            downtimeFormatted,
            scrap: Math.floor(scrap),
            pitchCount: pitches.length
        };

        console.log(`📊 [Shift Production] Métricas calculadas:`, responseData);

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('❌ [Shift Production] Erro ao buscar dados do turno:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar dados de produção do turno',
            details: error.message
        });
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
    getShiftProductionData,
};
