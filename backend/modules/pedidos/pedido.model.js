const { getConnection, USE_SIMULATION } = require('../../config/database');
const { toOracleFormat } = require('../../config/helpers');
const productoModel = require('../productos/producto.model');
const clienteModel = require('../clientes/cliente.model');

let pedidosSimulados = [];

const pedidoModel = {
    async crear(pedido, usuarioId = 1) {
        if (USE_SIMULATION) {
            const nuevo = {
                ...pedido,
                ID: pedidosSimulados.length + 1,
                FECHA: new Date(),
                ITEMS: pedido.items || [],
                ESTADO: 'PENDIENTE',
                PAGO_ESTADO: pedido.METODO_PAGO === 'cash' ? 'PAGADO' : 'PENDIENTE',
                ORIGEN: pedido.ORIGEN || 'POS',
                METODO_PAGO: pedido.METODO_PAGO || 'cash',
                AVANCE: pedido.AVANCE || 0
            };
            pedidosSimulados.unshift(nuevo);
            return nuevo;
        }

        const supabase = await getConnection();

        try {
            const metodoPago = pedido.METODO_PAGO || 'cash';
            const avance = pedido.AVANCE || 0;
            const pagoEstado = metodoPago === 'cash' ? 'PAGADO' : 'PENDIENTE';
            const origen = pedido.ORIGEN || 'POS';
            const estado = origen === 'POS' ? 'ENTREGADO' : 'POR_ENTREGAR';

            // 1. Insert pedido header
            const { data: pedidoData, error: pedidoError } = await supabase
                .from('pedidos')
                .insert([{
                    usuario_id: usuarioId,
                    cliente_id: pedido.CLIENTE_ID,
                    total: pedido.TOTAL,
                    estado: estado,
                    pago_estado: pagoEstado,
                    origen: origen,
                    metodo_pago: metodoPago,
                    avance: avance
                }])
                .select()
                .single();

            if (pedidoError) throw pedidoError;

            const pedidoId = pedidoData.id;

            // 2. Insert pedido details
            if (pedido.items && pedido.items.length > 0) {
                const detalles = pedido.items.map(item => ({
                    pedido_id: pedidoId,
                    producto_id: item.ID,
                    cantidad: item.cantidad,
                    precio_unitario: parseFloat(item.PRECIO),
                    subtotal: item.cantidad * parseFloat(item.PRECIO)
                }));

                const { error: detallesError } = await supabase
                    .from('pedido_detalles')
                    .insert(detalles);

                if (detallesError) throw detallesError;

                // 3. Update stock for each product
                for (const item of pedido.items) {
                    await productoModel.descontarStock(item.ID, item.cantidad);
                }
            }

            // 4. If credit, update client debt
            if (metodoPago === 'credit') {
                const deuda = pedido.TOTAL - avance;
                if (deuda > 0) {
                    await clienteModel.sumarDeuda(pedido.CLIENTE_ID, deuda);
                }
            }

            return { ...pedido, ID: pedidoId, ESTADO: estado, PAGO_ESTADO: pagoEstado };
        } catch (e) {
            console.error('Error al crear pedido:', e);
            throw e;
        }
    },

    async actualizarEstado(id, nuevoEstado, usuarioId = 1) {
        const timestamp = new Date();
        if (USE_SIMULATION) {
            const pedido = pedidosSimulados.find(p => p.ID == id);
            if (pedido) {
                pedido.ESTADO = nuevoEstado;
                if (nuevoEstado === 'EN_CAMINO') {
                    pedido.FECHA_SALIDA = timestamp;
                    pedido.REPARTIDOR = 'Repartidor 1';
                } else if (nuevoEstado === 'ENTREGADO') {
                    pedido.FECHA_ENTREGA = timestamp;
                }
                return true;
            }
            return false;
        }

        const supabase = await getConnection();

        const updateData = { estado: nuevoEstado };

        if (nuevoEstado === 'EN_CAMINO') {
            updateData.fecha_salida = timestamp.toISOString();
            updateData.repartidor = 'Repartidor DB';
        } else if (nuevoEstado === 'ENTREGADO') {
            updateData.fecha_entrega = timestamp.toISOString();
        }

        const { error } = await supabase
            .from('pedidos')
            .update(updateData)
            .eq('id', id)
            .eq('usuario_id', usuarioId);

        if (error) throw error;
        return true;
    },

    async registrarPago(id, estadoPago) {
        if (USE_SIMULATION) {
            const pedido = pedidosSimulados.find(p => p.ID == id);
            if (pedido) {
                pedido.PAGO_ESTADO = estadoPago;
                return true;
            }
            return false;
        }

        const supabase = await getConnection();
        const { error } = await supabase
            .from('pedidos')
            .update({ pago_estado: estadoPago })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async obtenerTodos(usuarioId = 1) {
        if (USE_SIMULATION) {
            return pedidosSimulados.sort((a, b) => new Date(b.FECHA) - new Date(a.FECHA));
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                clientes:cliente_id (
                    nombre,
                    direccion
                )
            `)
            .eq('usuario_id', usuarioId)
            .order('fecha', { ascending: false });

        if (error) {
            console.error('Error obtaining pedidos:', error);
            return [];
        }

        // Transform to Oracle format
        return data.map(p => ({
            ID: p.id,
            USUARIO_ID: p.usuario_id,
            CLIENTE_ID: p.cliente_id,
            TOTAL: p.total,
            ESTADO: p.estado,
            PAGO_ESTADO: p.pago_estado,
            ORIGEN: p.origen,
            METODO_PAGO: p.metodo_pago,
            AVANCE: p.avance,
            FECHA: p.fecha,
            FECHA_SALIDA: p.fecha_salida,
            FECHA_ENTREGA: p.fecha_entrega,
            REPARTIDOR: p.repartidor,
            NOMBRE_CLIENTE: p.clientes?.nombre || null,
            DIRECCION: p.clientes?.direccion || null
        }));
    },

    async getDeliveryStats(usuarioId = 1) {
        if (USE_SIMULATION) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const pendientes = pedidosSimulados.filter(p => ['PENDIENTE', 'EN_CAMINO'].includes(p.ESTADO)).length;
            const entregadosHoy = pedidosSimulados.filter(p =>
                p.ESTADO === 'ENTREGADO' &&
                p.FECHA_ENTREGA &&
                new Date(p.FECHA_ENTREGA) >= today
            ).length;

            return { pendientes, entregadosHoy };
        }

        const supabase = await getConnection();

        // Get pending deliveries
        const { count: pendientes } = await supabase
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId)
            .in('estado', ['PENDIENTE', 'EN_CAMINO']);

        // Get deliveries today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: entregadosHoy } = await supabase
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId)
            .eq('estado', 'ENTREGADO')
            .gte('fecha_entrega', today.toISOString());

        return {
            pendientes: pendientes || 0,
            entregadosHoy: entregadosHoy || 0
        };
    },

    async obtenerStatsEntregas(usuarioId = 1) {
        if (USE_SIMULATION) {
            const pendientes = pedidosSimulados.filter(p =>
                ['POR_ENTREGAR', 'PENDIENTE', 'EN_CAMINO'].includes(p.ESTADO) &&
                p.ORIGEN === 'TELEPEDIDO'
            ).length;

            const hoy = new Date().toDateString();
            const entregadosHoy = pedidosSimulados.filter(p =>
                p.ESTADO === 'ENTREGADO' &&
                p.ORIGEN === 'TELEPEDIDO' &&
                new Date(p.FECHA).toDateString() === hoy
            ).length;

            return { pendientes, entregadosHoy };
        }

        const supabase = await getConnection();

        // Get pending telepedidos
        const { count: pendientes } = await supabase
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId)
            .eq('origen', 'TELEPEDIDO')
            .in('estado', ['POR_ENTREGAR', 'PENDIENTE', 'EN_CAMINO']);

        // Get delivered telepedidos today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: entregadosHoy } = await supabase
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId)
            .eq('origen', 'TELEPEDIDO')
            .eq('estado', 'ENTREGADO')
            .gte('fecha', today.toISOString());

        return {
            pendientes: pendientes || 0,
            entregadosHoy: entregadosHoy || 0
        };
    }
};

module.exports = pedidoModel;
