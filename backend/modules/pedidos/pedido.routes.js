const express = require('express');
const router = express.Router();
const pedidoController = require('./pedido.controller');

router.get('/stats/entregas', pedidoController.obtenerStatsEntregas);
router.get('/', pedidoController.listar);
router.post('/', pedidoController.guardar);
router.patch('/:id/estado', pedidoController.actualizarEstado);
router.patch('/:id/pago', pedidoController.registrarPago);

module.exports = router;
