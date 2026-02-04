import React, { useState, useEffect, useMemo } from 'react';
import { ProductoService } from '../../services/ProductoService';
import { Search, Filter, Edit, Trash2, Tag, Box, AlertTriangle, CheckCircle, Archive, Plus, FileText, DollarSign } from 'lucide-react';
import CategoriasManager from './CategoriasManager';
import ProductoForm from './ProductoForm';
import OrdenCompraModal from './OrdenCompraModal';
import PinModal from '../../components/PinModal';
import { AuthService } from '../../services/AuthService';

const ProductosView = () => {
    const [productos, setProductos] = useState([]);
    const [stats, setStats] = useState({ total: 0, bajoStock: 0, critico: 0, valorInventario: 0 });
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCatManager, setShowCatManager] = useState(false);
    const [showProdForm, setShowProdForm] = useState(false);
    const [showOrdenCompra, setShowOrdenCompra] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [editingProd, setEditingProd] = useState(null);
    const [productoAEliminar, setProductoAEliminar] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, disponible, bajo, critico

    useEffect(() => {
        cargar();
    }, []);

    const cargar = async () => {
        setLoading(true);
        try {
            const [lista, estadisticas] = await Promise.all([
                ProductoService.listar(),
                ProductoService.getStatistics()
            ]);
            setProductos(lista);
            setStats(estadisticas);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (prod) => {
        if (prod.STOCK <= 0) return 'Sin Stock';
        if (prod.STOCK < prod.STOCK_MINIMO) return 'Critico';
        if (prod.STOCK <= prod.STOCK_MINIMO) return 'Bajo Stock';
        return 'Disponible';
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Disponible': { bg: '#0f172a', color: 'white' },
            'Bajo Stock': { bg: '#f1f5f9', color: '#0f172a' },
            'Critico': { bg: '#ef4444', color: 'white' },
            'Sin Stock': { bg: '#94a3b8', color: 'white' } // Caso extremo
        };
        const style = styles[status] || styles['Disponible'];
        return (
            <span style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                backgroundColor: style.bg, color: style.color
            }}>
                {status}
            </span>
        );
    };

    const handleEdit = (prod) => {
        setEditingProd(prod);
        setShowProdForm(true);
    };

    const handleDelete = (id) => {
        setProductoAEliminar(id);
        setShowPinModal(true);
    };

    const handleConfirmarEliminacion = async (pin) => {
        try {
            const usuarioId = AuthService.getUserId();
            await ProductoService.eliminar(productoAEliminar, pin, usuarioId);
            setShowPinModal(false);
            setProductoAEliminar(null);
            cargar();
        } catch (error) {
            // El error se maneja en el modal
            throw error;
        }
    };

    const filteredProducts = useMemo(() => {
        return productos.filter(p => {
            const status = getStatus(p);
            const matchesSearch =
                p.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.CODIGO && p.CODIGO.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.CATEGORIA && p.CATEGORIA.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'disponible' && status === 'Disponible') ||
                (filterStatus === 'bajo' && status === 'Bajo Stock') ||
                (filterStatus === 'critico' && status === 'Critico');

            return matchesSearch && matchesStatus;
        });
    }, [productos, searchTerm, filterStatus]);

    const isMobile = window.innerWidth <= 768;

    return (
        <div style={{ padding: isMobile ? '15px' : '30px', flexGrow: 1, backgroundColor: '#f8fafc', overflowY: 'auto', height: '100vh', width: '100%' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: '30px',
                gap: '15px'
            }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Gestión de Productos</h1>
                    <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px' }}>Administra el catálogo de productos de tu despensa</p>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    width: isMobile ? '100%' : 'auto',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => setShowOrdenCompra(true)}
                        style={{ backgroundColor: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', flex: isMobile ? '1' : 'none' }}
                    >
                        <FileText size={16} /> <span style={{ display: isMobile ? 'none' : 'inline' }}>Orden</span>
                    </button>
                    <button
                        onClick={() => setShowCatManager(true)}
                        style={{ backgroundColor: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', flex: isMobile ? '1' : 'none' }}
                    >
                        <Tag size={16} /> <span style={{ display: isMobile ? 'none' : 'inline' }}>Categorías</span>
                    </button>
                    <button
                        onClick={() => { setEditingProd(null); setShowProdForm(true); }}
                        style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', flex: isMobile ? '2' : 'none', justifyContent: 'center' }}
                    >
                        <Plus size={16} /> Nuevo <span style={{ display: isMobile ? 'none' : 'inline' }}>Producto</span>
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <Card title="Total Productos" value={stats.total} icon={<Box color="#2563eb" size={20} />} />
                <Card title="Valor Inventario" value={`$${stats.valorInventario?.toFixed(2)}`} icon={<DollarSign color="#16a34a" size={20} />} valueColor="#16a34a" />
                <Card title="Bajo Stock" value={stats.bajoStock} valueColor="#ea580c" icon={<AlertTriangle color="#ea580c" size={20} />} />
                <Card title="Stock Crítico" value={stats.critico} valueColor="#ef4444" icon={<AlertTriangle color="#ef4444" size={20} />} />
            </div>

            {/* Filters */}
            <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '16px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '15px',
                alignItems: isMobile ? 'stretch' : 'center',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
            }}>
                <div style={{ flexGrow: 1, position: 'relative' }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', color: '#475569', fontSize: '14px' }}
                    >
                        <option value="all">Filtros</option>
                        <option value="disponible">Disponibles</option>
                        <option value="bajo">Bajo Stock</option>
                        <option value="critico">Critico</option>
                    </select>
                    <button style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 500, color: '#475569', fontSize: '14px' }}>
                        Exportar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                            <th style={thStyle}>Código</th>
                            <th style={thStyle}>Producto</th>
                            <th style={thStyle}>Categoría</th>
                            <th style={thStyle}>Precio</th>
                            <th style={thStyle}>Stock Actual</th>
                            <th style={thStyle}>Stock Mínimo</th>
                            <th style={thStyle}>Estado</th>
                            <th style={thStyle}><span style={{ visibility: 'hidden' }}>Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(p => (
                            <tr key={p.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{p.CODIGO || 'N/A'}</span></td>
                                <td style={{ ...tdStyle, fontWeight: 600, color: '#0f172a' }}>{p.NOMBRE}</td>
                                <td style={tdStyle}><span style={{ backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}>{p.CATEGORIA || 'General'}</span></td>
                                <td style={tdStyle}>${parseFloat(p.PRECIO).toFixed(2)}</td>
                                <td style={{ ...tdStyle, fontWeight: 'bold', color: p.STOCK < p.STOCK_MINIMO ? '#ef4444' : '#0f172a' }}>{p.STOCK}</td>
                                <td style={{ ...tdStyle, color: '#64748b' }}>{p.STOCK_MINIMO}</td>
                                <td style={tdStyle}><StatusBadge status={getStatus(p)} /></td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(p)} style={actionBtnStyle}><Edit size={16} color="#64748b" /></button>
                                        <button onClick={() => handleDelete(p.ID)} style={actionBtnStyle}><Trash2 size={16} color="#ef4444" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No se encontraron productos</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {showCatManager && <CategoriasManager onClose={() => setShowCatManager(false)} />}
            {showProdForm && <ProductoForm producto={editingProd} onClose={() => setShowProdForm(false)} onSuccess={() => { setShowProdForm(false); cargar(); }} />}
            {showOrdenCompra && <OrdenCompraModal onClose={() => setShowOrdenCompra(false)} />}
            <PinModal
                isOpen={showPinModal}
                onClose={() => { setShowPinModal(false); setProductoAEliminar(null); }}
                onConfirm={handleConfirmarEliminacion}
                title="Eliminar Producto"
            />
        </div>
    );
};

const Card = ({ title, value, valueColor, icon }) => (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {icon}
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{title}</p>
        </div>
        <h2 style={{ fontSize: '28px', margin: 0, fontWeight: 'bold', color: valueColor || '#0f172a' }}>{value}</h2>
    </div>
);

const thStyle = { padding: '16px', fontWeight: '600', color: '#64748b', fontSize: '13px' };
const tdStyle = { padding: '16px', fontSize: '14px', color: '#334155' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' };

export default ProductosView;
