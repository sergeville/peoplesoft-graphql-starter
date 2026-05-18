# Google Sheets as the employee source

Edit employees in Google Sheets, then load them into GraphQL / mock PeopleSoft.

## Column headers (row 1)

Keep these exact header names in row 1:

| Column | Required | Example |
|--------|----------|---------|
| `emplid` | yes | `100001` |
| `effdt` | yes | `2024-01-01` |
| `effseq` | no | `0` |
| `name` | yes | `Jane Doe` |
| `email` | no | `jane.doe@example.com` |
| `department` | no | `Engineering` |
| `position` | no | `Software Engineer` |
| `salary` | no | `95000` |
| `manager_emplid` | no | `100003` |

- One row = one effective-dated job row (same `emplid` can appear multiple times for promotions).
- Leave `manager_emplid` empty for directors / top-level rows.

## One-time setup

### 1. Export CSV from this project

```bash
cd backend
npm run export:employees
```

Creates `backend/data/employees.csv` (~1000 employees).

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
npm run sync:sheet
npm run dev
```

**Option C — Read Sheet directly on every backend start**

```env
MOCK_DATA_SOURCE=sheet
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0
```

Restart backend after Sheet edits.

## Day-to-day workflow

1. Add / edit / delete rows in Google Sheets  
2. Either:  
   - **Download** → **File → Download → CSV** → save as `backend/data/employees.csv`, or  
   - Run `npm run sync:sheet` (if `GOOGLE_SHEET_CSV_URL` is set)  
3. Restart `npm run dev` (or `npm run dev:mock-ps`)

## Notes

- The app does not write back to Google Sheets (read-only). Sheets is your editor; CSV/URL is the feed.
- For write API access you would need a Google Cloud service account (not included in this starter).
- `MOCK_DATA_SOURCE=generate` ignores CSV/Sheet and builds data in code again.
