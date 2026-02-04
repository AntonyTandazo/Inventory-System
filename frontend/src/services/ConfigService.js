import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.ENDPOINTS.CONFIG;

export const ConfigService = {
    async getSettings() {
        const response = await axios.get(API_URL);
        return response.data;
    },

    async updateSettings(settings, pin) {
        const response = await axios.post(API_URL, { settings, pin });
        return response.data;
    },

    async verifyPin(pin) {
        const response = await axios.post(`${API_URL}/verify-pin`, { pin });
        return response.data;
    },

    async downloadBackup() {
        // Trigger download via browser
        window.open(`${API_URL}/backup`, '_blank');
    },

    async restoreBackup(data, pin) {
        const response = await axios.post(`${API_URL}/restore`, { data, pin });
        return response.data;
    },

    async changePin(currentPin, newPin, usuarioId) {
        const response = await axios.post(`${API_URL}/change-pin`, {
            currentPin,
            newPin,
            usuarioId
        });
        return response.data;
    }

    // In a real app, logic for "Factory Reset" or "Delete Profile" would also be endpoints
    // For now we will map them to "restoreBackup" with empty/default data or new endpoints if needed.
    // Let's assume Delete Profile clears DB.
};
