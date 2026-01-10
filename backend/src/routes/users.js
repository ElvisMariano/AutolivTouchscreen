const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const { requirePermission } = require('../middleware/permissions');

// GET /api/users - Listar usuários (Necessário para sync do frontend, aberto a autênticados)
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Obter usuário por ID
router.get('/:id', userController.getUserById);

// GET /api/users/:id/plants - Obter plantas do usuário
router.get('/:id/plants', userController.getUserPlants);

// POST /api/users - Criar usuário
router.post('/', requirePermission('users'), userController.createUser);

// POST /api/users/:id/plants - Associar usuário a planta
router.post('/:id/plants', requirePermission('users'), userController.assignUserToPlant);

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', requirePermission('users'), userController.updateUser);

// DELETE /api/users/:id - Deletar usuário
router.delete('/:id', requirePermission('users'), userController.deleteUser);

// DELETE /api/users/:id/plants/:plantId - Remover associação usuário-planta
router.delete('/:id/plants/:plantId', requirePermission('users'), userController.removeUserFromPlant);

module.exports = router;
