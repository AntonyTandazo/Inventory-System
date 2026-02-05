# Mi Despensa Virtual 🛒

Sistema integral de gestión para tiendas de abarrotes, que incluye control de inventario, CRM de clientes con manejo de deudas, punto de venta (POS), telepedidos y gestión de entregas.

## 🔥 Características Principales

- **Dashboard:** Resumen visual de ventas, productos críticos, alertas de stock y métricas del negocio
- **Inventario:** CRUD completo de productos con alertas de stock bajo y generación de órdenes de compra
- **Clientes:** Gestión de clientes con control de deudas y límites de crédito
- **Ventas:**
  - **POS (Punto de Venta):** Interfaz rápida para ventas en mostrador
  - **Telepedidos:** Registro de pedidos telefónicos con entrega a domicilio
  - **Historial:** Consulta completa de todas las ventas realizadas
- **Cobranza:** Gestión de pagos y deudas de clientes
- **Entregas:** Control de pedidos pendientes y entregas realizadas
- **Reportes:** Análisis de ventas, inventario y clientes con exportación a PDF/Excel
- **Configuración:** Personalización del negocio, seguridad y respaldos

## 🏗️ Arquitectura

El sistema utiliza una arquitectura moderna con:

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Node.js + Express
- **Base de Datos:** Supabase (PostgreSQL en la nube)
- **Despliegue:** Netlify (Frontend) + Vercel (Backend)

### Estructura del Proyecto

```
Sistema-Inventario/
├── backend/                  # API REST con Node.js + Express
│   ├── config/              # Configuración de base de datos
│   ├── modules/             # Módulos por funcionalidad
│   │   ├── productos/
│   │   ├── clientes/
│   │   ├── pedidos/
│   │   ├── categorias/
│   │   └── ...
│   ├── app.js              # Punto de entrada del servidor
│   └── package.json
│
└── frontend/                # Aplicación React
    ├── src/
    │   ├── modules/        # Vistas principales del sistema
    │   ├── services/       # Comunicación con la API
    │   ├── components/     # Componentes reutilizables
    │   └── config/         # Configuración de API
    └── package.json
```

---

## 🚀 Configuración para Desarrollo Local

### Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior) - [Descargar aquí](https://nodejs.org/)
- **npm** (viene incluido con Node.js)
- **Git** (opcional, para clonar el repositorio)

Verifica las instalaciones:
```bash
node --version
npm --version
```

---

### Paso 1: Clonar o Descargar el Proyecto

```bash
# Con Git
git clone https://github.com/tu-usuario/Sistema-Inventario.git
cd Sistema-Inventario

# O descarga el ZIP y descomprime
```

---

### Paso 2: Configurar el Backend

#### 2.1 Navegar a la carpeta del backend
```bash
cd backend
```

#### 2.2 Instalar dependencias
```bash
npm install
```

**Si encuentras errores de dependencias**, intenta:
```bash
npm install --legacy-peer-deps
# o
npm install --force
```

#### 2.3 Configurar variables de entorno

El archivo `.env` ya existe en el proyecto. Verifica que contenga lo siguiente:

```env
# --- CONFIGURACIÓN DE SUPABASE ---
SUPABASE_URL=https://tbhizjwopvtexfyictdc.supabase.co
SUPABASE_ANON_KEY=sb_publishable__PvlGi2iiEB-9TjpUcWtmw_y3u2wSDQ

# --- CONFIGURACIÓN DE SERVIDOR ---
PORT=3001

# Set to 'true' to use mockup data, 'false' for Supabase DB
DB_SIMULATION=false
```

> **Nota:** Las credenciales de Supabase ya están configuradas para conectarse a la base de datos en la nube.

#### 2.4 Iniciar el servidor backend
```bash
npm start
```

O para modo desarrollo con auto-reinicio:
```bash
npm run dev
```

El backend estará corriendo en: **http://localhost:3001**

---

### Paso 3: Configurar el Frontend

#### 3.1 Abrir una nueva terminal y navegar al frontend
```bash
# Desde la raíz del proyecto
cd frontend
```

#### 3.2 Instalar dependencias
```bash
npm install
```

**Si encuentras errores**, intenta:
```bash
npm install --legacy-peer-deps
```

#### 3.3 Configurar variables de entorno

El archivo `.env` ya existe. Verifica que contenga:

```env
# API URL - Apunta al backend local
VITE_API_URL=http://localhost:3001
```

#### 3.4 Iniciar el servidor de desarrollo
```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

---

## 🎯 Acceso a la Aplicación

1. Abre tu navegador en **http://localhost:5173**
2. Usa las credenciales por defecto:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`

> **Recomendación:** Cambia estas credenciales desde el módulo de Configuración después del primer inicio de sesión.

---

## 🔧 Solución de Problemas Comunes

### Error: "Cannot find module..."
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3001 already in use"
El puerto ya está en uso. Opciones:
1. Detén el proceso que usa el puerto
2. Cambia el puerto en `backend/.env`:
   ```env
   PORT=3002
   ```
   Y actualiza `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3002
   ```

### Error: "CORS policy"
Verifica que el backend esté corriendo en el puerto correcto y que `VITE_API_URL` apunte a él.

### Frontend no se conecta al Backend
1. Verifica que el backend esté corriendo (`http://localhost:3001`)
2. Revisa que `frontend/.env` tenga la URL correcta
3. Reinicia el frontend después de cambiar `.env`

### Error de base de datos / Supabase
1. Verifica tu conexión a internet
2. Confirma que las credenciales de Supabase en `backend/.env` sean correctas
3. Si quieres probar sin base de datos, cambia en `backend/.env`:
   ```env
   DB_SIMULATION=true
   ```

---

## 📦 Dependencias Principales

### Backend
```json
{
  "@supabase/supabase-js": "^2.94.0",  // Cliente de Supabase
  "express": "^5.2.1",                  // Framework web
  "cors": "^2.8.6",                     // Manejo de CORS
  "dotenv": "^17.2.3",                  // Variables de entorno
  "axios": "^1.13.4"                    // Cliente HTTP
}
```

### Frontend
```json
{
  "react": "^19.2.0",                   // Framework UI
  "react-router-dom": "^7.13.0",        // Enrutamiento
  "axios": "^1.13.4",                   // Cliente HTTP
  "lucide-react": "^0.563.0",           // Iconos
  "jspdf": "^4.1.0",                    // Generación PDF
  "xlsx": "^0.18.5"                     // Exportación Excel
}
```

---

## �️ Base de Datos

### Supabase (Producción)

El proyecto usa **Supabase** como base de datos en la nube (PostgreSQL). La configuración ya está lista en el `.env` del backend.

**Características:**
- Base de datos PostgreSQL alojada en la nube
- Disponible 24/7
- Sin necesidad de configuración local
- Acceso desde cualquier ubicación

### Modo Simulación (Desarrollo sin Internet)

Si necesitas trabajar sin conexión a internet, puedes usar el modo simulación:

1. Edita `backend/.env`:
   ```env
   DB_SIMULATION=true
   ```

2. Reinicia el backend

En este modo, se usarán datos de prueba almacenados en memoria (no persistentes).

---

## 📝 Scripts Disponibles

### Backend
```bash
npm start        # Iniciar servidor producción
npm run dev      # Iniciar con nodemon (auto-reload)
```

### Frontend
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

---

## 🌐 Despliegue en Producción

El proyecto está configurado para desplegarse en:

- **Frontend:** Netlify
- **Backend:** Vercel

Archivos de configuración incluidos:
- `netlify.toml` - Configuración de Netlify
- `vercel.json` - Configuración de Vercel (backend)

Para producción, actualiza:
- `frontend/.env.production` con la URL del backend en Vercel
- Variables de entorno en Netlify y Vercel con las credenciales de Supabase

---

## � Seguridad

- Cambia las credenciales por defecto después del primer inicio
- Configura un PIN de seguridad desde el módulo de Configuración
- El PIN se requiere para operaciones sensibles como:
  - Eliminar productos
  - Exportar base de datos
  - Cambiar credenciales
  - Restablecer sistema

---

## 📚 Documentación Adicional

Para una guía completa de uso del sistema, consulta el **Manual de Usuario** incluido en el proyecto.

---

## 🤝 Contribuciones

Si encuentras algún error o tienes sugerencias, por favor abre un issue en el repositorio.

---

## 📄 Licencia

ISC

---

## 👨‍💻 Autor

Desarrollado como sistema integral de gestión para tiendas de abarrotes.

**Versión:** 1.0.0  
**Última actualización:** 2026-02-04
