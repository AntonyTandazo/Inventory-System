const reporteModel = require('./reporte.model');

const reporteController = {
    async getGeneral(req, res) {
        try {
            const { rango } = req.query; // mes, trimestre, anio
            const usuarioId = parseInt(req.query.usuarioId || 1, 10);
            const data = await reporteModel.getGeneralStats(rango || 'mes', usuarioId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getProductos(req, res) {
        try {
            const { rango } = req.query;
            const usuarioId = parseInt(req.query.usuarioId || 1, 10);
            const data = await reporteModel.getTopProductos(rango || 'mes', usuarioId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getClientes(req, res) {
        try {
            const { rango } = req.query;
            const usuarioId = parseInt(req.query.usuarioId || 1, 10);
            const data = await reporteModel.getTopClientes(rango || 'mes', usuarioId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getCategorias(req, res) {
        try {
            const { rango } = req.query;
            const usuarioId = parseInt(req.query.usuarioId || 1, 10);
            const data = await reporteModel.getVentasPorCategoria(rango || 'mes', usuarioId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = reporteController;
