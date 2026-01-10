const express = require('express');
const router = express.Router();
const l2lController = require('../controllers/l2lController');
const { requirePermission } = require('../middleware/permissions');

// GET /api/l2l/test-connection - Testar conexão com API L2L
router.get('/test-connection', l2lController.testConnection);

// POST /api/l2l/sync/plants - Sincronizar plants
router.post('/sync/plants', requirePermission('admin:manage_l2l_sync'), l2lController.syncPlants);

// POST /api/l2l/sync/lines - Sincronizar lines (requer Site ID nas plantas)
router.post('/sync/lines', requirePermission('admin:manage_l2l_sync'), l2lController.syncLines);

// POST /api/l2l/sync/machines - Sincronizar machines
router.post('/sync/machines', requirePermission('admin:manage_l2l_sync'), l2lController.syncMachines);

// POST /api/l2l/sync/documents - Sincronizar documentos (Work Instructions)
router.post('/sync/documents', requirePermission('admin:manage_l2l_sync'), l2lController.syncDocuments);

// POST /api/l2l/sync/all - Sincronizar tudo
router.post('/sync/all', requirePermission('admin:manage_l2l_sync'), l2lController.syncAll);

// GET /api/l2l/logs - Obter logs de sincronização
router.get('/logs', requirePermission('admin:view_l2l_sync'), l2lController.getLogs);

// GET /api/l2l/shift-production - Obter dados de produção do turno
router.get('/shift-production', l2lController.getShiftProductionData);

module.exports = router;
