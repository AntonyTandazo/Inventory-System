import React, { useState, useEffect, useMemo } from 'react';
import { ProductoService } from '../../services/ProductoService';
import { ClienteService } from '../../services/ClienteService';
import { PedidoService } from '../../services/PedidoService';
import { Search, Trash2, Plus, Phone, MessageSquare, CreditCard, Banknote, Clock, X } from 'lucide-react';

const TelepedidosTab = () => {
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [carrito, setCarrito] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientSearch, setShowClientSearch] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [metodo, setMetodo] = useState('LLAMADA'); // LLAMADA, MENSAJE
    const [estadoPago, setEstadoPago] = useState('POR_PAGAR'); // PAGADO, POR_PAGAR, EN_SITIO
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [prods, clis] = await Promise.all([
                ProductoService.listar(),
                ClienteService.listar()
            ]);
            setProductos(prods);
            setClientes(clis);
        } catch (error) {
            console.error(error);
        }
    };

    const agregarAlCarrito = (producto) => {
        if (producto.STOCK <= 0) return alert('Producto agotado');
        const existe = carrito.find(item => item.ID === producto.ID);
        if (existe) {
            if (existe.cantidad >= producto.STOCK) return alert('Stock insuficiente');
            setCarrito(carrito.map(item => item.ID === producto.ID ? { ...item, cantidad: item.cantidad + 1 } : item));
        } else {
            setCarrito([...carrito, { ...producto, cantidad: 1 }]);
        }
    };

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setShowClientSearch(false);
        setClientSearchTerm('');
    };

    const registrarPedido = async () => {
        if (carrito.length === 0) return alert('Agrega productos al pedido');
        if (!selectedClient) return alert('Selecciona un cliente');

        setLoading(true);
        try {
            const total = carrito.reduce((sum, item) => sum + (item.PRECIO * item.cantidad), 0);
            const pedido = {
                CLIENTE_ID: selectedClient.ID,
                ORIGEN: 'TELEPEDIDO',
                METODO_PAGO: estadoPago === 'PAGADO' ? 'cash' : 'credit',
                AVANCE: estadoPago === 'PAGADO' ? total : 0,
                TOTAL: total,
                items: carrito
            };

            await PedidoService.guardar(pedido);
            alert('Pedido registrado con éxito');
            setCarrito([]);
            setSelectedClient(null);
            cargarDatos(); // Refresh stock
        } catch (error) {
            console.error(error);
            alert('Error al registrar pedido');
        } finally {
            setLoading(false);
        }
    };

    const total = carrito.reduce((sum, item) => sum + (item.PRECIO * item.cantidad), 0);
    const productosFiltrados = productos.filter(p => p.NOMBRE.toLowerCase().includes(busqueda.toLowerCase()));

    const clientesFiltrados = useMemo(() => {
        return clientes.filter(c =>
            c.NOMBRE.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            c.CEDULA?.includes(clientSearchTerm)
        );
    }, [clientes, clientSearchTerm]);

    return (
        <div style={{ display: 'flex', height: '100%', gap: '20px' }}>
            {/* Catalogo */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <Search size={20} color="#94a3b8" />
                    <input
                        placeholder="Buscar producto para tele-pedido..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{ border: 'none', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '16px' }}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', overflowY: 'auto' }}>
                    {productosFiltrados.map(p => (
                        <div key={p.ID} onClick={() => agregarAlCarrito(p)} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #e2e8f0', opacity: p.STOCK > 0 ? 1 : 0.6 }}>
                            <div style={{ fontWeight: 600, marginBottom: '5px' }}>{p.NOMBRE}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '14px' }}>
                                <span style={{ color: '#2563eb', fontWeight: 700 }}>${p.PRECIO}</span>
                                <span>Stock: {p.STOCK}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel Lateral */}
            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {/* Metodo Section */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>MÉTODO DE PEDIDO</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                        <button
                            onClick={() => setMetodo('LLAMADA')}
                            style={{ padding: '10px', borderRadius: '8px', border: metodo === 'LLAMADA' ? '2px solid #2563eb' : '1px solid #cbd5e1', backgroundColor: metodo === 'LLAMADA' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Phone size={18} color={metodo === 'LLAMADA' ? '#2563eb' : '#64748b'} />
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Llamada</span>
                        </button>
                        <button
                            onClick={() => setMetodo('MENSAJE')}
                            style={{ padding: '10px', borderRadius: '8px', border: metodo === 'MENSAJE' ? '2px solid #2563eb' : '1px solid #cbd5e1', backgroundColor: metodo === 'MENSAJE' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <MessageSquare size={18} color={metodo === 'MENSAJE' ? '#2563eb' : '#64748b'} />
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Mensaje</span>
                        </button>
                    </div>
                </div>

                {/* Cliente Section */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>CLIENTE</label>
                    <div style={{ marginTop: '5px' }}>
                        {selectedClient ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid #2563eb', borderRadius: '8px', padding: '12px', backgroundColor: '#eff6ff' }}>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{selectedClient.NOMBRE}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Cédula: {selectedClient.CEDULA || 'N/A'} • Deuda: ${(parseFloat(selectedClient.DEUDA) || 0).toFixed(2)}</div>
                                </div>
                                <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowClientSearch(true)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', border: '2px dashed #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#475569' }}
                            >
                                <Search size={18} />
                                Buscar Cliente
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                    {carrito.map(item => (
                        <div key={item.ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                            <div>
                                <div style={{ fontWeight: 500 }}>{item.NOMBRE}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>${item.PRECIO} x {item.cantidad}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontWeight: 700 }}>${(item.PRECIO * item.cantidad).toFixed(2)}</div>
                                <button onClick={() => setCarrito(carrito.filter(i => i.ID !== item.ID))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 600 }}>Total</span>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb' }}>${total.toFixed(2)}</span>
                    </div>

                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ESTADO DE PAGO</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '8px 0 20px 0' }}>
                        <button
                            onClick={() => setEstadoPago('PAGADO')}
                            style={{ padding: '8px', borderRadius: '8px', border: estadoPago === 'PAGADO' ? '2px solid #10b981' : '1px solid #cbd5e1', backgroundColor: estadoPago === 'PAGADO' ? '#ecfdf5' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                        >
                            <Banknote size={16} color={estadoPago === 'PAGADO' ? '#10b981' : '#64748b'} />
                            <span style={{ fontSize: '10px', fontWeight: 600 }}>Pagado</span>
                        </button>
                        <button
                            onClick={() => setEstadoPago('POR_PAGAR')}
                            style={{ padding: '8px', borderRadius: '8px', border: estadoPago === 'POR_PAGAR' ? '2px solid #f59e0b' : '1px solid #cbd5e1', backgroundColor: estadoPago === 'POR_PAGAR' ? '#fffbeb' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                        >
                            <Clock size={16} color={estadoPago === 'POR_PAGAR' ? '#f59e0b' : '#64748b'} />
                            <span style={{ fontSize: '10px', fontWeight: 600 }}>Por Pagar</span>
                        </button>
                        <button
                            onClick={() => setEstadoPago('EN_SITIO')}
                            style={{ padding: '8px', borderRadius: '8px', border: estadoPago === 'EN_SITIO' ? '2px solid #2563eb' : '1px solid #cbd5e1', backgroundColor: estadoPago === 'EN_SITIO' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                        >
                            <CreditCard size={16} color={estadoPago === 'EN_SITIO' ? '#2563eb' : '#64748b'} />
                            <span style={{ fontSize: '10px', fontWeight: 600 }}>En Lugar</span>
                        </button>
                    </div>

                    <button
                        onClick={registrarPedido}
                        disabled={loading}
                        style={{ width: '100%', padding: '15px', borderRadius: '10px', backgroundColor: '#0f172a', color: 'white', border: 'none', fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'REGISTRANDO...' : 'REGISTRAR'}
                    </button>
                </div>
            </div>

            {/* Client Search Modal */}
            {showClientSearch && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, maxWidth: '500px', maxHeight: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Buscar Cliente</h3>
                            <button onClick={() => setShowClientSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o cédula..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                autoFocus
                                style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px' }}
                            />
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {clientesFiltrados.map(c => (
                                <div
                                    key={c.ID}
                                    onClick={() => handleSelectClient(c)}
                                    style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{c.NOMBRE}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                                        Cédula: {c.CEDULA || 'N/A'} • Deuda: <span style={{ color: parseFloat(c.DEUDA) > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }}>${(parseFloat(c.DEUDA) || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            {clientesFiltrados.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No se encontraron clientes
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const modalOverlay = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalContent = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    maxWidth: '90%',
    width: '100%'
};

export default TelepedidosTab;
