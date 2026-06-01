from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime

@dataclass
class SharePointItem:
    id: str
    title: str
    raw_fields: Dict[str, Any] = field(default_factory=dict)
    source_list: str = "" # Identificador técnico (e.g., 'gestion_baja')

    @property
    def source_list_display(self) -> str:
        if self.source_list == "gestion_baja":
            return "Lista 1 (Gestión Baja de Servicio Móvil u Hogar)"
        elif self.source_list == "migracion_post_pre":
            return "Lista 2 (Ejecución Migración PostPago a PrePago)"
        return self.source_list

    @property
    def estado_baja(self) -> str:
        fields = self.raw_fields
        # Priorizar campos de ejecución
        val = fields.get("eBajaRealizada") or fields.get("BajaRealizada") or fields.get("Baja_x0020_Realizada")
        return str(val if val is not None else "").strip()

    @property
    def tipo_baja_display(self) -> str:
        fields = self.raw_fields
        val = fields.get("eTipoBaja") or fields.get("TipodeBaja") or fields.get("TipoBaja")
        if val == "Pre Pago R":
            return "Cambio de Post Pago a Pre Pago R"
        return str(val if val is not None else "N/A")

    @property
    def phone_number(self) -> str:
        fields = self.raw_fields
        # Lista 1 (Gestión Baja): la línea está en nLineaCodigoHogar (igual que script_lista1.py).
        # Lista 2 (Migración): el número suele estar en Title.
        val = fields.get("nLineaCodigoHogar") or fields.get("Title")

        if val is None:
            return "N/A"
            
        s_val = str(val).strip()
        if s_val.endswith(".0"):
            return s_val[:-2]
        return s_val

    @property
    def fecha_creacion(self) -> Optional[datetime]:
        created = self.raw_fields.get("Created")
        if created:
            try:
                # SharePoint ISO format: '2023-04-20T12:59:37Z'
                return datetime.fromisoformat(created.replace("Z", "+00:00"))
            except:
                return None
        return None

    @property
    def fecha_ejecucion(self) -> Optional[datetime]:
        # Usar dFechaFormRegularizado o Modified
        fecha = self.raw_fields.get("dFechaFormRegularizado") or self.raw_fields.get("Modified")
        if fecha:
            try:
                return datetime.fromisoformat(fecha.replace("Z", "+00:00"))
            except:
                return None
        return None

    def es_pendiente(self) -> bool:
        fields = self.raw_fields
        if self.source_list == "gestion_baja":
            # Réplica exacta de la lógica de filtrado de script_lista1.py.
            # La línea (nLineaCodigoHogar) debe existir y ser numérica.
            linea = fields.get("nLineaCodigoHogar")
            if not (linea is not None and str(linea).strip().isdigit()):
                return False

            return (
                fields.get("eServicio") in ("Móvil", "Móvil B2B") and
                fields.get("eRetencionEfectiva") == "NO" and
                fields.get("eTipoGestion") == "Se deriva para Baja" and
                # El script exige eBajaRealizada is None; en Graph un texto vacío
                # puede llegar como "" o ausente, así que cubrimos ambos.
                fields.get("eBajaRealizada") in (None, "") and
                fields.get("eFormularioPendiente") == "Formulario Regularizado" and
                fields.get("eDeudaPendiente") == "Sin Deuda" and
                fields.get("eRegularizadoCompleto") == "Se deriva para RPA"
            )
        elif self.source_list == "migracion_post_pre":
            title = fields.get("Title")
            return (
                title is not None and 
                str(title).isdigit() and 
                self.estado_baja in (None, "", "None")
            )
        return False

    def es_procesado(self) -> bool:
        baja = self.estado_baja
        if baja and baja.lower() != "pendiente" and baja != "None":
            return True
        return False
