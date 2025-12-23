const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController.js');

// GET /api/stations - Listar estações (com filtro opcional ?lineId=xxx)
router.get('/', stationController.getAllStations);

// GET /api/stations/external/:externalId - Obter estação por external_id
router.get('/external/:externalId', stationController.getStationByExternalId);

// GET /api/stations/:id - Obter estação por ID
router.get('/:id', stationController.getStationById);

// POST /api/stations - Criar estação
router.post('/', stationController.createStation);

// PUT /api/stations/:id - Atualizar estação
router.put('/:id', stationController.updateStation);

// DELETE /api/stations/:id - Deletar estação
router.delete('/:id', stationController.deleteStation);

module.exports = router;
