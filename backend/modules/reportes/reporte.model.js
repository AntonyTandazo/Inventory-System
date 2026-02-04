const { getConnection, USE_SIMULATION } = require('../../config/database');
const oracledb = require('oracledb');
const pedidoModel = require('../pedidos/pedido.model');
const productoModel = require('../productos/producto.model');
const clienteModel = require('../clientes/cliente.model');

const reporteModel = {
    async getGeneralStats(rango, usuarioId = 1) {
        // rango: 'mes', 'trimestre', 'anio'
        const startDate = getStartDate(rango);

        if (USE_SIMULATION) {
            const pedidos = await pedidoModel.obtenerTodos(usuarioId);
            const filtered = pedidos.filter(p => new Date(p.FECHA) >= startDate && p.ESTADO !== 'CANCELADO');

            const totalVentas = filtered.reduce((sum, p) => sum + parseFloat(p.TOTAL), 0);
            const cantidadPedidos = filtered.length;
            const ticketPromedio = cantidadPedidos > 0 ? totalVentas / cantidadPedidos : 0;

            // Trend (Simulated using current data buckets)
            const trend = {};
            filtered.forEach(p => {
                const dateKey = new Date(p.FECHA).toLocaleDateString();
                trend[dateKey] = (trend[dateKey] || 0) + parseFloat(p.TOTAL);
            });

            return { totalVentas, cantidadPedidos, ticketPromedio, trend };
        }

        const conn = await getConnection();
        try {
            const sql = `SELECT SUM(TOTAL) as VENTAS, COUNT(*) as PEDIDOS 
                         FROM PEDIDOS 
                         WHERE USUARIO_ID = :usuarioId AND FECHA >= :startDate AND ESTADO != 'CANCELADO'`;

            const result = await conn.execute(sql, { usuarioId, startDate }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            const row = result.rows[0];

            const totalVentas = row.VENTAS || 0;
            const cantidadPedidos = row.PEDIDOS || 0;
            const ticketPromedio = cantidadPedidos > 0 ? totalVentas / cantidadPedidos : 0;

            await conn.close();
            return { totalVentas, cantidadPedidos, ticketPromedio, trend: {} };
        } catch (e) {
            await conn.close();
            throw e;
        }
    },

    async getTopProductos(rango, usuarioId = 1) {
        const startDate = getStartDate(rango);
        if (USE_SIMULATION) {
            const pedidos = await pedidoModel.obtenerTodos(usuarioId);
            const filtered = pedidos.filter(p => new Date(p.FECHA) >= startDate && p.ESTADO !== 'CANCELADO');

            // Map items count
            const productStats = {};
            filtered.forEach(p => {
                (p.ITEMS || []).forEach(item => { // Assuming ITEMS are populated
                    if (!productStats[item.NOMBRE]) productStats[item.NOMBRE] = { cantidad: 0, total: 0 };
                    productStats[item.NOMBRE].cantidad += item.cantidad;
                    productStats[item.NOMBRE].total += (item.PRECIO * item.cantidad);
                });
            });

            // If no items detail found (due to simulation limitations), generate dummy
            if (Object.keys(productStats).length === 0) {
                return [
                    { nombre: 'Leche Descremada', cantidad: 120, total: 240 },
                    { nombre: 'Arroz 5kg', cantidad: 85, total: 340 },
                    { nombre: 'Aceite Vegetal', cantidad: 50, total: 150 },
                    { nombre: 'Coca Cola 2L', cantidad: 200, total: 500 },
                    { nombre: 'Pan Molde', cantidad: 60, total: 120 },
                ];
            }

            return Object.entries(productStats)
                .map(([nombre, stat]) => ({ nombre, ...stat }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);
        }

        const conn = await getConnection();
        try {
            // Using FETCH NEXT for Oracle 12c+ paging, or ROWNUM for older versions. 
            // Standard SQL: FETCH FIRST 5 ROWS ONLY
            const sql = `
                SELECT 
                    PR.NOMBRE, 
                    SUM(PD.CANTIDAD) as CANTIDAD, 
                    SUM(PD.SUBTOTAL) as TOTAL
                FROM PEDIDO_DETALLES PD
                JOIN PRODUCTOS PR ON PD.PRODUCTO_ID = PR.ID
                JOIN PEDIDOS P ON PD.PEDIDO_ID = P.ID
                WHERE P.USUARIO_ID = :usuarioId 
                  AND P.FECHA >= :startDate 
                  AND P.ESTADO != 'CANCELADO'
                GROUP BY PR.NOMBRE
                ORDER BY TOTAL DESC
                FETCH FIRST 5 ROWS ONLY
            `;

            const result = await conn.execute(sql, {
                usuarioId,
                startDate
            }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

            await conn.close();

            // Map result to expected format
            return result.rows.map(row => ({
                nombre: row.NOMBRE,
                cantidad: row.CANTIDAD,
                total: row.TOTAL
            }));
        } catch (e) {
            console.error('Error getting top products:', e);
            await conn.close();
            throw e;
        }
    },

    async getTopClientes(rango, usuarioId = 1) {
        const startDate = getStartDate(rango);
        if (USE_SIMULATION) {
            const pedidos = await pedidoModel.obtenerTodos(usuarioId);
            const filtered = pedidos.filter(p => new Date(p.FECHA) >= startDate && p.ESTADO !== 'CANCELADO');

            const clientStats = {};
            filtered.forEach(p => {
                const name = p.NOMBRE_CLIENTE || 'Consumidor Final';
                if (!clientStats[name]) clientStats[name] = { visitas: 0, total: 0 };
                clientStats[name].visitas += 1;
                clientStats[name].total += parseFloat(p.TOTAL);
            });

            return Object.entries(clientStats)
                .map(([nombre, stat]) => ({ nombre, ...stat }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);
        }

        const conn = await getConnection();
        try {
            const sql = `
                SELECT 
                    C.NOMBRE, 
                    COUNT(P.ID) as VISITAS, 
                    SUM(P.TOTAL) as TOTAL
                FROM PEDIDOS P
                JOIN CLIENTES C ON P.CLIENTE_ID = C.ID
                WHERE P.USUARIO_ID = :usuarioId 
                  AND P.FECHA >= :startDate 
                  AND P.ESTADO != 'CANCELADO'
                GROUP BY C.NOMBRE
                ORDER BY TOTAL DESC
                FETCH FIRST 5 ROWS ONLY
            `;

            const result = await conn.execute(sql, {
                usuarioId,
                startDate
            }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

            await conn.close();

            return result.rows.map(row => ({
                nombre: row.NOMBRE,
                visitas: row.VISITAS,
                total: row.TOTAL
            }));
        } catch (e) {
            console.error('Error getting top clients:', e);
            await conn.close();
            throw e;
        }
    },

    async getVentasPorCategoria(rango, usuarioId = 1) {
        const startDate = getStartDate(rango);

        if (USE_SIMULATION) {
            return [
                { categoria: 'Frenos', total: 1500, porcentaje: 35 },
                { categoria: 'Motor', total: 1200, porcentaje: 28 },
                { categoria: 'Suspensión', total: 1000, porcentaje: 23 },
                { categoria: 'Transmisión', total: 600, porcentaje: 14 }
            ];
        }

        const conn = await getConnection();
        try {
            // 1. Get total sales for the period to calculate percentages later
            // We use FECHA here to be consistent with our previous fix
            const sqlTotal = `SELECT SUM(TOTAL) as TOTAL_Ventas 
                             FROM PEDIDOS 
                             WHERE USUARIO_ID = :usuarioId AND FECHA >= :startDate AND ESTADO != 'CANCELADO'`;

            const totalResult = await conn.execute(sqlTotal, { usuarioId, startDate }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            const totalGeneral = totalResult.rows[0].TOTAL_VENTAS || 0;

            // 2. Get sales per category
            const sqlCat = `
                SELECT 
                    C.NOMBRE as CATEGORIA, 
                    SUM(PD.SUBTOTAL) as TOTAL
                FROM PEDIDO_DETALLES PD
                JOIN PRODUCTOS PR ON PD.PRODUCTO_ID = PR.ID
                JOIN CATEGORIAS C ON PR.CATEGORIA_ID = C.ID
                JOIN PEDIDOS P ON PD.PEDIDO_ID = P.ID
                WHERE P.USUARIO_ID = :usuarioId 
                  AND P.FECHA >= :startDate 
                  AND P.ESTADO != 'CANCELADO'
                GROUP BY C.NOMBRE
                ORDER BY TOTAL DESC
            `;

            const result = await conn.execute(sqlCat, { usuarioId, startDate }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await conn.close();

            // 3. Map result and calculate percentages
            return result.rows.map(row => ({
                categoria: row.CATEGORIA,
                total: row.TOTAL,
                porcentaje: totalGeneral > 0 ? Math.round((row.TOTAL / totalGeneral) * 100) : 0
            }));
        } catch (e) {
            console.error('Error getting sales by category:', e);
            await conn.close();
            throw e;
        }
    }
};

const getStartDate = (rango) => {
    const date = new Date();
    if (rango === 'mes') date.setMonth(date.getMonth() - 1);
    if (rango === 'trimestre') date.setMonth(date.getMonth() - 3);
    if (rango === 'anio') date.setFullYear(date.getFullYear() - 1);
    return date;
};

module.exports = reporteModel;
