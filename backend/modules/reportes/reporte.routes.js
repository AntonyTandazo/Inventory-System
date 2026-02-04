const express = require('express');
const router = express.Router();
const reporteController = require('./reporte.controller');

router.get('/general', reporteController.getGeneral);
router.get('/productos', reporteController.getProductos);
router.get('/clientes', reporteController.getClientes);
router.get('/categorias', reporteController.getCategorias);

module.exports = router;
