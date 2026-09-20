"""Tests de la clasificación de 'Estado' en carga masiva.

Estas reglas antes solo estaban documentadas en docs/GUIA_ESTADOS.md (ahora eliminado y
consolidado en el README). Este archivo es la referencia ejecutable de esas reglas: si alguien
cambia el orden de prioridad o las palabras clave, un test debe fallar aquí.
"""
import pytest

from application.use_cases.carga_masiva import clasificar_estado


@pytest.mark.parametrize("estado", ["", "  ", "PENDIENTE PROCESAR", "pendiente procesar"])
def test_estados_ignorados_no_escriben_nada(estado):
    categoria, fields = clasificar_estado(estado)
    assert categoria == "ignorada"
    assert fields == {}


@pytest.mark.parametrize("estado", ["PROCESADO", "procesado", "PROCESA", " Procesa "])
def test_estados_procesados(estado):
    categoria, fields = clasificar_estado(estado)
    assert categoria == "procesar"
    assert fields == {"eBajaRealizada": "Baja Procesada"}


@pytest.mark.parametrize(
    "estado",
    ["DEUDA", "NO PAGO FACTURA DE MAYO", "FACTURA PENDIENTE", "no pag"],
)
def test_estados_con_deuda(estado):
    categoria, fields = clasificar_estado(estado)
    assert categoria == "deuda"
    assert fields["eBajaRealizada"] == "Baja Observada"
    assert fields["eDeudaPendiente"] == "Con Deuda"
    assert fields["Observaciones"] == estado.strip()


def test_deuda_tiene_prioridad_sobre_observada():
    """Regla documentada: 'OBSERVADO COMO DEUDA PENDIENTE' se trata como Deuda, no como Observada."""
    categoria, fields = clasificar_estado("OBSERVADO COMO DEUDA PENDIENTE")
    assert categoria == "deuda"
    assert fields["eDeudaPendiente"] == "Con Deuda"


@pytest.mark.parametrize(
    "estado", ["PORTOUT", "PORT OUT", "LINEA EN PO", "LINEA REALIZO PORT OUT", "PO"]
)
def test_estados_port_out_se_desestiman(estado):
    categoria, fields = clasificar_estado(estado)
    assert categoria == "desestimar"
    assert fields["eBajaRealizada"] == "Baja Desestimada"


@pytest.mark.parametrize("estado", ["OBSERVADA", "OBSERVADO", "observado sin motivo claro"])
def test_estados_observados(estado):
    categoria, fields = clasificar_estado(estado)
    assert categoria == "observar"
    assert fields["eBajaRealizada"] == "Baja Observada"
    assert fields["Observaciones"] == estado.strip()


@pytest.mark.parametrize("estado", ["ALGO RARO", "XYZ123", "cancelado por el cliente"])
def test_estados_no_reconocidos(estado):
    categoria, fields = clasificar_estado(estado)
    assert categoria == "no_reconocido"
    assert fields == {}
