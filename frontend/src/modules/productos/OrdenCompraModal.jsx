import React, { useState, useEffect } from 'react';
import { ProductoService } from '../../services/ProductoService';
import { X, FileText, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OrdenCompraModal = ({ onClose }) => {
    const [productos, setProductos] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const todos = await ProductoService.listar();
            setCatalogo(todos);

            // Filtrar bajo stock o critico para la lista inicial
            const bajos = todos.filter(p => p.STOCK <= p.STOCK_MINIMO).map(p => ({
                ...p,
                cantidadPedir: Math.max(0, (p.STOCK_MINIMO * 2) - p.STOCK)
            }));
            setProductos(bajos);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const agregarProducto = (prod) => {
        // Evitar duplicados
        if (productos.find(p => p.ID === prod.ID)) {
            setSearchTerm('');
            return;
        }
        setProductos([...productos, { ...prod, cantidadPedir: 1 }]);
        setSearchTerm('');
    };

    const handleCantidadChange = (id, val) => {
        setProductos(productos.map(p => p.ID === id ? { ...p, cantidadPedir: parseInt(val) || 0 } : p));
    };

    const eliminarDeLista = (id) => {
        setProductos(productos.filter(p => p.ID !== id));
    };

    const filteredCatalogo = searchTerm.length > 1
        ? catalogo.filter(p =>
            p.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.CODIGO && p.CODIGO.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 5)
        : [];

    const exportarPDF = () => {
        const doc = new jsPDF();
        const storeName = localStorage.getItem('negocio') || 'Mi Despensa Virtual';
        const dateStr = new Date().toLocaleDateString();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // #0f172a
        doc.text(storeName, 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(71, 85, 105); // #475569
        doc.text('Orden de Compra', 14, 30);

        doc.setFontSize(10);
        doc.text(`Fecha de Emisión: ${dateStr}`, 14, 38);

        // Divider
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 42, 196, 42);

        const tableColumn = ["Código", "Producto", "Stock", "Mínimo", "Cantidad a Pedir"];
        const tableRows = [];

        productos.forEach(p => {
            if (p.cantidadPedir > 0) {
                tableRows.push([
                    p.CODIGO || 'N/A',
                    p.NOMBRE,
                    p.STOCK,
                    p.STOCK_MINIMO,
                    p.cantidadPedir
                ]);
            }
        });

        autoTable(doc, {
            startY: 48,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            styles: { fontSize: 9, cellPadding: 5 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }
            }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY || 48;
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text('Generado automáticamente por el Sistema de Gestión Tandazo', 14, finalY + 15);

        doc.save(`Orden_Compra_${dateStr.replace(/\//g, '-')}.pdf`);
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><FileText /> Orden de Compra</h2>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>Añadir extra:</span>
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', outline: 'none' }}
                        />
                    </div>
                    {filteredCatalogo.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10 }}>
                            {filteredCatalogo.map(p => (
                                <div
                                    key={p.ID}
                                    onClick={() => agregarProducto(p)}
                                    style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{p.NOMBRE}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>Stock: {p.STOCK}</div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>+ Añadir</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
                    Productos con stock bajo o crítico. Ajusta las cantidades a pedir.
                </p>

                {loading ? <p>Cargando...</p> : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={thStyle}>Producto</th>
                                    <th style={thStyle}>Stock</th>
                                    <th style={thStyle}>Pedir</th>
                                    <th style={thStyle}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(p => (
                                    <tr key={p.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 500 }}>{p.NOMBRE}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.CODIGO}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ color: p.STOCK < p.STOCK_MINIMO ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                                {p.STOCK}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}> / {p.STOCK_MINIMO} min</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <input
                                                type="number"
                                                value={p.cantidadPedir}
                                                onChange={(e) => handleCantidadChange(p.ID, e.target.value)}
                                                style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                            />
                                        </td>
                                        <td style={tdStyle}>
                                            <button onClick={() => eliminarDeLista(p.ID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {productos.length === 0 && <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No hay productos en la lista.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={btnSecondaryStyle}>Cancelar</button>
                    <button onClick={exportarPDF} disabled={productos.length === 0} style={btnPrimaryStyle}>
                        <Download size={18} /> Exportar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '700px' };
const thStyle = { padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' };
const tdStyle = { padding: '12px', borderTop: '1px solid #f1f5f9' };
const btnPrimaryStyle = { backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, opacity: props => props.disabled ? 0.5 : 1 };
const btnSecondaryStyle = { backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer' };

export default OrdenCompraModal;
