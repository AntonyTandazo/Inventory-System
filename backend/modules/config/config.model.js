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
    // Helper for synchronous local file access
    _getLocalSettings() {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            let settings = JSON.parse(data);

            // Ensure adminUser exists (Migration for existing files)
            if (!settings.adminUser) {
                settings.adminUser = {
                    usuario: 'admin',
                    password: 'admin123',
                    nombre: 'Administrador',
                    email: 'admin@example.com'
                };
            }
            return settings;
        } catch (e) {
            return {};
        }
    },

    async getSettings(usuarioId) {
        const settings = this._getLocalSettings();

        if (usuarioId && !USE_SIMULATION) {
            try {
                const supabase = await getConnection();
                const { data: user, error } = await supabase
                    .from('usuarios')
                    .select('nombre_negocio, email, pin_seguridad')
                    .eq('id', usuarioId)
                    .single();

                if (user) {
                    if (!settings.negocio) settings.negocio = {};
                    if (!settings.seguridad) settings.seguridad = {};
                    // Merge DB data into settings
                    if (user.nombre_negocio) settings.negocio.nombre = user.nombre_negocio;
                    if (user.email) settings.negocio.email = user.email;
                    if (user.pin_seguridad) settings.seguridad.pin = user.pin_seguridad;
                }
            } catch (error) {
                console.error('Error fetching user settings from DB:', error);
            }
        }
        return settings;
    },

    async saveSettings(newSettings, usuarioId) {
        const current = this._getLocalSettings();
        const updated = { ...current, ...newSettings };

        // Deep merge logic
        if (newSettings.negocio) updated.negocio = { ...current.negocio, ...newSettings.negocio };
        if (newSettings.notificaciones) updated.notificaciones = { ...current.notificaciones, ...newSettings.notificaciones };
        if (newSettings.metodosPago) updated.metodosPago = { ...current.metodosPago, ...newSettings.metodosPago };
        if (newSettings.seguridad) updated.seguridad = { ...current.seguridad, ...newSettings.seguridad };
        if (newSettings.adminUser) updated.adminUser = { ...current.adminUser, ...newSettings.adminUser };

        // Save to file (Global config)
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));

        // Save to DB (User specific config)
        if (usuarioId && !USE_SIMULATION) {
            try {
                const supabase = await getConnection();
                const updates = {};
                // Only update fields that exist in USUARIOS table
                if (newSettings.negocio && newSettings.negocio.nombre) updates.nombre_negocio = newSettings.negocio.nombre;
                if (newSettings.negocio && newSettings.negocio.email) updates.email = newSettings.negocio.email;
                if (newSettings.seguridad && newSettings.seguridad.pin) updates.pin_seguridad = newSettings.seguridad.pin;

                if (Object.keys(updates).length > 0) {
                    await supabase.from('usuarios').update(updates).eq('id', usuarioId);
                }
            } catch (error) {
                console.error('Error saving user settings to DB:', error);
            }
        }

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
        // userData: { usuario, password, email, negocio, pin }
        if (USE_SIMULATION) {
            this.saveSettings({
                adminUser: {
                    usuario: userData.usuario,
                    password: userData.password,
                    email: userData.email,
                    nombre: userData.nombre
                },
                negocio: { nombre: userData.negocio, email: userData.email },
                seguridad: { pin: userData.pin || '1234' }
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
                        nombre_negocio: userData.negocio,
                        pin_seguridad: userData.pin
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

    async verifyPin(inputPin, usuarioId) {
        const settings = this._getLocalSettings();

        if (usuarioId && !USE_SIMULATION) {
            try {
                const supabase = await getConnection();
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('pin_seguridad')
                    .eq('id', usuarioId)
                    .single();

                if (data) {
                    // Ensure robust comparison (string vs number)
                    return String(data.pin_seguridad) === String(inputPin);
                }
            } catch (error) {
                console.error('Error verifying PIN from DB:', error);
            }
        }

        // Fallback to local settings (for simulation or legacy)
        // Also if DB query fails or returns no user (shouldn't happen if logged in)
        return String(settings.seguridad.pin) === String(inputPin);
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
