import React, { useState, useEffect, useMemo } from 'react';
import { ProductoService } from '../../services/ProductoService';
import { ClienteService } from '../../services/ClienteService';
import { PedidoService } from '../../services/PedidoService';
import { Search, ShoppingCart, Trash2, Plus, Minus, User, X, Download, Printer, DollarSign, CreditCard } from 'lucide-react';
import jsPDF from 'jspdf';

const PosView = () => {
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [carrito, setCarrito] = useState([]);

    // Client search
    const [showClientSearch, setShowClientSearch] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);

    // Payment
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [advancePayment, setAdvancePayment] = useState('');

    // Receipt
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSale, setLastSale] = useState(null);

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
        if (producto.STOCK <= 0) {
            alert('Producto agotado');
            return;
        }
        const existe = carrito.find(item => item.ID === producto.ID);
        if (existe) {
            if (existe.cantidad >= producto.STOCK) {
                alert('No hay más stock disponible');
                return;
            }
            setCarrito(carrito.map(item =>
                item.ID === producto.ID ? { ...item, cantidad: item.cantidad + 1 } : item
            ));
        } else {
            setCarrito([...carrito, { ...producto, cantidad: 1 }]);
        }
    };

    const modificarCantidad = (id, delta) => {
        const prodMatch = productos.find(p => p.ID === id);
        setCarrito(carrito.map(item => {
            if (item.ID === id) {
                const nuevaCant = item.cantidad + delta;
                if (nuevaCant > prodMatch.STOCK) {
                    alert('Excede el stock disponible');
                    return item;
                }
                return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : item;
            }
            return item;
        }).filter(item => item.cantidad > 0));
    };

    const handleSelectClient = (cliente) => {
        setSelectedClient(cliente);
        setShowClientSearch(false);
        setClientSearchTerm('');
    };

    const handleCobrar = () => {
        if (!selectedClient) return alert('Por favor selecciona un cliente');
        if (carrito.length === 0) return alert('El carrito está vacío');
        setShowPaymentModal(true);
    };

    const handlePaymentMethod = (method) => {
        setShowPaymentModal(false);
        if (method === 'credit') {
            setShowCreditModal(true);
        } else {
            finalizarVenta(method, 0);
        }
    };

    const handleCreditPayment = () => {
        const advance = parseFloat(advancePayment) || 0;
        const total = carrito.reduce((sum, item) => sum + (item.PRECIO * item.cantidad), 0);

        if (advance > total) {
            alert('El avance no puede ser mayor al total');
            return;
        }

        setShowCreditModal(false);
        finalizarVenta('credit', advance);
    };

    const finalizarVenta = async (metodoPago, avance) => {
        const total = carrito.reduce((sum, item) => sum + (item.PRECIO * item.cantidad), 0);
        const deuda = metodoPago === 'credit' ? total - avance : 0;

        const pedido = {
            CLIENTE_ID: selectedClient.ID,
            TOTAL: total,
            METODO_PAGO: metodoPago,
            AVANCE: avance,
            items: carrito
        };

        try {
            await PedidoService.guardar(pedido);

            setLastSale({
                ...pedido,
                cliente: selectedClient,
                fecha: new Date(),
                deuda: deuda
            });

            setShowReceiptModal(true);
            setCarrito([]);
            setSelectedClient(null);
            setAdvancePayment('');
            cargarDatos();
        } catch (error) {
            alert('Error al procesar la venta');
            console.error(error);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const sale = lastSale;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('MI DESPENSA VIRTUAL', 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Nota de Venta', 105, 30, { align: 'center' });

        // Client info
        doc.setFontSize(11);
        doc.text(`Cliente: ${sale.cliente.NOMBRE}`, 20, 45);
        doc.text(`Cédula: ${sale.cliente.CEDULA || 'N/A'}`, 20, 52);
        doc.text(`Fecha: ${new Date(sale.fecha).toLocaleString('es-EC')}`, 20, 59);

        // Line
        doc.line(20, 65, 190, 65);

        // Products header
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUCTOS', 20, 73);
        doc.setFont('helvetica', 'normal');

        // Products list
        let y = 82;
        sale.items.forEach(item => {
            doc.text(item.NOMBRE, 20, y);
            doc.text(`${item.cantidad} x $${parseFloat(item.PRECIO).toFixed(2)}`, 20, y + 5);
            doc.text(`$${(item.cantidad * parseFloat(item.PRECIO)).toFixed(2)}`, 170, y, { align: 'right' });
            y += 12;
        });

        // Line
        doc.line(20, y, 190, y);
        y += 8;

        // Total
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('TOTAL:', 20, y);
        doc.text(`$${sale.TOTAL.toFixed(2)}`, 170, y, { align: 'right' });
        y += 10;

        // Payment method
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const metodoPagoTexto = sale.METODO_PAGO === 'cash' ? 'Efectivo' : 'Fiado/Deuda';
        doc.text(`Método de Pago: ${metodoPagoTexto}`, 20, y);

        if (sale.METODO_PAGO === 'credit') {
            y += 7;
            doc.text(`Avance: $${sale.AVANCE.toFixed(2)}`, 20, y);
            y += 7;
            doc.text(`Deuda agregada: $${sale.deuda.toFixed(2)}`, 20, y);
        }

        // Footer
        y += 15;
        doc.setFont('helvetica', 'italic');
        doc.text('¡Gracias por su compra!', 105, y, { align: 'center' });

        return doc;
    };

    const downloadPDF = () => {
        const doc = generatePDF();
        doc.save(`Nota_Venta_${new Date().getTime()}.pdf`);
    };

    const printReceipt = () => {
        const doc = generatePDF();
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const printWindow = window.open(pdfUrl);
        printWindow.addEventListener('load', () => {
            printWindow.print();
        });
    };

    const total = carrito.reduce((sum, item) => sum + (item.PRECIO * item.cantidad), 0);
    const productosFiltrados = productos.filter(p =>
        p.NOMBRE.toLowerCase().includes(busqueda.toLowerCase())
    );

    const clientesFiltrados = useMemo(() => {
        return clientes.filter(c =>
            c.NOMBRE.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            c.CEDULA?.includes(clientSearchTerm)
        );
    }, [clientes, clientSearchTerm]);

    return (
        <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 0px)', backgroundColor: '#f1f5f9' }}>
            {/* Buscador de Productos */}
            <div style={{ flex: 2, padding: '30px', borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                    <Search size={20} color="#64748b" />
                    <input
                        type="text"
                        placeholder="Buscar productos por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{ border: 'none', outline: 'none', padding: '10px', width: '100%', fontSize: '1.2rem' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {productosFiltrados.map(prod => (
                        <div key={prod.ID} onClick={() => agregarAlCarrito(prod)} style={{ ...cardStyle, opacity: prod.STOCK <= 0 ? 0.6 : 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{prod.NOMBRE}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '1.3rem' }}>${(parseFloat(prod.PRECIO) || 0).toFixed(2)}</span>
                                <span style={{ fontSize: '0.9rem', color: (prod.STOCK || 0) < 10 ? '#dc2626' : '#64748b', fontWeight: '600' }}>Stock: {prod.STOCK}</span>
                            </div>
                            {(prod.STOCK || 0) <= 0 && <p style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '10px', fontSize: '0.8rem' }}>AGOTADO</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Carrito */}
            <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 10px rgba(0,0,0,0.05)' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <ShoppingCart size={28} color="#1e293b" />
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Detalle de Venta</h2>
                </header>

                {/* Client Selection */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#334155' }}>Cliente:</label>
                    {selectedClient ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid #2563eb', borderRadius: '8px', padding: '12px', backgroundColor: '#eff6ff' }}>
                            <div>
                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{selectedClient.NOMBRE}</div>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>Cédula: {selectedClient.CEDULA || 'N/A'} • Deuda: ${(parseFloat(selectedClient.DEUDA) || 0).toFixed(2)}</div>
                            </div>
                            <button onClick={() => setSelectedClient(null)} style={{ ...actionBtn, color: '#dc2626' }}>
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

                <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {carrito.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', marginTop: '80px' }}>
                            <ShoppingCart size={48} style={{ margin: '0 auto 20px auto', opacity: 0.2 }} />
                            <p>No hay productos en el carrito</p>
                        </div>
                    ) : (
                        carrito.map(item => (
                            <div key={item.ID} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{item.NOMBRE}</h4>
                                    <p style={{ margin: '5px 0', color: '#334155', fontWeight: 'bold' }}>${(parseFloat(item.PRECIO) || 0).toFixed(2)}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => modificarCantidad(item.ID, -1)} style={actionBtn}><Minus size={16} /></button>
                                    <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                                    <button onClick={() => modificarCantidad(item.ID, 1)} style={actionBtn}><Plus size={16} /></button>
                                    <button onClick={() => setCarrito(carrito.filter(i => i.ID !== item.ID))} style={{ ...actionBtn, color: '#dc2626' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>Total:</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb' }}>${total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleCobrar}
                        style={{
                            width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                    >
                        COBRAR
                    </button>
                </div>
            </div>

            {/* Client Search Modal */}
            {showClientSearch && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, maxWidth: '500px', maxHeight: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Buscar Cliente</h3>
                            <button onClick={() => setShowClientSearch(false)} style={{ ...actionBtn, color: '#dc2626' }}>
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

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>Método de Pago</h3>
                        <p style={{ color: '#64748b', marginBottom: '25px' }}>Total: <strong style={{ color: '#2563eb', fontSize: '1.3rem' }}>${total.toFixed(2)}</strong></p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <button
                                onClick={() => handlePaymentMethod('cash')}
                                style={{ ...paymentBtn, backgroundColor: '#16a34a', color: 'white' }}
                            >
                                <DollarSign size={24} />
                                <span>Efectivo</span>
                            </button>
                            <button
                                onClick={() => handlePaymentMethod('credit')}
                                style={{ ...paymentBtn, backgroundColor: '#f59e0b', color: 'white' }}
                            >
                                <CreditCard size={24} />
                                <span>Fiado / Deuda</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowPaymentModal(false)}
                            style={{ width: '100%', marginTop: '20px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Credit Payment Modal (Advance) */}
            {showCreditModal && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>Venta a Crédito</h3>
                        <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontWeight: '600' }}>Total:</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#92400e' }}>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                            Monto de Avance (opcional)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={total}
                            value={advancePayment}
                            onChange={(e) => setAdvancePayment(e.target.value)}
                            placeholder="0.00"
                            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1.1rem', marginBottom: '15px' }}
                        />

                        <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: '600', color: '#64748b' }}>Deuda a agregar:</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#dc2626' }}>
                                    ${(total - (parseFloat(advancePayment) || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => { setShowCreditModal(false); setAdvancePayment(''); }}
                                style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreditPayment}
                                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceiptModal && lastSale && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, maxWidth: '450px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                <span style={{ fontSize: '30px' }}>✓</span>
                            </div>
                            <h2 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>¡Venta Exitosa!</h2>
                            <p style={{ color: '#64748b', margin: 0 }}>La venta se ha registrado correctamente</p>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Cliente</div>
                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{lastSale.cliente.NOMBRE}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2563eb' }}>${lastSale.TOTAL.toFixed(2)}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Método de Pago</div>
                                <div style={{ fontWeight: '600' }}>{lastSale.METODO_PAGO === 'cash' ? '💵 Efectivo' : '💳 Fiado/Deuda'}</div>
                            </div>
                            {lastSale.METODO_PAGO === 'credit' && (
                                <>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Avance</div>
                                        <div style={{ fontWeight: '600', color: '#16a34a' }}>${lastSale.AVANCE.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Deuda Agregada</div>
                                        <div style={{ fontWeight: '700', color: '#dc2626' }}>${lastSale.deuda.toFixed(2)}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button
                                onClick={downloadPDF}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: '1px solid #2563eb', borderRadius: '8px', backgroundColor: 'white', color: '#2563eb', cursor: 'pointer', fontWeight: '600' }}
                            >
                                <Download size={18} />
                                Descargar
                            </button>
                            <button
                                onClick={printReceipt}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: '1px solid #16a34a', borderRadius: '8px', backgroundColor: 'white', color: '#16a34a', cursor: 'pointer', fontWeight: '600' }}
                            >
                                <Printer size={18} />
                                Imprimir
                            </button>
                        </div>

                        <button
                            onClick={() => setShowReceiptModal(false)}
                            style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '8px', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const cardStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    border: '1px solid #e2e8f0'
};

const actionBtn = {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#334155'
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

const paymentBtn = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    padding: '18px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: '700',
    transition: 'transform 0.1s',
};

export default PosView;
