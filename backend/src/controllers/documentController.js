const documentService = require('../services/documentService');

/**
 * GET /api/documents
 * Obter todos os documentos (com filtros opcionais)
 */
async function getAllDocuments(req, res, next) {
    try {
        const filters = {
            lineId: req.query.lineId,
            stationId: req.query.stationId,
            category: req.query.category,
        };
        const documents = await documentService.getAllDocuments(filters);
        res.json(documents);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/documents/station/:externalId/work-instruction
 * Obter Work Instruction de uma estação pelo external_id
 * ENDPOINT ESSENCIAL PARA DASHBOARD
 */
async function getWorkInstructionByStationExternalId(req, res, next) {
    try {
        const document = await documentService.getWorkInstructionByStationExternalId(req.params.externalId);
        if (!document) {
            return res.status(404).json({ error: 'Work Instruction not found for this station' });
        }
        res.json(document);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/documents/:id
 * Obter documento por ID
 */
async function getDocumentById(req, res, next) {
    try {
        const document = await documentService.getDocumentById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(document);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/documents
 * Criar novo documento
 */
async function createDocument(req, res, next) {
    try {
        const document = await documentService.createDocument(req.body);
        res.status(201).json(document);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/documents/:id
 * Atualizar documento
 */
async function updateDocument(req, res, next) {
    try {
        const document = await documentService.updateDocument(req.params.id, req.body);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(document);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/documents/:id
 * Deletar documento
 */
async function deleteDocument(req, res, next) {
    try {
        const document = await documentService.deleteDocument(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({ message: 'Document deleted successfully', document });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllDocuments,
    getWorkInstructionByStationExternalId,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
};
