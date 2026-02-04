import React, { useState, useEffect } from 'react';
import { ConfigService } from '../../services/ConfigService';
import SecurityPinModal from './SecurityPinModal';
import ChangeCredentialModal from './ChangeCredentialModal';
import { Save, ShieldAlert, Download, RefreshCw, Trash2, Key, Bell, CreditCard } from 'lucide-react';

const ConfiguracionView = () => {
    const [settings, setSettings] = useState({
        negocio: { nombre: '', telefono: '', email: '', direccion: '' },
        notificaciones: { stockBajo: true, cobranza: true, nuevosPedidos: true },
        metodosPago: { efectivo: true, tarjeta: true, transferencia: true }
    });
    const [authModal, setAuthModal] = useState({ open: false, action: null });
    const [credentialModalOpen, setCredentialModalOpen] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await ConfigService.getSettings();
            setSettings(prev => ({ ...prev, ...data }));
        } catch (e) {
            console.error(e);
        }
    };

    const handleChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleAction = (actionType) => {
        // Trigger PIN modal
        setAuthModal({ open: true, action: actionType });
    };

    const executeAction = async (pin) => {
        const { action } = authModal;
        try {
            if (action === 'SAVE') {
                await ConfigService.updateSettings({ ...settings }, pin);
                alert('Configuración guardada correctamente.');
            } else if (action === 'RESTORE') {
                // In a real app, showing file picker here
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                        const data = JSON.parse(evt.target.result);
                        await ConfigService.restoreBackup(data, pin);
                        alert('Base de datos restaurada.');
                    };
                    reader.readAsText(file);
                };
                input.click();
            } else if (action === 'RESET') {
                // Call reset endpoint (mocked)
                alert('Sistema restaurado a estado de fábrica (Simulado).');
            } else if (action === 'DELETE_PROFILE') {
                if (confirm('¿ESTÁS SEGURO? Se borrarán todos tus datos permanentemente.')) {
                    alert('Perfil eliminado (Simulado).');
                    // Redirect to login or cleaning local storage
                }
            }
        } catch (e) {
            alert('Error: ' + (e.response?.data?.error || e.message));
        }
    };

    const isMobile = window.innerWidth <= 768;

    return (
        <div style={{ padding: isMobile ? '15px' : '30px', backgroundColor: '#f8fafc', flex: 1, overflowY: 'auto', width: '100%' }}>
            <h1 style={{ color: '#1e293b', marginBottom: '30px', fontSize: 'clamp(20px, 5vw, 24px)' }}>Configuración del Sistema</h1>

            {/* Quick Actions Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={cardStyle}>
                    <h3 style={cardTitle}><RefreshCw size={20} /> Backup y Restauración</h3>
                    <p style={cardText}>Último respaldo: {new Date().toLocaleDateString()}</p>
                    <button onClick={() => ConfigService.downloadBackup()} style={{ ...primaryBtn, fontSize: '14px', width: '100%', justifyContent: 'center' }}><Download size={16} /> Descargar Backup</button>
                </div>
                <div style={cardStyle}>
                    <h3 style={cardTitle}><Key size={20} /> Seguridad</h3>
                    <p style={cardText}>Protege acciones sensibles con tu PIN.</p>
                    <button onClick={() => setCredentialModalOpen(true)} style={{ ...secondaryBtn, width: '100%', fontSize: '14px' }}>Cambiar Contraseña / PIN</button>
                </div>
            </div>

            {/* Business Info Form */}
            <div style={cardStyle}>
                <h3 style={cardTitle}>Información del Negocio</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <input
                        style={inputStyle} placeholder="Nombre del Negocio"
                        value={settings.negocio.nombre} onChange={e => handleChange('negocio', 'nombre', e.target.value)}
                    />
                    <input
                        style={inputStyle} placeholder="Teléfono"
                        value={settings.negocio.telefono} onChange={e => handleChange('negocio', 'telefono', e.target.value)}
                    />
                    <input
                        style={inputStyle} placeholder="Correo Electrónico"
                        value={settings.negocio.email} onChange={e => handleChange('negocio', 'email', e.target.value)}
                    />
                    <input
                        style={inputStyle} placeholder="Dirección"
                        value={settings.negocio.direccion} onChange={e => handleChange('negocio', 'direccion', e.target.value)}
                    />
                </div>
                <button onClick={() => handleAction('SAVE')} style={{ ...primaryBtn, width: isMobile ? '100%' : 'fit-content', justifyContent: 'center' }}>
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>

            {/* Notifications & Payments */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={cardStyle}>
                    <h3 style={cardTitle}><Bell size={20} /> Notificaciones</h3>
                    <div style={checkRow}>
                        <input type="checkbox" checked={settings.notificaciones.stockBajo} onChange={e => handleChange('notificaciones', 'stockBajo', e.target.checked)} />
                        <span>Alerta de Stock Bajo</span>
                    </div>
                    <div style={checkRow}>
                        <input type="checkbox" checked={settings.notificaciones.cobranza} onChange={e => handleChange('notificaciones', 'cobranza', e.target.checked)} />
                        <span>Recordatorios de Cobranza</span>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={cardTitle}><CreditCard size={20} /> Métodos de Pago</h3>
                    <div style={checkRow}>
                        <input type="checkbox" checked={settings.metodosPago.efectivo} onChange={e => handleChange('metodosPago', 'efectivo', e.target.checked)} />
                        <span>Efectivo</span>
                    </div>
                    <div style={checkRow}>
                        <input type="checkbox" checked={settings.metodosPago.tarjeta} onChange={e => handleChange('metodosPago', 'tarjeta', e.target.checked)} />
                        <span>Tarjeta de Crédito/Débito</span>
                    </div>
                    <div style={checkRow}>
                        <input type="checkbox" checked={settings.metodosPago.transferencia} onChange={e => handleChange('metodosPago', 'transferencia', e.target.checked)} />
                        <span>Transferencia Bancaria</span>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div style={{ ...cardStyle, border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
                <h3 style={{ ...cardTitle, color: '#dc2626' }}><ShieldAlert size={20} /> Zona de Peligro</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button onClick={() => handleAction('RESTORE')} style={dangerBtn}>Restaurar Base de Datos</button>
                    <button onClick={() => handleAction('RESET')} style={dangerBtn}>Restaurar Configuración Predeterminada</button>
                    <button onClick={() => handleAction('DELETE_PROFILE')} style={{ ...dangerBtn, backgroundColor: '#b91c1c' }}><Trash2 size={16} /> Borrar Perfil</button>
                </div>
            </div>

            {authModal.open && (
                <SecurityPinModal
                    onClose={() => setAuthModal({ open: false, action: null })}
                    onSuccess={(pin) => executeAction(pin)}
                    title={authModal.action === 'SAVE' ? "Guardar Cambios" : "Acción Restringida"}
                />
            )}

            {credentialModalOpen && (
                <ChangeCredentialModal
                    onClose={() => setCredentialModalOpen(false)}
                />
            )}
        </div>
    );
};

const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' };
const cardTitle = { margin: '0 0 15px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#334155' };
const cardText = { color: '#64748b', marginBottom: '15px', fontSize: '14px' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' };
const checkRow = { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', color: '#475569' };
const primaryBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 };
const secondaryBtn = { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 };
const dangerBtn = { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' };

export default ConfiguracionView;
