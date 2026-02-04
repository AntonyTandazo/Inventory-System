const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Modo simulación configurado en .env
const DB_SIM_VALUE = String(process.env.DB_SIMULATION || 'false').toLowerCase().trim();
const USE_SIMULATION = DB_SIM_VALUE === 'true';

console.log(`[DB_CONFIG] DB_SIMULATION: "${process.env.DB_SIMULATION}" -> Final: ${USE_SIMULATION}`);

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

// Inicializar cliente de Supabase si no está en modo simulación
if (!USE_SIMULATION) {
  if (!supabaseUrl || !supabaseKey) {
    console.error('[DB_CONFIG] ERROR: SUPABASE_URL y SUPABASE_ANON_KEY son requeridos');
    throw new Error('Faltan credenciales de Supabase en variables de entorno');
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[DB_CONFIG] Cliente de Supabase inicializado correctamente');
}

/**
 * Obtiene el cliente de Supabase o un mock en modo simulación
 * @returns {Object} Cliente de Supabase o mock
 */
async function getConnection() {
  if (USE_SIMULATION) {
    console.log('--- MODO SIMULACIÓN ACTIVO ---');
    return {
      from: (table) => ({
        select: async (columns = '*') => {
          console.log(`[SIM] SELECT ${columns} FROM ${table}`);
          return { data: [], error: null };
        },
        insert: async (data) => {
          console.log(`[SIM] INSERT INTO ${table}:`, data);
          return { data: [{ id: 1, ...data }], error: null };
        },
        update: async (data) => {
          console.log(`[SIM] UPDATE ${table}:`, data);
          return { data: [data], error: null };
        },
        delete: async () => {
          console.log(`[SIM] DELETE FROM ${table}`);
          return { data: [], error: null };
        },
        eq: function (column, value) {
          console.log(`[SIM] WHERE ${column} = ${value}`);
          return this;
        },
        single: async function () {
          console.log(`[SIM] SINGLE`);
          return { data: null, error: null };
        }
      }),
      rpc: async (functionName, params) => {
        console.log(`[SIM] RPC ${functionName}:`, params);
        return { data: null, error: null };
      }
    };
  }

  if (!supabase) {
    throw new Error('Cliente de Supabase no inicializado');
  }

  return supabase;
}

/**
 * Ejecuta una consulta SQL directa usando pg (para queries complejas)
 * @param {string} sql - Query SQL
 * @param {Array} params - Parámetros de la query
 * @returns {Promise<Object>} Resultado de la query
 */
async function executeQuery(sql, params = []) {
  if (USE_SIMULATION) {
    console.log(`[SIM] Ejecutando SQL: ${sql}`, params);
    return { rows: [], rowCount: 0 };
  }

  // Para queries SQL directas, usamos rpc o la API REST de Supabase
  // Nota: Supabase prefiere usar su API, pero para queries complejas
  // podemos usar funciones RPC en PostgreSQL
  console.log('[DB] Ejecutando query:', sql.substring(0, 100) + '...');

  // Convertir query a formato Supabase cuando sea posible
  // Para queries muy complejas, considera crear funciones en Supabase
  throw new Error('executeQuery: Usa métodos de Supabase API en lugar de SQL directo');
}

module.exports = {
  getConnection,
  executeQuery,
  USE_SIMULATION,
  supabase
};
