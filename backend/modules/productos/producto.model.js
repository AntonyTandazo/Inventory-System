const { getConnection, USE_SIMULATION } = require('../../config/database');

const productoModel = {
    async obtenerTodos(usuarioId = 1, incluirInactivos = false) {
        if (USE_SIMULATION) {
            return incluirInactivos ? productosSimulados : productosSimulados.filter(p => p.ACTIVO == 1);
        }

        const conn = await getConnection();
        const baseWhere = incluirInactivos
            ? 'p.USUARIO_ID = :usuarioId'
            : 'p.ACTIVO = 1 AND p.USUARIO_ID = :usuarioId';


        const sql = `SELECT p.ID, p.USUARIO_ID, p.CATEGORIA_ID, p.CODIGO, p.NOMBRE,
             p.PRECIO_VENTA AS PRECIO, p.PRECIO_COSTO, p.STOCK, p.STOCK_MINIMO, p.ACTIVO,
             c.NOMBRE AS CATEGORIA
             FROM PRODUCTOS p
             LEFT JOIN CATEGORIAS c ON p.CATEGORIA_ID = c.ID AND c.USUARIO_ID = :usuarioId
             WHERE ${baseWhere} 
             ORDER BY p.ID DESC`;

        try {
            console.log('[PRODUCTOS] Executing query with usuarioId:', usuarioId);
            console.log('[PRODUCTOS] SQL:', sql);
            const result = await conn.execute(sql, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await conn.close();
            console.log('[PRODUCTOS] Found', result.rows.length, 'products');
            return result.rows;
        } catch (e) {
            console.error('[PRODUCTOS] Error obtaining products:', e.message);
            console.error('[PRODUCTOS] SQL was:', sql);
            console.error('[PRODUCTOS] Params:', { usuarioId });
            await conn.close();
            return [];
        }
    },

    async getStatistics(usuarioId = 1) {
        if (USE_SIMULATION) {
            const activeProducts = productosSimulados.filter(p => p.ACTIVO == 1);
            const valorInventario = activeProducts.reduce((sum, p) => sum + (p.PRECIO * p.STOCK), 0);
            return {
                total: activeProducts.length,
                bajoStock: activeProducts.filter(p => p.STOCK <= p.STOCK_MINIMO && p.STOCK > 0).length,
                critico: activeProducts.filter(p => p.STOCK < p.STOCK_MINIMO).length,
                valorInventario: parseFloat(valorInventario.toFixed(2))
            };
        }

        const conn = await getConnection();
        try {
            const sqlTotal = 'SELECT COUNT(*) AS CANTIDAD FROM PRODUCTOS WHERE ACTIVO = 1 AND USUARIO_ID = :usuarioId';
            const sqlBajo = 'SELECT COUNT(*) AS CANTIDAD FROM PRODUCTOS WHERE ACTIVO = 1 AND USUARIO_ID = :usuarioId AND STOCK <= STOCK_MINIMO';
            const sqlCritico = 'SELECT COUNT(*) AS CANTIDAD FROM PRODUCTOS WHERE ACTIVO = 1 AND USUARIO_ID = :usuarioId AND STOCK < STOCK_MINIMO';
            const sqlValor = 'SELECT SUM(PRECIO_VENTA * STOCK) AS VALOR FROM PRODUCTOS WHERE ACTIVO = 1 AND USUARIO_ID = :usuarioId';

            const [total, bajo, critico, valor] = await Promise.all([
                conn.execute(sqlTotal, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
                conn.execute(sqlBajo, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
                conn.execute(sqlCritico, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
                conn.execute(sqlValor, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT })
            ]);

            await conn.close();
            return {
                total: total.rows[0].CANTIDAD,
                bajoStock: bajo.rows[0].CANTIDAD,
                critico: critico.rows[0].CANTIDAD,
                valorInventario: valor.rows[0].VALOR || 0
            };
        } catch (e) {
            console.error('Error stats:', e);
            await conn.close();
            return { total: 0, bajoStock: 0, critico: 0, valorInventario: 0 };
        }
    },

    async buscarPorCodigo(codigo, usuarioId = 1) {
        if (USE_SIMULATION) {
            return productosSimulados.find(p => p.CODIGO === codigo);
        }
        const conn = await getConnection();
        const sql = 'SELECT * FROM PRODUCTOS WHERE CODIGO = :codigo AND USUARIO_ID = :usuarioId';
        const result = await conn.execute(sql, { codigo, usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        await conn.close();
        return result.rows[0];
    },

    async buscarPorNombre(nombre, usuarioId = 1) {
        if (USE_SIMULATION) {
            return productosSimulados.find(p => p.NOMBRE.toLowerCase() === nombre.toLowerCase());
        }
        const conn = await getConnection();
        const sql = 'SELECT * FROM PRODUCTOS WHERE LOWER(NOMBRE) = LOWER(:nombre) AND USUARIO_ID = :usuarioId';
        const result = await conn.execute(sql, { nombre, usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        await conn.close();
        return result.rows[0];
    },

    async crear(producto, usuarioId = 1) {
        if (USE_SIMULATION) {
            const nuevo = {
                ...producto,
                ID: productosSimulados.length + 1,
                ACTIVO: 1
            };
            productosSimulados.push(nuevo);
            return nuevo;
        }

        const conn = await getConnection();
        const sql = `INSERT INTO PRODUCTOS (USUARIO_ID, CATEGORIA_ID, CODIGO, NOMBRE, PRECIO_VENTA, PRECIO_COSTO, STOCK, STOCK_MINIMO, ACTIVO) 
                     VALUES (:usuarioId, :categoriaId, :codigo, :nombre, :precioVenta, :precioCosto, :stock, :stock_minimo, 1)`;

        const precioVenta = producto.PRECIO_VENTA != null ? producto.PRECIO_VENTA : (producto.PRECIO ?? 0);
        const precioCosto = producto.PRECIO_COSTO != null ? producto.PRECIO_COSTO : precioVenta;
        const categoriaId = producto.CATEGORIA_ID != null ? producto.CATEGORIA_ID : (producto.CATEGORIA || null);

        const params = {
            usuarioId,
            categoriaId: categoriaId || null,
            codigo: producto.CODIGO,
            nombre: producto.NOMBRE,
            precioVenta,
            precioCosto,
            stock: producto.STOCK,
            stock_minimo: producto.STOCK_MINIMO || 5
        };

        await conn.execute(sql, params, { autoCommit: true });
        await conn.close();
        return producto;
    },

    async actualizar(id, producto) {
        if (USE_SIMULATION) {
            const index = productosSimulados.findIndex(p => p.ID == id);
            if (index !== -1) {
                productosSimulados[index] = { ...productosSimulados[index], ...producto };
                return productosSimulados[index];
            }
            return null;
        }

        const conn = await getConnection();
        const sql = `UPDATE PRODUCTOS SET 
                     CODIGO = :codigo,
                     NOMBRE = :nombre, 
                     PRECIO_VENTA = :precioVenta, 
                     PRECIO_COSTO = :precioCosto, 
                     STOCK = :stock, 
                     STOCK_MINIMO = :stock_minimo,
                     CATEGORIA_ID = :categoriaId 
                     WHERE ID = :id`;

        const precioVenta = producto.PRECIO_VENTA != null ? producto.PRECIO_VENTA : (producto.PRECIO ?? 0);
        const precioCosto = producto.PRECIO_COSTO != null ? producto.PRECIO_COSTO : precioVenta;
        const categoriaId = producto.CATEGORIA_ID != null ? producto.CATEGORIA_ID : null;

        await conn.execute(sql, {
            codigo: producto.CODIGO,
            nombre: producto.NOMBRE,
            precioVenta,
            precioCosto,
            stock: producto.STOCK,
            stock_minimo: producto.STOCK_MINIMO,
            categoriaId,
            id
        }, { autoCommit: true });
        await conn.close();
        return producto;
    },

    async eliminar(id) {
        if (USE_SIMULATION) {
            const index = productosSimulados.findIndex(p => p.ID == id);
            if (index !== -1) {
                productosSimulados[index].ACTIVO = 0; // Soft delete
                return true;
            }
            return false;
        }

        const conn = await getConnection();
        // Soft delete logic
        await conn.execute('UPDATE PRODUCTOS SET ACTIVO = 0 WHERE ID = :id', { id }, { autoCommit: true });
        await conn.close();
        return true;
    },

    async restaurar(id) {
        if (USE_SIMULATION) {
            const index = productosSimulados.findIndex(p => p.ID == id);
            if (index !== -1) {
                productosSimulados[index].ACTIVO = 1;
                return true;
            }
            return false;
        }
        const conn = await getConnection();
        await conn.execute('UPDATE PRODUCTOS SET ACTIVO = 1 WHERE ID = :id', { id }, { autoCommit: true });
        await conn.close();
        return true;
    },

    async descontarStock(id, cantidad) {
        if (USE_SIMULATION) {
            const index = productosSimulados.findIndex(p => p.ID == id);
            if (index !== -1) {
                productosSimulados[index].STOCK -= cantidad;
                return true;
            }
            return false;
        }

        const conn = await getConnection();
        await conn.execute('UPDATE PRODUCTOS SET STOCK = STOCK - :cantidad WHERE ID = :id', { cantidad, id }, { autoCommit: true });
        await conn.close();
        return true;
    }
};

module.exports = productoModel;
