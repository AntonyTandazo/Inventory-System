const clienteModel = require('./cliente.model');

const clienteController = {
    async listar(req, res) {
        try {
            const queryId = req.query ? req.query.usuarioId : null;
            const bodyId = req.body ? req.body.usuarioId : null;
            const usuarioId = parseInt(queryId || bodyId || 1, 10);
            const clientes = await clienteModel.obtenerTodos(usuarioId);
            res.json(clientes);
        } catch (error) {
            console.error('[CLIENTE] Error listing:', error);
            res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
        }
    },

    async getStats(req, res) {
        try {
            const queryId = req.query ? req.query.usuarioId : null;
            const bodyId = req.body ? req.body.usuarioId : null;
            const usuarioId = parseInt(queryId || bodyId || 1, 10);
            const stats = await clienteModel.getStatistics(usuarioId);
            res.json(stats);
        } catch (error) {
            console.error('[CLIENTE] Error getting stats:', error);
            res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
        }
    },

    async guardar(req, res) {
        try {
            const { usuarioId } = req.body;
            const usuarioIdInt = parseInt(usuarioId || 1, 10);
            const nuevo = await clienteModel.crear(req.body, usuarioIdInt);
            res.status(201).json(nuevo);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al guardar cliente', error: error.message });
        }
    },

    async editar(req, res) {
        try {
            const { id } = req.params;
            const editado = await clienteModel.actualizar(id, req.body);
            if (editado) {
                res.json(editado);
            } else {
                res.status(404).json({ mensaje: 'Cliente no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al editar cliente', error: error.message });
        }
    },

    async borrar(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await clienteModel.eliminar(id);
            if (eliminado) {
                res.json({ mensaje: 'Cliente eliminado correctamente' });
            } else {
                res.status(404).json({ mensaje: 'Cliente no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al eliminar cliente', error: error.message });
        }
    },

    async pagar(req, res) {
        try {
            const { id } = req.params;
            const { monto } = req.body;
            const exito = await clienteModel.registrarPago(id, monto);
            if (exito) {
                res.json({ mensaje: 'Pago registrado correctamente' });
            } else {
                res.status(404).json({ mensaje: 'Cliente no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al registrar pago', error: error.message });
        }
    }
};

module.exports = clienteController;
