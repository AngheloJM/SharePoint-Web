import os
import requests
from dotenv import load_dotenv
from infrastructure.auth.graph_auth import get_access_token

load_dotenv()

def list_all_lists():
    print("🔍 Buscando todas las listas en el sitio...")
    token = get_access_token()
    site_id = os.getenv("SP_SITE_ID")
    
    url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists"

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        print(f"✅ Se encontraron {len(data['value'])} listas:")
        for sp_list in data["value"]:
            print(f"  - Nombre: {sp_list['displayName']}")
            print(f"    ID: {sp_list['id']}")
            print(f"    URL: {sp_list['webUrl']}")
            print("-" * 20)
            
    except Exception as e:
        print(f"❌ Error al listar las listas: {e}")

if __name__ == "__main__":
    list_all_lists()
