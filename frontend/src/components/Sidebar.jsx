import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, CreditCard, LogOut, Truck, BarChart2, Settings, Menu } from 'lucide-react';

const Sidebar = ({ onLogout, isOpen, onClose, storeName, onToggle }) => {
    const isMobile = window.innerWidth <= 768;

    return (
        <div className="sidebar" style={{
            width: isOpen ? '260px' : '0',
            minHeight: '100vh',
            height: 'auto',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: isOpen ? '24px' : '0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
            position: isMobile ? 'fixed' : 'relative',
            left: (isMobile && !isOpen) ? '-260px' : '0',
            zIndex: 1050,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '40px',
                paddingBottom: '20px',
                borderBottom: '1px solid #334155',
                width: '212px'
            }}>
                <button
                    onClick={onToggle}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <Menu size={24} />
                </button>
                <h2 style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#f1f5f9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {storeName || 'Mi Despensa Virtual'}
                </h2>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                <Link to="/" onClick={onClose} className="sidebar-link"><LayoutDashboard size={20} /> Dashboard</Link>
                <Link to="/productos" onClick={onClose} className="sidebar-link"><Package size={20} /> Productos</Link>
                <Link to="/ventas" onClick={onClose} className="sidebar-link"><ShoppingCart size={20} /> Gestión Ventas</Link>
                <Link to="/clientes" onClick={onClose} className="sidebar-link"><Users size={20} /> CRM Clientes</Link>
                <Link to="/cobranza" onClick={onClose} className="sidebar-link"><CreditCard size={20} /> Cobranza</Link>
                <Link to="/entregas" onClick={onClose} className="sidebar-link"><Truck size={20} /> Entregas</Link>
                <Link to="/reportes" onClick={onClose} className="sidebar-link"><BarChart2 size={20} /> Reportes</Link>
                <Link to="/configuracion" onClick={onClose} className="sidebar-link"><Settings size={20} /> Configuración</Link>
            </nav>

            <button
                onClick={onLogout}
                className="logout-button"
                style={{
                    marginTop: 'auto',
                    backgroundColor: '#dc2626',
                    border: 'none',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                }}
            >
                <LogOut size={20} /> Cerrar Sesión
            </button>
        </div>
    );
};

export default Sidebar;
