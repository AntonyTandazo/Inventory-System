const { getConnection, USE_SIMULATION } = require('../../config/database');
const oracledb = require('oracledb');

// Datos simulados
let categoriasSimuladas = [
    { ID: 1, NOMBRE: 'Granos', ACTIVO: 1 },
    { ID: 2, NOMBRE: 'Grasas', ACTIVO: 1 },
    { ID: 3, NOMBRE: 'Lácteos', ACTIVO: 1 },
    { ID: 4, NOMBRE: 'Endulzantes', ACTIVO: 1 },
    { ID: 5, NOMBRE: 'Proteínas', ACTIVO: 1 },
    { ID: 6, NOMBRE: 'Enlatados', ACTIVO: 1 },
    { ID: 7, NOMBRE: 'Bebidas', ACTIVO: 1 },
    { ID: 8, NOMBRE: 'Limpieza', ACTIVO: 0 } // Eliminada logicamente
];

const categoriaModel = {
    async obtenerTodas(usuarioId = 1, incluirInactivas = false) {
        if (USE_SIMULATION) {
            return incluirInactivas
                ? categoriasSimuladas
                : categoriasSimuladas.filter(c => c.ACTIVO == 1);
        }
        const conn = await getConnection();
        const sql = incluirInactivas
            ? 'SELECT * FROM CATEGORIAS WHERE USUARIO_ID = :usuarioId ORDER BY NOMBRE'
            : 'SELECT * FROM CATEGORIAS WHERE ACTIVO = 1 AND USUARIO_ID = :usuarioId ORDER BY NOMBRE';

        try {
            console.log('[CATEGORIAS] Executing query with usuarioId:', usuarioId);
            const result = await conn.execute(sql, { usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await conn.close();
            console.log('[CATEGORIAS] Found', result.rows.length, 'categories');
            return result.rows;
        } catch (e) {
            console.error('[CATEGORIAS] Error obtaining categories:', e.message);
            console.error('[CATEGORIAS] SQL was:', sql);
            await conn.close();
            return [];
        }
    },

    async buscarPorNombre(nombre, usuarioId = 1) {
        if (USE_SIMULATION) {
            return categoriasSimuladas.find(c => c.NOMBRE.toLowerCase() === nombre.toLowerCase());
        }
        const conn = await getConnection();
        const sql = 'SELECT * FROM CATEGORIAS WHERE LOWER(NOMBRE) = LOWER(:nombre) AND USUARIO_ID = :usuarioId';
        const result = await conn.execute(sql, { nombre, usuarioId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        await conn.close();
        return result.rows[0];
    },

    async crear(nombre, usuarioId = 1) {
        if (USE_SIMULATION) {
            const nueva = { ID: Date.now(), NOMBRE: nombre, ACTIVO: 1 };
            categoriasSimuladas.push(nueva);
            return nueva;
        }
        const conn = await getConnection();
        const sql = 'INSERT INTO CATEGORIAS (USUARIO_ID, NOMBRE, ACTIVO) VALUES (:usuarioId, :nombre, 1)';
        await conn.execute(sql, { usuarioId, nombre }, { autoCommit: true });
        await conn.close();
        return { NOMBRE: nombre, ACTIVO: 1 };
    },

    async actualizar(id, nombre) {
        if (USE_SIMULATION) {
            const idx = categoriasSimuladas.findIndex(c => c.ID == id);
            if (idx !== -1) {
                categoriasSimuladas[idx].NOMBRE = nombre;
                return true;
            }
            return false;
        }
        const conn = await getConnection();
        const sql = 'UPDATE CATEGORIAS SET NOMBRE = :nombre WHERE ID = :id';
        await conn.execute(sql, { nombre, id }, { autoCommit: true });
        await conn.close();
        return true;
    },

    async eliminar(id) {
        // Soft delete
        if (USE_SIMULATION) {
            const idx = categoriasSimuladas.findIndex(c => c.ID == id);
            if (idx !== -1) {
                categoriasSimuladas[idx].ACTIVO = 0;
                return true;
            }
            return false;
        }
        const conn = await getConnection();
        const sql = 'UPDATE CATEGORIAS SET ACTIVO = 0 WHERE ID = :id';
        await conn.execute(sql, { id }, { autoCommit: true });
        await conn.close();
        return true;
    },

    async restaurar(id) {
        if (USE_SIMULATION) {
            const idx = categoriasSimuladas.findIndex(c => c.ID == id);
            if (idx !== -1) {
                categoriasSimuladas[idx].ACTIVO = 1;
                return true;
            }
            return false;
        }
        const conn = await getConnection();
        const sql = 'UPDATE CATEGORIAS SET ACTIVO = 1 WHERE ID = :id';
        await conn.execute(sql, { id }, { autoCommit: true });
        await conn.close();
        return true;
    }
};

module.exports = categoriaModel;
