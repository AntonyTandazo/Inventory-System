const oracledb = require('oracledb');
const { getConnection } = require('../../config/database');

const telepedidosController = {
    async guardar(req, res) {
        let conn;
        try {
            const { CLIENTE_ID, METODO, ESTADO_PAGO, TOTAL, items, OBSERVACIONES } = req.body;
            const USUARIO_ID = 1; // Simplificado para este ejemplo, debería venir del auth

            conn = await getConnection();

            // 1. Insertar el encabezado del tele-pedido
            const sqlPedido = `
                INSERT INTO TELE_PEDIDOS_RECIBIDOS (
                    USUARIO_ID, CLIENTE_ID, METODO, ESTADO_PAGO, TOTAL, OBSERVACIONES
                ) VALUES (
                    :usuario, :cliente, :metodo, :pago, :total, :obs
                ) RETURNING ID INTO :id`;

            const resultPedido = await conn.execute(sqlPedido, {
                usuario: USUARIO_ID,
                cliente: CLIENTE_ID,
                metodo: METODO,
                pago: ESTADO_PAGO,
                total: TOTAL,
                obs: OBSERVACIONES || '',
                id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            });

            const pedidoId = resultPedido.outBinds.id[0];

            // 2. Insertar detalles y actualizar stock
            for (const item of items) {
                // Insertar detalle
                await conn.execute(`
                    INSERT INTO TELE_PEDIDO_DETALLES (
                        TELE_PEDIDO_ID, PRODUCTO_ID, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL
                    ) VALUES (
                        :pedidoId, :prodId, :cant, :precio, :subtotal
                    )`, {
                    pedidoId: pedidoId,
                    prodId: item.ID,
                    cant: item.cantidad,
                    precio: item.PRECIO,
                    subtotal: item.PRECIO * item.cantidad
                });

                // Descontar Stock
                await conn.execute(`
                    UPDATE PRODUCTOS SET STOCK = STOCK - :cant WHERE ID = :prodId
                `, { cant: item.cantidad, prodId: item.ID });
            }

            await conn.commit();
            res.json({ success: true, id: pedidoId });

        } catch (error) {
            if (conn) await conn.rollback();
            console.error('Error al guardar tele-pedido:', error);
            res.status(500).json({ error: error.message });
        } finally {
            if (conn) await conn.close();
        }
    },

    async listar(req, res) {
        let conn;
        try {
            conn = await getConnection();
            const result = await conn.execute(`
                SELECT tp.*, c.NOMBRE as CLIENTE_NOMBRE 
                FROM TELE_PEDIDOS_RECIBIDOS tp
                JOIN CLIENTES c ON tp.CLIENTE_ID = c.ID
                ORDER BY tp.FECHA_RECEPCION DESC
            `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        } finally {
            if (conn) await conn.close();
        }
    }
};

module.exports = telepedidosController;
