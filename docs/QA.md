# Version 1.1 verification

Reviewed November 16, 2026.

- 17 automated engine tests passed: household totals across all tiers; infant/pet handling; water overrides; inventory bounds; battery math; input normalization; cumulative task IDs; personal-needs modules; JSON round trip; beginner water buffer/rounding; preserved technical assumptions; separate meal-day inventory; experience/duration independence; communication goals; new field bounds.
- JavaScript syntax checks passed.
- Browser: Beginner hides the detailed power and assumptions fields; Advanced and Intermediate show them. Family starter targets show 18 gallons with the visible heat buffer and three days of meals. Advanced shows the entered one-gallon baseline (12 gallons).
- Browser: one-adult Beginner with a 30-day goal shows 45 gallons with heat buffer, 30 days of meals, and a 28-day gap after entering two stored days. Medical selection adds a specific backup/relocation message. Reload preserves experience, household and duration.
- Browser: across-town communications change from a simple helper/test recommendation to the detailed comparison and advanced MQTT/off-grid mesh acceptance test.
- Browser: the default plan was restored after testing. Mobile layout reviewed in a 390px iframe; body width and scroll width both 375px, without horizontal overflow.
- Version 1.0 browser checks also covered checkbox progress, filters, JSON export/reset/import and the print action. Updated PDF downloads resolve locally. Personalized print pagination was not independently captured.
- PDFs: full guide 37 pages, approximately 10,359 extracted words and 31 external source links; beginner guide 9 pages, approximately 2,144 words and 11 source links. All rendered contact sheets reviewed, with detailed inspection of water, power, radio and mesh pages. Builder page bounds passed.
- Regional presets are editorial prompts, not live weather, geocoding or property-level analysis. Radio range and device compatibility require real local tests; no physical equipment was tested for this project.
