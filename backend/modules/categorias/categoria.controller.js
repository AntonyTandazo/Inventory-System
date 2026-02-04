const categoriaModel = require('./categoria.model');

const categoriaController = {
    async listar(req, res) {
        try {
            const queryId = req.query ? req.query.usuarioId : null;
            const bodyId = req.body ? req.body.usuarioId : null;
            const usuarioId = parseInt(queryId || bodyId || 1, 10);
            console.log('[CATEGORIA] Listing for user:', usuarioId);
            const categorias = await categoriaModel.obtenerTodas(usuarioId);
            console.log('[CATEGORIA] Found', categorias.length, 'categories');
            res.json(categorias);
        } catch (error) {
            console.error('[CATEGORIA] Error listing:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async crear(req, res) {
        try {
            const { nombre } = req.body;
            const usuarioId = parseInt(req.body ? req.body.usuarioId : 1, 10);
            const existente = await categoriaModel.buscarPorNombre(nombre, usuarioId);

            if (existente) {
                if (existente.ACTIVO == 0) {
                    return res.status(409).json({
                        mensaje: `La categoría "${nombre}" ya existe pero fue eliminada.`,
                        puedeRestaurar: true,
                        id: existente.ID
                    });
                } else {
                    return res.status(409).json({
                        mensaje: `La categoría "${nombre}" ya existe.`,
                        puedeRestaurar: false
                    });
                }
            }

            const nueva = await categoriaModel.crear(nombre, usuarioId);
            res.status(201).json(nueva);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async editar(req, res) {
        try {
            const { id } = req.params;
            const { nombre } = req.body;
            await categoriaModel.actualizar(id, nombre);
            res.json({ mensaje: 'Categoría actualizada' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await categoriaModel.eliminar(id);
            res.json({ mensaje: 'Categoría eliminada (Soft Delete)' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async restaurar(req, res) {
        try {
            const { id } = req.params;
            await categoriaModel.restaurar(id);
            res.json({ mensaje: 'Categoría restaurada' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = categoriaController;
