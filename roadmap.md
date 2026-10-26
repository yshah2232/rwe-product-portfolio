# Current task
- [x] Separate admin login and protected testing and analytics workspace.
- [x] Replace admin password securely.
- [x] Verify rejected credentials and signed-out redirects; all three admin services reject invalid sessions.
- [x] Verify successful login with the actual account (confirmed by user 2026-10-26, screenshot of admin workspace).
- [ ] Verify sign out and saved-evaluation readback with the actual account (low effort; user can confirm during next admin visit).

# Backlog (PRD order)
- [x] Module 3 — Barriers & Access Phase 1 (lean): /cohorts/:id/barriers with LEP + poverty per site, site_barriers + acs_barriers_cache tables, ctg-barriers-compute edge function, barrierScore tests. Built 2026-10-26.
- [ ] **BLOCKED: Census API key.** Census API began requiring an API key in 2026 (keyless requests get HTTP 302 missing_key.html). User must register a free key at api.census.gov (email signup) and save it via the secure secret form as CENSUS_API_KEY. Until then barrier scoring AND fresh ACS demographics both show "not configured" states; cached ACS rows still serve.
- [ ] After key saved: verify live compute on QA cohort, verify acs-demographics serves fresh counties again.
- [ ] Cohort save/reopen funnel improvements (below instrumentation targets)
- [ ] Bot challenge UI (Turnstile widget for suspicious sessions)
- [ ] Module 3 Phase 2 (drive-time, broadband, transit, rural designation) — deferred
