# Ready Together

A US household preparedness guide and a working static planner for people starting from scratch. The guide and app organize readiness into **Core (3 days), Advanced (14 days), and Super prep (30 days)**, with a measured path toward 60–90 days in the PDF.

[Open the interactive planner](https://ckeysvt88.github.io/prep_together-/) · [Beginner guide (PDF)](dist/Ready-Together-Beginner-Guide.pdf) · [Full guide (PDF)](dist/Ready-Together-Guide.pdf)

## What is included

- A 37-page, printable PDF with household quantity tables, water/food planning, care, safe power, sanitation, evacuation, regional modules, a Central North Carolina example, worksheets, maintenance and 31 authoritative source links.
- A separate 9-page beginner quick-start PDF with simple shopping quantities, familiar meals and no electrical homework.
- Beginner, Intermediate and Advanced experience modes, independently selectable from supply duration.
- AM/FM and NOAA alert radios, FRS/GMRS voice, mesh text, amateur radio and satellite messaging guidance.
- Household presets for one adult, two adults, and two adults plus two children; editable counts, including infants and pets.
- Broad regional hazard presets with manual overrides; housing, medical/access, dietary and transport considerations.
- Water/food quantities, inventory gaps, tier-specific tasks, checklist filtering and a critical-load battery calculator.
- Browser-local persistence, JSON export/import and print styling for personalized plans.
- No application backend, API keys, external scripts, analytics, fonts, paid services or build step.

## Run locally

Open `dist/index.html` in a modern browser, or run a static server:

```bash
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. Browser storage behavior on local file URLs varies; use the local server for predictable persistence. The hosted version is not guaranteed to work offline because there is no service worker. Keep a downloaded PDF, printed plan or local source copy.

## GitHub Pages deployment

The **Publish Ready Together** workflow tests the planner and publishes `dist/` to GitHub Pages on pushes to `main`. It can also be run manually from the **Actions** tab. For a new copy of the repository, select **GitHub Actions** under **Settings → Pages → Build and deployment → Source** to enable publishing. Both PDFs are included in the deployed files.

## Source layout

```text
dist/
  index.html                 Dashboard
  styles.css                 Responsive and print styles
  engine.js                  Pure calculations and task selection
  app.js                     UI, storage, import/export and print behavior
  sources.html               Assumptions and reference links
  Ready-Together-Guide.pdf    Full guide
  Ready-Together-Beginner-Guide.pdf  Simple quick start
scripts/
  test-engine.cjs             Calculation and behavior tests
  build_pdf.py               PDF generator
  build_sources.py           Website source-directory generator
docs/
  guide.json                 Editable full-guide content
  beginner-guide.json        Editable beginner-guide content
  sources.json               Numbered references
  QA.md                      Verification record and limits
.github/workflows/pages.yml  GitHub Pages deployment
```

## Planning formulas

US gallons throughout; water weight excludes containers.

- **Daily water:** `(adults + children + infants) × waterRate + pets × petWater`.
- **Stored-water target:** daily water × tier days. Baseline is 1 gallon/person/day. Pets and special needs are additional. Beginner mode uses 1.5 gallons/person/day if extreme heat is selected or the extra-needs box is checked; otherwise 1. The extra half-gallon is a visible editorial starter buffer, not a medical or heat-safety prescription. Intermediate/Advanced use the entered water rate.
- **Daily food:** `adults × adultKcal + children × childKcal`. Defaults are 2,000 adult and 1,600 child kcal, explicitly editable inventory assumptions, not dietary prescriptions.
- **Beginner food inventory:** complete household days of familiar meals; gap = selected days minus stored days, clamped at zero. Kept separate from calorie inventory; no automatic conversion.
- **Beginner power:** one tested USB bank around 20,000 mAh per entered phone, cables and lights. This starter list is not a duration guarantee, whole-house sizing or a medical-device backup.
- **Food target:** daily food × tier days. Infants are excluded and receive a separate feeding task.
- **Meal slots:** `(adults + children) × 3 × days`; these are planned person-meals, not manufacturer servings.
- **Inventory gap:** `max(0, target − onHand)`.
- **Water weight:** gallons × 8.34 lb.
- **Nominal battery need:** `dailyWh × days / (usablePercent / 100)`.
- **Battery runtime:** `capacityWh × (usablePercent / 100) / dailyWh`. A zero load produces no runtime estimate. No recharge is assumed.
- **Checklist progress:** checked applicable tasks / applicable tasks. This is not a safety score or verification of inventory.

All tiers are cumulative. `normalize` bounds imported values and filters recognized hazards. Pet water defaults to a placeholder of 0.25 gallons per animal/day; users must replace it with actual requirements. It does not calculate animal physiology.

## Tests and PDF rebuild

```bash
node scripts/test-engine.cjs
node --check dist/app.js
python3 -m pip install -r requirements.txt
python3 scripts/build_pdf.py
python3 scripts/build_pdf.py --beginner
python3 scripts/build_sources.py
```

The PDF generator uses DejaVu fonts from `/usr/share/fonts/truetype/dejavu/` (Linux). Install the fonts or adjust `FONT` for another operating system. It writes the full or beginner PDF and a corresponding layout-bound check. Re-render and visually review after edits; numerical bounds alone do not prove correct layout. Update the page count in navigation and this README if content changes.

The source directory currently has 31 entries. If sources change, update `docs/sources.json` and run `scripts/build_sources.py`; the generated directory is static, not generated at runtime. Keep PDF and app assumptions synchronized.

## Privacy and limitations

- Plans remain in `localStorage` under `ready-together-v1`; there is no application database. Hosting infrastructure can still collect ordinary request metadata.
- Existing version-1 plans without an experience field reopen in Advanced mode to preserve their technical assumptions. New plans default to Beginner.
- Export format: `{ "version": 1, "exportedAt": "ISO timestamp", "plan": { ... } }`. Treat exported plans as private. Clearing browser data, using private browsing or changing device/origin can lose saved data.
- Never commit names, addresses, medical details, IDs, access codes, supply locations or exported personal plans. `.gitignore` excludes the default export filename pattern.
- The town/state field is a label only. Regional presets are editorial prompts, not geocoding, real-time warnings, flood-map analysis or official risk scoring.
- Care, drinking-water treatment, electrical work, fuel storage and evacuation require current official/product/professional guidance. Medical flags create planning tasks; they do not diagnose, prescribe or validate device compatibility.
- This is an educational version 1.1. It does not include shopping price feeds, live alerts, account sync, inventory-by-product or guaranteed offline caching.

## Maintaining and sharing

Content reviewed November 16, 2026. Before each hazard season, verify source links and local resources. Use issues/PRs to propose improvements; include the authoritative source for safety-sensitive changes. Add tests for changed formulas and visually inspect rebuilt PDFs. Keep private household data out of bug reports and screenshots.

The original project materials can be shared and adapted for household preparedness education with attribution to Ready Together. Third-party sources remain under their own terms. See `LICENSE.md` for the project grant and scope.
