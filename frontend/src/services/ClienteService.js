import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.ENDPOINTS.CLIENTES;

// Helper to get current user ID from localStorage
const getUserId = () => {
    const id = localStorage.getItem('usuarioId');
    return id ? parseInt(id, 10) : 1; // Convert to integer
};

export const ClienteService = {
    async listar() {
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}?usuarioId=${usuarioId}`);
        return response.data;
    },
    async getStatistics() {
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}/stats?usuarioId=${usuarioId}`);
        return response.data;
    },
    async guardar(cliente) {
        const usuarioId = getUserId();
        const response = await axios.post(API_URL, { ...cliente, usuarioId });
        return response.data;
    },
    async actualizar(id, cliente) {
        const response = await axios.put(`${API_URL}/${id}`, cliente);
        return response.data;
    },
    async eliminar(id, pin, usuarioId) {
        const response = await axios.delete(`${API_URL}/${id}`, {
            data: { pin, usuarioId }
        });
        return response.data;
    },
    async registrarPago(id, monto) {
        const response = await axios.post(`${API_URL}/${id}/pago`, { monto });
        return response.data;
    }
};
