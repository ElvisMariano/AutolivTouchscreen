const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController.js');

// GET /api/documents/station/:externalId/work-instruction
// ENDPOINT ESSENCIAL PARA DASHBOARD - Obter Work Instruction por station external_id
router.get('/station/:externalId/work-instruction', documentController.getWorkInstructionByStationExternalId);

// GET /api/documents - Listar documentos (com filtros opcionais)
router.get('/', documentController.getAllDocuments);

// GET /api/documents/:id - Obter documento por ID
router.get('/:id', documentController.getDocumentById);

// POST /api/documents - Criar documento
router.post('/', documentController.createDocument);

// PUT /api/documents/:id - Atualizar documento
router.put('/:id', documentController.updateDocument);

// DELETE /api/documents/:id - Deletar documento
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
