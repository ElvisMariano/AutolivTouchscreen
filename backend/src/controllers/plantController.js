const plantService = require('../services/plantService');

/**
 * GET /api/plants
 * Obter todas as plantas
 */
async function getAllPlants(req, res, next) {
    try {
        const plants = await plantService.getAllPlants();
        res.json(plants);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/plants/:id
 * Obter planta por ID
 */
async function getPlantById(req, res, next) {
    try {
        const plant = await plantService.getPlantById(req.params.id);
        if (!plant) {
            return res.status(404).json({ error: 'Plant not found' });
        }
        res.json(plant);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/plants
 * Criar nova planta
 */
async function createPlant(req, res, next) {
    try {
        const plant = await plantService.createPlant(req.body);
        res.status(201).json(plant);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/plants/:id
 * Atualizar planta
 */
async function updatePlant(req, res, next) {
    try {
        const plant = await plantService.updatePlant(req.params.id, req.body);
        if (!plant) {
            return res.status(404).json({ error: 'Plant not found' });
        }
        res.json(plant);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/plants/:id
 * Deletar planta (soft delete)
 */
async function deletePlant(req, res, next) {
    try {
        const plant = await plantService.deletePlant(req.params.id);
        if (!plant) {
            return res.status(404).json({ error: 'Plant not found' });
        }
        res.json({ message: 'Plant deleted successfully', plant });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllPlants,
    getPlantById,
    createPlant,
    updatePlant,
    deletePlant,
};
