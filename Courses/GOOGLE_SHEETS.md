# Google Sheets as the employee source

Edit employees in Google Sheets, then load them into GraphQL / mock PeopleSoft.

**Course:** [COURSE.md § Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) · **Hub:** [Courses/README.md](./README.md) · **Scripts:** [SCRIPT_COURSE_LINKS § Module 6](./SCRIPT_COURSE_LINKS.md#by-course-module-course--script)

| Run | Script |
|-----|--------|
| `npm run export:employees` | [`backend/scripts/export-employees-csv.ts`](../backend/scripts/export-employees-csv.ts) |
| `npm run sync:sheet` | [`backend/scripts/sync-employees-from-sheet.ts`](../backend/scripts/sync-employees-from-sheet.ts) |

## Column headers (row 1)

Keep these exact header names in row 1:

| Column | Required | Example |
|--------|----------|---------|
| `emplid` | yes | `100001` |
| `effdt` | yes | `2024-01-01` |
| `effseq` | no | `0` |
| `hr_status` | no | `A` (active) or `I` (inactive/terminated) |
| `name` | yes | `Jane Doe` |
| `email` | no | `jane.doe@example.com` |
| `department` | no | `Engineering` |
| `position` | no | `Software Engineer` |
| `salary` | no | `95000` |
| `manager_emplid` | no | `100003` |

- One row = one effective-dated job row (same `emplid` can appear multiple times for promotions or termination).
- `hr_status`: `A` = active (default if column missing on import); `I` = inactive — used when the app **terminates** an employee (new eff-dated row, history kept).
- Leave `manager_emplid` empty for directors / top-level rows.
- Re-run `npm run export:employees` if your sheet lacks `hr_status` — export uses the same headers as [`csvEmployees.ts`](../backend/src/peoplesoft/csvEmployees.ts).

## One-time setup

### 1. Export CSV from this project

```bash
npm run export:employees
```

Runs [`backend/scripts/export-employees-csv.ts`](../backend/scripts/export-employees-csv.ts) and creates [`backend/data/employees.csv`](../backend/data/employees.csv) (~1000 employees).

### 2. Import into Google Sheets

1. Open [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. **File → Import → Upload** → choose `employees.csv`
3. Import location: **Replace current sheet**
4. Rename the sheet tab (e.g. `employees`)

### 3. Publish for the app (optional — live Sheet)

1. **File → Share → Publish to web**
2. Link type: the `employees` sheet
3. Format: **Comma-separated values (.csv)**
4. Click **Publish**
5. Copy the URL — it looks like:

   `https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=GID`

### 4. Configure `backend/.env`

**Option A — Local CSV (simplest)**  
After editing the Sheet, download as CSV and replace `data/employees.csv`, or run sync (Option B).

```env
MOCK_DATA_SOURCE=csv
MOCK_EMPLOYEE_CSV_PATH=./data/employees.csv
```

**Option B — Pull from Google Sheet on sync**

```env
MOCK_DATA_SOURCE=csv
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0
```

```bash
npm run sync:sheet   # → backend/scripts/sync-employees-from-sheet.ts
npm run dev          # → backend/src/server.ts + frontend
```

**Option C — Read Sheet directly on every backend start**

```env
MOCK_DATA_SOURCE=sheet
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0
```

Restart backend after Sheet edits.

## Day-to-day workflow

1. Add / edit rows in Google Sheets (manual “terminate”: add a row with `hr_status=I` — do not delete history rows if you need eff-dated queries)  
2. Either:  
   - **Download** → **File → Download → CSV** → save as `backend/data/employees.csv`, or  
   - Run [`npm run sync:sheet`](../package.json) → [`sync-employees-from-sheet.ts`](../backend/scripts/sync-employees-from-sheet.ts) (if `GOOGLE_SHEET_CSV_URL` is set)  
3. Restart [`npm run dev`](../package.json) (or [`npm run dev:mock-ps`](../package.json) for IB path — [Module 7](./COURSE.md#module-7--mock-integration-broker))

## Notes

- The app does not write back to Google Sheets (read-only). Sheets is your editor; CSV/URL is the feed.
- For write API access you would need a Google Cloud service account (not included in this starter).
- `MOCK_DATA_SOURCE=generate` ignores CSV/Sheet and builds data in code again.
