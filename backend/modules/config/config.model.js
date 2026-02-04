const fs = require('fs');
const path = require('path');
const { getConnection, USE_SIMULATION } = require('../../config/database');
const productoModel = require('../productos/producto.model');
const clienteModel = require('../clientes/cliente.model');
const pedidoModel = require('../pedidos/pedido.model');
const pagoModel = require('../pagos/pago.model');

const CONFIG_FILE = path.join(__dirname, 'settings.json');

// Initialize settings file if not exists
if (!fs.existsSync(CONFIG_FILE)) {
    const defaultSettings = {
        negocio: { nombre: 'Mi Despensa Virtual', telefono: '', email: '', direccion: '' },
        notificaciones: { stockBajo: true, cobranza: true, nuevosPedidos: true },
        metodosPago: { efectivo: true, tarjeta: true, transferencia: true },
        seguridad: { pin: '1234' },
        adminUser: { // Credentials
            usuario: 'admin',
            password: 'admin123', // In real app, hash this
            nombre: 'Administrador',
            email: 'admin@example.com'
        }
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultSettings, null, 2));
}

const configModel = {
    getSettings() {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const settings = JSON.parse(data);

            // Ensure adminUser exists (Migration for existing files)
            if (!settings.adminUser) {
                settings.adminUser = {
                    usuario: 'admin',
                    password: 'admin123',
                    nombre: 'Administrador',
                    email: 'admin@example.com'
                };
                // Optional: Save it back so we don't check every time
                try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(settings, null, 2)); } catch (e) { }
            }

            return settings;
        } catch (e) {
            return {};
        }
    },

    saveSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };

        // Deep merge logic
        if (newSettings.negocio) updated.negocio = { ...current.negocio, ...newSettings.negocio };
        if (newSettings.notificaciones) updated.notificaciones = { ...current.notificaciones, ...newSettings.notificaciones };
        if (newSettings.metodosPago) updated.metodosPago = { ...current.metodosPago, ...newSettings.metodosPago };
        if (newSettings.seguridad) updated.seguridad = { ...current.seguridad, ...newSettings.seguridad };
        if (newSettings.adminUser) updated.adminUser = { ...current.adminUser, ...newSettings.adminUser };

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
        return updated;
    },

    async verifyLogin(usuario, password) {
        if (USE_SIMULATION) {
            const settings = this.getSettings();
            const admin = settings.adminUser || {};
            // In simulation, we check settings.json
            return admin.usuario === usuario && admin.password === password
                ? { id: 1, usuario: admin.usuario, nombre_negocio: admin.nombre || 'Mi Tienda' }
                : null;
        }

        const supabase = await getConnection();
        try {
            // Login query using Supabase
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, usuario, password, nombre_negocio')
                .eq('usuario', usuario)
                .eq('estado', 1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return null;
                }
                throw error;
            }

            if (data && data.password === password) {
                return data;
            }
            return null;
        } catch (e) {
            console.error('Login Error:', e);
            throw e;
        }
    },

    async registerUser(userData) {
        // userData: { usuario, password, email, negocio }
        if (USE_SIMULATION) {
            this.saveSettings({
                adminUser: {
                    usuario: userData.usuario,
                    password: userData.password,
                    email: userData.email,
                    nombre: userData.nombre
                },
                negocio: { nombre: userData.negocio, email: userData.email }
            });
            return { id: 1, ...userData };
        }

        const supabase = await getConnection();
        try {
            // Insert new user using Supabase
            const { data, error } = await supabase
                .from('usuarios')
                .insert([
                    {
                        usuario: userData.usuario,
                        password: userData.password,
                        email: userData.email,
                        nombre_negocio: userData.negocio
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Error en registro:', error);
                throw error;
            }

            return { id: data.id, usuario: data.usuario };

        } catch (e) {
            console.error('Error en registro:', e);
            throw e;
        }
    },

    verifyPin(inputPin) {
        const settings = this.getSettings();
        return settings.seguridad.pin === inputPin;
    },

    // ... backup methods (generateBackup, restoreBackup) kept as is or updated if needed
    async generateBackup() {
        // ... (Keep existing simulation implementation)
        if (USE_SIMULATION) {
            const productos = await productoModel.obtenerTodos();
            const clientes = await clienteModel.obtenerTodos();
            const pedidos = await pedidoModel.obtenerTodos();
            const pagos = await pagoModel.obtenerHistorial();
            return { timestamp: new Date(), data: { productos, clientes, pedidos, pagos } };
        }
        return { message: "Backup DB not implementing in this View" };
    },

    async restoreBackup(data) {
        if (USE_SIMULATION) {
            console.log("Restoring...", data);
            return true;
        }
        return false;
    }
};

module.exports = configModel;
