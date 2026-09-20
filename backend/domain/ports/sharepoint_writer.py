from abc import ABC, abstractmethod
from typing import Dict, Any


class SharePointPermissionError(Exception):
    """La app no tiene permiso de escritura (Sites.ReadWrite.All) en SharePoint."""
    pass


class SharePointWriter(ABC):

    @abstractmethod
    def update_item_fields(
        self,
        list_id: str,
        item_id: str,
        fields: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Actualiza los campos de un item de SharePoint y devuelve los campos resultantes."""
        pass
