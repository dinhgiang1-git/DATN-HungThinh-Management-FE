import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param {Array<Object>} data - Array of objects to export
 * @param {Array<{header: string, key: string, width?: number}>} columns - Column definitions
 * @param {string} fileName - File name without extension
 * @param {string} sheetName - Sheet name
 */
export function exportToExcel(data, columns, fileName = 'export', sheetName = 'Sheet1') {
  // Build header row
  const headers = columns.map(c => c.header);

  // Build data rows
  const rows = data.map(item =>
    columns.map(col => {
      if (col.transform) return col.transform(item);
      const val = col.key.split('.').reduce((o, k) => o?.[k], item);
      return val ?? '';
    })
  );

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width || 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
