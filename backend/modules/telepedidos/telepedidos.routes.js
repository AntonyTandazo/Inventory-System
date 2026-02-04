const express = require('express');
const router = express.Router();
const telepedidosController = require('./telepedidos.controller');

router.get('/', telepedidosController.listar);
router.post('/', telepedidosController.guardar);

module.exports = router;
