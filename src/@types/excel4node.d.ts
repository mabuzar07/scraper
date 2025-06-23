declare module "excel4node" {
  declare class Workbook {
    addWorksheet(name: string): Worksheet;
    write(filename: string): void;
  }

  declare class Worksheet {
    cell(rowIndex: number, columnIndex: number): Worksheet;
    string(value: unknown): Worksheet;
  }
}
