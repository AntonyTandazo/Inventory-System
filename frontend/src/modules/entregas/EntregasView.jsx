import React, { useState, useEffect } from 'react';
import { PedidoService } from '../../services/PedidoService';
import { Truck, Package, Clock, Eye, Search, CheckCircle } from 'lucide-react';
import DetallePedidoModal from './DetallePedidoModal';

const EntregasView = () => {
    const [pedidos, setPedidos] = useState([]);
    const [stats, setStats] = useState({ pendientes: 0, entregadosHoy: 0 });
    const [filtro, setFiltro] = useState('');
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null); // Para modal

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [lista, estadisticas] = await Promise.all([
                PedidoService.obtenerTodos(),
                PedidoService.obtenerStatsEntregas()
            ]);
            // Filter only Telepedidos
            const telepedidos = lista.filter(p => p.ORIGEN === 'TELEPEDIDO');
            setPedidos(telepedidos);
            setStats(estadisticas);
        } catch (e) {
            console.error(e);
        }
    };

    const cambiarEstado = async (id, nuevoEstado, e) => {
        e.stopPropagation();
        try {
            await PedidoService.actualizarEstado(id, nuevoEstado);
            cargarDatos();
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Error al actualizar el estado del pedido');
        }
    };

    const pedidosFiltrados = pedidos.filter(p =>
        (p.NOMBRE_CLIENTE?.toLowerCase().includes(filtro.toLowerCase()) ||
            p.ID.toString().includes(filtro)) &&
        p.ORIGEN !== 'null' // Filtrar basura si hay
    );

    return (
        <div style={{ padding: '30px', backgroundColor: '#f8fafc', flex: 1, height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h1 style={{ marginBottom: '30px', color: '#1e293b' }}>Gestión de Entregas</h1>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <KpiCard
                    title="Pendientes por Entregar"
                    value={stats.pendientes}
                    icon={<Clock color="#ea580c" />}
                    bg="#ffedd5"
                />
                <KpiCard
                    title="Entregas Realizadas Hoy"
                    value={stats.entregadosHoy}
                    icon={<CheckCircle color="#16a34a" />}
                    bg="#dcfce7"
                />
            </div>

            {/* Filtro y Tabla */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                    <Search color="#64748b" />
                    <input
                        placeholder="Buscar por cliente o número de pedido..."
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                        style={{ border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%', fontSize: '16px' }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white' }}>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                                <th style={thStyle}>Pedido #</th>
                                <th style={thStyle}>Cliente</th>
                                <th style={thStyle}>Dirección</th>
                                <th style={thStyle}>Fecha</th>
                                <th style={thStyle}>Total</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidosFiltrados.map(p => (
                                <tr key={p.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ ...tdStyle, fontWeight: 700 }}>#{p.ID}</td>
                                    <td style={tdStyle}>{p.NOMBRE_CLIENTE || 'Consumidor Final'}</td>
                                    <td style={{ ...tdStyle, fontSize: '13px', color: '#64748b' }}>{p.DIRECCION || 'Sin dirección'}</td>
                                    <td style={tdStyle}>{new Date(p.FECHA).toLocaleDateString()}</td>
                                    <td style={{ ...tdStyle, fontWeight: 700, color: '#2563eb' }}>${parseFloat(p.TOTAL || 0).toFixed(2)}</td>
                                    <td style={tdStyle}><EstadoBadge estado={p.ESTADO} /></td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => setPedidoSeleccionado(p)} style={iconBtn} title="Ver Detalles"><Eye size={18} /></button>

                                            {(p.ESTADO === 'PENDIENTE' || p.ESTADO === 'POR_ENTREGAR') && (
                                                <button onClick={(e) => cambiarEstado(p.ID, 'EN_CAMINO', e)} style={actionBtn}>Iniciar Ruta</button>
                                            )}
                                            {p.ESTADO === 'EN_CAMINO' && (
                                                <button onClick={(e) => cambiarEstado(p.ID, 'ENTREGADO', e)} style={{ ...actionBtn, backgroundColor: '#16a34a', color: 'white' }}>Confirmar Entrega</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {pedidoSeleccionado && (
                <DetallePedidoModal
                    pedido={pedidoSeleccionado}
                    onClose={() => setPedidoSeleccionado(null)}
                />
            )}
        </div>
    );
};

const KpiCard = ({ title, value, icon, bg }) => (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ backgroundColor: bg, padding: '15px', borderRadius: '12px' }}>{icon}</div>
        <div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{value}</div>
        </div>
    </div>
);

const EstadoBadge = ({ estado }) => {
    const colors = { PENDIENTE: '#f59e0b', EN_CAMINO: '#3b82f6', ENTREGADO: '#10b981', CANCELADO: '#ef4444' };
    return (
        <span style={{ backgroundColor: `${colors[estado]}20`, color: colors[estado], padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
            {estado.replace('_', ' ')}
        </span>
    );
};

const thStyle = { padding: '15px' };
const tdStyle = { padding: '15px' };
const iconBtn = { cursor: 'pointer', border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '8px' };
const actionBtn = { cursor: 'pointer', border: 'none', background: '#eff6ff', color: '#2563eb', padding: '8px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' };

export default EntregasView;
