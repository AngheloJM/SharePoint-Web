import os
import requests
from dotenv import load_dotenv
from infrastructure.auth.graph_auth import get_access_token

load_dotenv()

def debug_list_headers(list_name, list_id):
    print(f"\n" + "="*50)
    print(f"📋 ANALIZANDO: {list_name}")
    print(f"🆔 ID: {list_id}")
    print("="*50)
    
    token = get_access_token()
    site_id = os.getenv("SP_SITE_ID")
    
    url = (
        f"https://graph.microsoft.com/v1.0/"
        f"sites/{site_id}/lists/{list_id}/items"
        f"?expand=fields&$top=5"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data["value"]:
            all_keys = set()
            for item in data["value"]:
                all_keys.update(item["fields"].keys())
            
            print(f"✅ Se encontraron {len(all_keys)} campos en los primeros {len(data['value'])} items.")
            print("\nListado de Campos y Ejemplos:")
            for key in sorted(all_keys):
                # Buscar un ejemplo que no sea None
                example_val = "None"
                for item in data["value"]:
                    if item["fields"].get(key) is not None:
                        example_val = item["fields"].get(key)
                        break
                print(f"  🔹 {key.ljust(30)} | Ej: {str(example_val)[:50]}")
        else:
            print("⚠️ No se encontraron items en esta lista.")
            
    except Exception as e:
        print(f"❌ Error al analizar la lista: {e}")

def main():
    # Listas que parecen más relevantes según el listado anterior
    relevant_lists = [
        ("Gestión Baja de Servicio Móvil u Hogar", "cab5ea08-2965-4f45-9969-d90b6e247567"),
        ("Formulario Baja de Servicio Hogar", "a265a611-6683-4d98-b643-5a31fdb55fb6"),
        ("Formulario Baja de Servicio", "9594e3f4-4355-42b2-a2cf-2067dbe98e7a")
    ]
    
    for name, lid in relevant_lists:
        debug_list_headers(name, lid)

if __name__ == "__main__":
    main()
