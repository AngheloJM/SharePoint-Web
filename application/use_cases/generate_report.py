import os
from domain.ports.sharepoint_reader import SharePointReader
from domain.ports.report_writer import ReportWriter

class GenerateReportUseCase:

    def __init__(
        self,
        reader: SharePointReader,
        writer: ReportWriter,
    ):
        self.reader = reader
        self.writer = writer

    def execute(self) -> None:
        print("🚀 Iniciando proceso de generación de reporte OPTIMIZADO...")
        
        list1_id = os.getenv("SP_LIST_ID")
        list2_id = os.getenv("SP_LIST_ID_2")
        
        all_items = []
        
        # --- Configuración de Optimización para Lista 1 ---
        # Solo traemos campos necesarios
        list1_select = (
            "Title,eServicio,eRetencionEfectiva,eTipoGestion,eFormularioPendiente,"
            "eDeudaPendiente,eRegularizadoCompleto,eBajaRealizada,Created,Modified,dFechaFormRegularizado,"
            "nLineaCodigoHogar"
        )
        # Filtro: Solo items que sean móviles o que ya tengan algún estado de baja
        # (Para no traer los ~80k registros irrelevantes)
        # Nota: Usamos OR para capturar tanto potenciales pendientes como ya procesados.
        list1_filter = (
            "fields/eServicio eq 'Móvil' or fields/eServicio eq 'Móvil B2B' or "
            "(fields/eBajaRealizada ne null and fields/eBajaRealizada ne '')"
        )

        # --- Configuración de Optimización para Lista 2 ---
        list2_select = "Title,BajaRealizada,Created,Modified"
        # Para lista 2, el usuario dijo que los pendientes tienen Title numérico y BajaRealizada vacía.
        # Los procesados tienen BajaRealizada con algo.
        # Filtramos para ignorar aquellos que no tengan ni Title ni BajaRealizada (si los hay).
        list2_filter = "fields/Title ne null"

        # Procesar Lista 1
        if list1_id:
            try:
                all_items.extend(self.reader.get_items(
                    list1_id, 
                    "gestion_baja", 
                    filter_query=list1_filter, 
                    select_query=list1_select
                ))
            except Exception as e:
                print(f"⚠️ Error optimizado en Lista 1, reintentando sin filtro: {e}")
                all_items.extend(self.reader.get_items(list1_id, "gestion_baja"))
        
        # Procesar Lista 2
        if list2_id:
            try:
                all_items.extend(self.reader.get_items(
                    list2_id, 
                    "formulario_baja_hogar",
                    filter_query=list2_filter,
                    select_query=list2_select
                ))
            except Exception as e:
                print(f"⚠️ Error optimizado en Lista 2, reintentando sin filtro: {e}")
                all_items.extend(self.reader.get_items(list2_id, "formulario_baja_hogar"))

        if not all_items:
            print("⚠️ No se encontraron items.")
            return

        print("🔍 Aplicando filtros finales en memoria...")
        pendientes = [i for i in all_items if i.es_pendiente()]
        procesados = [i for i in all_items if i.es_procesado()]

        print(f"📊 Resumen Optimizado: {len(all_items)} traídos, {len(pendientes)} pendientes, {len(procesados)} procesados.")

        print("💾 Guardando reporte Excel...")
        self.writer.write(
            all_items=all_items,
            pendientes=pendientes,
            procesados=procesados,
        )
        print("✨ Proceso OPTIMIZADO finalizado.")
