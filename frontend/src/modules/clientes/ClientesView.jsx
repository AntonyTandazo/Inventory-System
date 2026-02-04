import React, { useState, useEffect, useMemo } from 'react';
import { ClienteService } from '../../services/ClienteService';
import { UserPlus, Phone, MapPin, Edit, Trash2, X, Search, Filter, Mail, CreditCard, UserCheck, UserX, Eye, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const ClientesView = () => {
    const [clientes, setClientes] = useState([]);
    const [stats, setStats] = useState({ total: 0, activos: 0, nuevosMes: 0, conDeuda: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [clienteActual, setClienteActual] = useState({ NOMBRE: '', CEDULA: '', EMAIL: '', TELEFONO: '', DIRECCION: '', DEUDA: 0, ESTADO: 'Activo' });
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, Activo, Inactivo
    const [filterDebt, setFilterDebt] = useState('all'); // all, con-deuda, sin-deuda

    // PIN Protection for Delete
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [pinInput, setPinInput] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [lista, estadisticas] = await Promise.all([
                ClienteService.listar(),
                ClienteService.getStatistics()
            ]);
            setClientes(lista);
            setStats(estadisticas);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const requestDelete = (id) => {
        setPendingDeleteId(id);
        setPinInput('');
        setShowPinModal(true);
    };

    const verifyPinAndDelete = async () => {
        if (pinInput === '8520') { // TODO: Get from AuthService or backend
            setShowPinModal(false);
            await eliminar(pendingDeleteId);
        } else {
            alert('PIN incorrecto');
        }
    };

    const exportToExcel = () => {
        // Prepare data for export
        const dataToExport = filteredClients.map((c, index) => ({
            'N°': index + 1,
            'Nombre': c.NOMBRE,
            'Cédula': c.CEDULA,
            'Teléfono': c.TELEFONO,
            'Email': c.EMAIL || 'Sin correo',
            'Dirección': c.DIRECCION,
            'Deuda': `$${(parseFloat(c.DEUDA) || 0).toFixed(2)}`,
            'Estado': c.ESTADO || 'Activo',
            'Fecha Registro': c.FECHA_REGISTRO ? new Date(c.FECHA_REGISTRO).toLocaleDateString('es-EC') : 'N/A'
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Set column widths
        ws['!cols'] = [
            { wch: 5 },  // N°
            { wch: 25 }, // Nombre
            { wch: 15 }, // Cédula
            { wch: 15 }, // Teléfono
            { wch: 30 }, // Email
            { wch: 40 }, // Dirección
            { wch: 12 }, // Deuda
            { wch: 10 }, // Estado
            { wch: 15 }  // Fecha Registro
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

        // Generate filename with current date
        const fecha = new Date().toLocaleDateString('es-EC').replace(/\//g, '-');
        const filename = `Clientes_${fecha}.xlsx`;

        // Download file
        XLSX.writeFile(wb, filename);
    };

    const abrirModal = (cliente = null) => {
        if (cliente) {
            setClienteActual(cliente);
            setIsEditing(true);
        } else {
            setClienteActual({ NOMBRE: '', CEDULA: '', EMAIL: '', TELEFONO: '', DIRECCION: '', DEUDA: 0, ESTADO: 'Activo' });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const guardar = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await ClienteService.actualizar(clienteActual.ID, clienteActual);
            } else {
                await ClienteService.guardar(clienteActual);
            }
            setShowModal(false);
            cargarDatos();
        } catch (e) {
            // Display specific error message from backend
            const errorMsg = e.response?.data?.mensaje || e.message || 'Error al guardar cliente';
            alert(errorMsg);
            console.error('Error al guardar cliente:', e);
        }
    };

    const eliminar = async (id) => {
        if (window.confirm('¿Deseas eliminar a este cliente permanentemente?')) {
            try {
                await ClienteService.eliminar(id);
                cargarDatos();
            } catch (e) {
                alert('Error al eliminar');
            }
        }
    };

    const filteredClients = useMemo(() => {
        return clientes.filter(c => {
            const matchesSearch =
                c.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.TELEFONO && c.TELEFONO.includes(searchTerm)) ||
                (c.EMAIL && c.EMAIL.toLowerCase().includes(searchTerm.toLowerCase()));

            // Case-insensitive status comparison to match database values (ACTIVO/Activo)
            const matchesStatus = filterStatus === 'all' ||
                c.ESTADO.toUpperCase() === filterStatus.toUpperCase();

            const matchesDebt = filterDebt === 'all' ||
                (filterDebt === 'con-deuda' && c.DEUDA > 0) ||
                (filterDebt === 'sin-deuda' && c.DEUDA <= 0);

            return matchesSearch && matchesStatus && matchesDebt;
        });
    }, [clientes, searchTerm, filterStatus, filterDebt]);

    const isMobile = window.innerWidth <= 768;

    return (
        <div style={{ padding: isMobile ? '15px' : '30px', flexGrow: 1, backgroundColor: '#f8fafc', overflowY: 'auto', height: '100vh', width: '100%' }}>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: '30px',
                gap: '15px'
            }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Gestión de Clientes</h1>
                    <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px' }}>Administra la información de tus clientes</p>
                </div>
                <button
                    onClick={() => abrirModal()}
                    style={{
                        backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer',
                        width: isMobile ? '100%' : 'auto', justifyContent: 'center'
                    }}
                >
                    <UserPlus size={18} /> Nuevo Cliente
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <Card title="Total Clientes" value={stats.total} />
                <Card title="Activos" value={stats.activos} />
                <Card title="Nuevos Mes" value={stats.nuevosMes} />
                <Card title="Con Deuda" value={stats.conDeuda} valueColor="#ef4444" />
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
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', color: '#475569', fontSize: '14px' }}
                    >
                        <option value="all">Estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>

                    <select
                        value={filterDebt}
                        onChange={(e) => setFilterDebt(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', color: '#475569', fontSize: '14px' }}
                    >
                        <option value="all">Deudas</option>
                        <option value="con-deuda">Con deuda</option>
                        <option value="sin-deuda">Sin deuda</option>
                    </select>

                    <button
                        onClick={exportToExcel}
                        title="Exportar a Excel"
                        style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 500, color: '#475569', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Download size={16} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Cliente</th>
                            <th style={thStyle}>Contacto</th>
                            <th style={thStyle}>Dirección</th>
                            <th style={thStyle}>Compras</th>
                            <th style={thStyle}>Deuda</th>
                            <th style={thStyle}>Estado</th>
                            <th style={thStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map((c, index) => (
                            <tr key={c.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={tdStyle}><span style={{ color: '#64748b' }}>#{index + 1}</span></td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.NOMBRE}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Ced: {c.CEDULA || 'N/A'}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569' }}>
                                        <Phone size={14} /> {c.TELEFONO}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                                        <Mail size={14} /> {c.EMAIL || 'Sin correo'}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.DIRECCION}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 500, color: '#475569' }}>{Math.floor(Math.random() * 50)}</div> {/* Mock purchases count */}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontWeight: 600, color: c.DEUDA > 0 ? '#ef4444' : '#10b981' }}>
                                        ${(parseFloat(c.DEUDA) || 0).toFixed(2)}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                        backgroundColor: c.ESTADO === 'Activo' ? '#0f172a' : '#f1f5f9',
                                        color: c.ESTADO === 'Activo' ? 'white' : '#64748b'
                                    }}>
                                        {c.ESTADO || 'Activo'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => abrirModal(c)} title="Editar" style={actionBtnStyle}><Edit size={16} color="#64748b" /></button>
                                        <button onClick={() => requestDelete(c.ID)} title="Eliminar" style={actionBtnStyle}><Trash2 size={16} color="#ef4444" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredClients.length === 0 && (
                            <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No se encontraron clientes</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Client Modal */}
            {showModal && (
                <div style={{ ...modalOverlayStyle, padding: '10px' }}>
                    <div style={{ ...modalContentStyle, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
                        </div>
                        <form onSubmit={guardar} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px' }}>
                            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                                <label style={labelStyle}>Nombre Completo *</label>
                                <input required type="text" value={clienteActual.NOMBRE} onChange={(e) => setClienteActual({ ...clienteActual, NOMBRE: e.target.value })} style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>Cédula *</label>
                                <input required type="text" value={clienteActual.CEDULA} onChange={(e) => setClienteActual({ ...clienteActual, CEDULA: e.target.value })} style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>Teléfono *</label>
                                <input required type="text" value={clienteActual.TELEFONO} onChange={(e) => setClienteActual({ ...clienteActual, TELEFONO: e.target.value })} style={inputStyle} />
                            </div>

                            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                                <label style={labelStyle}>Email (Opcional)</label>
                                <input type="email" value={clienteActual.EMAIL} onChange={(e) => setClienteActual({ ...clienteActual, EMAIL: e.target.value })} style={inputStyle} />
                            </div>

                            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                                <label style={labelStyle}>Dirección *</label>
                                <input required type="text" value={clienteActual.DIRECCION} onChange={(e) => setClienteActual({ ...clienteActual, DIRECCION: e.target.value })} style={inputStyle} />
                            </div>

                            {isEditing && (
                                <div>
                                    <label style={labelStyle}>Estado</label>
                                    <select value={clienteActual.ESTADO} onChange={(e) => setClienteActual({ ...clienteActual, ESTADO: e.target.value })} style={inputStyle}>
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1', marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: isMobile ? 1 : 'none', padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: isMobile ? 1 : 'none', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PIN Modal for Delete */}
            {showPinModal && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: '350px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Seguridad requerida</h3>
                            <p style={{ fontSize: '14px', color: '#64748b' }}>Ingrese PIN para continuar</p>
                        </div>
                        <input
                            type="password"
                            placeholder="PIN (4 dígitos)"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            maxLength={4}
                            style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px', backgroundColor: '#fef3c7' }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setShowPinModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={verifyPinAndDelete} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Subcomponents
const Card = ({ title, value, valueColor }) => (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', border: '1px solid #f1f5f9' }}>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0, marginBottom: '10px' }}>{title}</p>
        <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold', color: valueColor || '#0f172a' }}>{value}</h2>
    </div>
);

const thStyle = { padding: '16px', fontWeight: '600', color: '#64748b', fontSize: '13px' };
const tdStyle = { padding: '16px', fontSize: '14px', color: '#334155' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '5px', outline: 'none' };
const labelStyle = { fontSize: '13px', fontWeight: 500, color: '#475569' };

export default ClientesView;
