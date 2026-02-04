const { getConnection, USE_SIMULATION } = require('../../config/database');
const { toOracleFormat } = require('../../config/helpers');
const clienteModel = require('../clientes/cliente.model');

let pagosSimulados = [
    { ID: 1, CLIENTE_ID: 2, NOMBRE_CLIENTE: 'Juan Perez', MONTO: 20.00, FECHA: new Date('2024-02-01T10:00:00'), REFERENCIA: 'EFECTIVO' },
    { ID: 2, CLIENTE_ID: 5, NOMBRE_CLIENTE: 'Ana Martinez', MONTO: 50.00, FECHA: new Date('2024-02-01T15:30:00'), REFERENCIA: 'TRANSFERENCIA' }
];

const pagoModel = {
    async registrar(pago, usuarioId = 1) {
        if (USE_SIMULATION) {
            const clientes = await clienteModel.obtenerTodos();
            const nuevo = {
                ID: pagosSimulados.length + 1,
                CLIENTE_ID: pago.CLIENTE_ID,
                NOMBRE_CLIENTE: clientes.find(c => c.ID == pago.CLIENTE_ID)?.NOMBRE || 'Cliente',
                MONTO: parseFloat(pago.MONTO),
                FECHA: new Date(),
                REFERENCIA: pago.REFERENCIA || 'EFECTIVO'
            };
            pagosSimulados.unshift(nuevo);
            await clienteModel.registrarPago(pago.CLIENTE_ID, pago.MONTO);
            return nuevo;
        }

        const supabase = await getConnection();

        try {
            // 1. Get current client debt
            const { data: cliente, error: clienteError } = await supabase
                .from('clientes')
                .select('deuda')
                .eq('id', pago.CLIENTE_ID)
                .eq('usuario_id', usuarioId)
                .single();

            if (clienteError || !cliente) {
                throw new Error('Cliente no encontrado');
            }

            const deudaAnterior = parseFloat(cliente.deuda);
            const montoFloat = parseFloat(pago.MONTO);

            if (montoFloat <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }

            if (montoFloat > deudaAnterior) {
                throw new Error('El monto no puede ser mayor a la deuda actual');
            }

            const deudaNueva = deudaAnterior - montoFloat;

            // 2. Insert payment record
            const { data: pagoData, error: pagoError } = await supabase
                .from('pagos')
                .insert([{
                    usuario_id: usuarioId,
                    cliente_id: pago.CLIENTE_ID,
                    monto: montoFloat,
                    referencia: pago.REFERENCIA || 'EFECTIVO',
                    deuda_anterior: deudaAnterior,
                    deuda_nueva: deudaNueva
                }])
                .select()
                .single();

            if (pagoError) throw pagoError;

            // 3. Update client debt
            const { error: updateError } = await supabase
                .from('clientes')
                .update({ deuda: deudaNueva })
                .eq('id', pago.CLIENTE_ID);

            if (updateError) throw updateError;

            return {
                CLIENTE_ID: pago.CLIENTE_ID,
                MONTO: montoFloat,
                REFERENCIA: pago.REFERENCIA,
                DEUDA_ANTERIOR: deudaAnterior,
                DEUDA_NUEVA: deudaNueva,
                FECHA_PAGO: new Date()
            };
        } catch (e) {
            console.error('Error registering payment:', e);
            throw e;
        }
    },

    async obtenerHistorial(usuarioId = 1) {
        if (USE_SIMULATION) {
            return pagosSimulados.sort((a, b) => b.FECHA - a.FECHA);
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('pagos')
            .select(`
                id,
                monto,
                referencia,
                deuda_anterior,
                deuda_nueva,
                fecha_pago,
                clientes:cliente_id (
                    nombre,
                    cedula
                )
            `)
            .eq('usuario_id', usuarioId)
            .order('fecha_pago', { ascending: false });

        if (error) {
            console.error('Error al obtener historial:', error);
            throw error;
        }

        // Transform to Oracle format
        return data.map(p => ({
            ID: p.id,
            MONTO: p.monto,
            REFERENCIA: p.referencia,
            DEUDA_ANTERIOR: p.deuda_anterior,
            DEUDA_NUEVA: p.deuda_nueva,
            FECHA_PAGO: p.fecha_pago,
            NOMBRE_CLIENTE: p.clientes?.nombre || null,
            CEDULA: p.clientes?.cedula || null
        }));
    },

    async getStatistics(usuarioId = 1) {
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

        const supabase = await getConnection();

        // Get payments today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: pagosHoy, error: errorHoy } = await supabase
            .from('pagos')
            .select('monto')
            .eq('usuario_id', usuarioId)
            .gte('fecha_pago', today.toISOString());

        const ingresosHoy = pagosHoy?.reduce((sum, p) => sum + p.monto, 0) || 0;

        // Get payments this month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const { data: pagosMes, error: errorMes } = await supabase
            .from('pagos')
            .select('monto')
            .eq('usuario_id', usuarioId)
            .gte('fecha_pago', firstDayOfMonth.toISOString());

        const ingresosMes = pagosMes?.reduce((sum, p) => sum + p.monto, 0) || 0;
        const transaccionesMes = pagosMes?.length || 0;

        // Get total debt
        const { data: clientes, error: errorDeuda } = await supabase
            .from('clientes')
            .select('deuda')
            .eq('usuario_id', usuarioId)
            .gt('deuda', 0);

        const totalDeuda = clientes?.reduce((sum, c) => sum + c.deuda, 0) || 0;

        return {
            ingresosHoy: parseFloat(ingresosHoy.toFixed(2)),
            ingresosMes: parseFloat(ingresosMes.toFixed(2)),
            transaccionesMes,
            totalDeuda: parseFloat(totalDeuda.toFixed(2))
        };
    }
};

module.exports = pagoModel;
