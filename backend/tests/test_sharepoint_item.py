"""Tests de las reglas de negocio de SharePointItem (candidatura a baja, pendiente/procesado,
mal cargada). Esta es la regla central del README ('Lógica de filtrado') y no tenía cobertura.
"""
from domain.entities.sharepoint_item import SharePointItem


def _item_candidato(**overrides):
    fields = {
        "eServicio": "Móvil",
        "eRetencionEfectiva": "NO",
        "eTipoGestion": "Se deriva para Baja",
        "eBajaRealizada": "",
        "eFormularioPendiente": "Formulario Regularizado",
        "eDeudaPendiente": "Sin Deuda",
        "eRegularizadoCompleto": "Se deriva para RPA",
        "nLineaCodigoHogar": "77712345",
    }
    fields.update(overrides)
    return SharePointItem(id="1", title="t", raw_fields=fields, source_list="gestion_baja")


def test_candidata_completa_es_pendiente():
    item = _item_candidato()
    assert item.es_candidata_baja() is True
    assert item.es_pendiente() is True
    assert item.es_mal_cargada() is False


def test_no_candidata_si_no_es_movil():
    item = _item_candidato(eServicio="Hogar")
    assert item.es_candidata_baja() is False
    assert item.es_pendiente() is False


def test_no_candidata_si_retencion_efectiva():
    item = _item_candidato(eRetencionEfectiva="SI")
    assert item.es_candidata_baja() is False


def test_no_candidata_si_ya_tiene_baja_realizada():
    item = _item_candidato(eBajaRealizada="Baja Procesada")
    assert item.es_candidata_baja() is False


def test_no_candidata_si_linea_no_es_numerica():
    item = _item_candidato(nLineaCodigoHogar="N/A")
    assert item.es_candidata_baja() is False


def test_candidata_con_flujo_incompleto_es_mal_cargada():
    item = _item_candidato(eDeudaPendiente="Con Deuda")
    assert item.es_candidata_baja() is True
    assert item.es_pendiente() is False
    assert item.es_mal_cargada() is True
    faltantes = item.campos_faltantes()
    assert len(faltantes) == 1
    assert faltantes[0]["campo"] == "eDeudaPendiente"


def test_procesado_cuando_baja_realizada_tiene_valor():
    item = _item_candidato(eBajaRealizada="Baja Procesada")
    assert item.es_procesado() is True


def test_diagnostico_reporta_mal_cargada_con_faltantes():
    item = _item_candidato(eRegularizadoCompleto="")
    resultado = item.diagnostico()
    assert resultado["estado"] == "Mal cargada"
    assert any(f["campo"] == "eRegularizadoCompleto" for f in resultado["faltantes"])


def test_lista_2_pendiente_por_title_numerico_sin_baja():
    item = SharePointItem(
        id="2",
        title="70000000",
        raw_fields={"Title": "70000000"},
        source_list="migracion_post_pre",
    )
    assert item.es_pendiente() is True
