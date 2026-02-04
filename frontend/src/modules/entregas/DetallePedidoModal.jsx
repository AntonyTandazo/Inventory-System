import React from 'react';
import { X, Package } from 'lucide-react';

const DetallePedidoModal = ({ pedido, onClose }) => {
    // Si no hay items reales (por simulación), mostramos data dummy o items si existen
    const items = pedido.ITEMS || [];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '500px', padding: '25px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Detalles del Pedido #{pedido.ID}</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <p><strong>Cliente:</strong> {pedido.NOMBRE_CLIENTE}</p>
                    <p><strong>Dirección:</strong> {pedido.DIRECCION}</p>
                    <p><strong>Total:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>${parseFloat(pedido.TOTAL).toFixed(2)}</span></p>
                </div>

                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={16} /> Productos</h4>
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '15px', maxHeight: '200px', overflowY: 'auto' }}>
                    {items.length > 0 ? (
                        items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                                <span>{item.NOMBRE} x{item.cantidad}</span>
                                <span style={{ fontWeight: 600 }}>${(item.PRECIO * item.cantidad).toFixed(2)}</span>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay detalles de productos disponibles.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetallePedidoModal;
