const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');

// GET /api/users - Listar usuários
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Obter usuário por ID
router.get('/:id', userController.getUserById);

// GET /api/users/:id/plants - Obter plantas do usuário
router.get('/:id/plants', userController.getUserPlants);

// POST /api/users - Criar usuário
router.post('/', userController.createUser);

// POST /api/users/:id/plants - Associar usuário a planta
router.post('/:id/plants', userController.assignUserToPlant);

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Deletar usuário
router.delete('/:id', userController.deleteUser);

// DELETE /api/users/:id/plants/:plantId - Remover associação usuário-planta
router.delete('/:id/plants/:plantId', userController.removeUserFromPlant);

module.exports = router;
