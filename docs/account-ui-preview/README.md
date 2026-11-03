# Account settings — verification, 2026-11-03

The account menu opens four sections: Personal, Business & roles, Security, and Preferences. The component lives in `src/components/account-settings-dialog.tsx` rather than in the marketplace page.

## Implemented behavior

- Personal: edit the shared display/full name and account province; upload JPG, PNG or WebP images up to 5MB; remove the picture to return to initials. Face presets are no longer offered. Uploads use generated filenames, MIME/signature matching, and fixed image extensions.
- Email and phone: visible as sign-in details, read-only in this screen. The server rejects attempts to change them using the profile endpoint. Email verification reflects the stored timestamp; phone verification is explicitly unavailable.
- Business & roles: edit the name and description for any owned, approved role without switching the active role. Server updates are scoped to the authenticated owner and recheck ACTIVE status at write time. Pending/rejected roles cannot be edited. Role requests, admin feedback, document status, ratings and trust scores come from stored data.
- Security: verify the current password, reject reuse and invalid lengths, hash the new password, guard against concurrent password changes, and clear user/admin cookies in the current browser. Five attempts per account per 15-minute window are permitted in each server process.
- Preferences: language and light/dark/system theme update immediately and persist in browser local storage. These preferences are browser-specific, not synced across devices.
- Loading, load failure/retry, mutation errors, success notices, pending controls, password confirmation, and viewport-contained scrolling are implemented. Closing a pending mutation is blocked; opening role switching while settings are open is blocked.

## Validation

- Unit/regression: **126/126 passed**, including 28 new account tests. Actual route modules run against mocked session/database/filesystem boundaries.
- Production build: compile, TypeScript and prerender **26/26** passed. Built in a disposable Docker container against a read-only source mount, with no access to the live database.
- Edge production frontend checks: **17/17 passed**, no runtime exceptions. API responses are browser fixtures, so this is not a live MySQL integration test. Results are in `checks.json`.
- Existing role/history/chat browser regression: **10/10 passed** after updating the account-menu label.
- Screenshots: `personal-light-desktop.png`, `business-light-desktop.png`, `preferences-dark-desktop.png`, `business-dark-mobile.png`, `security-error-mobile.png`.

To rerun browser checks, serve the current production frontend at `http://localhost:3112` in an isolated test environment, then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/account-ui.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tests/roles-ui.ps1
```

## Scope and limits

No schema or live data was changed. The existing Docker service was not rebuilt or redeployed. Provinces are selected from existing location records, with the current account province retained; location is shared across roles. This change does not create separate business addresses, email/phone change flows, device/session lists, account deletion, or a global session-revocation system.

Password changes clear cookies in the current browser; existing sessions on other devices remain valid until they expire. The throttle is local to each server process and resets on restart; shared production throttling is still needed for a multi-instance deployment. Avatar deletion clears the database reference without deleting files; uploads require persistent storage when deploying containers, and old unreferenced files are not reclaimed by this change. Business descriptions are editable here; this change does not add them to public listing cards.
