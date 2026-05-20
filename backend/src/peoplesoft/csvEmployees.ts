import type { JobRow } from "./types.js";

export const EMPLOYEE_CSV_HEADERS = [
  "emplid",
  "effdt",
  "effseq",
  "hr_status",
  "name",
  "email",
  "department",
  "position",
  "salary",
  "manager_emplid",
] as const;

/** Parse CSV text (RFC 4180–style, supports quoted fields). */
export function parseEmployeesCsv(text: string): JobRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith("#");
  });

  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]!).map((cell) => cell.trim().toLowerCase());
  const startIndex = headerIncludesJobHeaders(header) ? 1 : 0;

  const rows: JobRow[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const row = cellsToJobRow(cells, header);
    if (row) rows.push(row);
  }

  return rows;
}

function headerIncludesJobHeaders(header: string[]): boolean {
  return header.includes("emplid") && header.includes("effdt");
}

function cellsToJobRow(cells: string[], header: string[]): JobRow | null {
  const get = (name: string, index: number): string => {
    if (header.length > 0) {
      const pos = header.indexOf(name);
      if (pos >= 0) return (cells[pos] ?? "").trim();
    }
    return (cells[index] ?? "").trim();
  };

  const emplid = get("emplid", 0);
  const effdt = get("effdt", 1);
  const name = get("name", 3);
  if (!emplid || !effdt || !name) return null;

  const effseqRaw = get("effseq", 2);
  const hasHrStatus =
    header.length > 0 &&
    (header.includes("hr_status") || header.includes("hrstatus"));
  const hrStatusRaw = hasHrStatus
    ? get("hr_status", 3) || get("hrstatus", 3)
    : "";
  const salaryRaw = get("salary", hasHrStatus ? 8 : 7);
  const email = get("email", hasHrStatus ? 5 : 4);
  const manager =
    get("manager_emplid", hasHrStatus ? 9 : 8) ||
    get("manageremplid", hasHrStatus ? 9 : 8);

  return {
    emplid,
    effdt,
    effseq: effseqRaw ? Number.parseInt(effseqRaw, 10) || 0 : 0,
    hrStatus: hrStatusRaw ? hrStatusRaw.toUpperCase() : "A",
    name,
    email: email || null,
    department: get("department", 6) || null,
    position: get("position", 7) || "Employee",
    salary: salaryRaw ? Number.parseFloat(salaryRaw) || 0 : 0,
    managerEmplid: manager || null,
  };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

export function jobRowsToCsv(rows: JobRow[]): string {
  const header = EMPLOYEE_CSV_HEADERS.join(",");
  const body = rows.map((row) =>
    [
      csvCell(row.emplid),
      csvCell(row.effdt),
      String(row.effseq),
      csvCell(row.hrStatus ?? "A"),
      csvCell(row.name),
      csvCell(row.email ?? ""),
      csvCell(row.department ?? ""),
      csvCell(row.position),
      String(row.salary),
      csvCell(row.managerEmplid ?? ""),
    ].join(","),
  );
  return [header, ...body].join("\n");
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
