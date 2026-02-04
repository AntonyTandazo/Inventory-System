import React, { useState } from 'react';
import { AuthService } from '../../services/AuthService';
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginView = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [step, setStep] = useState(1); // 1: Datos, 2: PIN
    const [formData, setFormData] = useState({
        usuario: '', password: '', confirmPassword: '', email: '', nombre: '', negocio: '', pin: ''
    });
    const [error, setError] = useState('');

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNextStep = () => {
        if (!formData.usuario || !formData.password || !formData.email || !formData.nombre || !formData.negocio) {
            setError('Todos los campos son obligatorios');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isRegistering) {
            if (step === 1) {
                handleNextStep();
                return;
            }

            if (!formData.pin || formData.pin.length !== 4) {
                setError('El PIN debe tener 4 dígitos');
                return;
            }

            try {
                await AuthService.register(formData);
                alert('Registro exitoso. Ahora inicia sesión.');
                setIsRegistering(false);
                setStep(1);
                setFormData({ ...formData, password: '', confirmPassword: '', pin: '' });
            } catch (err) {
                setError(err);
            }
        } else {
            try {
                await AuthService.login(formData.usuario, formData.password);
                onLoginSuccess();
            } catch (err) {
                setError(err);
            }
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', backgroundColor: '#0f172a'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Mi Despensa Virtual</h2>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>Inicia sesión para continuar</p>

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '20px' }}>
                    <button
                        onClick={() => { setIsRegistering(false); setError(''); setStep(1); }}
                        style={{ background: 'none', border: 'none', color: !isRegistering ? '#3b82f6' : '#64748b', fontWeight: !isRegistering ? 'bold' : 'normal', cursor: 'pointer', borderBottom: !isRegistering ? '2px solid #3b82f6' : 'none' }}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => { setIsRegistering(true); setError(''); }}
                        style={{ background: 'none', border: 'none', color: isRegistering ? '#3b82f6' : '#64748b', fontWeight: isRegistering ? 'bold' : 'normal', cursor: 'pointer', borderBottom: isRegistering ? '2px solid #3b82f6' : 'none' }}
                    >
                        Registrarse
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* LOGIN FORM */}
                    {!isRegistering && (
                        <>
                            <FormInput
                                label="Usuario"
                                icon={<User size={18} />}
                                type="text"
                                value={formData.usuario}
                                onChange={v => handleChange('usuario', v)}
                                placeholder="Ingresa tu usuario"
                            />
                            <FormInput
                                label="Contraseña"
                                icon={<Lock size={18} />}
                                type="password"
                                value={formData.password}
                                onChange={v => handleChange('password', v)}
                                placeholder="••••••••"
                            />
                            <button type="submit" style={btnStyle}>Ingresar al Sistema</button>
                        </>
                    )}

                    {/* REGISTRATION STEP 1: ACCOUNT DETAILS */}
                    {isRegistering && step === 1 && (
                        <>
                            <FormInput label="Correo Electrónico" icon={<User size={18} />} type="email" value={formData.email} onChange={v => handleChange('email', v)} placeholder="ejemplo@email.com" />
                            <FormInput label="Tu Nombre" icon={<User size={18} />} type="text" value={formData.nombre} onChange={v => handleChange('nombre', v)} placeholder="Nombre Completo" />
                            <FormInput label="Nombre del Negocio" icon={<User size={18} />} type="text" value={formData.negocio} onChange={v => handleChange('negocio', v)} placeholder="Mi Tienda" />
                            <FormInput label="Crear Usuario" icon={<User size={18} />} type="text" value={formData.usuario} onChange={v => handleChange('usuario', v)} placeholder="Elige un usuario" />
                            <FormInput label="Contraseña" icon={<Lock size={18} />} type="password" value={formData.password} onChange={v => handleChange('password', v)} placeholder="••••••••" />
                            <FormInput label="Confirmar Contraseña" icon={<Lock size={18} />} type="password" value={formData.confirmPassword} onChange={v => handleChange('confirmPassword', v)} placeholder="••••••••" />

                            <button type="button" onClick={handleNextStep} style={btnStyle}>Siguiente: Configurar Seguridad</button>
                        </>
                    )}

                    {/* REGISTRATION STEP 2: SECURITY PIN */}
                    {isRegistering && step === 2 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
                                <Lock size={32} color="#2563eb" style={{ marginBottom: '10px' }} />
                                <h3 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>Configura tu PIN de Seguridad</h3>
                                <p style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.4' }}>
                                    Este PIN de 4 dígitos se solicitará para realizar acciones sensibles como <strong>borrar productos</strong>, <strong>restaurar copias de seguridad</strong> o <strong>modificar la configuración</strong>.
                                </p>
                            </div>

                            <FormInput
                                label="PIN de Seguridad (4 Dígitos)"
                                icon={<Lock size={18} />}
                                type="text"
                                value={formData.pin}
                                onChange={v => { if (v.length <= 4 && /^\d*$/.test(v)) handleChange('pin', v) }}
                                placeholder="1234"
                            />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setStep(1)} style={{ ...btnStyle, backgroundColor: '#cbd5e1', color: '#334155' }}>Atrás</button>
                                <button type="submit" style={btnStyle}>Finalizar Registro</button>
                            </div>
                        </div>
                    )}
                </form>

            </div>
        </div>
    );
};

const btnStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1rem',
    marginTop: '10px',
    cursor: 'pointer',
    width: '100%'
};

// Helper Component for Inputs
const FormInput = ({ label, icon, type, value, onChange, placeholder }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: 'white' }}>
                <div style={{ marginRight: '10px', color: '#94a3b8' }}>{icon}</div>
                <input
                    type={isPassword && showPassword ? 'text' : type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' }}
                    placeholder={placeholder}
                    required
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};


export default LoginView;
