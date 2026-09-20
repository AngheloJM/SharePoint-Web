from application.use_cases.generate_report import GenerateReportUseCase
from infrastructure.sharepoint.graph_sharepoint_reader import GraphSharePointReader
from infrastructure.reports.excel_report_writer import ExcelReportWriter

def main():
    reader = GraphSharePointReader()
    writer = ExcelReportWriter()

    use_case = GenerateReportUseCase(reader, writer)
    use_case.execute()

    print("✅ Reporte generado correctamente")

if __name__ == "__main__":
    main()
