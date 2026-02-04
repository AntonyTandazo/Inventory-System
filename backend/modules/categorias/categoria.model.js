const { getConnection, USE_SIMULATION } = require('../../config/database');
const { toOracleFormat } = require('../../config/helpers');

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

        const supabase = await getConnection();

        let query = supabase
            .from('categorias')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('nombre');

        if (!incluirInactivas) {
            query = query.eq('activo', 1);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[CATEGORIAS] Error obtaining categories:', error.message);
            return [];
        }

        console.log('[CATEGORIAS] Found', data.length, 'categories');
        return toOracleFormat(data);
    },

    async buscarPorNombre(nombre, usuarioId = 1) {
        if (USE_SIMULATION) {
            return categoriasSimuladas.find(c => c.NOMBRE.toLowerCase() === nombre.toLowerCase());
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('categorias')
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

    async crear(nombre, usuarioId = 1) {
        if (USE_SIMULATION) {
            const nueva = { ID: Date.now(), NOMBRE: nombre, ACTIVO: 1 };
            categoriasSimuladas.push(nueva);
            return nueva;
        }

        const supabase = await getConnection();
        const { data, error } = await supabase
            .from('categorias')
            .insert([{
                usuario_id: usuarioId,
                nombre: nombre,
                activo: 1
            }])
            .select()
            .single();

        if (error) throw error;

        return toOracleFormat(data);
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

        const supabase = await getConnection();
        const { error } = await supabase
            .from('categorias')
            .update({ nombre })
            .eq('id', id);

        if (error) throw error;
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

        const supabase = await getConnection();
        const { error } = await supabase
            .from('categorias')
            .update({ activo: 0 })
            .eq('id', id);

        if (error) throw error;
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

        const supabase = await getConnection();
        const { error } = await supabase
            .from('categorias')
            .update({ activo: 1 })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

module.exports = categoriaModel;
