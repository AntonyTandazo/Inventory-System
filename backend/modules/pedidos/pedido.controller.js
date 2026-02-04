const pedidoModel = require('./pedido.model');

const pedidoController = {
    async guardar(req, res) {
        try {
            console.log('[PEDIDO] Recibiendo pedido:', JSON.stringify(req.body, null, 2));
            const { usuarioId, ...pedido } = req.body;
            const usuarioIdInt = parseInt(usuarioId || 1, 10);
            console.log('[PEDIDO] Usuario ID:', usuarioIdInt);
            console.log('[PEDIDO] Pedido a crear:', JSON.stringify(pedido, null, 2));

            const nuevoPedido = await pedidoModel.crear(pedido, usuarioIdInt);
            console.log('[PEDIDO] Pedido creado exitosamente:', nuevoPedido.ID);
            res.status(201).json(nuevoPedido);
        } catch (error) {
            console.error('[PEDIDO] Error completo:', error);
            console.error('[PEDIDO] Error message:', error.message);
            console.error('[PEDIDO] Error stack:', error.stack);
            res.status(500).json({
                error: error.message,
                details: error.stack,
                code: 'PEDIDO_CREATE_ERROR'
            });
        }
    },

    async actualizarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            await pedidoModel.actualizarEstado(id, estado);
            res.json({ mensaje: 'Estado actualizado' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async registrarPago(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body; // PAGADO, DEUDA
            await pedidoModel.registrarPago(id, estado);

            // Si es DEUDA, deberíamos sumar a la deuda del cliente (Lógica adicional)
            // Aquí simplificamos solo marcando el pedido

            res.json({ mensaje: 'Pago registrado' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async listar(req, res) {
        try {
            const queryId = req.query ? req.query.usuarioId : null;
            const bodyId = req.body ? req.body.usuarioId : null;
            const usuarioId = parseInt(queryId || bodyId || 1, 10);
            const pedidos = await pedidoModel.obtenerTodos(usuarioId);
            res.json(pedidos);
        } catch (error) {
            console.error('[PEDIDO] Error listing:', error);
            res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
        }
    },

    async obtenerStatsEntregas(req, res) {
        try {
            const usuarioId = parseInt((req.body && req.body.usuarioId) || (req.query && req.query.usuarioId) || 1, 10);
            const stats = await pedidoModel.obtenerStatsEntregas(usuarioId);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = pedidoController;
