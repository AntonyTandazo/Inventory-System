const { getConnection, USE_SIMULATION } = require('../../config/database');
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

            // En simulación, solo registramos el pedido
            // La actualización de deuda y stock se maneja en la BD real

            return nuevo;
        }

        const conn = await getConnection();
        try {
            // 1. Insertar Pedido Header
            const metodoPago = pedido.METODO_PAGO || 'cash';
            const avance = pedido.AVANCE || 0;
            const pagoEstado = metodoPago === 'cash' ? 'PAGADO' : 'PENDIENTE';
            const origen = pedido.ORIGEN || 'POS';
            // Auto-assign ESTADO: POS orders are instantly delivered, TELEPEDIDO need delivery
            const estado = origen === 'POS' ? 'ENTREGADO' : 'POR_ENTREGAR';

            const sqlPedido = `INSERT INTO PEDIDOS (USUARIO_ID, CLIENTE_ID, TOTAL, ESTADO, PAGO_ESTADO, ORIGEN, METODO_PAGO, AVANCE)
                               VALUES (:usuarioId, :cliente_id, :total, :estado, :pago_estado, :origen, :metodo_pago, :avance)
                               RETURNING ID INTO :id`;

            const result = await conn.execute(sqlPedido, {
                usuarioId,
                cliente_id: pedido.CLIENTE_ID,
                total: pedido.TOTAL,
                estado: estado,
                pago_estado: pagoEstado,
                origen: origen,
                metodo_pago: metodoPago,
                avance: avance,
                id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            }, { autoCommit: false });

            const pedidoId = result.outBinds.id[0];

            // 2. Insertar Detalle (Items)
            if (pedido.items && pedido.items.length > 0) {
                const sqlDetalle = `INSERT INTO PEDIDO_DETALLES (PEDIDO_ID, PRODUCTO_ID, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL)
                                    VALUES (:pedido_id, :producto_id, :cantidad, :precio, :subtotal)`;

                for (const item of pedido.items) {
                    const subtotal = item.cantidad * parseFloat(item.PRECIO);
                    await conn.execute(sqlDetalle, {
                        pedido_id: pedidoId,
                        producto_id: item.ID,
                        cantidad: item.cantidad,
                        precio: parseFloat(item.PRECIO),
                        subtotal: subtotal
                    }, { autoCommit: false });

                    // 3. Actualizar stock
                    await conn.execute(
                        'UPDATE PRODUCTOS SET STOCK = STOCK - :cantidad WHERE ID = :id',
                        { cantidad: item.cantidad, id: item.ID },
                        { autoCommit: false }
                    );
                }
            }

            // 4. Si es crédito, actualizar deuda del cliente
            if (metodoPago === 'credit') {
                const deuda = pedido.TOTAL - avance;
                if (deuda > 0) {
                    await conn.execute(
                        'UPDATE CLIENTES SET DEUDA = DEUDA + :deuda WHERE ID = :id',
                        { deuda: deuda, id: pedido.CLIENTE_ID },
                        { autoCommit: false }
                    );
                }
            }

            await conn.commit();
            await conn.close();
            return { ...pedido, ID: pedidoId, ESTADO: estado, PAGO_ESTADO: pagoEstado };
        } catch (e) {
            console.error('Error al crear pedido:', e);
            await conn.rollback();
            await conn.close();
            throw e;
        }
    },

    async actualizarEstado(id, nuevoEstado) {
        const timestamp = new Date();
        if (USE_SIMULATION) {
            const pedido = pedidosSimulados.find(p => p.ID == id);
            if (pedido) {
                pedido.ESTADO = nuevoEstado;
                if (nuevoEstado === 'EN_CAMINO') {
                    pedido.FECHA_SALIDA = timestamp;
                    pedido.REPARTIDOR = 'Repartidor 1'; // Simulado
                } else if (nuevoEstado === 'ENTREGADO') {
                    pedido.FECHA_ENTREGA = timestamp;
                }
                return true;
            }
            return false;
        }

        const conn = await getConnection();
        let sql = 'UPDATE PEDIDOS SET ESTADO = :estado';
        const params = { estado: nuevoEstado, id };

        if (nuevoEstado === 'EN_CAMINO') {
            sql += ', FECHA_SALIDA = CURRENT_TIMESTAMP, REPARTIDOR = :repartidor';
            params.repartidor = 'Repartidor DB';
        } else if (nuevoEstado === 'ENTREGADO') {
            sql += ', FECHA_ENTREGA = CURRENT_TIMESTAMP';
        }

        sql += ' WHERE ID = :id';

        await conn.execute(sql, params, { autoCommit: true });
        await conn.close();
        return true;
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

        const conn = await getConnection();
        const sqlPendientes = "SELECT COUNT(*) as CANTIDAD FROM PEDIDOS WHERE USUARIO_ID = :usuarioId AND ESTADO IN ('PENDIENTE', 'EN_CAMINO')";
        const sqlEntregados = "SELECT COUNT(*) as CANTIDAD FROM PEDIDOS WHERE USUARIO_ID = :usuarioId AND ESTADO = 'ENTREGADO' AND TRUNC(FECHA_ENTREGA) = TRUNC(SYSDATE)";

        const [pendientes, entregados] = await Promise.all([
            conn.execute(sqlPendientes, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            conn.execute(sqlEntregados, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT })
        ]);

        await conn.close();

        return {
            pendientes: pendientes.rows[0].CANTIDAD,
            entregadosHoy: entregados.rows[0].CANTIDAD
        };
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
        const conn = await getConnection();
        await conn.execute('UPDATE PEDIDOS SET PAGO_ESTADO = :estado WHERE ID = :id', { estado: estadoPago, id }, { autoCommit: true });
        await conn.close();
        return true;
    },

    async obtenerTodos(usuarioId = 1) {
        if (USE_SIMULATION) {
            return pedidosSimulados.sort((a, b) => new Date(b.FECHA) - new Date(a.FECHA));
        }
        const conn = await getConnection();
        const sql = `SELECT P.*, C.NOMBRE as NOMBRE_CLIENTE, C.DIRECCION 
                     FROM PEDIDOS P 
                     LEFT JOIN CLIENTES C ON P.CLIENTE_ID = C.ID AND C.USUARIO_ID = :usuarioId 
                     WHERE P.USUARIO_ID = :usuarioId 
                     ORDER BY P.FECHA DESC`;
        try {
            const result = await conn.execute(sql, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await conn.close();
            return result.rows;
        } catch (e) {
            console.error('Error obtaining pedidos:', e);
            await conn.close();
            return [];
        }
    },

    async actualizarEstado(id, estado, usuarioId = 1) {
        if (USE_SIMULATION) {
            const pedido = pedidosSimulados.find(p => p.ID === parseInt(id));
            if (pedido) {
                pedido.ESTADO = estado;
            }
            return { success: true };
        }

        const conn = await getConnection();
        try {
            await conn.execute(
                'UPDATE PEDIDOS SET ESTADO = :estado WHERE ID = :id AND USUARIO_ID = :usuarioId',
                { estado, id: parseInt(id), usuarioId },
                { autoCommit: true }
            );
            await conn.close();
            return { success: true };
        } catch (e) {
            console.error('Error al actualizar estado:', e);
            await conn.close();
            throw e;
        }
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

        const conn = await getConnection();
        try {
            const result = await conn.execute(`
                SELECT 
                    COUNT(CASE WHEN ESTADO IN ('POR_ENTREGAR', 'PENDIENTE', 'EN_CAMINO') THEN 1 END) AS PENDIENTES,
                    COUNT(CASE WHEN ESTADO = 'ENTREGADO' AND TRUNC(FECHA) = TRUNC(SYSDATE) THEN 1 END) AS ENTREGADOS_HOY
                FROM PEDIDOS 
                WHERE USUARIO_ID = :usuarioId AND ORIGEN = 'TELEPEDIDO'
            `, { usuarioId });

            await conn.close();

            const row = result.rows[0];
            return {
                pendientes: row[0] || 0,
                entregadosHoy: row[1] || 0
            };
        } catch (e) {
            console.error('Error al obtener stats de entregas:', e);
            await conn.close();
            throw e;
        }
    }
};

module.exports = pedidoModel;
