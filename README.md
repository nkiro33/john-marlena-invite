# John & Marlena — Digital Wedding Invitation

A static (no build step) mobile invitation:

1. **Page 1** — sealed envelope. Tap → wax seal breaks → cross-dissolve to the
   open envelope → white flash → the invitation is revealed.
2. **Page 2** — invitation details *(static)*.
3. **Page 3** — dress code *(static)*.
4. **Page 4** — wedding events with **two clickable LOCATION buttons**
   (real links, placeholders for now).
5. **Page 5** — **reservation form** (guest names) that saves to **Google Sheets**.

The original artwork is used **as-is**. For pages 4 & 5 the *clean* (`WT`) images
are the base, and the interactive controls are overlaid exactly where the
designed versions (`P4.svg` / `P5.svg`) place them.

---

## Files

```
index.html              the page
css/styles.css          styling + animations + overlay positions
js/config.js            ← EDIT THIS: your links + Sheets URL
js/app.js               behaviour (envelope, form, lazy-load)
assets/                 the 6 SVGs used (clean versions for pages 4 & 5)
apps-script/Code.gs     Google Sheets receiver
```

Original source SVGs (`P1.svg`, `P1 OI.svg`, `P2.svg` … `P5 WT.svg`) are kept in
the project root for reference. `P4.svg` / `P5.svg` (with the printed
buttons/form) are the *visual reference* and are not loaded by the app.

---

## 1. Run / preview locally

Because images are loaded by the browser, use a local server (not `file://`):

```bash
cd john2
python3 -m http.server 8080
# open http://localhost:8080
```

Best viewed in a narrow / mobile-sized window (it's a 1080×1920 portrait design).

---

## 2. Connect the form to Google Sheets (one-time, ~2 min)

> This is the part that **must be done by you** — it needs your Google account.

1. Create a new Google Sheet.
2. **Extensions → Apps Script**. Delete any code, paste the contents of
   `apps-script/Code.gs`, and **Save**.
3. **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorise when prompted.
4. Copy the **Web app URL** (ends in `/exec`).
5. Paste it into `js/config.js` → `SHEETS_ENDPOINT`.

Submissions append a row: `Timestamp | Guest 1 | Guest 2 | Guest 3 | Total Guests`.

> Tip: if you ever change `Code.gs`, redeploy via **Deploy → Manage deployments →
> edit → New version**, or the URL keeps running the old code.

---

## 3. Set the location links (Page 4)

In `js/config.js`:

```js
LOCATIONS: {
  church: "https://maps.app.goo.gl/...",   // 5:00 PM — Church
  venue:  "https://maps.app.goo.gl/..."    // 7:00 PM — Hiltons King Ranch
}
```

---

## 4. Host it

Any static host works — drag the folder into **Netlify**, push to
**GitHub Pages**, **Vercel**, Cloudflare Pages, etc. No server needed.

---

## Notes & limitations

- The SVGs are **flat raster images** (one embedded picture each), so all
  buttons/inputs are overlaid by coordinate — they don't live "inside" the
  artwork. If the artwork text moves, nudge the `%` positions in
  `css/styles.css` (`#locChurch`, `#locVenue`, `.fld-*`, `.submit-btn`).
- The envelope "open" is a **seal-break + crossfade + flash**, not a true 3D
  paper fold (impossible from a flat image without a layered/vector envelope).
- Files are ~3 MB each (~18 MB total) and kept **as-is** per request; pages 2–5
  are lazy-loaded after the envelope opens. Optional: re-export the embedded
  images as compressed WebP to cut this ~70%.
- `mode:'no-cors'` is used for the Sheets POST (the standard Apps Script
  pattern); the row is written reliably, but app-level errors aren't readable
  by the browser — only network failures surface a retry message.
