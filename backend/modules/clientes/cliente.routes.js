const express = require('express');
const router = express.Router();
const clienteController = require('./cliente.controller');

router.get('/stats', clienteController.getStats);
router.get('/', clienteController.listar);
router.post('/', clienteController.guardar);
router.put('/:id', clienteController.editar);
router.delete('/:id', clienteController.borrar);
router.post('/:id/pago', clienteController.pagar);

module.exports = router;
