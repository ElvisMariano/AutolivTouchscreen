const express = require('express');
const router = express.Router();
const lineController = require('../controllers/lineController.js');

// GET /api/lines - Listar linhas (com filtro opcional ?plantId=xxx)
router.get('/', lineController.getAllLines);

// GET /api/lines/:id - Obter linha por ID
router.get('/:id', lineController.getLineById);

// POST /api/lines - Criar linha
router.post('/', lineController.createLine);

// PUT /api/lines/:id - Atualizar linha
router.put('/:id', lineController.updateLine);

// DELETE /api/lines/:id - Deletar linha
router.delete('/:id', lineController.deleteLine);

module.exports = router;
