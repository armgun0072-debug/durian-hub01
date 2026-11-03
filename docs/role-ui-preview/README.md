# Roles, listing history and chat verification — 2026-11-03

- Unit/regression tests: 98/98 passed (`tests/post-roles.test.cjs`, `tests/post-history.test.cjs`, and existing suites).
- Production build: passed compilation, TypeScript checking and 25/25 prerendered pages in a disposable Docker container.
- Edge headless: 10/10 checks passed; no runtime exceptions. See `checks.json` and the screenshots here.
- Chat status, timestamp and icons: computed white `rgb(255, 255, 255)` on emerald `rgb(4, 120, 87)` in both themes; contrast approximately 5.48:1.
- Browser tests use API fixtures injected before hydration. They validate the production frontend; server authorization is covered separately by actual route modules with mocked database/session boundaries.
- No live MySQL integration was run for this change. No schema or live data was changed. The existing service was not rebuilt or redeployed.

The account menu now exposes approved roles at desktop and mobile sizes without signing out. Switching updates the business name and session. Listing forms prevent role switching while open, and the server requires the requested category to match an approved active role. Browsing categories does not change the active role.

History remains scoped to the signed-in user and supports both listing type and status filters. Author role and business identity are resolved from the listing type rather than the owner's current active role. These are not immutable historical snapshots of business names; renaming a business still changes the displayed name.

To repeat the frontend checks, serve the current production build on `http://localhost:3112` in an isolated environment, then run `powershell -NoProfile -ExecutionPolicy Bypass -File tests/roles-ui.ps1`. The script uses Edge at its standard Windows path and a temporary browser profile. It does not connect to the live database.
