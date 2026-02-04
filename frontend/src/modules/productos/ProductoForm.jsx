import React, { useState, useEffect } from 'react';
import { ProductoService } from '../../services/ProductoService';
import { CategoriaService } from '../../services/CategoriaService';
import { X } from 'lucide-react';

const ProductoForm = ({ producto = null, onClose, onSuccess }) => {
    const isEditing = !!producto;
    const [formData, setFormData] = useState({
        CODIGO: '',
        NOMBRE: '',
        CATEGORIA_ID: '',
        PRECIO: 0,
        STOCK: 0,
        STOCK_MINIMO: 5
    });
    const [categorias, setCategorias] = useState([]);
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        cargarCategorias();
        if (producto) {
            setFormData({
                CODIGO: producto.CODIGO || '',
                NOMBRE: producto.NOMBRE || '',
                CATEGORIA_ID: producto.CATEGORIA_ID ?? '',
                PRECIO: producto.PRECIO ?? producto.PRECIO_VENTA ?? 0,
                STOCK: producto.STOCK || 0,
                STOCK_MINIMO: producto.STOCK_MINIMO || 5
            });
        }
    }, [producto]);

    const cargarCategorias = async () => {
        const data = await CategoriaService.listar();
        setCategorias(data);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        try {
            if (isEditing) {
                await ProductoService.editar(producto.ID, formData);
                onSuccess();
            } else {
                await ProductoService.guardar(formData);
                onSuccess();
            }
        } catch (err) {
            // Manejo de conflictos (duplicado pero eliminado)
            if (err.puedeRestaurar) {
                if (window.confirm(`${err.mensaje} ¿Deseas restaurarlo con el stock y datos anteriores?`)) {
                    await ProductoService.restaurar(err.id);
                    onSuccess();
                    return;
                }
                if (window.confirm('¿Quieres cambiar el identificador para crear uno nuevo?')) {
                    // Usuario decide cambiar datos, no hacemos nada, se queda en el form
                    return;
                }
            }
            setMensaje(err.mensaje || 'Error al guardar');
        }
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

                    <div>
                        <label style={labelStyle}>Código *</label>
                        <input name="CODIGO" value={formData.CODIGO} onChange={handleChange} style={inputStyle} required disabled={isEditing} />
                    </div>

                    <div>
                        <label style={labelStyle}>Categoría *</label>
                        <select name="CATEGORIA_ID" value={formData.CATEGORIA_ID} onChange={handleChange} style={inputStyle} required>
                            <option value="">Seleccione...</option>
                            {categorias.map(c => (
                                <option key={c.ID} value={c.ID}>{c.NOMBRE}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Nombre *</label>
                        <input name="NOMBRE" value={formData.NOMBRE} onChange={handleChange} style={inputStyle} required />
                    </div>

                    <div>
                        <label style={labelStyle}>Precio Unit. ($)</label>
                        <input type="number" step="0.01" name="PRECIO" value={formData.PRECIO} onChange={handleChange} style={inputStyle} required />
                    </div>

                    <div>
                        <label style={labelStyle}>Stock Mínimo</label>
                        <input type="number" name="STOCK_MINIMO" value={formData.STOCK_MINIMO} onChange={handleChange} style={inputStyle} required />
                    </div>

                    {/* Stock Actual solo editable al crear, o al editar para ajustes? Dejemoslo editable para ajustes rapidos */}
                    <div>
                        <label style={labelStyle}>Stock Actual ({isEditing ? 'Ajuste' : 'Inicial'})</label>
                        <input type="number" name="STOCK" value={formData.STOCK} onChange={handleChange} style={inputStyle} required />
                    </div>

                    {mensaje && <p style={{ gridColumn: '1 / -1', color: 'red', fontSize: '14px', margin: 0 }}>{mensaje}</p>}

                    <div style={{ gridColumn: '1 / -1', marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancelar</button>
                        <button type="submit" style={btnPrimaryStyle}>Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '600px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: 500, color: '#475569' };
const btnPrimaryStyle = { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 600 };
const btnSecondaryStyle = { padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer' };

export default ProductoForm;
