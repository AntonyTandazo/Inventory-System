const express = require('express');
const router = express.Router();
const categoriaController = require('./categoria.controller');

router.get('/', categoriaController.listar);
router.post('/', categoriaController.crear);
router.put('/:id', categoriaController.editar);
router.delete('/:id', categoriaController.eliminar);
router.post('/:id/restaurar', categoriaController.restaurar);

module.exports = router;
