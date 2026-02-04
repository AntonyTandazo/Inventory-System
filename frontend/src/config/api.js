// Configuración centralizada de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    ENDPOINTS: {
        AUTH: `${API_BASE_URL}/api/config`,
        PRODUCTOS: `${API_BASE_URL}/api/productos`,
        CATEGORIAS: `${API_BASE_URL}/api/categorias`,
        CLIENTES: `${API_BASE_URL}/api/clientes`,
        PEDIDOS: `${API_BASE_URL}/api/pedidos`,
        PAGOS: `${API_BASE_URL}/api/pagos`,
        REPORTES: `${API_BASE_URL}/api/reportes`,
        CONFIG: `${API_BASE_URL}/api/config`,
        TELEPEDIDOS: `${API_BASE_URL}/api/telepedidos`
    }
};

export default API_CONFIG;
