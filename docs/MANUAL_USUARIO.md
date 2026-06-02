# Manual de Usuario — Visor de Gestiones

Esta guía explica, paso a paso y en lenguaje simple, cómo usar el dashboard. No necesitas
conocimientos técnicos.

---

## 1. Ingresar al sistema

1. Abre el enlace del dashboard en tu navegador (Chrome, Edge o el de tu celular).
2. Escribe tu **usuario** y **contraseña** y pulsa **"Acceder al Dashboard"**.

> Si ves "Usuario o contraseña incorrectos", revisa que no haya espacios de más. Si el problema
> sigue, pide tus credenciales al responsable del sistema.

---

## 2. Conocer la pantalla principal

Arriba a la derecha tienes los botones:

- **Cargar Excel** 📤 — para marcar muchas líneas a la vez (ver punto 6).
- **Diagnóstico** 🔎 — para revisar una línea puntual (ver punto 5).
- **☀️/🌙** — cambia entre tema claro y oscuro. El sistema recuerda tu elección.
- **Botón rojo de salir** ⎋ — cierra tu sesión.

---

## 3. Consultar líneas

1. Elige el **Estado de Gestión**: **Pendientes** o **Procesados**.
2. (Opcional) Elige un rango de **fechas** (Desde / Hasta).
3. Pulsa **Consultar**.
4. Verás una tabla con las líneas: ID, origen (Lista 1 o 2), fecha, tipo de baja y estado.

Ayudas dentro de los resultados:

- **Buscar por ID, línea o título**: escribe en la cajita de búsqueda para filtrar al instante.
- **Todas / Lista 1 / Lista 2**: muestra solo el origen que te interese.
- **Recargar**: vuelve a traer datos frescos de SharePoint (ignora lo guardado en memoria).

---

## 4. Editar una línea (marcar resultado)

> Solo las líneas de **Lista 1** se pueden editar (tienen el ícono de lápiz ✏️).

1. En la fila que quieras, pulsa el **lápiz** ✏️.
2. Se abre una ventana donde puedes cambiar:
   - **Baja Realizada**: el resultado (p. ej. *Baja Procesada*, *Baja Observada*).
   - **Deuda Pendiente**: *Sin Deuda* o *Con Deuda*.
   - **Observaciones**: texto libre (motivo, detalle, etc.).
3. Pulsa **Guardar**. El cambio se escribe en SharePoint y la tabla se actualiza sola.

---

## 5. Diagnosticar una línea

Sirve para saber el estado de una línea y, si está mal cargada, **qué le falta**.

1. Pulsa **Diagnóstico** 🔎 en la parte superior.
2. Escribe el **ID** de SharePoint o el **número de línea** y pulsa buscar.
3. Verás el estado (Pendiente / Procesado / **Mal cargada**) y, si está mal cargada, la lista de
   campos que no cumplen (qué se esperaba y qué tiene actualmente).

---

## 6. Carga masiva desde Excel

Sirve para marcar **muchas líneas de una sola vez** a partir de un archivo.

1. Prepara tu archivo a partir de la **plantilla** (`docs/plantilla_carga_masiva.xlsx`). Debe tener
   al menos las columnas **ID** y **Estado**.
2. Pulsa **Cargar Excel** 📤 y selecciona el archivo (`.xlsx` o `.csv`).
3. Aparece una **previsualización**: una tabla con cada línea y la acción que se hará, más un
   resumen (cuántas a Procesada, Observada, Desestimada, ignoradas y **no reconocidas**).
4. Si hay líneas **no reconocidas** (estado que el sistema no entiende), verás una alerta y un
   botón **Descargar CSV** para revisarlas aparte. Esas líneas **no se escriben**.
5. Revisa la tabla y pulsa **Aplicar N cambios**. El sistema escribe en SharePoint y al terminar
   muestra cuántas se aplicaron y cuántas fallaron.

> Qué valor de "Estado" produce qué resultado está explicado en la
> **[Guía de Estados](GUIA_ESTADOS.md)**.

---

## Preguntas frecuentes

**No veo ningún resultado.** Revisa el estado (Pendientes/Procesados) y el rango de fechas; prueba
**Recargar**. En el celular, recarga la página por si quedó una versión vieja en memoria.

**Edité una línea pero sigo viéndola igual.** Pulsa **Recargar**: los datos se guardan unos minutos
en memoria para ir más rápido.

**Aparece "Sesión expirada".** Vuelve a iniciar sesión; por seguridad la sesión caduca tras un
tiempo.

**¿Qué es una línea "Mal cargada"?** Es una línea que debería procesarse pero le faltan datos del
flujo (Formulario / Deuda / "Se deriva para RPA"). Úsala con **Diagnóstico** para ver qué le falta.
