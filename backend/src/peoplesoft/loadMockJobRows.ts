import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseEmployeesCsv } from "./csvEmployees.js";
import {
  generateMockJobRows,
  resolveMockEmployeeCount,
} from "./generateMockJobRows.js";
import type { JobRow } from "./types.js";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function resolveEmployeeCsvPath(): string {
  const configured = process.env.MOCK_EMPLOYEE_CSV_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(backendRoot, configured);
  }
  return path.join(backendRoot, "data", "employees.csv");
}

export type MockDataSource = "auto" | "csv" | "sheet" | "generate";

export function resolveMockDataSource(): MockDataSource {
  const raw = (process.env.MOCK_DATA_SOURCE ?? "auto").trim().toLowerCase();
  if (raw === "csv" || raw === "sheet" || raw === "generate") return raw;
  return "auto";
}

function loadFromCsvFile(csvPath: string): JobRow[] {
  const text = readFileSync(csvPath, "utf8");
  const rows = parseEmployeesCsv(text);
  if (rows.length === 0) {
    throw new Error(`No employee rows parsed from ${csvPath}`);
  }
  return rows;
}

async function loadFromGoogleSheet(url: string): Promise<JobRow[]> {
  const response = await fetch(url, {
    headers: { Accept: "text/csv" },
  });
  if (!response.ok) {
    throw new Error(
      `Google Sheet fetch failed (${response.status}): ${await response.text()}`,
    );
  }
  const rows = parseEmployeesCsv(await response.text());
  if (rows.length === 0) {
    throw new Error("Google Sheet CSV contained no employee rows");
  }
  return rows;
}

/**
 * Load mock PS job rows: Google Sheet URL, local CSV, or generated dataset.
 */
export async function loadMockJobRows(): Promise<JobRow[]> {
  const source = resolveMockDataSource();
  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL?.trim();
  const csvPath = resolveEmployeeCsvPath();

  if (source === "sheet" || (source === "auto" && sheetUrl)) {
    if (!sheetUrl) {
      throw new Error(
        "MOCK_DATA_SOURCE=sheet requires GOOGLE_SHEET_CSV_URL (published CSV export URL)",
      );
    }
    console.log(`Loading employees from Google Sheet…`);
    return loadFromGoogleSheet(sheetUrl);
  }

  if (source === "csv" || (source === "auto" && existsSync(csvPath))) {
    console.log(`Loading employees from ${csvPath}`);
    return loadFromCsvFile(csvPath);
  }

  const count = resolveMockEmployeeCount();
  console.log(`Generating ${count} mock employees in memory`);
  return generateMockJobRows(count);
}
