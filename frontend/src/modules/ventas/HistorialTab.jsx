import React, { useState, useEffect } from 'react';
import { PedidoService } from '../../services/PedidoService';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

const HistorialTab = () => {
    const [pedidos, setPedidos] = useState([]);

    useEffect(() => {
        cargarPedidos();
    }, []);

    const cargarPedidos = async () => {
        try {
            const data = await PedidoService.obtenerTodos();
            setPedidos(data);
        } catch (e) {
            console.error(e);
        }
    };

    const cambiarEstado = async (id, estado, estadoPago = null) => {
        await PedidoService.actualizarEstado(id, estado);
        if (estadoPago) {
            await PedidoService.registrarPago(id, estadoPago);
        }
        cargarPedidos();
    };

    const StatusBadge = ({ estado }) => {
        const styles = {
            'PENDIENTE': { bg: '#fef3c7', color: '#d97706', icon: <Clock size={14} /> },
            'EN_CAMINO': { bg: '#dbeafe', color: '#2563eb', icon: <Truck size={14} /> },
            'ENTREGADO': { bg: '#dcfce7', color: '#16a34a', icon: <CheckCircle size={14} /> },
            'CANCELADO': { bg: '#f1f5f9', color: '#64748b', icon: <Package size={14} /> }
        };
        const style = styles[estado] || styles['PENDIENTE'];
        return (
            <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', width: 'fit-content' }}>
                {style.icon} {estado}
            </span>
        );
    };

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', height: '100%', overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                        <th style={{ padding: '15px' }}>ID</th>
                        <th style={{ padding: '15px' }}>Cliente</th>
                        <th style={{ padding: '15px' }}>Fecha</th>
                        <th style={{ padding: '15px' }}>Total</th>
                        <th style={{ padding: '15px' }}>Estado</th>
                        <th style={{ padding: '15px' }}>Pago</th>
                        <th style={{ padding: '15px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidos.map(p => (
                        <tr key={p.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '15px', fontWeight: 600 }}>#{p.ID}</td>
                            <td style={{ padding: '15px' }}>{p.NOMBRE_CLIENTE || 'Consumidor Final'}</td>
                            <td style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>{new Date(p.FECHA).toLocaleString()}</td>
                            <td style={{ padding: '15px', fontWeight: 700 }}>${parseFloat(p.TOTAL).toFixed(2)}</td>
                            <td style={{ padding: '15px' }}><StatusBadge estado={p.ESTADO} /></td>
                            <td style={{ padding: '15px' }}>
                                <span style={{ color: p.PAGO_ESTADO === 'PAGADO' ? '#16a34a' : (p.PAGO_ESTADO === 'DEUDA' ? '#dc2626' : '#d97706'), fontWeight: 600, fontSize: '12px' }}>
                                    {p.PAGO_ESTADO}
                                </span>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {p.ESTADO === 'PENDIENTE' && (
                                        <button onClick={() => cambiarEstado(p.ID, 'EN_CAMINO')} style={actionBtn}>Despachar</button>
                                    )}
                                    {p.ESTADO === 'EN_CAMINO' && (
                                        <>
                                            <button onClick={() => cambiarEstado(p.ID, 'ENTREGADO', 'PAGADO')} style={{ ...actionBtn, backgroundColor: '#dcfce7', color: '#16a34a' }}>Entregado (Pago)</button>
                                            <button onClick={() => cambiarEstado(p.ID, 'ENTREGADO', 'DEUDA')} style={{ ...actionBtn, backgroundColor: '#fee2e2', color: '#dc2626' }}>Entregado (Deuda)</button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const actionBtn = {
    border: 'none',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '12px'
};

export default HistorialTab;
