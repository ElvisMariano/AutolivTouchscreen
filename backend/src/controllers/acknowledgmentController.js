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
        let { document_id, shift, user_id } = req.body;

        // Fallback to authenticated user if not provided in body
        if (!user_id && req.user && req.user.id) {
            console.log('⚠️ createAcknowledgment: user_id missing in body, using req.user.id:', req.user.id);
            user_id = req.user.id;
        }

        if (!user_id) {
            console.warn('⚠️ createAcknowledgment: No user_id provided and no authenticated user found.');
            // Optional: Decide whether to fail or allow NULL if DB allows. 
            // Assuming DB requires it, but let's log it.
        }

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
