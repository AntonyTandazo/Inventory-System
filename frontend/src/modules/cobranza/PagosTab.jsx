import React, { useState, useEffect, useMemo } from 'react';
import { PagoService } from '../../services/PagoService';
import { Calendar, TrendingUp, Search } from 'lucide-react';

const PagosTab = () => {
    const [pagos, setPagos] = useState([]);
    const [stats, setStats] = useState({ ingresosHoy: 0, ingresosMes: 0, transaccionesMes: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [historial, estadisticas] = await Promise.all([
                PagoService.obtenerHistorial(),
                PagoService.obtenerEstadisticas()
            ]);
            setPagos(historial);
            setStats(estadisticas);
        } catch (e) {
            console.error(e);
        }
    };

    const pagosFiltrados = useMemo(() => {
        return pagos.filter(p => {
            const searchLower = searchTerm.toLowerCase();
            return (
                p.NOMBRE_CLIENTE?.toLowerCase().includes(searchLower) ||
                p.CEDULA?.includes(searchTerm) ||
                p.REFERENCIA?.toLowerCase().includes(searchLower)
            );
        });
    }, [pagos, searchTerm]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <KpiCard
                    title="Cobrado este mes"
                    value={`$${(stats.ingresosMes || 0).toFixed(2)}`}
                    icon={<Calendar color="#2563eb" />}
                    bg="#dbeafe"
                    color="#2563eb"
                />
                <KpiCard
                    title="Pagos Completados"
                    value={stats.transaccionesMes || 0}
                    icon={<TrendingUp color="#9333ea" />}
                    bg="#f3e8ff"
                    color="#9333ea"
                />
            </div>

            {/* Tabla Historial */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Historial de Pagos</h3>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, cédula o referencia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 35px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                <th style={{ padding: '12px' }}>Fecha</th>
                                <th style={{ padding: '12px' }}>Cliente</th>
                                <th style={{ padding: '12px' }}>Referencia</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagosFiltrados.map(p => (
                                <tr key={p.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontSize: '14px' }}>
                                        {p.FECHA_PAGO ? new Date(p.FECHA_PAGO).toLocaleString('es-EC', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>
                                        <div>{p.NOMBRE_CLIENTE || 'Cliente'}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.CEDULA || ''}</div>
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>{p.REFERENCIA || 'N/A'}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>+${parseFloat(p.MONTO).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pagosFiltrados.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            {searchTerm ? 'No se encontraron pagos con ese criterio' : 'No hay pagos registrados'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, bg, color }) => (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ backgroundColor: bg, padding: '12px', borderRadius: '10px' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{value}</div>
        </div>
    </div>
);

export default PagosTab;
