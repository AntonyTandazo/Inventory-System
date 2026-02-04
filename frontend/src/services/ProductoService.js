import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.ENDPOINTS.PRODUCTOS;

// Helper to get current user ID from localStorage
const getUserId = () => {
    const id = localStorage.getItem('usuarioId');
    return id ? parseInt(id, 10) : 1; // Convert to integer
};

export const ProductoService = {
    async listar() {
        try {
            const usuarioId = getUserId();
            const response = await axios.get(`${API_URL}?usuarioId=${usuarioId}`);
            return response.data;
        } catch (error) {
            console.error('Error al listar productos:', error);
            throw error;
        }
    },

    async getStatistics() {
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}/stats?usuarioId=${usuarioId}`);
        return response.data;
    },

    async guardar(producto) {
        try {
            const usuarioId = getUserId();
            const response = await axios.post(API_URL, { ...producto, usuarioId });
            return response.data;
        } catch (error) {
            // Re-throw full response for component handling (conflicts)
            throw error.response ? error.response.data : error;
        }
    },

    async editar(id, producto) {
        try {
            const response = await axios.put(`${API_URL}/${id}`, producto);
            return response.data;
        } catch (error) {
            console.error('Error al editar producto:', error);
            throw error;
        }
    },

    async eliminar(id, pin, usuarioId) {
        try {
            const response = await axios.delete(`${API_URL}/${id}`, {
                data: { pin, usuarioId }
            });
            return response.data;
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            throw error;
        }
    },

    async restaurar(id) {
        const response = await axios.post(`${API_URL}/${id}/restaurar`);
        return response.data;
    }
};
