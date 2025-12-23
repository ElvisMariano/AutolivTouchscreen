const express = require('express');
const router = express.Router();
const acknowledgmentController = require('../controllers/acknowledgmentController.js');

// GET /api/acknowledgments - Listar acknowledgments (filtros opcionais)
router.get('/', acknowledgmentController.getAcknowledgments);

// POST /api/acknowledgments - Criar acknowledgment (Confirmar leitura)
router.post('/', acknowledgmentController.createAcknowledgment);

module.exports = router;
