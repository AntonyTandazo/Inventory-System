import React, { useState } from 'react';
import CobranzaTab from '../cobranza/CobranzaTab';
import PagosTab from '../cobranza/PagosTab';
import { CreditCard, DollarSign } from 'lucide-react';

const CobranzaView = () => {
    const [activeTab, setActiveTab] = useState('pagos');

    return (
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>Gestión de Cobranza y Pagos</h1>
                <div style={{ flex: 1 }}></div>
                <div style={{ display: 'flex', backgroundColor: 'white', padding: '4px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <TabButton
                        active={activeTab === 'pagos'}
                        onClick={() => setActiveTab('pagos')}
                        icon={<DollarSign size={18} />}
                        label="Gestión de Pagos"
                    />
                    <TabButton
                        active={activeTab === 'cobranza'}
                        onClick={() => setActiveTab('cobranza')}
                        icon={<CreditCard size={18} />}
                        label="Gestión de Cobranza"
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'pagos' && <PagosTab />}
                {activeTab === 'cobranza' && <CobranzaTab />}
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

export default CobranzaView;
