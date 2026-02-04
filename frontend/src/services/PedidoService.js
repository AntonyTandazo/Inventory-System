import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.ENDPOINTS.PEDIDOS;

// Helper to get current user ID from localStorage
const getUserId = () => {
    const id = localStorage.getItem('usuarioId');
    return id ? parseInt(id, 10) : 1; // Convert to integer
};

export const PedidoService = {
    async guardar(pedido) {
        try {
            const usuarioId = getUserId();
            const response = await axios.post(API_URL, { ...pedido, usuarioId });
            return response.data;
        } catch (error) {
            console.error('Error al registrar venta:', error);
            throw error;
        }
    },

    async obtenerTodos() {
        try {
            const usuarioId = getUserId();
            const response = await axios.get(`${API_URL}?usuarioId=${usuarioId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener pedidos:', error);
            throw error;
        }
    },

    async actualizarEstado(id, estado) {
        const response = await axios.patch(`${API_URL}/${id}/estado`, { estado });
        return response.data;
    },

    async registrarPago(id, estado) {
        const response = await axios.patch(`${API_URL}/${id}/pago`, { estado });
        return response.data;
    },

    async obtenerStatsEntregas() {
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}/stats/entregas?usuarioId=${usuarioId}`);
        return response.data;
    }
};
