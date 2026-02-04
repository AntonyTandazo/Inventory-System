import React, { useState, useEffect } from 'react';
import { ClienteService } from '../../services/ClienteService';
import { PagoService } from '../../services/PagoService'; // Necesario para registrar pago real
import { AlertTriangle, Phone, MessageCircle, DollarSign, CheckCircle } from 'lucide-react';

const CobranzaTab = () => {
    const [deudores, setDeudores] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [clientePago, setClientePago] = useState(null); // Para modal

    useEffect(() => {
        cargarDeudores();
    }, []);

    const cargarDeudores = async () => {
        try {
            const clientes = await ClienteService.listar();
            const conDeuda = clientes.filter(c => parseFloat(c.DEUDA) > 0);
            setDeudores(conDeuda);
        } catch (e) {
            console.error(e);
        }
    };

    const totalPorCobrar = deudores.reduce((sum, c) => sum + parseFloat(c.DEUDA), 0);
    const deudoresFiltrados = deudores.filter(c => c.NOMBRE.toLowerCase().includes(filtro.toLowerCase()));

    const accionSimulada = (tipo, cliente) => {
        const mensaje = tipo === 'whatsapp'
            ? `Abriendo WhatsApp para cobrar a ${cliente.NOMBRE}...`
            : `Llamando a ${cliente.NOMBRE} (${cliente.TELEFONO})...`;
        alert(mensaje);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            {/* KPI Deuda */}
            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ backgroundColor: '#f97316', padding: '12px', borderRadius: '10px', color: 'white' }}>
                    <AlertTriangle />
                </div>
                <div>
                    <div style={{ color: '#9a3412', fontWeight: 600 }}>Total por Cobrar</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#c2410c' }}>${totalPorCobrar.toFixed(2)}</div>
                </div>
            </div>

            {/* Lista Deudores */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>
                    <input
                        placeholder="Buscar cliente..."
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {deudoresFiltrados.map(c => (
                        <div key={c.ID} style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '15px' }}>{c.NOMBRE}</div>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{c.TELEFONO} • Hace 5 días</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Deuda</div>
                                    <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '16px' }}>${parseFloat(c.DEUDA).toFixed(2)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => accionSimulada('whatsapp', c)} style={{ ...iconBtn, backgroundColor: '#dcfce7', color: '#16a34a' }}><MessageCircle size={18} /></button>
                                    <button onClick={() => accionSimulada('llamada', c)} style={{ ...iconBtn, backgroundColor: '#e0f2fe', color: '#0ea5e9' }}><Phone size={18} /></button>
                                    <button onClick={() => setClientePago(c)} style={{ ...iconBtn, backgroundColor: '#fcd34d', color: '#78350f' }}><DollarSign size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {clientePago && (
                <RegistrarPagoModal
                    cliente={clientePago}
                    onClose={() => setClientePago(null)}
                    onSuccess={() => {
                        setClientePago(null);
                        cargarDeudores();
                    }}
                />
            )}
        </div>
    );
};

const RegistrarPagoModal = ({ cliente, onClose, onSuccess }) => {
    const [monto, setMonto] = useState('');
    const [referencia, setReferencia] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await PagoService.registrar({
                CLIENTE_ID: cliente.ID,
                MONTO: parseFloat(monto),
                REFERENCIA: referencia || 'EFECTIVO'
            });
            alert('Pago registrado');
            onSuccess();
        } catch (e) {
            alert('Error');
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '300px' }}>
                <h3 style={{ marginTop: 0 }}>Registrar Pago</h3>
                <p>Cliente: <strong>{cliente.NOMBRE}</strong></p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Monto ($)</label>
                        <input
                            type="number" step="0.01" required autoFocus
                            value={monto} onChange={e => setMonto(e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Referencia (Opcional)</label>
                        <input
                            value={referencia} onChange={e => setReferencia(e.target.value)}
                            placeholder="Efectivo, Transferencia..."
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" style={{ flex: 1, padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const iconBtn = {
    border: 'none',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

export default CobranzaTab;
