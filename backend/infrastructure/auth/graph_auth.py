import logging
import os
import requests
from dotenv import load_dotenv


logger = logging.getLogger(__name__)
load_dotenv()

def get_access_token() -> str:
    tenant_id = os.getenv("TENANT_ID")
    client_id = os.getenv("CLIENT_ID")
    client_secret = os.getenv("CLIENT_SECRET")
    scope = os.getenv("GRAPH_SCOPE")

    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"

    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": scope,
    }

    logger.info("Obteniendo token de acceso...")
    try:
        response = requests.post(url, data=data, timeout=10)
        response.raise_for_status()
        logger.info("Token obtenido")
        return response.json()["access_token"]
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error al obtener token: {e}")
        raise
