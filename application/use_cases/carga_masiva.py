import io
import pandas as pd
from typing import Optional, List, Dict, Any

from domain.ports.sharepoint_writer import SharePointWriter
from application.use_cases.update_item import UpdateItemUseCase


# Estados que NO generan ninguna escritura (la línea sigue pendiente / sin dato)
ESTADOS_IGNORADOS = {"", "PENDIENTE PROCESAR"}
# Estados que se consideran "baja procesada"
ESTADOS_PROCESADO = {"PROCESADO", "PROCESA"}
# Palabras clave que indican que la línea tiene deuda
PALABRAS_DEUDA = ("DEUDA", "NO PAG", "FACTURA")
# Estados reconocidos como "Baja Observada" sin deuda
ESTADOS_OBSERVA = {"LINEA EN PO"}


def clasificar_estado(estado: str):
    """Clasifica el 'Estado' del Excel. Devuelve (categoria, fields) donde
    categoria ∈ {procesar, observar, deuda, ignorada, no_reconocido}."""
    e = (estado or "").strip()
    eu = e.upper()
    if eu in ESTADOS_IGNORADOS:
        return ("ignorada", {})
    if eu in ESTADOS_PROCESADO:
        return ("procesar", {"eBajaRealizada": "Baja Procesada"})
    # Deuda primero (cubre "OBSERVADO COMO DEUDA PENDIENTE")
    if any(k in eu for k in PALABRAS_DEUDA):
        return ("deuda", {"eBajaRealizada": "Baja Observada", "Observaciones": e, "eDeudaPendiente": "Con Deuda"})
    if eu in ESTADOS_OBSERVA or eu.startswith("OBSERVAD"):
        return ("observar", {"eBajaRealizada": "Baja Observada", "Observaciones": e})
    # Estado fuera de la lista reconocida
    return ("no_reconocido", {})


def mapear_estado(estado: str) -> Optional[Dict[str, Any]]:
    """Compatibilidad: devuelve los campos a escribir, o None si no se escribe."""
    categoria, fields = clasificar_estado(estado)
    return fields if categoria in ("procesar", "observar", "deuda") else None


def _norm(s: Any) -> str:
    return str(s).strip().lower()


def _buscar_columna(columnas: List[str], candidatos: List[str]) -> Optional[str]:
    norm = {_norm(c): c for c in columnas}
    for cand in candidatos:
        if cand in norm:
            return norm[cand]
    return None


def parsear_excel(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Lee el Excel/CSV y devuelve el preview de lo que se escribiría."""
    nombre = (filename or "").lower()
    buffer = io.BytesIO(file_bytes)
    if nombre.endswith(".csv"):
        df = pd.read_csv(buffer, dtype=str)
    else:
        df = pd.read_excel(buffer, dtype=str)

    columnas = list(df.columns)
    col_id = _buscar_columna(columnas, ["id.1", "id", "id sharepoint"])
    col_estado = _buscar_columna(columnas, ["estado"])
    col_linea = _buscar_columna(columnas, ["linea / codigo hogar", "linea", "nlineacodigohogar", "linea/codigo hogar"])

    if not col_id or not col_estado:
        faltan = []
        if not col_id:
            faltan.append("ID")
        if not col_estado:
            faltan.append("Estado")
        return {
            "rows": [],
            "resumen": {"procesar": 0, "observar": 0, "ignoradas": 0, "total": 0},
            "errores": [f"No se encontró la(s) columna(s): {', '.join(faltan)}."],
        }

    rows = []
    errores = []
    procesar = observar = ignoradas = no_reconocidas = 0

    for _, fila in df.iterrows():
        raw_id = fila.get(col_id)
        item_id = "" if pd.isna(raw_id) else str(raw_id).strip()
        # pandas a veces lee enteros como "133274.0"
        if item_id.endswith(".0"):
            item_id = item_id[:-2]
        if not item_id.isdigit():
            if item_id:
                errores.append(f"ID inválido: '{item_id}' (se omite)")
            continue

        estado_raw = fila.get(col_estado)
        estado = "" if pd.isna(estado_raw) else str(estado_raw).strip()
        linea_raw = fila.get(col_linea) if col_linea else None
        linea = "" if (linea_raw is None or pd.isna(linea_raw)) else str(linea_raw).strip()
        if linea.endswith(".0"):
            linea = linea[:-2]

        categoria, fields = clasificar_estado(estado)
        if categoria == "procesar":
            procesar += 1
            accion = "Baja Procesada"
        elif categoria == "deuda":
            observar += 1
            accion = "Baja Observada + Con Deuda"
        elif categoria == "observar":
            observar += 1
            accion = "Baja Observada"
        elif categoria == "ignorada":
            ignoradas += 1
            accion = "Sin acción (ignorada)"
        else:  # no_reconocido
            no_reconocidas += 1
            accion = "No reconocido"

        rows.append({
            "id": item_id,
            "linea": linea,
            "estado": estado,
            "accion": accion,
            "fields": fields,
            "categoria": categoria,
        })

    return {
        "rows": rows,
        "resumen": {
            "procesar": procesar,
            "observar": observar,
            "ignoradas": ignoradas,
            "no_reconocidas": no_reconocidas,
            "total": len(rows),
        },
        "errores": errores,
    }


class CargaMasivaUseCase:
    def __init__(self, writer: SharePointWriter):
        self.update_uc = UpdateItemUseCase(writer)

    def aplicar(self, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aplica los cambios fila por fila. Una fila que falla no detiene al resto."""
        detalles = []
        ok = 0
        fallidos = 0
        for row in rows:
            item_id = str(row.get("id", "")).strip()
            fields = row.get("fields") or {}
            if not item_id or not fields:
                continue
            try:
                self.update_uc.execute(item_id=item_id, fields=fields)
                ok += 1
                detalles.append({"id": item_id, "ok": True})
            except Exception as e:
                fallidos += 1
                detalles.append({"id": item_id, "ok": False, "error": str(e)})

        return {"ok": ok, "fallidos": fallidos, "detalles": detalles}
