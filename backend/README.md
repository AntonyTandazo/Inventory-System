# Backend - Mi Despensa Virtual 🖥️

Servidor de API REST construido con Node.js y Express para gestionar las operaciones del sistema.

## 📡 Tecnologías
- **Node.js**: Entorno de ejecución.
- **Express**: Framework web.
- **dotenv**: Gestión de variables de entorno.
- **oracledb**: Driver para conexión con Oracle DB.
- **cors**: Habilitación de peticiones desde el frontend.

## ⚙️ Configuración (.env)
El archivo `.env` es el corazón de la configuración:
- `DB_SIMULATION`: Cambia entre datos ficticios (`true`) y base de datos real (`false`).
- `PORT`: Puerto donde corre el servidor (default 3001).

## 🛣️ Endpoints Principales
- `/api/productos`: GET, POST, PUT, DELETE.
- `/api/clientes`: GET, POST, PUT, DELETE.
- `/api/clientes/:id/pago`: POST para registrar abonos a la deuda.
- `/api/pedidos`: POST para registrar ventas y actualizar stock.

## 💾 Persistencia
Si `DB_SIMULATION` es `true`, los datos se mantienen en memoria mientras el servidor esté encendido. Para persistencia real, configura Oracle DB usando el archivo `query.sql`.
