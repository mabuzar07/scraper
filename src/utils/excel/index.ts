import xl from "excel4node";
import fs from "fs";

const VALUES: Record<string, string> = {
  string: "string",
  number: "number",
  boolean: "bool",
};

function exportJSONArrayToCSV(jsonArray: any[], filename: string) {
  if (jsonArray.length === 0) {
    console.log("No data to export to CSV");
    return;
  }

  // Get all unique headers from all records to ensure complete coverage
  const allHeaders = new Set<string>();
  jsonArray.forEach((record) => {
    Object.keys(record).forEach((key) => allHeaders.add(key));
  });

  // Convert Set to Array to maintain consistent order
  const headers = Array.from(allHeaders);

  // Create CSV header row
  let csvContent = headers.join(",") + "\n";

  // Add data rows
  jsonArray.forEach((record) => {
    const row = headers.map((header) => {
      let value = record[header];

      // Handle undefined/null values
      if (value === undefined || value === null) {
        value = "";
      }

      // Handle NaN numbers
      if (typeof value === "number" && isNaN(value)) {
        value = "";
      }

      // Convert to string and escape commas and quotes
      const stringValue = String(value);

      // If the value contains comma, newline, or quote, wrap in quotes and escape internal quotes
      if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }

      return stringValue;
    });

    csvContent += row.join(",") + "\n";
  });

  // Write CSV file
  fs.writeFileSync(`${filename}.csv`, csvContent, "utf8");
  console.log(`📊 CSV file saved: ${filename}.csv`);
}

function exportJSONArrayToExcel(jsonArray: any[], filename: string) {
  if (jsonArray.length === 0) {
    console.log("No data to export to Excel");
    return;
  }

  const workBook = new xl.Workbook();
  const workSheet = workBook.addWorksheet(filename);

  // Get all unique headers from all records to ensure complete coverage
  const allHeaders = new Set<string>();
  jsonArray.forEach((record) => {
    Object.keys(record).forEach((key) => allHeaders.add(key));
  });

  // Convert Set to Array to maintain consistent order
  const headers = Array.from(allHeaders);

  // Add headers to first row
  headers.forEach((header, index) => {
    workSheet.cell(1, index + 1).string(header);
  });

  // Add data rows
  jsonArray.forEach((record, rowIndex) => {
    headers.forEach((header, columnIndex) => {
      let value = record[header];

      if (value === undefined || value === null) {
        value = "";
      }

      if (typeof value === "number" && isNaN(value)) {
        value = "";
      }

      const typeofValue = VALUES[typeof value] || "string";

      // @ts-ignore
      workSheet.cell(rowIndex + 2, columnIndex + 1)[typeofValue](value);
    });
  });

  workBook.write(`${filename}.xlsx`);
  console.log(`📊 Excel file saved: ${filename}.xlsx`);
}

function exportJSONArrayToFile(jsonArray: any[], filename: string) {
  const jsonData = JSON.stringify(jsonArray, null, 2); // `null` and `2` are used for pretty-printing

  // Step 4: Write the JSON string to a file
  fs.writeFile(`${filename}.json`, jsonData, (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("File has been written");
    }
  });
}

export const exportJSON = {
  toExcel: exportJSONArrayToExcel,
  toFile: exportJSONArrayToFile,
  toCSV: exportJSONArrayToCSV,
};
