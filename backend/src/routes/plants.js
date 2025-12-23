const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');

// GET /api/plants - Obter todas as plantas
router.get('/', plantController.getAllPlants);

// GET /api/plants/:id - Obter planta por ID
router.get('/:id', plantController.getPlantById);

// POST /api/plants - Criar nova planta
router.post('/', plantController.createPlant);

// PUT /api/plants/:id - Atualizar planta
router.put('/:id', plantController.updatePlant);

// DELETE /api/plants/:id - Deletar planta (soft delete)
router.delete('/:id', plantController.deletePlant);

module.exports = router;
