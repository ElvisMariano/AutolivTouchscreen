const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController.js');

// GET /api/roles - Listar roles
router.get('/', roleController.getAllRoles);

// GET /api/roles/:id - Obter role por ID
router.get('/:id', roleController.getRoleById);

// POST /api/roles - Criar role
router.post('/', roleController.createRole);

// PUT /api/roles/:id - Atualizar role
router.put('/:id', roleController.updateRole);

// DELETE /api/roles/:id - Deletar role
router.delete('/:id', roleController.deleteRole);

module.exports = router;
