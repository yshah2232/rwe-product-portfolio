# Current task
- [ ] Add on demand comparison AI summary below the data, grounded in registry and Census sources.
- [ ] Add Mr. Trial comparison assistant with a temporary conversation, source links and no clinical verdicts; verify summary and follow up questions.
- [x] Improve PDF hierarchy, grounded takeaways, concise comparison and sourced ACS context. Live two trial report downloaded and all four pages visually inspected. Fixed excess whitespace and an orphaned table row. Takeaways are deterministic, not AI generated verdicts.
- [x] Offer optional anonymous post download rating/comments and admin review, with no search/report linkage. Live submission and signed in AdminCEO readback verified; invalid ratings, extra identifiers, unauthenticated admin reads and direct table reads rejected. 80 tests passed; build clean. One explicitly labeled launch verification submission remains for inspection.
- [x] Correct preview origin blocking: live browser requests with actual hosted preview Origin returned 10 trials for Cancer trials in US (45 candidates, 749 registry matches) and Prostate cancer. Invalid origins return 403 with visible error, not zero results; 12 tests passed.
- [ ] Search relevance review: Prostate cancer retrieves an overly broad registry pool and includes weak matches. Origin blocking is corrected; ranking accuracy must not be described as fully verified.
- [x] Replace public saved cohorts with direct trial comparison (2 to 4 trials). Verified live search, deselection, four trial cap, separate tabs and reload reset.
- [x] Add browser generated PDF report with visible watermark and embedded attribution. Downloaded and inspected six page report; eight unit tests pass and mobile page does not overflow.
- [x] Stop new visitor activity retention in application storage and explain individual temporary activity. Historical records remain; provider and hosting retention is not verified.
- [x] Separate admin login and protected testing and analytics workspace.
- [x] Replace admin password securely.
- [x] Verify rejected credentials and signed-out redirects; all three admin services reject invalid sessions.
- [x] Verify successful login with the actual account (confirmed by user 2026-10-26, screenshot of admin workspace).
- [ ] Verify sign out and saved-evaluation readback with the actual account (low effort; user can confirm during next admin visit).

# Backlog (PRD order)
- [x] Module 3 — Barriers & Access Phase 1 (lean): /cohorts/:id/barriers with LEP + poverty per site, site_barriers + acs_barriers_cache tables, ctg-barriers-compute edge function, barrierScore tests. Built 2026-10-26.
- [ ] **BLOCKED: Census API key.** Census API began requiring an API key in 2026 (keyless requests get HTTP 302 missing_key.html). User must register a free key at api.census.gov (email signup) and save it via the secure secret form as CENSUS_API_KEY. Until then barrier scoring AND fresh ACS demographics both show "not configured" states; cached ACS rows still serve.
- [ ] After key saved: verify live compute on QA cohort, verify acs-demographics serves fresh counties again.
- Cohort persistence retired at user request: direct trial comparison and local PDF download replace saving. Existing diversity and barriers pages are no longer publicly routed because they depended on saved cohorts.
- [ ] Bot challenge UI (Turnstile widget for suspicious sessions)
- [ ] Module 3 Phase 2 (drive-time, broadband, transit, rural designation) — deferred

## QA log 2026-10-27 (5 conditions × desktop, 2 × phone)
- [x] BUG (low): On phones the header toggle label is cut to "Easy?" instead of "Easy read". Fix: shorten to an icon + "Easy read" on small screens.
- [x] ISSUE (medium, fixed: US sites first when query names US/state or browser region is US): "type 2 diabetes" top results were old non‑US trials (South Korea, China), so map and Census box were empty. Display was correct; ranking should favor US / recruiting trials when no location is given.
- [ ] Dev warning: "Function components cannot be given refs" at App level (no visible impact).
- [x] Comparison page: source record row with ClinicalTrials.gov links + visible Not medical advice disclaimer.
- [x] Region view retested: works for all 5 conditions (shows only regions that have sites).
