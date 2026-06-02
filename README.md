# SharePoint Reporting Dashboard

Dashboard web para **visualizar y gestionar** las líneas de baja/migración registradas en
SharePoint (vía Microsoft Graph). Permite consultar pendientes/procesados, **editar** el resultado
de cada gestión, **diagnosticar** una línea por ID o número, y hacer **carga masiva** desde Excel.

> 📖 ¿Eres usuario final (sin conocimientos técnicos)? Ve directo al
> **[Manual de Usuario](docs/MANUAL_USUARIO.md)** y a la **[Guía de Estados](docs/GUIA_ESTADOS.md)**.

## 📁 Estructura del proyecto (arquitectura hexagonal)

- **domain/**: entidades y reglas de negocio del núcleo (`SharePointItem`, puertos).
- **application/**: casos de uso (filtrar, actualizar, diagnosticar, carga masiva).
- **infrastructure/**: implementaciones técnicas (Microsoft Graph: lectura/escritura, auth).
- **presentation/**: API REST (FastAPI).
- **dashboard-viewer/**: frontend (React + Vite).
- **scripts/**: utilidades para inspeccionar listas y esquemas de SharePoint.
- **docs/**: documentación de usuario, guía de estados y plantilla de carga masiva.

## ✨ Funcionalidades

- **Consulta** de líneas por estado (Pendientes / Procesados) y rango de fechas, con filtro local
  por Lista 1 / Lista 2 y búsqueda por ID, línea o título.
- **Edición** (write-back a SharePoint) de Baja Realizada, Deuda Pendiente y Observaciones — solo
  Lista 1.
- **Diagnóstico** de una línea por ID o número: muestra su estado y, si está "mal cargada", los
  campos del flujo que no cumplen.
- **Carga masiva** desde Excel/CSV: marca muchas líneas a la vez con previsualización, exportación
  de las no reconocidas a CSV y reporte de resultados. Ver **[Guía de Estados](docs/GUIA_ESTADOS.md)**.
- **Tema claro/oscuro** (sigue el sistema, recordado por navegador) y diseño responsive.

## 🔐 Autenticación

Login protegido por **JWT**. El usuario ingresa credenciales (definidas en variables de entorno),
el backend devuelve un token y el frontend lo envía en cada petición.

La conexión con SharePoint usa **Microsoft Graph** con `client_credentials` (app registrada en
Azure). Para **escribir** (edición / carga masiva) la app necesita el permiso de aplicación
**`Sites.ReadWrite.All`** con consentimiento de administrador.

## 🔍 Lógica de filtrado (Lista 1 = "Gestión Baja de Servicio Móvil u Hogar")

Una línea se considera **Pendiente** cuando cumple TODO:

- `eServicio` ∈ {`Móvil`, `Móvil B2B`}
- `eRetencionEfectiva` = `NO`
- `eTipoGestion` = `Se deriva para Baja`
- `eBajaRealizada` vacío (aún sin baja)
- `eFormularioPendiente` = `Formulario Regularizado`
- `eDeudaPendiente` = `Sin Deuda`
- `eRegularizadoCompleto` = `Se deriva para RPA`
- `nLineaCodigoHogar` presente y numérico (es "la línea" que se muestra)

Una línea **candidata** a la que le falta uno de los 3 últimos campos del flujo se clasifica como
**"Mal cargada"** (visible en Diagnóstico). Lista 2 ("Ejecución Migración PostPago a PrePago") es
de **solo lectura** por ahora.

## ⚙️ Variables de entorno (`.env`)

Copia `.env.example` a `.env` y completa:

| Variable | Descripción |
|---|---|
| `SP_SITE_ID` | ID del sitio de SharePoint |
| `SP_LIST_ID` | ID de la Lista 1 (Gestión) |
| `SP_LIST_ID_2` | ID de la Lista 2 (Migración) |
| `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET` | Credenciales de la app de Azure |
| `GRAPH_SCOPE` | `https://graph.microsoft.com/.default` |
| `JWT_SECRET_KEY` | Frase secreta para firmar los tokens de sesión |
| `DASHBOARD_USER`, `DASHBOARD_PASSWORD` | Credenciales del login del dashboard |
| `ALLOWED_ORIGINS` | URL(s) del frontend permitidas (CORS), separadas por coma |

## 💻 Correr en local

**Backend** (Python 3.11+):

```bash
pip install -r requirements.txt
uvicorn presentation.api:app --reload --port 8000
```

**Frontend** (Node 18+):

```bash
cd dashboard-viewer
npm install
npm run dev
```

El frontend usa `VITE_API_URL` para apuntar al backend (en local, configúralo a
`http://localhost:8000` o usa un proxy de Vite).

### Con Docker Compose

```bash
docker-compose up --build
```

Backend en el puerto 8000 y frontend en el 3000.

## 🌐 Despliegue en Render

- **Backend**: `Dockerfile.backend` de la raíz.
- **Frontend**: `Dockerfile` dentro de `dashboard-viewer` (Context Directory = `dashboard-viewer`).
- Configura todas las variables de entorno de arriba. En el frontend, `VITE_API_URL` debe apuntar
  a la URL pública del backend.

## 🛠️ Utilidades (`scripts/`)

- `list_available_lists.py`: lista todas las listas del sitio de SharePoint.
- `inspect_list_schema.py`: muestra los campos internos y ejemplos de datos de las listas.

Se ejecutan con la raíz del proyecto en el `PYTHONPATH`, p. ej.:
`PYTHONPATH=. python scripts/inspect_list_schema.py`.

---

_Desarrollo por Shoshan-anjo_
