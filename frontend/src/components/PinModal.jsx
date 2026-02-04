import React, { useState } from 'react';
import './PinModal.css';

export default function PinModal({ isOpen, onClose, onConfirm, title }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Validar que el PIN tenga 4 dígitos
        if (pin.length !== 4) {
            setError('El PIN debe tener 4 dígitos');
            return;
        }

        if (!/^\d{4}$/.test(pin)) {
            setError('El PIN debe contener solo números');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onConfirm(pin);
            // Si llega aquí, fue exitoso
            handleClose();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'PIN incorrecto');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPin('');
        setError('');
        setLoading(false);
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="pin-modal-overlay" onClick={handleClose}>
            <div className="pin-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="pin-modal-header">
                    <h3>{title || 'Confirmar Eliminación'}</h3>
                    <button className="pin-modal-close" onClick={handleClose}>×</button>
                </div>

                <div className="pin-modal-body">
                    <p className="pin-modal-message">
                        Por seguridad, ingrese su PIN de 4 dígitos:
                    </p>

                    <input
                        type="password"
                        className="pin-modal-input"
                        maxLength="4"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        onKeyPress={handleKeyPress}
                        placeholder="••••"
                        autoFocus
                        disabled={loading}
                    />

                    {error && <p className="pin-modal-error">{error}</p>}
                </div>

                <div className="pin-modal-footer">
                    <button
                        className="pin-modal-btn pin-modal-btn-cancel"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        className="pin-modal-btn pin-modal-btn-confirm"
                        onClick={handleSubmit}
                        disabled={loading || pin.length !== 4}
                    >
                        {loading ? 'Verificando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
