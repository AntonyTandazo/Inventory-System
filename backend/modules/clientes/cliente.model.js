const { getConnection, USE_SIMULATION } = require('../../config/database');
const oracledb = require('oracledb');

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
        const conn = await getConnection();
        const sql = 'SELECT * FROM CLIENTES WHERE USUARIO_ID = :usuarioId ORDER BY ID DESC';
        try {
            const result = await conn.execute(sql, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await conn.close();
            return result.rows;
        } catch (error) {
            console.error('Error obtaining clients:', error);
            await conn.close();
            return [];
        }
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

        const conn = await getConnection();
        const sqlTotal = 'SELECT COUNT(*) AS CANTIDAD FROM CLIENTES WHERE USUARIO_ID = :usuarioId';
        const sqlActivos = "SELECT COUNT(*) AS CANTIDAD FROM CLIENTES WHERE USUARIO_ID = :usuarioId AND ESTADO = 'Activo'";
        const sqlDeuda = 'SELECT COUNT(*) AS CANTIDAD FROM CLIENTES WHERE USUARIO_ID = :usuarioId AND DEUDA > 0';
        const sqlNuevos = "SELECT COUNT(*) AS CANTIDAD FROM CLIENTES WHERE USUARIO_ID = :usuarioId AND FECHA_REGISTRO >= TRUNC(SYSDATE, 'MM')";

        const [total, activos, deuda, nuevos] = await Promise.all([
            conn.execute(sqlTotal, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            conn.execute(sqlActivos, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            conn.execute(sqlDeuda, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            conn.execute(sqlNuevos, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT })
        ]);

        await conn.close();
        return {
            total: total.rows[0].CANTIDAD,
            activos: activos.rows[0].CANTIDAD,
            nuevosMes: nuevos.rows[0].CANTIDAD,
            conDeuda: deuda.rows[0].CANTIDAD
        };
    },

    async crear(cliente, usuarioId = 1) {
        if (USE_SIMULATION) {
            // Check for duplicate CEDULA in simulation
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

        const conn = await getConnection();

        try {
            // Check for duplicate CEDULA
            const checkSql = 'SELECT COUNT(*) AS CANTIDAD FROM CLIENTES WHERE CEDULA = :cedula AND USUARIO_ID = :usuarioId';
            const checkResult = await conn.execute(checkSql, {
                cedula: cliente.CEDULA,
                usuarioId
            }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

            if (checkResult.rows[0].CANTIDAD > 0) {
                await conn.close();
                throw new Error('Ya existe un cliente con esta cédula');
            }

            // Insert new client
            const sql = `INSERT INTO CLIENTES (USUARIO_ID, NOMBRE, CEDULA, EMAIL, TELEFONO, DEUDA, DIRECCION, ESTADO, FECHA_REGISTRO) 
                         VALUES (:usuarioId, :nombre, :cedula, :email, :telefono, :deuda, :direccion, :estado, CURRENT_TIMESTAMP)`;
            await conn.execute(sql, {
                usuarioId,
                nombre: cliente.NOMBRE,
                cedula: cliente.CEDULA,
                email: cliente.EMAIL || '',
                telefono: cliente.TELEFONO,
                deuda: cliente.DEUDA || 0,
                direccion: cliente.DIRECCION,
                estado: cliente.ESTADO || 'Activo'
            }, { autoCommit: true });
            await conn.close();
            return cliente;
        } catch (error) {
            await conn.close();
            throw error;
        }
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
        const conn = await getConnection();
        const sql = `UPDATE CLIENTES SET 
                     NOMBRE = :nombre, 
                     CEDULA = :cedula,
                     EMAIL = :email,
                     TELEFONO = :telefono, 
                     DIRECCION = :direccion, 
                     DEUDA = :deuda,
                     ESTADO = :estado 
                     WHERE ID = :id`;
        await conn.execute(sql, {
            nombre: cliente.NOMBRE,
            cedula: cliente.CEDULA,
            email: cliente.EMAIL,
            telefono: cliente.TELEFONO,
            direccion: cliente.DIRECCION,
            deuda: cliente.DEUDA,
            estado: cliente.ESTADO,
            id: id
        }, { autoCommit: true });
        await conn.close();
        return cliente;
    },

    // ... existing methods (sumarDeuda, registrarPago, eliminar)
    // Mantengo los que estaban, solo asegurando de no borrarlos accidentalmente
    // Como estoy reemplazando todo el bloque, debo re-escribirlos

    async eliminar(id) {
        if (USE_SIMULATION) {
            const initialLength = clientesSimulados.length;
            clientesSimulados = clientesSimulados.filter(c => c.ID != id);
            return clientesSimulados.length < initialLength;
        }
        const conn = await getConnection();
        await conn.execute('DELETE FROM CLIENTES WHERE ID = :id', { id }, { autoCommit: true });
        await conn.close();
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
        const conn = await getConnection();
        await conn.execute('UPDATE CLIENTES SET DEUDA = DEUDA + :monto WHERE ID = :id', { monto, id }, { autoCommit: true });
        await conn.close();
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

        const conn = await getConnection();
        await conn.execute('UPDATE CLIENTES SET DEUDA = DEUDA - :monto WHERE ID = :id', { monto, id }, { autoCommit: true });
        await conn.close();
        return true;
    }
};

module.exports = clienteModel;
