# ☑️ SharePoint Reporting Dashboard

## 🎯 Resumen

Proyecto para consultar **y gestionar** listas de SharePoint: clasifica registros como
pendientes/procesados/mal cargados y los expone en un dashboard con autenticación. Permite
**editar** el resultado de cada gestión (write-back vía Microsoft Graph), **diagnosticar** una
línea por ID o número, hacer **carga masiva** desde Excel y generar reportes Excel de resumen.

| Elemento | Valor |
|---|---|
| Propósito | Monitoreo y gestión de registros SharePoint |
| Backend | Python + FastAPI |
| Frontend | React + Vite |
| Integración externa | Microsoft Graph |
| Seguridad | JWT + CORS |

## ✅ Qué Resuelve

- Lectura de listas de SharePoint con filtros optimizados.
- Clasificación por reglas de negocio en dominio (pendiente / procesado / mal cargada).
- Exposición de API autenticada.
- Visualización con filtros, búsqueda, orden y paginación.
- **Edición** de gestiones (Baja Realizada, Deuda, Observaciones) escrita en SharePoint.
- **Diagnóstico** de una línea por ID o número de línea.
- **Carga masiva** desde Excel/CSV con previsualización y reporte de no reconocidas.
- Exportación de resumen operativo en Excel.

## 🧱 Arquitectura

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Dominio | `domain/` | Entidades y reglas de negocio |
| Aplicación | `application/` | Casos de uso y orquestación |
| Infraestructura | `infrastructure/` | Graph API, auth y reportes |
| Presentación | `presentation/` | API REST y entrypoints |
| UI | `dashboard-viewer/` | Dashboard React |
| Soporte | `scripts/` | Inspección de listas/campos |

### 🔄 Flujo General

1. Usuario inicia sesión en el dashboard.
2. Backend valida credenciales y emite JWT.
3. Frontend consulta endpoint protegido.
4. Caso de uso consulta SharePoint por Graph.
5. Dominio clasifica pendiente/procesado.
6. UI renderiza y opcionalmente se genera reporte.

## 📦 Módulos Clave

| Módulo | Rol |
|---|---|
| `domain/entities/sharepoint_item.py` | Reglas `es_pendiente`, `es_procesado`, `es_mal_cargada`, `diagnostico`, normalización de campos |
| `application/use_cases/get_filtered_items.py` | Filtros, caché, estrategia OData y smart fetch |
| `application/use_cases/update_item.py` | Edición de campos (whitelist + validación de choices) |
| `application/use_cases/diagnosticar_linea.py` | Búsqueda por ID o línea y diagnóstico |
| `application/use_cases/carga_masiva.py` | Parseo de Excel, mapeo de estados y aplicación en lote |
| `application/use_cases/generate_report.py` | Consolidación y separación para reporte |
| `infrastructure/auth/graph_auth.py` | Obtención de token Microsoft Graph |
| `infrastructure/sharepoint/graph_sharepoint_reader.py` | Lectura paginada de listas SharePoint |
| `infrastructure/sharepoint/graph_sharepoint_writer.py` | Escritura (PATCH) de campos en SharePoint |
| `infrastructure/reports/excel_report_writer.py` | Generación `reporte_sharepoint_summary.xlsx` |
| `presentation/api.py` | Endpoints REST y seguridad |
| `presentation/main.py` | Ejecución por consola |

## 🔐 Seguridad y Acceso

| Tema | Implementación |
|---|---|
| Login | `POST /login` con `DASHBOARD_USER` y `DASHBOARD_PASSWORD` |
| Sesión | JWT firmado con `JWT_SECRET_KEY` |
| Tiempo de token | 24 horas |
| Protección de rutas | Dependencia `get_current_user` |
| CORS | `ALLOWED_ORIGINS` |
| Escritura en SharePoint | Requiere permiso de app `Sites.ReadWrite.All` (consentimiento admin) |

## 🛠️ Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/login` | Autenticación y entrega de token |
| GET | `/items` | Consulta registros con filtros |
| PATCH | `/items/{id}` | Edita campos de una línea (Lista 1) |
| GET | `/diagnostico` | Diagnóstico de una línea por ID o número (`?q=`) |
| POST | `/carga-masiva/preview` | Previsualiza el Excel/CSV subido |
| POST | `/carga-masiva/aplicar` | Aplica los cambios en lote |
| GET | `/health` | Estado de servicio |

## ⚙️ Variables de Entorno

| Variable | Uso |
|---|---|
| `TENANT_ID` | Tenant Azure AD |
| `CLIENT_ID` | App registrada |
| `CLIENT_SECRET` | Secreto de la app |
| `GRAPH_SCOPE` | Scope de Graph |
| `SP_SITE_ID` | Sitio SharePoint |
| `SP_LIST_ID` | Lista principal |
| `SP_LIST_ID_2` | Segunda lista |
| `DASHBOARD_USER` | Usuario login |
| `DASHBOARD_PASSWORD` | Password login |
| `JWT_SECRET_KEY` | Firma JWT |
| `ALLOWED_ORIGINS` | CORS frontend |

## 📚 Dependencias

### Backend Python

| Paquete |
|---|
| `fastapi` |
| `uvicorn` |
| `requests` |
| `python-dotenv` |
| `pandas` |
| `openpyxl` |
| `msal` |
| `python-jose[cryptography]` |
| `passlib[bcrypt]` |
| `python-multipart` |

### Frontend

| Paquete |
|---|
| `react` |
| `react-dom` |
| `framer-motion` |
| `lucide-react` |
| `clsx` |
| `tailwind-merge` |
| `vite` |
| `@vitejs/plugin-react` |

## 🧠 Reglas de Negocio Importantes

- Lista 1 (Pendiente): `eServicio` ∈ {Móvil, Móvil B2B}, `eRetencionEfectiva`=NO,
  `eTipoGestion`="Se deriva para Baja", `eBajaRealizada` vacío, `eFormularioPendiente`=
  "Formulario Regularizado", `eDeudaPendiente`="Sin Deuda", `eRegularizadoCompleto`=
  "Se deriva para RPA", y `nLineaCodigoHogar` numérico.
- Lista 1 (Mal cargada): candidata a baja a la que le falta uno de los 3 campos del flujo.
- Lista 2: títulos numéricos con baja vacía (solo lectura por ahora).
- Línea / teléfono: se toma de `nLineaCodigoHogar` (Lista 1); `Title` como respaldo (Lista 2).
- Estado baja: se deriva de `eBajaRealizada` / `BajaRealizada` u homólogos.
- Carga masiva: mapea el "Estado" del Excel a Procesada / Observada / Con Deuda / Desestimada
  (Port Out); estados desconocidos se reportan como "no reconocidos". Ver `docs/GUIA_ESTADOS.md`.
- Cache en memoria para reducir llamadas repetidas a Graph (se invalida al escribir).

## 🧰 Operación y Mantenimiento

| Tarea | Acción recomendada |
|---|---|
| Cambio de campos SharePoint | Revisar `domain/entities/sharepoint_item.py` |
| Cambio de listas | Ajustar `.env` y validar con scripts |
| Cambio de JSON API | Probar frontend y contratos |
| Problemas de performance | Revisar filtros OData, límites y caché |
| Integración Notion | Usar MCP global de VS Code (User) |

## 🔎 Archivos de Referencia

- README.md
- docs/sharepoint_headers.md
- presentation/api.py


## 📝 Notas Finales

- Backend requiere conectividad Azure y permisos correctos en SharePoint. Para **escribir**
  (edición / carga masiva) la app necesita `Sites.ReadWrite.All` con consentimiento de admin.
- El diseño actual está orientado a listas grandes (optimización por filtros, orden y límites).
- El dashboard permite **consulta y edición** de datos (edición individual y carga masiva en Lista 1).
