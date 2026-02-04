import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { ConfigService } from '../../services/ConfigService';

const SecurityPinModal = ({ onClose, onSuccess, title = "Seguridad" }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { valid } = await ConfigService.verifyPin(pin);
            if (valid) {
                onSuccess(pin);
                onClose();
            } else {
                setError('PIN Incorrecto');
            }
        } catch (e) {
            setError('Error al verificar PIN');
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Lock size={20} className="text-slate-700" /> {title}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <p style={{ marginBottom: '20px', color: '#64748b', fontSize: '14px' }}>
                    Esta acción está protegida. Por favor ingresa tu PIN de seguridad para continuar.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="Ingresa PIN (4 dígitos)"
                        value={pin}
                        onChange={e => { setPin(e.target.value); setError(''); }}
                        maxLength={4}
                        style={{ width: '100%', padding: '12px', fontSize: '18px', textAlign: 'center', letterSpacing: '5px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }}
                        autoFocus
                    />
                    {error && <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SecurityPinModal;
