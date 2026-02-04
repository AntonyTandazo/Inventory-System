const express = require('express');
const router = express.Router();
const pagoController = require('./pago.controller');

router.get('/', pagoController.obtenerHistorial);
router.post('/', pagoController.registrar);
router.get('/stats', pagoController.getStats);

module.exports = router;
