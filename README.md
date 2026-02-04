# Mi Despensa Virtual 🛒

Sistema integral de gestión para tiendas de abarrotes, que incluye control de inventario, CRM de clientes con manejo de deudas y un Punto de Venta (POS) dinámico.

## 🔥 Características Principales

- **Dashboard:** Resumen visual de productos críticos y deudas totales.
- **Inventario:** CRUD completo de productos con alertas de stock bajo.
- **Clientes:** Gestión de deudores y registro de pagos.
- **POS (Puntos de Venta):** Interfaz rápida para ventas con actualización automática de stock y deudas.
- **Dualidad de Base de Datos:** Soporta modo simulación (mock data) y base de datos real (Oracle).

## 🛠️ Estructura del Proyecto

El proyecto está dividido en dos partes principales:

### 1. Backend (Node.js + Express)
Localizado en la carpeta `/backend`. Gestiona la lógica de negocio y la persistencia de datos.

**Estructura:**
- `/config`: Configuración de base de datos.
- `/modules`: Lógica dividida por componentes (productos, clientes, pedidos).
- `app.js`: Punto de entrada del servidor.
- `query.sql`: Scripts para inicializar la base de datos Oracle.

### 2. Frontend (React + Vite)
Localizado en la carpeta `/frontend`. Interfaz de usuario moderna y responsiva.

**Estructura:**
- `/src/modules`: Vistas principales del sistema.
- `/src/services`: Comunicación con la API.
- `/src/components`: Elementos reutilizables como el Sidebar.

---

## 🚀 Configuración y Ejecución

### Requisitos Previos
- Node.js instalado (v14 o superior).
- (Opcional) Base de datos Oracle configurada.

### Paso 1: Configurar el Backend
1. Entra a la carpeta: `cd backend`
2. Instala dependencias: `npm install`
3. Configura el archivo `.env`:
   - `DB_SIMULATION=true` para usar datos de prueba.
   - `DB_SIMULATION=false` para conectar a Oracle (requiere credenciales).

### Paso 2: Configurar el Frontend
1. Entra a la carpeta: `cd frontend`
2. Instala dependencias: `npm install`

### Paso 3: Ejecución
- **Backend:** `npm start` o `node app.js` (Corre en puerto 3001).
- **Frontend:** `npm run dev` (Corre en puerto 5173).

---

## 📋 Base de Datos (Oracle)
Si deseas usar una base de datos real, ejecuta los scripts contenidos en `backend/query.sql` para crear las tablas necesarias.

## 🔑 Credenciales por Defecto (Simulación)
- **Usuario:** admin
- **Contraseña:** admin123
