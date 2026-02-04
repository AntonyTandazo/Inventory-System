const pagoModel = require('./pago.model');

const pagoController = {
    async registrar(req, res) {
        try {
            const usuarioId = req.body.usuarioId || 1; // TODO: Get from session/token
            const pago = await pagoModel.registrar(req.body, usuarioId);
            res.json(pago);
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: error.message || 'Error al registrar pago' });
        }
    },

    async obtenerHistorial(req, res) {
        try {
            const usuarioId = req.query.usuarioId || 1; // TODO: Get from session/token
            const pagos = await pagoModel.obtenerHistorial(usuarioId);
            res.json(pagos);
        } catch (error) {
            console.error('Error al obtener historial:', error);
            res.status(500).json({ message: 'Error al obtener historial' });
        }
    },

    async getStats(req, res) {
        try {
            const usuarioId = req.query.usuarioId || 1; // TODO: Get from session/token
            const stats = await pagoModel.getStatistics(usuarioId);
            res.json(stats);
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({ message: 'Error al obtener estadísticas' });
        }
    }
};

module.exports = pagoController;
