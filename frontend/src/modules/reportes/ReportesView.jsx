import React, { useState, useEffect } from 'react';
import { ReporteService } from '../../services/ReporteService';
import { jsPDF } from 'jspdf';
import { DollarSign, ShoppingBag, Users, TrendingUp, Download, PieChart, BarChart2 } from 'lucide-react';

const ReportesView = () => {
    const [rango, setRango] = useState('mes');
    const [general, setGeneral] = useState({ totalVentas: 0, cantidadPedidos: 0, ticketPromedio: 0, trend: {} });
    const [topProductos, setTopProductos] = useState([]);
    const [topClientes, setTopClientes] = useState([]);
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, [rango]);

    const cargarDatos = async () => {
        try {
            const [gen, prod, cli, cat] = await Promise.all([
                ReporteService.getGeneral(rango),
                ReporteService.getProductos(rango),
                ReporteService.getClientes(rango),
                ReporteService.getCategorias(rango)
            ]);
            setGeneral(gen);
            setTopProductos(prod);
            setTopClientes(cli);
            setCategorias(cat);
        } catch (e) {
            console.error(e);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Reporte de Análisis - Despensa Virtual', 20, 20);

        doc.setFontSize(14);
        doc.text(`Período: ${rango.toUpperCase()}`, 20, 30);
        doc.text(`Ventas Totales: $${general.totalVentas.toFixed(2)}`, 20, 40);
        doc.text(`Pedidos: ${general.cantidadPedidos}`, 20, 50);

        doc.text('Top Clientes:', 20, 70);
        topClientes.forEach((c, i) => {
            doc.text(`${i + 1}. ${c.nombre} - $${c.total.toFixed(2)}`, 20, 80 + (i * 10));
        });

        doc.save(`reporte_${rango}.pdf`);
    };

    const isMobile = window.innerWidth <= 768;

    return (
        <div style={{ padding: isMobile ? '15px' : '30px', backgroundColor: '#f8fafc', flexGrow: 1, overflowY: 'auto', width: '100%' }}>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: '30px',
                gap: '15px'
            }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e293b', fontSize: 'clamp(20px, 5vw, 24px)' }}>Reportes y Análisis</h1>
                    <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px' }}>Estadísticas clave del negocio</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                    <select
                        value={rango}
                        onChange={e => setRango(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '14px' }}
                    >
                        <option value="mes">Mes</option>
                        <option value="trimestre">Trimestre</option>
                        <option value="anio">Año</option>
                    </select>
                    <button onClick={exportPDF} style={{ ...btnStyle, flex: 1, justifyContent: 'center' }}>
                        <Download size={18} /> Exportar
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <KpiCard title="Ventas Totales" value={`$${general.totalVentas.toFixed(2)}`} icon={<DollarSign color="#16a34a" size={20} />} bg="#dcfce7" />
                <KpiCard title="Pedidos" value={general.cantidadPedidos} icon={<ShoppingBag color="#2563eb" size={20} />} bg="#dbeafe" />
                <KpiCard title="Ticket Promedio" value={`$${general.ticketPromedio.toFixed(2)}`} icon={<TrendingUp color="#9333ea" size={20} />} bg="#f3e8ff" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                {/* Top Productos */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BarChart2 size={20} /> Productos Más Vendidos
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {topProductos.map((prod, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                                    <span>{prod.nombre}</span>
                                    <span style={{ fontWeight: 600 }}>${prod.total.toFixed(2)}</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${(prod.total / (topProductos[0]?.total || 1)) * 100}%`,
                                        height: '100%',
                                        backgroundColor: '#3b82f6'
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Clientes */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={20} /> Mejores Clientes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {topClientes.map((cli, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{cli.nombre}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{cli.visitas} compras</div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, color: '#16a34a' }}>
                                    ${cli.total.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Categories Chart (Simple CSS Bar) */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PieChart size={20} /> Ventas por Categoría
                    </h3>
                    <div style={{ display: 'flex', height: '200px', alignItems: 'flex-end', gap: '20px', padding: '10px' }}>
                        {categorias.map((cat, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{cat.porcentaje}%</div>
                                <div style={{ width: '100%', height: `${cat.porcentaje * 2}px`, backgroundColor: colors[i % colors.length], borderRadius: '8px 8px 0 0' }}></div>
                                <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>{cat.categoria}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, bg }) => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ backgroundColor: bg, padding: '16px', borderRadius: '12px' }}>{icon}</div>
        <div>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '5px' }}>{title}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{value}</div>
        </div>
    </div>
);

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const btnStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 };

export default ReportesView;
