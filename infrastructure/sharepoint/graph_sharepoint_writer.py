import os
import requests
from typing import Dict, Any
from dotenv import load_dotenv

from domain.ports.sharepoint_writer import SharePointWriter, SharePointPermissionError
from infrastructure.auth.graph_auth import get_access_token

load_dotenv()


class GraphSharePointWriter(SharePointWriter):

    def update_item_fields(
        self,
        list_id: str,
        item_id: str,
        fields: Dict[str, Any],
    ) -> Dict[str, Any]:
        token = get_access_token()
        site_id = os.getenv("SP_SITE_ID")

        url = (
            f"https://graph.microsoft.com/v1.0/"
            f"sites/{site_id}/lists/{list_id}/items/{item_id}/fields"
        )

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        print(f"✏️ PATCH item {item_id} en lista {list_id}: {fields}")
        response = requests.patch(url, headers=headers, json=fields, timeout=30)

        # 403 = falta el permiso de aplicación Sites.ReadWrite.All (consentimiento admin)
        if response.status_code == 403:
            print(f"🚫 403 al escribir: {response.text}")
            raise SharePointPermissionError(
                "La aplicación no tiene permiso de escritura en SharePoint. "
                "Se requiere el permiso 'Sites.ReadWrite.All' (aplicación) con "
                "consentimiento de administrador en Azure."
            )

        try:
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            detalle = getattr(e.response, "text", "") if hasattr(e, "response") and e.response is not None else ""
            print(f"❌ Error al escribir item {item_id}: {e} | {detalle}")
            raise

        data = response.json()
        print(f"✅ Item {item_id} actualizado.")
        return data
