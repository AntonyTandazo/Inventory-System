import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.ENDPOINTS.REPORTES;

// Helper to get current user ID from localStorage
const getUserId = () => {
    const id = localStorage.getItem('usuarioId');
    return id ? parseInt(id, 10) : 1; // Convert to integer
};

export const ReporteService = {
    async getGeneral(rango) {
        // rango: 'mes', 'trimestre', 'anio'
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}/general?rango=${rango}&usuarioId=${usuarioId}`);
        return response.data;
    },

    async getProductos(rango) {
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}/productos?rango=${rango}&usuarioId=${usuarioId}`);
        return response.data;
    },

    async getClientes(rango) {
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}/clientes?rango=${rango}&usuarioId=${usuarioId}`);
        return response.data;
    },

    async getCategorias(rango) {
        const usuarioId = getUserId();
        const response = await axios.get(`${API_URL}/categorias?rango=${rango}&usuarioId=${usuarioId}`);
        return response.data;
    }
};
