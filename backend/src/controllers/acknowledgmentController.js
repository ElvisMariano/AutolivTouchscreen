const db = require('../config/database'); // Assuming database connection is here? Check other controllers.
// Wait, I should check how other controllers access DB.
// Usually it's via a service or direct DB.
// Let's assume service pattern or check userController.js (Step 118).
// It used `userService`.
// So I should create acknowledgmentService.js.

const acknowledgmentService = require('../services/acknowledgmentService');

async function getAcknowledgments(req, res, next) {
    try {
        console.log('🔍 Controller: getAcknowledgments called');
        const filters = req.query; // { documentIds, shift }
        const data = await acknowledgmentService.getAcknowledgments(filters);
        res.json(data);
    } catch (error) {
        next(error);
    }
}

async function createAcknowledgment(req, res, next) {
    try {
        const { document_id, shift, user_id } = req.body;
        const data = await acknowledgmentService.createAcknowledgment({ document_id, shift, user_id });
        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAcknowledgments,
    createAcknowledgment
};
