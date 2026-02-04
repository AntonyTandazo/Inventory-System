/**
 * Helper functions para trabajar con Supabase
 * Convierte entre snake_case (PostgreSQL) y UPPERCASE (Oracle legacy)
 */

/**
 * Convierte un objeto de PostgreSQL (snake_case) a formato Oracle legacy (UPPERCASE)
 * @param {Object} obj - Objeto con propiedades en snake_case
 * @returns {Object} Objeto con propiedades en UPPERCASE
 */
function toOracleFormat(obj) {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(toOracleFormat);

    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
        const upperKey = key.toUpperCase();
        converted[upperKey] = value;
    }
    return converted;
}

/**
 * Convierte un objeto de formato Oracle legacy (UPPERCASE) a PostgreSQL (snake_case)
 * @param {Object} obj - Objeto con propiedades en UPPERCASE
 * @returns {Object} Objeto con propiedades en snake_case
 */
function toPostgresFormat(obj) {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(toPostgresFormat);

    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.toLowerCase();
        converted[snakeKey] = value;
    }
    return converted;
}

module.exports = {
    toOracleFormat,
    toPostgresFormat
};
