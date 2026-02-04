const { getConnection, USE_SIMULATION } = require('../../config/database');
const pedidoModel = require('../pedidos/pedido.model');
const productoModel = require('../productos/producto.model');
const clienteModel = require('../clientes/cliente.model');

const reporteModel = {
    async getGeneralStats(rango, usuarioId = 1) {
        const startDate = getStartDate(rango);

        if (USE_SIMULATION) {
            const pedidos = await pedidoModel.obtenerTodos(usuarioId);
            const filtered = pedidos.filter(p => new Date(p.FECHA) >= startDate && p.ESTADO !== 'CANCELADO');

            const totalVentas = filtered.reduce((sum, p) => sum + parseFloat(p.TOTAL), 0);
            const cantidadPedidos = filtered.length;
            const ticketPromedio = cantidadPedidos > 0 ? totalVentas / cantidadPedidos : 0;

            const trend = {};
            filtered.forEach(p => {
                const dateKey = new Date(p.FECHA).toLocaleDateString();
                trend[dateKey] = (trend[dateKey] || 0) + parseFloat(p.TOTAL);
            });

            return { totalVentas, cantidadPedidos, ticketPromedio, trend };
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('pedidos')
            .select('total')
            .eq('usuario_id', usuarioId)
            .gte('fecha', startDate.toISOString())
            .neq('estado', 'CANCELADO');

        if (error) throw error;

        const totalVentas = data.reduce((sum, p) => sum + p.total, 0);
        const cantidadPedidos = data.length;
        const ticketPromedio = cantidadPedidos > 0 ? totalVentas / cantidadPedidos : 0;

        return { totalVentas, cantidadPedidos, ticketPromedio, trend: {} };
    },

    async getTopProductos(rango, usuarioId = 1) {
        const startDate = getStartDate(rango);

        if (USE_SIMULATION) {
            return [
                { nombre: 'Leche Descremada', cantidad: 120, total: 240 },
                { nombre: 'Arroz 5kg', cantidad: 85, total: 340 },
                { nombre: 'Aceite Vegetal', cantidad: 50, total: 150 },
                { nombre: 'Coca Cola 2L', cantidad: 200, total: 500 },
                { nombre: 'Pan Molde', cantidad: 60, total: 120 },
            ];
        }

        const supabase = await getConnection();

        // Get pedido_detalles with product info
        const { data, error } = await supabase
            .from('pedido_detalles')
            .select(`
                cantidad,
                subtotal,
                productos:producto_id (nombre),
                pedidos:pedido_id (
                    usuario_id,
                    fecha,
                    estado
                )
            `)
            .gte('pedidos.fecha', startDate.toISOString())
            .eq('pedidos.usuario_id', usuarioId)
            .neq('pedidos.estado', 'CANCELADO');

        if (error) {
            console.error('Error getting top products:', error);
            return [];
        }

        // Aggregate by product
        const productStats = {};
        data.forEach(item => {
            if (item.productos && item.pedidos) {
                const nombre = item.productos.nombre;
                if (!productStats[nombre]) {
                    productStats[nombre] = { cantidad: 0, total: 0 };
                }
                productStats[nombre].cantidad += item.cantidad;
                productStats[nombre].total += item.subtotal;
            }
        });

        return Object.entries(productStats)
            .map(([nombre, stat]) => ({ nombre, ...stat }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    },

    async getTopClientes(rango, usuarioId = 1) {
        const startDate = getStartDate(rango);

        if (USE_SIMULATION) {
            const pedidos = await pedidoModel.obtenerTodos(usuarioId);
            const filtered = pedidos.filter(p => new Date(p.FECHA) >= startDate && p.ESTADO !== 'CANCELADO');

            const clientStats = {};
            filtered.forEach(p => {
                const name = p.NOMBRE_CLIENTE || 'Consumidor Final';
                if (!clientStats[name]) clientStats[name] = { visitas: 0, total: 0 };
                clientStats[name].visitas += 1;
                clientStats[name].total += parseFloat(p.TOTAL);
            });

            return Object.entries(clientStats)
                .map(([nombre, stat]) => ({ nombre, ...stat }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('pedidos')
            .select(`
                total,
                clientes:cliente_id (nombre)
            `)
            .eq('usuario_id', usuarioId)
            .gte('fecha', startDate.toISOString())
            .neq('estado', 'CANCELADO');

        if (error) {
            console.error('Error getting top clients:', error);
            return [];
        }

        // Aggregate by client
        const clientStats = {};
        data.forEach(p => {
            const nombre = p.clientes?.nombre || 'Consumidor Final';
            if (!clientStats[nombre]) {
                clientStats[nombre] = { visitas: 0, total: 0 };
            }
            clientStats[nombre].visitas += 1;
            clientStats[nombre].total += p.total;
        });

        return Object.entries(clientStats)
            .map(([nombre, stat]) => ({ nombre, ...stat }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    },

    async getVentasPorCategoria(rango, usuarioId = 1) {
        const startDate = getStartDate(rango);

        if (USE_SIMULATION) {
            return [
                { categoria: 'Granos', total: 1500, porcentaje: 35 },
                { categoria: 'Grasas', total: 1200, porcentaje: 28 },
                { categoria: 'Lácteos', total: 1000, porcentaje: 23 },
                { categoria: 'Endulzantes', total: 600, porcentaje: 14 }
            ];
        }

        const supabase = await getConnection();

        // Get total sales for percentage calculation
        const { data: totalData, error: totalError } = await supabase
            .from('pedidos')
            .select('total')
            .eq('usuario_id', usuarioId)
            .gte('fecha', startDate.toISOString())
            .neq('estado', 'CANCELADO');

        if (totalError) throw totalError;

        const totalGeneral = totalData.reduce((sum, p) => sum + p.total, 0);

        // Get sales by category
        const { data, error } = await supabase
            .from('pedido_detalles')
            .select(`
                subtotal,
                productos:producto_id (
                    categorias:categoria_id (nombre)
                ),
                pedidos:pedido_id (
                    usuario_id,
                    fecha,
                    estado
                )
            `)
            .gte('pedidos.fecha', startDate.toISOString())
            .eq('pedidos.usuario_id', usuarioId)
            .neq('pedidos.estado', 'CANCELADO');

        if (error) {
            console.error('Error getting sales by category:', error);
            return [];
        }

        // Aggregate by category
        const categoryStats = {};
        data.forEach(item => {
            if (item.productos?.categorias && item.pedidos) {
                const categoria = item.productos.categorias.nombre;
                if (!categoryStats[categoria]) {
                    categoryStats[categoria] = 0;
                }
                categoryStats[categoria] += item.subtotal;
            }
        });

        return Object.entries(categoryStats)
            .map(([categoria, total]) => ({
                categoria,
                total,
                porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 100) : 0
            }))
            .sort((a, b) => b.total - a.total);
    }
};

const getStartDate = (rango) => {
    const date = new Date();
    if (rango === 'mes') date.setMonth(date.getMonth() - 1);
    if (rango === 'trimestre') date.setMonth(date.getMonth() - 3);
    if (rango === 'anio') date.setFullYear(date.getFullYear() - 1);
    return date;
};

module.exports = reporteModel;
