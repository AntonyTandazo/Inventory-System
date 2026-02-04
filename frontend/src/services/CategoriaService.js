import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.ENDPOINTS.CATEGORIAS;

// Helper to get current user ID from localStorage
const getUserId = () => {
    const id = localStorage.getItem('usuarioId');
    return id ? parseInt(id, 10) : 1; // Convert to integer
};

export const CategoriaService = {
    async listar() {
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}?usuarioId=${usuarioId}`);
        return response.data;
    },
    async guardar(nombre) {
        try {
            const usuarioId = getUserId();
            const response = await axios.post(API_URL, { nombre, usuarioId });
            return response.data;
        } catch (error) {
            // Extract error message from response
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw { mensaje: error.message || 'Error de conexión con el servidor' };
        }
    },
    async actualizar(id, nombre) {
        const response = await axios.put(`${API_URL}/${id}`, { nombre });
        return response.data;
    },
    async eliminar(id) {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    },
    async restaurar(id) {
        const response = await axios.post(`${API_URL}/${id}/restaurar`);
        return response.data;
    }
};
