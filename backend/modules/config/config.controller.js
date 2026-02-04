const configModel = require('./config.model');
const { getConnection } = require('../../config/database');
const oracledb = require('oracledb');

const configController = {
    getSettings(req, res) {
        try {
            const settings = configModel.getSettings();
            // Don't send PIN in clear text if possible, but for edit form we might need it? 
            // Better to NOT send PIN back.
            const { seguridad, ...rest } = settings;
            res.json({ ...rest, hasPin: !!seguridad.pin });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateSettings(req, res) {
        try {
            const { pin, settings } = req.body;
            // Verify PIN for sensitive changes if needed, or if it's a general save
            // Logic: If user is saving "Business Info", they provided a PIN in the UI modal.
            if (!configModel.verifyPin(pin)) {
                return res.status(403).json({ error: 'PIN Incorrecto' });
            }

            const updated = configModel.saveSettings(settings);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    verifyPin(req, res) {
        try {
            const { pin } = req.body;
            const isValid = configModel.verifyPin(pin);
            res.json({ valid: isValid });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async login(req, res) {
        try {
            const { usuario, password } = req.body;
            // VerifyLogin is now ASYNC and returns USER object or NULL
            const user = await configModel.verifyLogin(usuario, password);

            if (user) {
                // Return user details including ID for frontend context
                res.json({
                    token: 'mock-token',
                    usuarioId: user.ID,  // ADD USER ID HERE
                    usuario: user.USUARIO,
                    negocio: user.NOMBRE_NEGOCIO
                });
            } else {
                res.status(401).json({ error: 'Credenciales inválidas' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    async register(req, res) {
        try {
            const { usuario, password, nombre, negocio, email, pin } = req.body;

            // Basic validation
            if (!usuario || !password) return res.status(400).json({ error: 'Usuario y Contraseña requeridos' });

            // Call model to register (DB or Simulation)
            await configModel.registerUser({ usuario, password, nombre, negocio, email });

            // Note: PIN is currently stored in settings.json (simulation) or needs to be in DB.
            // Since DB schema provided by user DOES NOT HAVE PIN, we might lose it for DB users unless we add it.
            // For now, we save it to settings file as a fallback for the "Local System" preferences, 
            // assuming the DB user is mapped to this "machine" settings.
            if (pin) {
                configModel.saveSettings({ seguridad: { pin } });
            }

            res.json({ message: 'Usuario registrado correctamente' });
        } catch (error) {
            console.error(error); // Log error
            res.status(500).json({ error: error.message });
        }
    },

    async downloadBackup(req, res) {
        try {
            const backup = await configModel.generateBackup();
            res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(backup, null, 2));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async restoreBackup(req, res) {
        try {
            const { pin, data } = req.body;
            if (!configModel.verifyPin(pin)) {
                return res.status(403).json({ error: 'PIN Incorrecto' });
            }

            const success = await configModel.restoreBackup(data);
            if (success) {
                res.json({ message: 'Restauración completada' });
            } else {
                res.status(400).json({ error: 'Fallo al restaurar' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async changePin(req, res) {
        try {
            const { currentPin, newPin } = req.body;
            const usuarioId = req.body.usuarioId || 1; // Get from session/token in production

            // Verify current PIN against DATABASE (source of truth)
            const conn = await getConnection();

            try {
                const result = await conn.execute(
                    'SELECT PIN_SEGURIDAD FROM USUARIOS WHERE ID = :usuarioId',
                    { usuarioId },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );

                if (!result.rows || result.rows.length === 0) {
                    await conn.close();
                    return res.status(404).json({ error: 'Usuario no encontrado' });
                }

                const pinActualDB = result.rows[0].PIN_SEGURIDAD;

                // Verify current PIN
                if (pinActualDB !== currentPin) {
                    await conn.close();
                    return res.status(403).json({ error: 'PIN Actual Incorrecto' });
                }

                // Update PIN in DATABASE
                await conn.execute(
                    'UPDATE USUARIOS SET PIN_SEGURIDAD = :newPin WHERE ID = :usuarioId',
                    { newPin, usuarioId },
                    { autoCommit: true }
                );

                await conn.close();

                // Also update settings.json for backward compatibility
                configModel.saveSettings({ seguridad: { pin: newPin } });

                res.json({ message: 'PIN actualizado correctamente' });
            } catch (dbError) {
                await conn.close();
                throw dbError;
            }
        } catch (error) {
            console.error('[CONFIG] Error changing PIN:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = configController;
