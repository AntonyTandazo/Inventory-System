import React, { useState } from 'react';
import { X, Key, Lock } from 'lucide-react';
import { ConfigService } from '../../services/ConfigService';
import { AuthService } from '../../services/AuthService';

const ChangeCredentialModal = ({ onClose }) => {
    const [mode, setMode] = useState('SELECT'); // SELECT, PIN, PASSWORD
    const [formData, setFormData] = useState({ current: '', new: '', confirm: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.new !== formData.confirm) {
            setError('Las nuevas credenciales no coinciden.');
            return;
        }

        try {
            if (mode === 'PIN') {
                // Use new changePin method that updates both DB and settings
                const usuarioId = AuthService.getUserId();
                await ConfigService.changePin(formData.current, formData.new, usuarioId);
                setSuccess('PIN actualizado correctamente.');
                setTimeout(onClose, 1500);

            } else if (mode === 'PASSWORD') {
                // Simulation for password change
                if (formData.current !== 'admin123') { // Hardcoded current for simulation
                    setError('Contraseña actual incorrecta (Simulada: admin123).');
                    return;
                }
                setSuccess('Contraseña actualizada (Simulado).');
                setTimeout(onClose, 1500);
            }
        } catch (e) {
            setError(e.response?.data?.error || 'Error al actualizar.');
            console.error(e);
        }
    };

    const renderSelection = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <button onClick={() => setMode('PASSWORD')} style={optionBtn}>
                <Key size={32} />
                <span>Cambiar Contraseña</span>
            </button>
            <button onClick={() => setMode('PIN')} style={optionBtn}>
                <Lock size={32} />
                <span>Cambiar PIN de Seguridad</span>
            </button>
        </div>
    );

    const renderForm = (title) => (
        <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <input
                    type="password" placeholder="Actual" value={formData.current}
                    onChange={e => handleChange('current', e.target.value)}
                    style={inputStyle} required
                    maxLength={mode === 'PIN' ? 4 : 20}
                />
                <input
                    type="password" placeholder="Nueva" value={formData.new}
                    onChange={e => handleChange('new', e.target.value)}
                    style={inputStyle} required
                    maxLength={mode === 'PIN' ? 4 : 20}
                />
                <input
                    type="password" placeholder="Confirmar Nueva" value={formData.confirm}
                    onChange={e => handleChange('confirm', e.target.value)}
                    style={inputStyle} required
                    maxLength={mode === 'PIN' ? 4 : 20}
                />
            </div>
            {error && <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '14px' }}>{error}</div>}
            {success && <div style={{ color: '#16a34a', marginBottom: '10px', fontSize: '14px' }}>{success}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setMode('SELECT')} style={secondaryBtn}>Volver</button>
                <button type="submit" style={primaryBtn}>Guardar</button>
            </div>
        </form>
    );

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Gestión de Credenciales</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                {mode === 'SELECT' && renderSelection()}
                {mode === 'PIN' && renderForm('Cambiar PIN (4 dígitos)')}
                {mode === 'PASSWORD' && renderForm('Cambiar Contraseña de Acceso')}
            </div>
        </div>
    );
};

const optionBtn = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s',
    color: '#334155', fontWeight: 600
};

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' };
const primaryBtn = { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const secondaryBtn = { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer' };

export default ChangeCredentialModal;
