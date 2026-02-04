import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardView from './modules/dashboard/DashboardView';
import ProductosView from './modules/productos/ProductosView';
import VentasView from './modules/ventas/VentasView'; // Unified View
import ClientesView from './modules/clientes/ClientesView';
import CobranzaView from './modules/clientes/CobranzaView';
import EntregasView from './modules/entregas/EntregasView';
import ReportesView from './modules/reportes/ReportesView';
import ConfiguracionView from './modules/configuracion/ConfiguracionView';
import LoginView from './modules/dashboard/LoginView';
import { ConfigService } from './services/ConfigService';

import { Menu, X } from 'lucide-react';

// Wrapper component to use useNavigate
const DashboardWrapper = ({ storeName }) => {
  const navigate = useNavigate();
  return <DashboardView onNavigate={navigate} storeName={storeName} />;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeName, setStoreName] = useState('Mi Despensa Virtual');
  const isMobile = window.innerWidth <= 768;

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  // Fetch Store Name
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await ConfigService.getSettings();
        if (settings?.negocio?.nombre) {
          setStoreName(settings.negocio.nombre);
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    if (isLoggedIn) fetchSettings();
  }, [isLoggedIn]);

  // Inactivity Timeout (30 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;

    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert('Sesión cerrada por inactividad');
        logout();
      }, 1800000); // 30 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isLoggedIn, logout]);

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={login} />;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* Toggle Button (Shown when sidebar is hidden) */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            style={{
              position: 'fixed',
              top: '15px',
              left: '15px',
              zIndex: 1100,
              padding: '10px',
              backgroundColor: '#0f172a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s'
            }}
          >
            <Menu size={24} />
          </button>
        )}

        <Sidebar
          onLogout={logout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          storeName={storeName}
          onToggle={toggleSidebar}
        />

        <main className="main-content" style={{
          flexGrow: 1,
          display: 'flex',
          width: '100%',
          overflowX: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingLeft: !sidebarOpen ? '75px' : '0', // Offset for the floating toggle button
          paddingTop: isMobile && !sidebarOpen ? '10px' : '0'
        }}>
          <Routes>
            <Route path="/" element={<DashboardWrapper storeName={storeName} />} />
            <Route path="/productos" element={<ProductosView />} />
            <Route path="/ventas" element={<VentasView />} />
            <Route path="/clientes" element={<ClientesView />} />
            <Route path="/cobranza" element={<CobranzaView />} />
            <Route path="/entregas" element={<EntregasView />} />
            <Route path="/reportes" element={<ReportesView />} />
            <Route path="/configuracion" element={<ConfiguracionView />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && window.innerWidth <= 768 && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
