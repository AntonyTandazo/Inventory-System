const { getConnection, USE_SIMULATION } = require('../../config/database');
const { toOracleFormat } = require('../../config/helpers');

const productoModel = {
    async obtenerTodos(usuarioId = 1, incluirInactivos = false) {
        if (USE_SIMULATION) {
            return incluirInactivos ? productosSimulados : productosSimulados.filter(p => p.ACTIVO == 1);
        }

        const supabase = await getConnection();

        let query = supabase
            .from('productos')
            .select(`
                id,
                usuario_id,
                categoria_id,
                codigo,
                nombre,
                precio_venta,
                precio_costo,
                stock,
                stock_minimo,
                activo,
                categorias:categoria_id (
                    nombre
                )
            `)
            .eq('usuario_id', usuarioId)
            .order('id', { ascending: false });

        if (!incluirInactivos) {
            query = query.eq('activo', 1);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[PRODUCTOS] Error obtaining products:', error.message);
            return [];
        }

        console.log('[PRODUCTOS] Found', data.length, 'products');

        // Transform to Oracle format
        return data.map(p => ({
            ID: p.id,
            USUARIO_ID: p.usuario_id,
            CATEGORIA_ID: p.categoria_id,
            CODIGO: p.codigo,
            NOMBRE: p.nombre,
            PRECIO: p.precio_venta,
            PRECIO_COSTO: p.precio_costo,
            STOCK: p.stock,
            STOCK_MINIMO: p.stock_minimo,
            ACTIVO: p.activo,
            CATEGORIA: p.categorias?.nombre || null
        }));
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

        const supabase = await getConnection();

        try {
            // Get total count
            const { count: total, error: errorTotal } = await supabase
                .from('productos')
                .select('*', { count: 'exact', head: true })
                .eq('activo', 1)
                .eq('usuario_id', usuarioId);

            // Get low stock count
            const { count: bajoStock, error: errorBajo } = await supabase
                .from('productos')
                .select('*', { count: 'exact', head: true })
                .eq('activo', 1)
                .eq('usuario_id', usuarioId)
                .lte('stock', supabase.raw('stock_minimo'));

            // Get critical stock count  
            const { count: critico, error: errorCritico } = await supabase
                .from('productos')
                .select('*', { count: 'exact', head: true })
                .eq('activo', 1)
                .eq('usuario_id', usuarioId)
                .lt('stock', supabase.raw('stock_minimo'));

            // Get inventory value - need to fetch data for calculation
            const { data: productos, error: errorValor } = await supabase
                .from('productos')
                .select('precio_venta, stock')
                .eq('activo', 1)
                .eq('usuario_id', usuarioId);

            const valorInventario = productos?.reduce((sum, p) => sum + (p.precio_venta * p.stock), 0) || 0;

            if (errorTotal || errorBajo || errorCritico || errorValor) {
                console.error('Error getting stats:', errorTotal || errorBajo || errorCritico || errorValor);
                return { total: 0, bajoStock: 0, critico: 0, valorInventario: 0 };
            }

            return {
                total: total || 0,
                bajoStock: bajoStock || 0,
                critico: critico || 0,
                valorInventario: parseFloat(valorInventario.toFixed(2))
            };
        } catch (e) {
            console.error('Error stats:', e);
            return { total: 0, bajoStock: 0, critico: 0, valorInventario: 0 };
        }
    },

    async buscarPorCodigo(codigo, usuarioId = 1) {
        if (USE_SIMULATION) {
            return productosSimulados.find(p => p.CODIGO === codigo);
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('codigo', codigo)
            .eq('usuario_id', usuarioId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        return toOracleFormat(data);
    },

    async buscarPorNombre(nombre, usuarioId = 1) {
        if (USE_SIMULATION) {
            return productosSimulados.find(p => p.NOMBRE.toLowerCase() === nombre.toLowerCase());
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .ilike('nombre', nombre)
            .eq('usuario_id', usuarioId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        return toOracleFormat(data);
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

        const supabase = await getConnection();

        const precioVenta = producto.PRECIO_VENTA != null ? producto.PRECIO_VENTA : (producto.PRECIO ?? 0);
        const precioCosto = producto.PRECIO_COSTO != null ? producto.PRECIO_COSTO : precioVenta;
        const categoriaId = producto.CATEGORIA_ID != null ? producto.CATEGORIA_ID : (producto.CATEGORIA || null);

        const { data, error } = await supabase
            .from('productos')
            .insert([{
                usuario_id: usuarioId,
                categoria_id: categoriaId || null,
                codigo: producto.CODIGO,
                nombre: producto.NOMBRE,
                precio_venta: precioVenta,
                precio_costo: precioCosto,
                stock: producto.STOCK,
                stock_minimo: producto.STOCK_MINIMO || 5,
                activo: 1
            }])
            .select()
            .single();

        if (error) {
            console.error('[PRODUCTOS] Error creating product:', error);
            throw error;
        }

        return toOracleFormat(data);
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

        const supabase = await getConnection();

        const precioVenta = producto.PRECIO_VENTA != null ? producto.PRECIO_VENTA : (producto.PRECIO ?? 0);
        const precioCosto = producto.PRECIO_COSTO != null ? producto.PRECIO_COSTO : precioVenta;
        const categoriaId = producto.CATEGORIA_ID != null ? producto.CATEGORIA_ID : null;

        const { data, error } = await supabase
            .from('productos')
            .update({
                codigo: producto.CODIGO,
                nombre: producto.NOMBRE,
                precio_venta: precioVenta,
                precio_costo: precioCosto,
                stock: producto.STOCK,
                stock_minimo: producto.STOCK_MINIMO,
                categoria_id: categoriaId
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toOracleFormat(data);
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

        const supabase = await getConnection();
        const { error } = await supabase
            .from('productos')
            .update({ activo: 0 })
            .eq('id', id);

        if (error) throw error;
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

        const supabase = await getConnection();
        const { error } = await supabase
            .from('productos')
            .update({ activo: 1 })
            .eq('id', id);

        if (error) throw error;
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

        const supabase = await getConnection();

        // First get current stock
        const { data: producto, error: errorGet } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', id)
            .single();

        if (errorGet) throw errorGet;

        // Update with new stock
        const { error } = await supabase
            .from('productos')
            .update({ stock: producto.stock - cantidad })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

// Simulated data (kept for USE_SIMULATION mode)
let productosSimulados = [
    { ID: 1, CODIGO: 'P001', NOMBRE: 'Arroz', PRECIO: 1.50, PRECIO_COSTO: 1.00, STOCK: 100, STOCK_MINIMO: 20, CATEGORIA_ID: 1, ACTIVO: 1 },
    { ID: 2, CODIGO: 'P002', NOMBRE: 'Aceite', PRECIO: 2.50, PRECIO_COSTO: 2.00, STOCK: 50, STOCK_MINIMO: 10, CATEGORIA_ID: 2, ACTIVO: 1 },
    { ID: 3, CODIGO: 'P003', NOMBRE: 'Leche', PRECIO: 1.00, PRECIO_COSTO: 0.75, STOCK: 30, STOCK_MINIMO: 15, CATEGORIA_ID: 3, ACTIVO: 1 },
    { ID: 4, CODIGO: 'P004', NOMBRE: 'Azúcar', PRECIO: 1.20, PRECIO_COSTO: 0.90, STOCK: 5, STOCK_MINIMO: 20, CATEGORIA_ID: 4, ACTIVO: 1 }, // Bajo stock
    { ID: 5, CODIGO: 'P005', NOMBRE: 'Sal', PRECIO: 0.50, PRECIO_COSTO: 0.30, STOCK: 80, STOCK_MINIMO: 10, CATEGORIA_ID: 4, ACTIVO: 1 }
];

module.exports = productoModel;
