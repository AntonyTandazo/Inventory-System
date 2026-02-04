import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.ENDPOINTS.AUTH;

export const AuthService = {
    async login(usuario, password) {
        try {
            const response = await axios.post(`${API_URL}/login`, { usuario, password });
            // Store user data in localStorage for subsequent requests
            if (response.data.usuarioId) {
                localStorage.setItem('usuarioId', response.data.usuarioId);
                localStorage.setItem('usuario', response.data.usuario);
                localStorage.setItem('negocio', response.data.negocio);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Error al iniciar sesión';
        }
    },

    async register(data) {
        try {
            const response = await axios.post(`${API_URL}/register`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Error al registrarse';
        }
    },

    getUserId() {
        return localStorage.getItem('usuarioId') || '1';
    }
};
