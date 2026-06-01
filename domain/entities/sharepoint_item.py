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

    # Campos del flujo de regularización requeridos para que una línea candidata
    # esté "bien cargada" (lista para RPA). (campo_interno, display, valor_esperado)
    CAMPOS_REGULARIZACION = (
        ("eFormularioPendiente", "Formulario Pendiente", "Formulario Regularizado"),
        ("eDeudaPendiente", "Deuda Pendiente", "Sin Deuda"),
        ("eRegularizadoCompleto", "Regularizado Completo", "Se deriva para RPA"),
    )

    def es_candidata_baja(self) -> bool:
        """Línea de Lista 1 que entró al flujo de baja/migración (aún sin baja realizada)."""
        if self.source_list != "gestion_baja":
            return False
        f = self.raw_fields
        linea = f.get("nLineaCodigoHogar")
        return (
            f.get("eServicio") in ("Móvil", "Móvil B2B") and
            f.get("eRetencionEfectiva") == "NO" and
            f.get("eTipoGestion") == "Se deriva para Baja" and
            # En Graph un texto vacío puede llegar como "" o ausente; cubrimos ambos.
            f.get("eBajaRealizada") in (None, "") and
            linea is not None and str(linea).strip().isdigit()
        )

    def campos_faltantes(self) -> list:
        """Campos del flujo de regularización que NO cumplen el valor esperado."""
        f = self.raw_fields
        faltan = []
        for campo, display, esperado in self.CAMPOS_REGULARIZACION:
            actual = f.get(campo)
            if actual != esperado:
                faltan.append({
                    "campo": campo,
                    "display": display,
                    "esperado": esperado,
                    "actual": actual if actual not in (None, "") else "(vacío)",
                })
        return faltan

    def es_mal_cargada(self) -> bool:
        """Candidata a baja a la que le falta completar el flujo de regularización."""
        return self.es_candidata_baja() and len(self.campos_faltantes()) > 0

    def diagnostico(self) -> dict:
        """Estado de la línea y, si está mal cargada, los campos que no cumplen."""
        if self.es_pendiente():
            estado = "Pendiente"
        elif self.es_procesado():
            estado = "Procesado"
        elif self.es_mal_cargada():
            estado = "Mal cargada"
        else:
            estado = "Otro"
        return {
            "estado": estado,
            "faltantes": self.campos_faltantes() if estado == "Mal cargada" else [],
        }

    def es_pendiente(self) -> bool:
        fields = self.raw_fields
        if self.source_list == "gestion_baja":
            # Candidata a baja + flujo de regularización completo (= lógica de script_lista1.py)
            return self.es_candidata_baja() and len(self.campos_faltantes()) == 0
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
