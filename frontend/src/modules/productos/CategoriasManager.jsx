import React, { useState, useEffect } from 'react';
import { CategoriaService } from '../../services/CategoriaService';
import { Edit, Trash2, RotateCcw, X, Plus } from 'lucide-react';

const CategoriasManager = ({ onClose }) => {
    const [categorias, setCategorias] = useState([]);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [editando, setEditando] = useState(null); // ID de la categoria que se edita
    const [editNombre, setEditNombre] = useState('');
    const [mensaje, setMensaje] = useState(null); // { tipo: 'error'|'success', texto: '' }

    useEffect(() => {
        cargar();
    }, []);

    const cargar = async () => {
        const data = await CategoriaService.listar();
        setCategorias(data);
    };

    const crear = async (e) => {
        e.preventDefault();
        setMensaje(null);
        try {
            await CategoriaService.guardar(nuevoNombre);
            setNuevoNombre('');
            cargar();
            setMensaje({ tipo: 'success', texto: 'Categoría creada exitosamente' });
        } catch (err) {
            console.error('Error completo:', err);
            if (err.puedeRestaurar) {
                if (window.confirm(`${err.mensaje} ¿Deseas restaurarla?`)) {
                    await CategoriaService.restaurar(err.id);
                    setNuevoNombre('');
                    cargar();
                    return;
                }
            }
            setMensaje({ tipo: 'error', texto: err.mensaje || err.error || 'Error al guardar' });
        }
    };

    const actualizar = async (id) => {
        try {
            await CategoriaService.actualizar(id, editNombre);
            setEditando(null);
            cargar();
        } catch (e) {
            alert('Error actualizando');
        }
    };

    const eliminar = async (id) => {
        if (window.confirm('¿Eliminar categoría? Los productos seguirán existiendo pero sin categoría visible.')) {
            await CategoriaService.eliminar(id);
            cargar();
        }
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Gestión de Categorías</h2>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>

                <form onSubmit={crear} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        placeholder="Nueva categoría..."
                        style={inputStyle}
                        required
                    />
                    <button type="submit" style={btnPrimaryStyle}><Plus size={18} /> Agregar</button>
                </form>

                {mensaje && <p style={{ color: mensaje.tipo === 'error' ? 'red' : 'green', fontSize: '14px', marginBottom: '10px' }}>{mensaje.texto}</p>}

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {categorias.map(c => (
                                <tr key={c.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px' }}>
                                        {editando === c.ID ? (
                                            <input
                                                value={editNombre}
                                                onChange={(e) => setEditNombre(e.target.value)}
                                                style={inputStyle}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 500 }}>{c.NOMBRE}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                        {editando === c.ID ? (
                                            <>
                                                <button onClick={() => actualizar(c.ID)} style={{ ...actionBtnStyle, color: 'green', marginRight: '5px' }}>Guardar</button>
                                                <button onClick={() => setEditando(null)} style={actionBtnStyle}>Cancelar</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditando(c.ID); setEditNombre(c.NOMBRE); }} style={{ ...actionBtnStyle, color: '#2563eb' }}><Edit size={16} /></button>
                                                <button onClick={() => eliminar(c.ID)} style={{ ...actionBtnStyle, color: '#dc2626' }}><Trash2 size={16} /></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px' };
const inputStyle = { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const btnPrimaryStyle = { backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' };

export default CategoriasManager;
