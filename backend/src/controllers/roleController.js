const roleService = require('../services/roleService');

/**
 * GET /api/roles
 * Listar todas as roles
 */
async function getAllRoles(req, res, next) {
    try {
        const roles = await roleService.getAllRoles();
        res.json(roles);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/roles/:id
 * Obter role por ID
 */
async function getRoleById(req, res, next) {
    try {
        const role = await roleService.getRoleById(req.params.id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json(role);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/roles
 * Criar nova role
 */
async function createRole(req, res, next) {
    try {
        const role = await roleService.createRole(req.body);
        res.status(201).json(role);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/roles/:id
 * Atualizar role
 */
async function updateRole(req, res, next) {
    try {
        const role = await roleService.updateRole(req.params.id, req.body);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json(role);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/roles/:id
 * Deletar role
 */
async function deleteRole(req, res, next) {
    try {
        const role = await roleService.deleteRole(req.params.id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json({ message: 'Role deleted successfully', role });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
};
