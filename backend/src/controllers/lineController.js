const lineService = require('../services/lineService');

/**
 * GET /api/lines
 * Obter todas as linhas (com filtro opcional por planta)
 */
async function getAllLines(req, res, next) {
    try {
        const { plantId } = req.query;
        const lines = await lineService.getAllLines(plantId);
        res.json(lines);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/lines/:id
 * Obter linha por ID
 */
async function getLineById(req, res, next) {
    try {
        const line = await lineService.getLineById(req.params.id);
        if (!line) {
            return res.status(404).json({ error: 'Line not found' });
        }
        res.json(line);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/lines
 * Criar nova linha
 */
async function createLine(req, res, next) {
    try {
        const line = await lineService.createLine(req.body);
        res.status(201).json(line);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/lines/:id
 * Atualizar linha
 */
async function updateLine(req, res, next) {
    try {
        const line = await lineService.updateLine(req.params.id, req.body);
        if (!line) {
            return res.status(404).json({ error: 'Line not found' });
        }
        res.json(line);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/lines/:id
 * Deletar linha (soft delete)
 */
async function deleteLine(req, res, next) {
    try {
        const line = await lineService.deleteLine(req.params.id);
        if (!line) {
            return res.status(404).json({ error: 'Line not found' });
        }
        res.json({ message: 'Line deleted successfully', line });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllLines,
    getLineById,
    createLine,
    updateLine,
    deleteLine,
};
