const alertService = require('../services/alertService');

/**
 * GET /api/alerts
 * Listar alertas (com filtros opcionais)
 */
async function getAllAlerts(req, res, next) {
    try {
        const filters = {
            lineId: req.query.lineId,
            status: req.query.status,
            priority: req.query.priority,
        };
        const alerts = await alertService.getAllAlerts(filters);
        res.json(alerts);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/alerts/active
 * Obter alertas ativos
 */
async function getActiveAlerts(req, res, next) {
    try {
        const lineId = req.query.lineId;
        const alerts = await alertService.getActiveAlerts(lineId);
        res.json(alerts);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/alerts/:id
 * Obter alerta por ID
 */
async function getAlertById(req, res, next) {
    try {
        const alert = await alertService.getAlertById(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        res.json(alert);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/alerts
 * Criar novo alerta
 */
async function createAlert(req, res, next) {
    try {
        const alert = await alertService.createAlert(req.body);
        res.status(201).json(alert);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/alerts/:id/resolve
 * Resolver alerta
 */
async function resolveAlert(req, res, next) {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const alert = await alertService.resolveAlert(req.params.id, userId);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        res.json(alert);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/alerts/:id
 * Atualizar alerta
 */
async function updateAlert(req, res, next) {
    try {
        const alert = await alertService.updateAlert(req.params.id, req.body);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        res.json(alert);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/alerts/:id
 * Deletar alerta
 */
async function deleteAlert(req, res, next) {
    try {
        const alert = await alertService.deleteAlert(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        res.json({ message: 'Alert deleted successfully', alert });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllAlerts,
    getActiveAlerts,
    getAlertById,
    createAlert,
    resolveAlert,
    updateAlert,
    deleteAlert,
};
