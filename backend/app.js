const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Importar Rutas
const productoRoutes = require('./modules/productos/producto.routes');
const categoriaRoutes = require('./modules/categorias/categoria.routes');
const clienteRoutes = require('./modules/clientes/cliente.routes');
const pedidoRoutes = require('./modules/pedidos/pedido.routes');
const pagoRoutes = require('./modules/pagos/pago.routes');
const reporteRoutes = require('./modules/reportes/reporte.routes');
const configRoutes = require('./modules/config/config.routes');
const telepedidosRoutes = require('./modules/telepedidos/telepedidos.routes');

// Definir Rutas
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/config', configRoutes);
app.use('/api/telepedidos', telepedidosRoutes);

app.get('/', (req, res) => {
    res.send('API de Mi Despensa Virtual en funcionamiento');
});

app.get('/api', (req, res) => {
    res.json({
        message: 'API de Mi Despensa Virtual',
        status: 'online',
        database: 'Supabase PostgreSQL'
    });
});

// Solo iniciar servidor si no estamos en Vercel
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
}

// Exportar para Vercel serverless
module.exports = app;
