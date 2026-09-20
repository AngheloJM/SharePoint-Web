from abc import ABC, abstractmethod
from typing import List
from domain.entities.sharepoint_item import SharePointItem

class ReportWriter(ABC):

    @abstractmethod
    def write(
        self,
        all_items: List[SharePointItem],
        pendientes: List[SharePointItem],
        procesados: List[SharePointItem],
    ) -> None:
        pass
