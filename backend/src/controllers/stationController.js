const stationService = require('../services/stationService');

/**
 * GET /api/stations
 * Obter todas as estações (com filtro opcional por linha)
 */
async function getAllStations(req, res, next) {
    try {
        const { lineId } = req.query;
        const stations = await stationService.getAllStations(lineId);
        res.json(stations);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/stations/:id
 * Obter estação por ID
 */
async function getStationById(req, res, next) {
    try {
        const station = await stationService.getStationById(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        res.json(station);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/stations/external/:externalId
 * Obter estação por external_id
 */
async function getStationByExternalId(req, res, next) {
    try {
        const station = await stationService.getStationByExternalId(req.params.externalId);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        res.json(station);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/stations
 * Criar nova estação
 */
async function createStation(req, res, next) {
    try {
        const station = await stationService.createStation(req.body);
        res.status(201).json(station);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/stations/:id
 * Atualizar estação
 */
async function updateStation(req, res, next) {
    try {
        const station = await stationService.updateStation(req.params.id, req.body);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        res.json(station);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/stations/:id
 * Deletar estação (soft delete)
 */
async function deleteStation(req, res, next) {
    try {
        const station = await stationService.deleteStation(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        res.json({ message: 'Station deleted successfully', station });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllStations,
    getStationById,
    getStationByExternalId,
    createStation,
    updateStation,
    deleteStation,
};
