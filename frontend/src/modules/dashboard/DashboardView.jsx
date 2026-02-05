import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Users, Package, TrendingUp, Search, X, Filter, AlertCircle } from 'lucide-react';
import { PedidoService } from '../../services/PedidoService';
import { ProductoService } from '../../services/ProductoService';
import { ClienteService } from '../../services/ClienteService'; // Assuming this exists or needed for count

const DashboardView = ({ onNavigate, storeName }) => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]); // For KPI count
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'price-high', 'price-low'

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [ordersData, productsData, customersData] = await Promise.all([
                PedidoService.obtenerTodos(),
                ProductoService.listar(),
                ClienteService.listar()
            ]);
            setOrders(ordersData);
            setProducts(productsData);
            setCustomers(customersData);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    // KPIs
    const totalSales = useMemo(() => orders.reduce((acc, order) => acc + (parseFloat(order.TOTAL) || 0), 0), [orders]);
    const salesToday = useMemo(() => {
        const today = new Date().toDateString();
        return orders.filter(o => new Date(o.FECHA).toDateString() === today).length;
    }, [orders]);
    const salesTodayValue = useMemo(() => {
        const today = new Date().toDateString();
        return orders
            .filter(o => new Date(o.FECHA).toDateString() === today)
            .reduce((acc, order) => acc + (parseFloat(order.TOTAL) || 0), 0);
    }, [orders]);


    // Recent Orders (Top 4)
    const recentOrders = useMemo(() => {
        return [...orders].sort((a, b) => new Date(b.FECHA) - new Date(a.FECHA)).slice(0, 4);
    }, [orders]);

    // Stock Alerts (products with stock at or below their minimum)
    const stockAlerts = useMemo(() => {
        return [...products]
            .filter(p => p.STOCK <= p.STOCK_MINIMO)
            .sort((a, b) => a.STOCK - b.STOCK)
            .slice(0, 3);
    }, [products]);

    // Modal Filtered Orders
    const filteredOrders = useMemo(() => {
        let result = [...orders];

        // Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(o =>
                (o.NOMBRE_CLIENTE && o.NOMBRE_CLIENTE.toLowerCase().includes(lowerTerm)) ||
                o.ID.toString().includes(lowerTerm)
            );
        }

        // Sort
        if (sortOrder === 'price-high') {
            result.sort((a, b) => (parseFloat(b.TOTAL) || 0) - (parseFloat(a.TOTAL) || 0));
        } else if (sortOrder === 'price-low') {
            result.sort((a, b) => (parseFloat(a.TOTAL) || 0) - (parseFloat(b.TOTAL) || 0));
        } else {
            // Newest default
            result.sort((a, b) => new Date(b.FECHA) - new Date(a.FECHA));
        }

        return result;
    }, [orders, searchTerm, sortOrder]);

    const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ padding: '20px', flexGrow: 1, backgroundColor: '#f8fafc', minHeight: '100vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Dashboard</h1>
                <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: 'clamp(13px, 2.5vw, 14px)' }}>Resumen general de {storeName || 'Mi Despensa Virtual'}</p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <Card title="Clientes Activos" value={customers.filter(c => c.ESTADO === 'Activo').length || customers.length} percent="+12%" icon={<Users color="#10b981" />} color="#dcfce7" trendColor="#10b981" />
                <Card title="Productos en Stock" value={products.length} percent="-3%" icon={<Package color="#3b82f6" />} color="#dbeafe" trendColor="#ef4444" />
                <Card title="Pedidos Hoy" value={salesToday} percent="+8%" icon={<TrendingUp color="#10b981" />} color="#dcfce7" trendColor="#10b981" />
                <Card title="Ventas del Día" value={formatCurrency(salesTodayValue)} percent="+15%" icon={<DollarSign color="#10b981" />} color="#dcfce7" trendColor="#10b981" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>

                {/* Recent Orders */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Pedidos Recientes</h3>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#475569',
                                fontWeight: 500
                            }}>
                            Ver todos
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {recentOrders.map(order => (
                            <div key={order.ID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#64748b' }}>#{order.ID}</span>
                                        <span style={{ fontWeight: 600, color: '#334155' }}>{order.NOMBRE_CLIENTE || 'Cliente Desconocido'}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{formatDate(order.FECHA)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatCurrency(order.TOTAL)}</div>
                                    <StatusBadge status="Completado" />
                                </div>
                            </div>
                        ))}
                        {recentOrders.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>No hay pedidos recientes</p>}
                    </div>
                </div>

                {/* Stock Alerts */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <AlertCircle color="#f97316" size={20} />
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Alertas de Stock</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {stockAlerts.map(product => (
                            <div key={product.ID} style={{ padding: '15px', backgroundColor: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600, color: '#431407' }}>{product.NOMBRE}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9a3412', marginBottom: '4px' }}>
                                    <span>Stock actual: {product.STOCK}</span>
                                    <span>Mín: {product.STOCK_MINIMO}</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: '#fed7aa', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min((product.STOCK / product.STOCK_MINIMO) * 100, 100)}%`, height: '100%', backgroundColor: '#f97316' }}></div>
                                </div>
                            </div>
                        ))}
                        {stockAlerts.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Todo en orden</p>}
                    </div>

                    <button
                        onClick={() => onNavigate && onNavigate('productos')}
                        style={{ width: '100%', marginTop: '20px', padding: '10px', border: 'none', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = '#e2e8f0'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = '#f8fafc'; }}
                    >
                        Ver todas las alertas
                    </button>
                </div>

            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '10px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Todos los Pedidos</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
                        </div>

                        <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
                            <div style={{ position: 'relative', flexGrow: 1 }}>
                                <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar pedido..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                                />
                            </div>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#475569' }}
                            >
                                <option value="newest">Más recientes</option>
                                <option value="price-high">Precio: Mayor a Menor</option>
                                <option value="price-low">Precio: Menor a Mayor</option>
                            </select>
                        </div>

                        <div style={{ overflowY: 'auto', padding: '0 20px 20px 20px', flexGrow: 1 }}>
                            {filteredOrders.map(order => (
                                <div key={order.ID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#334155' }}>#{order.ID} - {order.NOMBRE_CLIENTE || 'Sin Nombre'}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(order.FECHA).toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatCurrency(order.TOTAL)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Subcomponents
const Card = ({ title, value, percent, icon, color, trendColor }) => (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', minHeight: '140px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: color, width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            {percent && <span style={{ color: trendColor, fontWeight: 600, fontSize: '13px' }}>{percent}</span>}
        </div>
        <div style={{ marginTop: '15px' }}>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0, marginBottom: '5px' }}>{title}</p>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', margin: 0, color: '#0f172a', fontWeight: 'bold' }}>{value}</h2>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    // Basic mapping, can be expanded
    const styles = {
        'Completado': { bg: '#dcfce7', color: '#166534' },
        'Pendiente': { bg: '#f1f5f9', color: '#475569' },
        'En preparación': { bg: '#fef9c3', color: '#854d0e' }
    };
    const style = styles[status] || styles['Pendiente'];

    return (
        <span style={{
            fontSize: '12px',
            padding: '4px 12px',
            backgroundColor: style.bg,
            color: style.color,
            borderRadius: '20px',
            fontWeight: 600,
            display: 'inline-block',
            marginTop: '5px'
        }}>
            {status}
        </span>
    );
};

export default DashboardView;
