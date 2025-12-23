const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController.js');

// GET /api/alerts/active - Obter alertas ativos (ANTES do /:id para não conflitar)
router.get('/active', alertController.getActiveAlerts);

// GET /api/alerts - Listar alertas (com filtros opcionais)
router.get('/', alertController.getAllAlerts);

// GET /api/alerts/:id - Obter alerta por ID
router.get('/:id', alertController.getAlertById);

// POST /api/alerts - Criar alerta
router.post('/', alertController.createAlert);

// POST /api/alerts/:id/resolve - Resolver alerta
router.post('/:id/resolve', alertController.resolveAlert);

// PUT /api/alerts/:id - Atualizar alerta
router.put('/:id', alertController.updateAlert);

// DELETE /api/alerts/:id - Deletar alerta
router.delete('/:id', alertController.deleteAlert);

module.exports = router;
