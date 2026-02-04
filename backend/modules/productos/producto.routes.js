const express = require('express');
const router = express.Router();
const productoController = require('./producto.controller');

router.get('/', productoController.listar);
router.get('/stats', productoController.getStats);
router.post('/', productoController.guardar);
router.put('/:id', productoController.editar);
router.delete('/:id', productoController.eliminar);
router.post('/:id/restaurar', productoController.restaurar);

module.exports = router;
