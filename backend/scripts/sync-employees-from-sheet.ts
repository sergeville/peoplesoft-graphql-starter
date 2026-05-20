/**
 * Pull published Google Sheet CSV → backend/data/employees.csv.
 *
 * Course: Courses/GOOGLE_SHEETS.md
 * To pick: Courses/COURSE.md#module-6--peoplesoft-data-layer-mock--csv
 *          Courses/GOOGLE_SHEET_AS_MOCK_PS.md
 * Index:  Courses/SCRIPT_COURSE_LINKS.md
 */
import { mkdirSync, writeFileSync } from "node:fs";
import "dotenv/config";

import { jobRowsToCsv, parseEmployeesCsv } from "../src/peoplesoft/csvEmployees.js";
import { resolveEmployeeCsvPath } from "../src/peoplesoft/loadMockJobRows.js";

const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL?.trim();
if (!sheetUrl) {
  console.error("Set GOOGLE_SHEET_CSV_URL in backend/.env to your published Sheet CSV URL.");
  process.exit(1);
}

const response = await fetch(sheetUrl, { headers: { Accept: "text/csv" } });
if (!response.ok) {
  console.error(`Fetch failed (${response.status}):`, await response.text());
  process.exit(1);
}

const text = await response.text();
const rows = parseEmployeesCsv(text);
if (rows.length === 0) {
  console.error("No rows parsed. Check column headers in the Sheet.");
  process.exit(1);
}

const csvPath = resolveEmployeeCsvPath();
mkdirSync(path.dirname(csvPath), { recursive: true });
writeFileSync(csvPath, `${jobRowsToCsv(rows)}\n`, "utf8");

const uniqueEmplids = new Set(rows.map((row) => row.emplid)).size;
console.log(`Synced ${rows.length} job rows (${uniqueEmplids} employees) from Google Sheet →`);
console.log(csvPath);
console.log("Restart the backend to load the updated CSV.");
console.log("Course: Courses/GOOGLE_SHEETS.md (To pick: Courses/COURSE.md#module-6--peoplesoft-data-layer-mock--csv)");
console.log("Index:  Courses/SCRIPT_COURSE_LINKS.md");
