/**
 * Regenerate backend/data/employees.csv from the mock job-row generator.
 *
 * Course: Courses/COURSE.md#module-6--peoplesoft-data-layer-mock--csv
 * To pick: Courses/GOOGLE_SHEETS.md
 * Index:  Courses/SCRIPT_COURSE_LINKS.md
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

import { jobRowsToCsv } from "../src/peoplesoft/csvEmployees.js";
import {
  generateMockJobRows,
  resolveMockEmployeeCount,
} from "../src/peoplesoft/generateMockJobRows.js";
import { resolveEmployeeCsvPath } from "../src/peoplesoft/loadMockJobRows.js";

const csvPath = resolveEmployeeCsvPath();
const count = resolveMockEmployeeCount();
const rows = generateMockJobRows(count);

mkdirSync(path.dirname(csvPath), { recursive: true });
writeFileSync(csvPath, `${jobRowsToCsv(rows)}\n`, "utf8");

console.log(`Wrote ${rows.length} job rows (${count} employees) to:`);
console.log(csvPath);
console.log("");
console.log("Next: import this file into Google Sheets");
console.log("Course: Courses/GOOGLE_SHEETS.md (To pick: Courses/COURSE.md#module-6--peoplesoft-data-layer-mock--csv)");
console.log("Index:  Courses/SCRIPT_COURSE_LINKS.md");
