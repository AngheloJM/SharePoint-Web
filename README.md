# SharePoint Reporting Dashboard

Dashboard web para **visualizar y gestionar** las líneas de baja/migración registradas en
SharePoint (vía Microsoft Graph). Permite consultar pendientes/procesados, **editar** el resultado
de cada gestión, **diagnosticar** una línea por ID o número, y hacer **carga masiva** desde Excel.

## 📁 Estructura del proyecto (arquitectura hexagonal)

- **domain/**: entidades y reglas de negocio del núcleo (`SharePointItem`, puertos).
- **application/**: casos de uso (filtrar, actualizar, diagnosticar, carga masiva).
- **infrastructure/**: implementaciones técnicas (Microsoft Graph: lectura/escritura, auth).
- **presentation/**: API REST (FastAPI).
- **dashboard-viewer/**: frontend (React + Vite).
- **scripts/**: utilidades para inspeccionar listas y esquemas de SharePoint.
- **tests/**: pruebas unitarias (pytest) de las reglas de negocio.

## ✨ Funcionalidades

- **Consulta** de líneas por estado (Pendientes / Procesados) y rango de fechas, con filtro local
  por Lista 1 / Lista 2 y búsqueda por ID, línea o título.
- **Edición** (write-back a SharePoint) de Baja Realizada, Deuda Pendiente y Observaciones — solo
  Lista 1.
- **Diagnóstico** de una línea por ID o número: muestra su estado y, si está "mal cargada", los
  campos del flujo que no cumplen.
- **Carga masiva** desde Excel/CSV: marca muchas líneas a la vez con previsualización, exportación
  de las no reconocidas a CSV y reporte de resultados. Ver la tabla de reglas más abajo.
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

## 📋 Reglas de clasificación de "Estado" en carga masiva

Al subir un Excel/CSV en **Cargar Excel**, el sistema lee la columna **Estado** de cada fila y
decide qué escribir en SharePoint (ver `application/use_cases/carga_masiva.py::clasificar_estado`).
La comparación no distingue mayúsculas/minúsculas ni espacios extra. **El orden importa**: si un
estado encaja en varias reglas, gana la de más arriba (por eso `OBSERVADO COMO DEUDA PENDIENTE` se
trata como Deuda, no como Observada simple).

| Estado en el Excel | Qué escribe en SharePoint | Categoría |
|---|---|---|
| `PROCESADO` o `PROCESA` | `eBajaRealizada = Baja Procesada` | Procesada |
| Contiene `DEUDA`, `NO PAG` o `FACTURA` | `eBajaRealizada = Baja Observada` + `eDeudaPendiente = Con Deuda` + Observaciones | Observada + Deuda |
| Contiene `PORT OUT`, `PORTOUT`, `EN PO`, o es `PO` | `eBajaRealizada = Baja Desestimada` + Observaciones | Desestimada |
| Empieza con `OBSERVAD` | `eBajaRealizada = Baja Observada` + Observaciones | Observada |
| `PENDIENTE PROCESAR` o vacío | No se escribe nada | Ignorada |
| Cualquier otro texto | No se escribe nada; se reporta y puede descargarse en CSV | No reconocido |

La identificación de la fila usa la columna **ID** (ID de SharePoint); la columna de línea/celular es
solo informativa en la previsualización. Nada se escribe hasta pulsar **Aplicar**.

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

> ⚠️ `JWT_SECRET_KEY`, `DASHBOARD_USER`, `DASHBOARD_PASSWORD` y `ALLOWED_ORIGINS` son **obligatorias**:
> la API falla al arrancar si faltan, en vez de usar valores por defecto inseguros. `ALLOWED_ORIGINS`
> tampoco acepta `*` (la API usa credenciales, incompatible con un origen comodín).

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

## ✅ Pruebas y calidad

**Backend**:

```bash
pip install -r requirements-dev.txt
ruff check .        # lint
pytest               # tests unitarios (tests/)
```

Los tests cubren las reglas de negocio más sensibles: la clasificación de "Estado" en carga masiva
(`tests/test_carga_masiva.py`) y las reglas de candidatura/pendiente/mal cargada de `SharePointItem`
(`tests/test_sharepoint_item.py`). Un cambio en esas reglas debe venir acompañado de un test.

**Frontend**: `cd dashboard-viewer && npm run build` valida que el bundle compile sin errores.

Ambos se ejecutan automáticamente en GitHub Actions en cada push/PR a `master`
(`.github/workflows/ci.yml`).

## 🛠️ Utilidades (`scripts/`)

- `list_available_lists.py`: lista todas las listas del sitio de SharePoint.
- `inspect_list_schema.py`: muestra los campos internos y ejemplos de datos de las listas.

Se ejecutan con la raíz del proyecto en el `PYTHONPATH`, p. ej.:
`PYTHONPATH=. python scripts/inspect_list_schema.py`.

---

_Desarrollo por Shoshan-anjo_
