# Use your Google Sheet as mock PeopleSoft (Apps Script)

Your sheet:  
https://docs.google.com/spreadsheets/d/1v8or00pEg1dEQm04QurJSfiWAqoiP_qvXvVa0yupixM/edit?gid=164390836

GraphQL still calls `integrationBrokerClient.ts` → `fetch(PS_BASE_URL + "/employees")`.  
The Apps Script **is** the mock PS server and **updates the sheet** on POST/PUT/DELETE.

---

## Step 1 — Add the script to your spreadsheet

1. Open your Sheet (**Peoplesoft muck**).
2. **Extensions → Apps Script**.
3. Delete any code in `Code.gs`.
4. Paste the contents of [google-apps-script-mock-ps.gs](./google-apps-script-mock-ps.gs).
5. **Save** (disk icon).

---

## Step 2 — Deploy as web app

1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (required for local Node `fetch` without Google login)
5. **Deploy** → copy the **Web app URL**  
   Example: `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 3 — Configure backend

`backend/.env`:

```env
PORT=4000
PEOPLESOFT_DATA_SOURCE=integration-broker
PS_BASE_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
PS_USERNAME=demo
PS_PASSWORD=demo
```

(No mock server on :4100 needed.)

---

## Step 4 — Run

```bash
cd ~/Documents/Projects/peoplesoft-graphql-starter
npm run dev
```

Use the UI — watch **Apps Script → Executions** for each call.  
Your Sheet rows update on create/update/delete.

---

## See the Node.js call

Set a breakpoint or add `console.log` in:

`backend/src/peoplesoft/integrationBrokerClient.ts`

```typescript
const response = await fetch(url, { ... });  // ← GraphQL path ends here
```

---

## Security

**Anyone with the web app URL** can read/write the sheet. Use only for learning/demo.  
Revoke: **Deploy → Manage deployments → Archive**.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 / HTML response | Redeploy with **Anyone** access |
| Sheet empty | Row 1 must be headers: `emplid,effdt,effseq,name,...` |
| GraphQL fetch failed | Check `PS_BASE_URL` has no trailing path except `/exec` |
| Changes slow | Normal — each mutation hits Apps Script |
