# Math Band Practice Availability

A small static web app for Math Band members to mark their weekly practice
availability. Deployed free on GitHub Pages; responses are collected in a
Google Sheet you own.

Members select 1-hour time slots across the week and mark each as:

- **Preferred**
- **Can make it work**
- **Can't do**

Hours considered: **Mon–Fri 4–9 PM** and **Sat–Sun 12–9 PM** (43 slots total).

## How it works

```
index.html  ->  page (static)
app.js      ->  grid, three-state toggles, draft saved in localStorage, POST to your sheet
config.js   ->  holds your Google Apps Script web app URL
styles.css  ->  styling
Code.gs     ->  Google Apps Script that stores responses in a Google Sheet
```

## Part 1 — Set up the Google Sheet backend (10 min)

1. Go to https://sheets.new and name the spreadsheet (e.g. "Math Band Availability");
   leave it empty.
2. In the spreadsheet menu: **Extensions → Apps Script**.
3. Delete the default `function myFunction() {}` and paste in the full contents of
   `Code.gs`.
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - **Execute as:** Me (your Google account)
   - **Who has access:** *Anyone* (this is what lets non-Google members submit)
   - Click **Deploy**, then **Authorize access** and approve the permissions.
5. Copy the **Web app URL** (ends in `/exec`).
6. Open `config.js` in this project and paste the URL:
   ```js
   window.APPS_SCRIPT_URL = "https://script.google.com/macros/s/xxxxx/exec";
   ```

The sheet gets a tab named **Availability**. Each member occupies one row
(name + timestamp + one column per slot). If a member edits their availability
and resubmits, their row is updated — you always see their latest answers.

> Public sites have request limits (~20,000/day per published app). Fine for a
> band; if your members are all on school Google accounts, you could deploy with
> "Anyone with a Google account" instead and add `member` accounts to the sheet.

## Part 2 — Host on GitHub Pages (10 min)

1. Create a repository on GitHub (public or private). You can name it
   `math-band-availability`.
2. Upload/copy these files into it:
   `index.html`, `app.js`, `config.js`, `styles.css`, `README.md`, `Code.gs`.
3. Push to GitHub. Then: **Settings → Pages → Source: Deploy from a branch →
   Branch: main → `/ (root)** → Save**.
4. Your app is live at `https://<your-username>.github.io/math-band-availability/`.

If you later prefer it at the root of a `<username>.github.io` repo, put these
files at the repo root instead.

## For members

Open the link, type your name, and click time slots:

1. Click a slot once → Preferred (green)
2. Click again → Can make it work (yellow)
3. Click again → Can't do (grey)

Your selections autosave as a draft in your browser, so you can come back and
tweak before hitting **Submit my availability**. Submissions go straight to the
spreadsheet.

## Viewing results

Open your spreadsheet's **Availability** tab. With the header row — `Timestamp`,
`Name`, then `Mon 4-5 PM` ... `Sun 8-9 PM` — you can use **pivot tables** or
`COUNTIF` per column to tally preferred/possible attendance per slot. A common
approach:

```
=COUNTIF(B2:B100, "Preferred")
```

Filter by a column to see every member's answer for a specific slot.