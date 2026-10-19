/**
 * CSV Generation & Formula Injection Sanitization Utility
 */

/**
 * Escapes a single CSV cell value and mitigates Spreadsheet Formula Injection (CSV Injection / DDE).
 * If a cell begins with '=', '+', '-', '@', '\t', or '\r', it prepends a single quote (').
 *
 * @param {any} value
 * @returns {string} Sanitized and quoted CSV cell string
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Check for formula injection triggers at beginning of string
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r'];
  if (str.length > 0 && formulaTriggers.includes(str.charAt(0))) {
    str = `'${str}`;
  }

  // Escape internal double quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Converts headers and row arrays into an RFC 4180 compliant CSV string.
 *
 * @param {string[]} headers
 * @param {Array<Array<any>>} rows
 * @returns {string}
 */
export function generateCsv(headers, rows) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}
