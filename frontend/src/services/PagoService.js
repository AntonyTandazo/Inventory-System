import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.ENDPOINTS.PAGOS;

export const PagoService = {
    async obtenerHistorial() {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error('Error al obtener historial pagos:', error);
            throw error;
        }
    },

    async obtenerEstadisticas() {
        try {
            const response = await axios.get(`${API_URL}/stats`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener estadisticas pagos:', error);
            throw error;
        }
    },

    async registrar(pago) {
        try {
            const response = await axios.post(API_URL, pago);
            return response.data;
        } catch (error) {
            console.error('Error al registrar pago:', error);
            throw error;
        }
    }
};
