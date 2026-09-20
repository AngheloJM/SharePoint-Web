import os
from dotenv import load_dotenv

load_dotenv()

# Variables planas para acceso directo
SITE_ID = os.getenv("SP_SITE_ID")
LIST_ID = os.getenv("SP_LIST_ID")
LIST_ID_2 = os.getenv("SP_LIST_ID_2")

class Settings:
    """Configuración global de la aplicación."""
    PROJECT_NAME = "SharePoint Reporting"
    
    # Credenciales de Azure (para auth)
    TENANT_ID = os.getenv("TENANT_ID")
    CLIENT_ID = os.getenv("CLIENT_ID")
    CLIENT_SECRET = os.getenv("CLIENT_SECRET")
    
    # SharePoint
    SP_SITE_ID = SITE_ID
    SP_LIST_ID = LIST_ID
    SP_LIST_ID_2 = LIST_ID_2
