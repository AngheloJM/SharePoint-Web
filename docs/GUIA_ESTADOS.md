# Guía rápida de Estados (Carga masiva)

Cuando subes un Excel/CSV en **Cargar Excel**, el sistema lee la columna **Estado** de cada fila y
decide qué escribir en SharePoint. Esta es la referencia de qué valor produce qué resultado.

> La comparación **no distingue mayúsculas/minúsculas** ni espacios extra al inicio/final.

| Estado en el Excel | Qué escribe en SharePoint | Categoría |
|---|---|---|
| `PROCESADO` o `PROCESA` | Baja Realizada = **Baja Procesada** | 🟢 Procesada |
| Contiene `DEUDA`, `NO PAGO` o `FACTURA`<br>(ej. `NO PAGO FACTURA DE MAYO`, `DEUDA`, `OBSERVADO COMO DEUDA PENDIENTE`) | Baja Realizada = **Baja Observada** + **Deuda Pendiente = Con Deuda** + el texto en Observaciones | 🟡 Observada + Deuda |
| Contiene `PORT OUT`, `PORTOUT`, `EN PO` o es `PO`<br>(ej. `LINEA EN PO`, `LÍNEA REALIZÓ PORT OUT`) | Baja Realizada = **Baja Desestimada** + el texto en Observaciones | 🔵 Desestimada |
| Empieza con `OBSERVAD`<br>(ej. `OBSERVADA`, `OBSERVADO`) | Baja Realizada = **Baja Observada** + el texto en Observaciones | 🟡 Observada |
| `PENDIENTE PROCESAR` o vacío | **No se escribe nada** (la línea sigue pendiente) | ⚪ Ignorada |
| Cualquier otro texto | **No se escribe nada** — se reporta y se puede **descargar en CSV** para revisar | 🔴 No reconocido |

## Notas

- **Identificación de la línea**: el sistema usa la columna **ID** (el ID de SharePoint). La columna
  de la línea/celular es solo informativa en la previsualización.
- **Orden de prioridad**: si un estado encaja en varias reglas, gana la de arriba. Por eso
  `OBSERVADO COMO DEUDA PENDIENTE` se trata como **Deuda** (no como simple Observada).
- **No reconocidos**: si un estado no encaja en ninguna categoría conocida, **no se escribe** y
  aparece en la alerta con opción de descargar un CSV (ID, Línea, Estado) para corregirlo y volver
  a subirlo.
- **Previsualización siempre**: nada se escribe hasta que revisas la tabla y pulsas **Aplicar**.

## ¿Falta un estado?

Si tu equipo usa un estado que hoy cae en "No reconocido" y debería tener una acción (por ejemplo un
nuevo texto para deuda o para Port Out), avísale al responsable técnico para agregarlo a las reglas.
