const { getConnection, USE_SIMULATION } = require('../../config/database');

let entregasSimuladas = [
    { ID: 1, PEDIDO_ID: 101, FECHA: '2026-01-29', ESTADO: 'Entregado', REPARTIDOR: 'Carlos Mora' },
    { ID: 2, PEDIDO_ID: 102, FECHA: '2026-01-30', ESTADO: 'Pendiente', REPARTIDOR: 'Ana Vaca' },
    { ID: 4, PEDIDO_ID: 104, FECHA: '2026-01-31', ESTADO: 'En Camino', REPARTIDOR: 'Diego Jara' },
    { ID: 5, PEDIDO_ID: 105, FECHA: '2026-02-01', ESTADO: 'Entregado', REPARTIDOR: 'Elena Ruiz' }
];

const entregaModel = {
    async obtenerTodas() {
        if (USE_SIMULATION) return entregasSimuladas;
        // Lógica real Oracle...
        return [];
    }
};

module.exports = entregaModel;
