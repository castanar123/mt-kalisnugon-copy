import * as XLSX from 'xlsx';

/** Generic export to Excel. rows = array of objects, filename without extension. */
export function exportToExcel(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = 'Sheet1',
): void {
  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws);
  if (ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Export multiple sheets in one workbook. */
export function exportToExcelMultiSheet(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
  filename: string,
): void {
  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const withAtLeastOneRow = rows.length ? rows : [{ Note: 'No data' }];
    const ws = XLSX.utils.json_to_sheet(withAtLeastOneRow);
    autoFitColumns(ws);
    if (ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Auto-fit column widths based on content. */
export function autoFitColumns(ws: XLSX.WorkSheet): void {
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  const colWidths: number[] = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    let maxLen = 10;
    for (let R = range.s.r; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.v != null) {
        const len = String(cell.v).length;
        if (len > maxLen) maxLen = len;
      }
    }
    colWidths.push(Math.min(maxLen + 2, 50));
  }
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));
}
