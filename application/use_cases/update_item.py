import os
from typing import Dict, Any

from domain.ports.sharepoint_writer import SharePointWriter
from application.use_cases.get_filtered_items import GetFilteredItemsUseCase


# Campos editables desde el dashboard y, para los de tipo "choice", sus valores válidos.
# (Confirmados contra Graph /lists/{id}/columns). "Observaciones" es texto libre.
CHOICE_VALIDOS = {
    "eBajaRealizada": {
        "Baja Procesada",
        "Baja Observada",
        "Baja Desestimada",
        "Baja Realizada por Otro Canal",
    },
    "eDeudaPendiente": {"Con Deuda", "Sin Deuda"},
}
CAMPOS_PERMITIDOS = set(CHOICE_VALIDOS) | {"Observaciones"}


class ValidacionError(Exception):
    """Campos o valores no permitidos para la edición."""
    pass


class UpdateItemUseCase:
    def __init__(self, writer: SharePointWriter):
        self.writer = writer

    def execute(self, item_id: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        if not fields:
            raise ValidacionError("No se enviaron campos para actualizar.")

        # 1. Whitelist: rechazar cualquier campo fuera de los permitidos
        no_permitidos = set(fields) - CAMPOS_PERMITIDOS
        if no_permitidos:
            raise ValidacionError(
                f"Campos no permitidos: {', '.join(sorted(no_permitidos))}. "
                f"Solo se pueden editar: {', '.join(sorted(CAMPOS_PERMITIDOS))}."
            )

        # 2. Validar valores de los campos tipo choice (los vacíos limpian el campo)
        for campo, validos in CHOICE_VALIDOS.items():
            if campo in fields:
                valor = fields[campo]
                if valor not in (None, "") and valor not in validos:
                    raise ValidacionError(
                        f"Valor inválido para {campo}: '{valor}'. "
                        f"Valores válidos: {', '.join(sorted(validos))}."
                    )

        # 3. Resolver la lista (solo Lista 1 / gestion_baja es editable)
        list_id = os.getenv("SP_LIST_ID")
        if not list_id:
            raise ValidacionError("SP_LIST_ID no está configurado.")

        # 4. Escribir en SharePoint
        resultado = self.writer.update_item_fields(list_id, item_id, fields)

        # 5. Invalidar el caché de lectura para que el dashboard refleje el cambio
        GetFilteredItemsUseCase._cache.clear()
        print("🧹 Caché de lectura invalidado tras la edición.")

        return resultado
