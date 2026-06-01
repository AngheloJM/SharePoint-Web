from abc import ABC, abstractmethod
from typing import List, Optional
from domain.entities.sharepoint_item import SharePointItem

class SharePointReader(ABC):

    @abstractmethod
    def get_items(
        self,
        list_id: str,
        source_name: str,
        filter_query: str = "",
        select_query: str = ""
    ) -> List[SharePointItem]:
        pass

    @abstractmethod
    def get_item_by_id(
        self,
        list_id: str,
        source_name: str,
        item_id: str,
    ) -> Optional[SharePointItem]:
        """Devuelve un item por su ID (o None si no existe)."""
        pass
