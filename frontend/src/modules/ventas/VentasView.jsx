import React, { useState } from 'react';
import PosTab from './PosTab';
import TelepedidosTab from './TelepedidosTab';
import HistorialTab from './HistorialTab';
import { ShoppingBag, MessageSquare, History } from 'lucide-react';

const VentasView = () => {
    const [activeTab, setActiveTab] = useState('pos');

    const isMobile = window.innerWidth <= 768;

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', backgroundColor: '#f8fafc', height: '100%', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden', position: 'relative' }}>
            <div style={{
                marginBottom: '20px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: '15px'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px', color: '#1e293b' }}>Gestión de Ventas</h1>
                </div>

                <div style={{ flex: 1 }}></div>

                <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                    <div style={{
                        display: 'flex',
                        backgroundColor: 'white',
                        padding: '4px',
                        borderRadius: '10px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        flex: isMobile ? 2 : 'none',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap'
                    }}>
                        <TabButton
                            active={activeTab === 'pos'}
                            onClick={() => setActiveTab('pos')}
                            icon={<ShoppingBag size={isMobile ? 16 : 18} />}
                            label={isMobile ? "POS" : "Punto de Venta"}
                        />
                        <TabButton
                            active={activeTab === 'tele'}
                            onClick={() => setActiveTab('tele')}
                            icon={<MessageSquare size={isMobile ? 16 : 18} />}
                            label={isMobile ? "Tele" : "Tele-Pedidos"}
                        />
                        <TabButton
                            active={activeTab === 'history'}
                            onClick={() => setActiveTab('history')}
                            icon={<History size={isMobile ? 16 : 18} />}
                            label={isMobile ? "Hist" : "Historial"}
                        />
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'pos' && <PosTab />}
                {activeTab === 'tele' && <TelepedidosTab />}
                {activeTab === 'history' && <HistorialTab />}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: active ? '#0f172a' : 'transparent',
            color: active ? 'white' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px'
        }}
    >
        {icon}
        {label}
    </button>
);

export default VentasView;
