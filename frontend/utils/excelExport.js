// Compiles arrays of project, task, or transaction records into formatted Excel sheets.
// Generates spreadsheet downloads for administrative reporting.

import * as XLSX from "xlsx";

/**
 * Reusable utility to export JSON data arrays into uncorrupted Excel (.xlsx) files.
 * Uses the xlsx (SheetJS) library.
 * 
 * @param {Array<Object>} data - Array of objects containing row data.
 * @param {string} fileName - Destination filename (without extension).
 * @throws {Error} If data is empty or export fails.
 */
export async function exportToExcel(data, fileName = "export") {
  try {
    if (!data || data.length === 0) {
      throw new Error("No data available to export!");
    }

    // Convert JSON to Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Calculate column widths automatically for clean spreadsheet layout
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      const colWidths = keys.map(key => {
        const maxLen = Math.max(
          key.length,
          ...data.map(row => (row[key] ? String(row[key]).length : 0))
        );
        return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
      });
      worksheet['!cols'] = colWidths;
    }

    // Apply header cell styling if range is valid
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (headerCell) {
          headerCell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1F2937" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
    }

    // Create a new Workbook
    const workbook = XLSX.utils.book_new();

    // Append Worksheet to Workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write file directly to browser
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Export to Excel failed:", error);
    throw error;
  }
}
