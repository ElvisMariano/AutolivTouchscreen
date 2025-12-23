const userService = require('../services/userService');

/**
 * GET /api/users
 * Listar todos os usuários
 */
async function getAllUsers(req, res, next) {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/users/:id
 * Obter usuário por ID
 */
async function getUserById(req, res, next) {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/users
 * Criar novo usuário
 */
async function createUser(req, res, next) {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/users/:id
 * Atualizar usuário
 */
async function updateUser(req, res, next) {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/users/:id
 * Deletar usuário (soft delete)
 */
async function deleteUser(req, res, next) {
    try {
        const user = await userService.deleteUser(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully', user });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/users/:id/plants
 * Obter plantas do usuário
 */
async function getUserPlants(req, res, next) {
    try {
        const plants = await userService.getUserPlants(req.params.id);
        res.json(plants);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/users/:id/plants
 * Associar usuário a uma planta
 */
async function assignUserToPlant(req, res, next) {
    try {
        const { plantId } = req.body;
        if (!plantId) {
            return res.status(400).json({ error: 'plantId is required' });
        }
        const result = await userService.assignUserToPlant(req.params.id, plantId);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/users/:id/plants/:plantId
 * Remover associação usuário-planta
 */
async function removeUserFromPlant(req, res, next) {
    try {
        await userService.removeUserFromPlant(req.params.id, req.params.plantId);
        res.json({ message: 'User removed from plant successfully' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserPlants,
    assignUserToPlant,
    removeUserFromPlant,
};
