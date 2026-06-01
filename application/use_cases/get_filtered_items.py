from typing import List, Optional
from domain.entities.sharepoint_item import SharePointItem
from domain.ports.sharepoint_reader import SharePointReader
import os

import time

class GetFilteredItemsUseCase:
    # Cache simple en memoria: {(params_tuple): (timestamp, data)}
    _cache = {}
    CACHE_TTL = 300  # 5 minutos

    def __init__(self, reader: SharePointReader):
        self.reader = reader

    def execute(
        self, 
        status: Optional[str] = None, 
        from_date: Optional[str] = None, 
        to_date: Optional[str] = None,
        limit: int = 1000,
        force_refresh: bool = False
    ) -> List[SharePointItem]:
        # Clave del caché única por parámetros
        cache_key = (status, from_date, to_date, limit)
        now = time.time()

        # 1. Intentar servir del caché
        if not force_refresh:
            if cache_key in self._cache:
                timestamp, cached_data = self._cache[cache_key]
                if now - timestamp < self.CACHE_TTL:
                    print(f"🚀 Sirviendo {len(cached_data)} items desde caché (Edad: {int(now - timestamp)}s)")
                    return cached_data
                else:
                    print("⌛ Caché expirado. Recargando...")
            else:
                print("🆕 Sin caché previo. Consultando SharePoint...")
        else:
            print("🔄 Forzando recarga de datos...")

        list1_id = os.getenv("SP_LIST_ID")
        list2_id = os.getenv("SP_LIST_ID_2")
        
        all_items = []
        
        # OData Selects
        list1_select = (
            "Title,eServicio,eRetencionEfectiva,eTipoGestion,eFormularioPendiente,"
            "eDeudaPendiente,eRegularizadoCompleto,eBajaRealizada,eTipoBaja,eEstado,Created,Modified,"
            "nLineaCodigoHogar,Observaciones"
        )
        list2_select = "Title,BajaRealizada,TipodeBaja,Created,Modified"

        # Filtro de fecha para OData (Solo To Date)
        # OPTIMIZACIÓN: NO enviamos from_date al servidor. 
        # Como pedimos orden descendente (Newest First), es más rápido bajar todo y cortar 
        # con min_date_threshold que pedirle a SharePoint que filtre (scan) por rango.
        date_filter = ""
        # if from_date: NO AGREGAR AL SERVER FILTER. Usar min_date_threshold.
        if to_date and to_date.strip():
            date_filter += f" and fields/Created le '{to_date}T23:59:59Z'"

        # Calcular umbral de fecha para "Smart Fetch"
        # Si el usuario pide desde "2023-01-01", podemos parar de buscar cuando veamos algo de "2022-12-31"
        min_date_threshold = None
        if from_date and from_date.strip():
            # El reader compara lexicográficamente. 2023-01-01 < 2023-01-02.
            # Convertimos "YYYY-MM-DD" a "YYYY-MM-DDT00:00:00Z" para comparar con Created
            min_date_threshold = f"{from_date}T00:00:00Z"
            print(f"📉 Smart Fetch activado: Parar si Created < {min_date_threshold}")

        # --- Lista 1: Gestión ---
        if list1_id:
            items = []
            try:
                # Intento 1: Servicio + Fechas (Lo más rápido)
                f1_parts = ["(fields/eServicio eq 'Móvil' or fields/eServicio eq 'Móvil B2B')"]
                q1 = " and ".join(f1_parts) + date_filter
                print(f"🔍 [L1] Intentando OData (T1): {q1}")
                items = self.reader.get_items(list1_id, "gestion_baja", filter_query=q1, select_query=list1_select, max_items=limit, orderby_query="fields/Created desc", min_date_threshold=min_date_threshold)
            except Exception as e:
                print(f"⚠️ Error en T1 L1: {e}. Intentando T2 (solo fechas)...")
                try:
                    # Intento 2: Solo fechas (Created suele estar indexado por defecto)
                    q2 = date_filter.lstrip(" and ")
                    if q2:
                        items = self.reader.get_items(list1_id, "gestion_baja", filter_query=q2, select_query=list1_select, max_items=limit, orderby_query="fields/Created desc", min_date_threshold=min_date_threshold)
                    else:
                        raise e # No hay fechas, fallar al siguiente nivel
                except Exception as e2:
                    print(f"⚠️ Error en T2 L1: {e2}. T3: Sin filtros (Limitado)...")
                    # Fallback final: bajamos sin filtros pero con un tope para no romper el servidor
                    items = self.reader.get_items(list1_id, "gestion_baja", select_query=list1_select, max_items=limit, orderby_query="fields/Created desc", min_date_threshold=min_date_threshold)
            
            # Filtrado fino en memoria (siempre se aplica para seguridad)
            if status == "pendiente":
                all_items.extend([i for i in items if i.es_pendiente()])
            elif status in ("procesado", "procesados"):
                all_items.extend([i for i in items if i.es_procesado()])
            else:
                all_items.extend(items)

        # --- Lista 2: Hogar ---
        if list2_id:
            items = []
            try:
                q_hogar = "fields/Title ne null" + date_filter
                print(f"🔍 [L2] Intentando OData: {q_hogar}")
                items = self.reader.get_items(list2_id, "migracion_post_pre", filter_query=q_hogar, select_query=list2_select, max_items=limit, orderby_query="fields/Created desc", min_date_threshold=min_date_threshold)
            except Exception:
                print("⚠️ Falló OData L2. Consultando sin filtros...")
                items = self.reader.get_items(list2_id, "migracion_post_pre", select_query=list2_select, max_items=limit, orderby_query="fields/Created desc", min_date_threshold=min_date_threshold)

            if status == "pendiente":
                all_items.extend([i for i in items if i.es_pendiente()])
            elif status in ("procesado", "procesados"):
                all_items.extend([i for i in items if i.es_procesado()])
            else:
                all_items.extend(items)

        
        # Guardar en caché antes de retornar
        self._cache[cache_key] = (now, all_items)
        print(f"💾 Guardado en caché ({len(all_items)} items). Expira en {self.CACHE_TTL}s")

        return all_items
