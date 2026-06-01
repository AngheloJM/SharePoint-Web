from typing import List
from domain.entities.sharepoint_item import SharePointItem
from domain.ports.sharepoint_reader import SharePointReader
import os

class GetPendingItemsUseCase:
    def __init__(self, reader: SharePointReader):
        self.reader = reader

    def execute(self) -> List[SharePointItem]:
        list1_id = os.getenv("SP_LIST_ID")
        list2_id = os.getenv("SP_LIST_ID_2")
        
        all_items = []
        
        # Optimizados OData Filters
        list1_filter = (
            "fields/eServicio eq 'Móvil' or fields/eServicio eq 'Móvil B2B'"
        )
        list1_select = (
            "Title,eServicio,eRetencionEfectiva,eTipoGestion,eFormularioPendiente,"
            "eDeudaPendiente,eRegularizadoCompleto,eBajaRealizada,Created,nLineaCodigoHogar"
        )

        list2_filter = "fields/Title ne null"
        list2_select = "Title,BajaRealizada,Created"

        if list1_id:
            try:
                # Solo traemos los que potencialmente son pendientes
                items = self.reader.get_items(list1_id, "gestion_baja", filter_query=list1_filter, select_query=list1_select)
                all_items.extend([i for i in items if i.es_pendiente()])
            except Exception as e:
                print(f"Error fetching List 1: {e}")

        if list2_id:
            try:
                items = self.reader.get_items(list2_id, "formulario_baja_hogar", filter_query=list2_filter, select_query=list2_select)
                all_items.extend([i for i in items if i.es_pendiente()])
            except Exception as e:
                print(f"Error fetching List 2: {e}")

        return all_items
