const productoModel = require('./producto.model');

const productoController = {
    async listar(req, res) {
        try {
            console.log('[CONTROLLER] Request method:', req.method);
            console.log('[CONTROLLER] Request URL:', req.url);
            console.log('[CONTROLLER] req.query:', req.query);
            console.log('[CONTROLLER] req.body:', req.body);

            // Safe extraction with null checks
            const queryId = req.query ? req.query.usuarioId : null;
            const bodyId = req.body ? req.body.usuarioId : null;
            const usuarioId = parseInt(queryId || bodyId || 1, 10);

            console.log('[CONTROLLER] Listing products for user:', usuarioId);
            const productos = await productoModel.obtenerTodos(usuarioId, false);
            res.json(productos);
        } catch (error) {
            console.error('[CONTROLLER] Error listing products:', error);
            res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
        }
    },

    async getStats(req, res) {
        try {
            const queryId = req.query ? req.query.usuarioId : null;
            const bodyId = req.body ? req.body.usuarioId : null;
            const usuarioId = parseInt(queryId || bodyId || 1, 10);
            const stats = await productoModel.getStatistics(usuarioId);
            res.json(stats);
        } catch (error) {
            console.error('[CONTROLLER] Error getting stats:', error);
            res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
        }
    },

    async guardar(req, res) {
        try {
            const { CODIGO, NOMBRE, usuarioId } = req.body;
            const usuarioIdInt = parseInt(usuarioId || 1, 10);

            // Check conflicts
            const existingCode = await productoModel.buscarPorCodigo(CODIGO, usuarioIdInt);
            if (existingCode) {
                if (existingCode.ACTIVO == 0) {
                    return res.status(409).json({
                        mensaje: `El producto con código ${CODIGO} ya existe pero fue eliminado.`,
                        puedeRestaurar: true,
                        id: existingCode.ID,
                        tipo: 'codigo'
                    });
                }
                return res.status(400).json({ mensaje: `El código ${CODIGO} ya está en uso.` });
            }

            const existingName = await productoModel.buscarPorNombre(NOMBRE, usuarioIdInt);
            if (existingName) {
                if (existingName.ACTIVO == 0) {
                    return res.status(409).json({
                        mensaje: `El producto "${NOMBRE}" ya existe pero fue eliminado.`,
                        puedeRestaurar: true,
                        id: existingName.ID,
                        tipo: 'nombre'
                    });
                }
                return res.status(400).json({ mensaje: `El producto "${NOMBRE}" ya existe.` });
            }

            const nuevoProducto = await productoModel.crear(req.body, usuarioIdInt);
            res.status(201).json(nuevoProducto);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al guardar producto', error: error.message });
        }
    },

    async editar(req, res) {
        try {
            const { id } = req.params;
            const productoEditado = await productoModel.actualizar(id, req.body);
            if (productoEditado) {
                res.json(productoEditado);
            } else {
                res.status(404).json({ mensaje: 'Producto no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al editar producto', error: error.message });
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const { pin, usuarioId } = req.body;

            // Validar que se envió el PIN
            if (!pin) {
                return res.status(400).json({
                    mensaje: 'Se requiere PIN de seguridad para eliminar'
                });
            }

            // Validar PIN usando configModel
            const configModel = require('../config/config.model');
            const pinCorrecto = await configModel.verifyPin(pin, usuarioId);

            if (!pinCorrecto) {
                return res.status(403).json({
                    mensaje: 'PIN de seguridad incorrecto'
                });
            }

            // Si el PIN es correcto, proceder con la eliminación
            const eliminado = await productoModel.eliminar(id);
            if (eliminado) {
                res.json({ mensaje: 'Producto eliminado correctamente' });
            } else {
                res.status(404).json({ mensaje: 'Producto no encontrado' });
            }
        } catch (error) {
            console.error('[CONTROLLER] Error deleting product:', error);
            res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
        }
    },

    async restaurar(req, res) {
        try {
            const { id } = req.params;
            const restaurado = await productoModel.restaurar(id);
            if (restaurado) {
                res.json({ mensaje: 'Producto restaurado correctamente' });
            } else {
                res.status(404).json({ mensaje: 'Producto no encontrado para restaurar' });
            }
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al restaurar producto', error: error.message });
        }
    }
};

module.exports = productoController;
