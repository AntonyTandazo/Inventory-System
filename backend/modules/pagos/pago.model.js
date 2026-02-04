const { getConnection, USE_SIMULATION } = require('../../config/database');
const clienteModel = require('../clientes/cliente.model');

let pagosSimulados = [
    { ID: 1, CLIENTE_ID: 2, NOMBRE_CLIENTE: 'Juan Perez', MONTO: 20.00, FECHA: new Date('2024-02-01T10:00:00'), REFERENCIA: 'EFECTIVO' },
    { ID: 2, CLIENTE_ID: 5, NOMBRE_CLIENTE: 'Ana Martinez', MONTO: 50.00, FECHA: new Date('2024-02-01T15:30:00'), REFERENCIA: 'TRANSFERENCIA' }
];

const pagoModel = {
    async registrar(pago, usuarioId = 1) {
        // pago: { CLIENTE_ID, MONTO, REFERENCIA }
        if (USE_SIMULATION) {
            const nuevo = {
                ID: pagosSimulados.length + 1,
                CLIENTE_ID: pago.CLIENTE_ID,
                NOMBRE_CLIENTE: (await clienteModel.obtenerTodos()).find(c => c.ID == pago.CLIENTE_ID)?.NOMBRE || 'Cliente',
                MONTO: parseFloat(pago.MONTO),
                FECHA: new Date(),
                REFERENCIA: pago.REFERENCIA || 'EFECTIVO'
            };
            pagosSimulados.unshift(nuevo);

            // Actualizar deuda del cliente
            await clienteModel.registrarPago(pago.CLIENTE_ID, pago.MONTO);

            return nuevo;
        }

        const conn = await getConnection();
        try {
            // 1. Obtener deuda actual del cliente
            const clienteResult = await conn.execute(
                'SELECT DEUDA FROM CLIENTES WHERE ID = :clienteId AND USUARIO_ID = :usuarioId',
                { clienteId: pago.CLIENTE_ID, usuarioId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            if (!clienteResult.rows || clienteResult.rows.length === 0) {
                await conn.close();
                throw new Error('Cliente no encontrado');
            }

            const deudaAnterior = parseFloat(clienteResult.rows[0].DEUDA);
            const montoFloat = parseFloat(pago.MONTO);

            if (montoFloat <= 0) {
                await conn.close();
                throw new Error('El monto debe ser mayor a 0');
            }

            if (montoFloat > deudaAnterior) {
                await conn.close();
                throw new Error('El monto no puede ser mayor a la deuda actual');
            }

            const deudaNueva = deudaAnterior - montoFloat;

            // 2. Insertar Pago con DEUDA_ANTERIOR y DEUDA_NUEVA
            const sqlPago = `INSERT INTO PAGOS (USUARIO_ID, CLIENTE_ID, MONTO, REFERENCIA, DEUDA_ANTERIOR, DEUDA_NUEVA, FECHA_PAGO)
                             VALUES (:usuarioId, :clienteId, :monto, :referencia, :deudaAnterior, :deudaNueva, CURRENT_TIMESTAMP)`;

            await conn.execute(sqlPago, {
                usuarioId,
                clienteId: pago.CLIENTE_ID,
                monto: montoFloat,
                referencia: pago.REFERENCIA || 'EFECTIVO',
                deudaAnterior,
                deudaNueva
            }, { autoCommit: false });

            // 3. Actualizar Deuda Cliente
            await conn.execute(
                'UPDATE CLIENTES SET DEUDA = :deudaNueva WHERE ID = :id',
                { deudaNueva, id: pago.CLIENTE_ID },
                { autoCommit: false }
            );

            await conn.commit();
            await conn.close();

            return {
                CLIENTE_ID: pago.CLIENTE_ID,
                MONTO: montoFloat,
                REFERENCIA: pago.REFERENCIA,
                DEUDA_ANTERIOR: deudaAnterior,
                DEUDA_NUEVA: deudaNueva,
                FECHA_PAGO: new Date()
            };
        } catch (e) {
            await conn.rollback();
            await conn.close();
            throw e;
        }
    },

    async obtenerHistorial(usuarioId = 1) {
        if (USE_SIMULATION) {
            return pagosSimulados.sort((a, b) => b.FECHA - a.FECHA);
        }

        const conn = await getConnection();
        const sql = `SELECT 
                        P.ID,
                        P.MONTO,
                        P.REFERENCIA,
                        P.DEUDA_ANTERIOR,
                        P.DEUDA_NUEVA,
                        P.FECHA_PAGO,
                        C.NOMBRE AS NOMBRE_CLIENTE,
                        C.CEDULA
                     FROM PAGOS P 
                     INNER JOIN CLIENTES C ON P.CLIENTE_ID = C.ID 
                     WHERE P.USUARIO_ID = :usuarioId
                     ORDER BY P.FECHA_PAGO DESC`;

        try {
            const result = await conn.execute(sql, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await conn.close();
            return result.rows;
        } catch (e) {
            console.error('Error al obtener historial:', e);
            await conn.close();
            throw e;
        }
    },

    async getStatistics(usuarioId = 1) {
        // Ingresos Hoy, Mes Actual, Pagos Completados
        if (USE_SIMULATION) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const ingresosHoy = pagosSimulados
                .filter(p => new Date(p.FECHA) >= today)
                .reduce((sum, p) => sum + p.MONTO, 0);

            const ingresosMes = pagosSimulados
                .filter(p => new Date(p.FECHA) >= firstDayOfMonth)
                .reduce((sum, p) => sum + p.MONTO, 0);

            const transaccionesMes = pagosSimulados
                .filter(p => new Date(p.FECHA) >= firstDayOfMonth).length;

            const clientes = await clienteModel.obtenerTodos();
            const totalDeuda = clientes.reduce((sum, c) => sum + parseFloat(c.DEUDA), 0);

            return { ingresosHoy, ingresosMes, transaccionesMes, totalDeuda };
        }

        const conn = await getConnection();

        // Estadísticas de pagos del mes actual
        const sql = `SELECT 
                        SUM(CASE WHEN TRUNC(FECHA_PAGO) = TRUNC(SYSDATE) THEN MONTO ELSE 0 END) as HOY,
                        SUM(CASE WHEN FECHA_PAGO >= TRUNC(SYSDATE, 'MM') THEN MONTO ELSE 0 END) as MES,
                        COUNT(CASE WHEN FECHA_PAGO >= TRUNC(SYSDATE, 'MM') THEN 1 END) as TRANSACCIONES
                     FROM PAGOS
                     WHERE USUARIO_ID = :usuarioId`;

        // Total de deuda pendiente
        const sqlDeuda = 'SELECT SUM(DEUDA) as TOTAL FROM CLIENTES WHERE USUARIO_ID = :usuarioId AND DEUDA > 0';

        try {
            const [statsResult, deudaResult] = await Promise.all([
                conn.execute(sql, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
                conn.execute(sqlDeuda, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT })
            ]);

            await conn.close();

            return {
                ingresosHoy: statsResult.rows[0].HOY || 0,
                ingresosMes: statsResult.rows[0].MES || 0,
                transaccionesMes: statsResult.rows[0].TRANSACCIONES || 0,
                totalDeuda: deudaResult.rows[0].TOTAL || 0
            };
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            await conn.close();
            throw error;
        }
    }
};

module.exports = pagoModel;
