const { getConnection, USE_SIMULATION } = require('../../config/database');
const { toOracleFormat } = require('../../config/helpers');

let clientesSimulados = [
    { ID: 1, NOMBRE: 'Consumidor Final', TELEFONO: '', DIRECCION: '', DEUDA: 0, CEDULA: '9999999999', EMAIL: '', ESTADO: 'Activo', FECHA_REGISTRO: new Date() },
    { ID: 2, NOMBRE: 'Juan Perez', CEDULA: '1720010011', EMAIL: 'juan@email.com', TELEFONO: '0999888777', DEUDA: 45.50, DIRECCION: 'Centro Quito', ESTADO: 'Activo', FECHA_REGISTRO: new Date('2024-01-15') },
    { ID: 3, NOMBRE: 'Maria Lopez', CEDULA: '1720010022', EMAIL: 'maria@email.com', TELEFONO: '0988777666', DEUDA: 0.00, DIRECCION: 'Norte Quito', ESTADO: 'Activo', FECHA_REGISTRO: new Date('2024-01-20') },
    { ID: 4, NOMBRE: 'Carlos Ruiz', CEDULA: '1720010033', EMAIL: 'carlos@email.com', TELEFONO: '0977666555', DEUDA: 12.00, DIRECCION: 'Sur Quito', ESTADO: 'Inactivo', FECHA_REGISTRO: new Date('2023-12-10') },
    { ID: 5, NOMBRE: 'Ana Martinez', CEDULA: '1720010044', EMAIL: 'ana@email.com', TELEFONO: '0966555444', DEUDA: 85.00, DIRECCION: 'Cumbayá', ESTADO: 'Activo', FECHA_REGISTRO: new Date('2024-02-01') },
    { ID: 6, NOMBRE: 'Luis Castro', CEDULA: '1720010055', EMAIL: 'luis@email.com', TELEFONO: '0955444333', DEUDA: 0.00, DIRECCION: 'Tumbaco', ESTADO: 'Activo', FECHA_REGISTRO: new Date('2024-02-02') },
];

const clienteModel = {
    async obtenerTodos(usuarioId = 1) {
        if (USE_SIMULATION) return clientesSimulados;

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('id', { ascending: false });

        if (error) {
            console.error('Error obtaining clients:', error);
            return [];
        }

        return toOracleFormat(data);
    },

    async getStatistics(usuarioId = 1) {
        if (USE_SIMULATION) {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            return {
                total: clientesSimulados.length,
                activos: clientesSimulados.filter(c => c.ESTADO === 'Activo').length,
                nuevosMes: clientesSimulados.filter(c => new Date(c.FECHA_REGISTRO) >= firstDayOfMonth).length,
                conDeuda: clientesSimulados.filter(c => c.DEUDA > 0).length
            };
        }

        const supabase = await getConnection();

        // Get total count
        const { count: total } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId);

        // Get active count
        const { count: activos } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId)
            .eq('estado', 'Activo');

        // Get count with debt
        const { count: conDeuda } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId)
            .gt('deuda', 0);

        // Get new clients this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const { count: nuevosMes } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId)
            .gte('fecha_registro', firstDayOfMonth.toISOString());

        return {
            total: total || 0,
            activos: activos || 0,
            nuevosMes: nuevosMes || 0,
            conDeuda: conDeuda || 0
        };
    },

    async crear(cliente, usuarioId = 1) {
        if (USE_SIMULATION) {
            const duplicado = clientesSimulados.find(c => c.CEDULA === cliente.CEDULA);
            if (duplicado) {
                throw new Error('Ya existe un cliente con esta cédula');
            }

            const nuevo = {
                ...cliente,
                ID: clientesSimulados.length + 1,
                DEUDA: parseFloat(cliente.DEUDA) || 0,
                FECHA_REGISTRO: new Date()
            };
            clientesSimulados.push(nuevo);
            return nuevo;
        }

        const supabase = await getConnection();

        // Check for duplicate CEDULA
        const { data: existing, error: checkError } = await supabase
            .from('clientes')
            .select('id')
            .eq('cedula', cliente.CEDULA)
            .eq('usuario_id', usuarioId)
            .single();

        if (existing) {
            throw new Error('Ya existe un cliente con esta cédula');
        }

        // Insert new client
        const { data, error } = await supabase
            .from('clientes')
            .insert([{
                usuario_id: usuarioId,
                nombre: cliente.NOMBRE,
                cedula: cliente.CEDULA,
                email: cliente.EMAIL || '',
                telefono: cliente.TELEFONO,
                deuda: cliente.DEUDA || 0,
                direccion: cliente.DIRECCION,
                estado: cliente.ESTADO || 'Activo'
            }])
            .select()
            .single();

        if (error) throw error;
        return toOracleFormat(data);
    },

    async actualizar(id, cliente) {
        if (USE_SIMULATION) {
            const index = clientesSimulados.findIndex(c => c.ID == id);
            if (index !== -1) {
                clientesSimulados[index] = { ...clientesSimulados[index], ...cliente };
                return clientesSimulados[index];
            }
            return null;
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('clientes')
            .update({
                nombre: cliente.NOMBRE,
                cedula: cliente.CEDULA,
                email: cliente.EMAIL,
                telefono: cliente.TELEFONO,
                direccion: cliente.DIRECCION,
                deuda: cliente.DEUDA,
                estado: cliente.ESTADO
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toOracleFormat(data);
    },

    async eliminar(id) {
        if (USE_SIMULATION) {
            const initialLength = clientesSimulados.length;
            clientesSimulados = clientesSimulados.filter(c => c.ID != id);
            return clientesSimulados.length < initialLength;
        }

        const supabase = await getConnection();
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async sumarDeuda(id, monto) {
        if (USE_SIMULATION) {
            const index = clientesSimulados.findIndex(c => c.ID == id);
            if (index !== -1) {
                clientesSimulados[index].DEUDA += parseFloat(monto);
                return true;
            }
            return false;
        }

        const supabase = await getConnection();

        // Get current debt
        const { data: cliente, error: getError } = await supabase
            .from('clientes')
            .select('deuda')
            .eq('id', id)
            .single();

        if (getError) throw getError;

        // Update with new debt
        const { error } = await supabase
            .from('clientes')
            .update({ deuda: cliente.deuda + parseFloat(monto) })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async registrarPago(id, monto) {
        if (USE_SIMULATION) {
            const index = clientesSimulados.findIndex(c => c.ID == id);
            if (index !== -1) {
                clientesSimulados[index].DEUDA -= parseFloat(monto);
                if (clientesSimulados[index].DEUDA < 0) clientesSimulados[index].DEUDA = 0;
                return true;
            }
            return false;
        }

        const supabase = await getConnection();

        // Get current debt
        const { data: cliente, error: getError } = await supabase
            .from('clientes')
            .select('deuda')
            .eq('id', id)
            .single();

        if (getError) throw getError;

        // Calculate new debt
        const newDeuda = Math.max(0, cliente.deuda - parseFloat(monto));

        // Update with new debt
        const { error } = await supabase
            .from('clientes')
            .update({ deuda: newDeuda })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

module.exports = clienteModel;
