import os
from typing import List
from domain.entities.sharepoint_item import SharePointItem
from domain.ports.sharepoint_reader import SharePointReader


class DiagnosticarUseCase:
    """Busca una línea de Lista 1 por ID o por número de línea (nLineaCodigoHogar)
    y devuelve su diagnóstico (estado y campos faltantes)."""

    def __init__(self, reader: SharePointReader):
        self.reader = reader

    def execute(self, q: str) -> List[SharePointItem]:
        q = (q or "").strip()
        # ID y línea son numéricos; evita inyección OData y búsquedas inválidas.
        if not q.isdigit():
            return []

        list_id = os.getenv("SP_LIST_ID")
        if not list_id:
            return []

        encontrados = {}

        # 1. Por ID exacto (el ID de SharePoint coincide con el id de Graph del item)
        try:
            it = self.reader.get_item_by_id(list_id, "gestion_baja", q)
            if it:
                encontrados[it.id] = it
        except Exception as e:
            print(f"⚠️ Diagnóstico por ID falló: {e}")

        # 2. Por número de línea (nLineaCodigoHogar es de tipo texto)
        try:
            items = self.reader.get_items(
                list_id,
                "gestion_baja",
                filter_query=f"fields/nLineaCodigoHogar eq '{q}'",
                max_items=50,
            )
            for it in items:
                encontrados[it.id] = it
        except Exception as e:
            print(f"⚠️ Diagnóstico por línea falló: {e}")

        return list(encontrados.values())
