# Last Z Alliance Planner

Member website: https://samuelmm97.github.io/lastz-alliance-planner/

Members choose screenshots, enter their construction bonus, confirm detected buildings, and submit a plan. No login is required. The same browser's next submission updates its existing plan. Different devices produce separate submissions; names are self-reported, not verified game identities.

Leaders use **Alliance access** in the footer and enter the leader key. The key is checked on the server; it is never shipped in the public website. The local key file is `.local/leader-access.txt`, excluded from Git. Share it only with alliance leaders. Only a hash is configured in the backend.

## Hosting

GitHub Pages hosts the member interface. A separately deployed Sites/Cloudflare Worker with D1 stores confirmed plans. `public/config.json` contains its public API URL. Backend source is in the separately tracked `alliance-backend` checkout, excluded from this public repository. Its `.openai/hosting.json` retains the actual backend project ID.

The public website contains no screenshots, account snapshots, tokens, or leader credentials. English OCR runs locally using vendored Tesseract.js files. Screenshots are temporary and not stored or sent to the backend. Only the name, speed bonus, confirmed buildings and plan text are sent after pressing Submit. A device-local draft and random update token are stored in the browser. Leaders can see up to the 500 most recent submissions. Rate limits apply per connecting IP (30 API requests/hour).

## Development

Requires Node 22 or newer.

```sh
npm ci
npm test
npm run dev
npm run build
```

The GitHub Actions workflow publishes `dist` on pushes to `main`. Paths are relative for GitHub project Pages. OCR worker, core and language data are served from the same origin. Fonts come from Google Fonts with system-font fallback.

## Planning boundaries

Reuses the previous personal planner's community building dataset (32 building types, 1,120 transitions). Attribution and source URLs remain in `public/buildings.json`. Data imported October 1, 2026; it is not an official or universally verified game dataset. Missing electricity cost is unknown. No resource inventory, affordability, queue availability, alliance-help reduction or temporary buff expiry is inferred.

Construction time = base time / (1 + speed bonus / 100). Input is the total bonus; do not add hero/VIP components again. Buildings marked already upgrading are skipped. OCR is less capable than the previous agent's visual interpretation; it reads English labels and levels, not unlabeled building icons. Unreadable levels stay blank for member confirmation. Duplicate instances are retained. A screenshot's displayed upgrading level is not assumed to be its target level.

HQ requirements lead the recommendations when available; unknown prerequisites remain flagged. Each suggestion is an independent scenario for one available builder, not a multi-builder queue or a shared resource spending ledger. Speedups are a member-entered budget. The plan does not establish that resources are affordable or that any game action occurred.

Full Preparedness follows the community six-block/four-hour calendar. The default game clock is UTC−02:00, corroborated in the owner's game October 1, 2026. All future recurrence and scoring remain estimates. Dates render in each member's browser timezone, including DST. Tuesday Shelter and Friday Balanced are construction overlap candidates; members must confirm their current scoring task lists. The tool does not project exact points/rewards or send unattended notifications.

Backend checks: `node --test tests/security.test.mjs` from the backend checkout, after its build. These exercise actual SQL storage with SQLite plus leader authentication, input validation, updates and rate limiting.

## Third-party assets

Tesseract.js and tesseract.js-core: Apache-2.0, https://github.com/naptha/tesseract.js. English trained data: https://github.com/naptha/tessdata. See `public/vendor/` license files. Community building data: https://wild-hoggs.com/tools/building/ (unofficial fan data).

## Other upgrade goals
Research uses a lazily loaded community catalog (4,075 transitions across 21 trees), its own speed bonus, tree-qualified technology IDs and level zero. Ambiguous screenshot labels require a tree selection. Missing laboratory, research and season requirements remain explicit unknowns; timing assumes they are satisfied.
Heroes (including equipment), vehicles and training have simple confirmed manual goals. Portrait recognition and automatic hero/vehicle cost inference are not implemented. Optional owned/needed quantities refer to one identical item, not total affordability. Training duration is the adjusted in-game batch timer, never divided by speed again. Each goal independently targets matching Full Preparedness and Duel/Balanced windows; resources are not reserved between scenarios. These categories share a readable summary with leaders, and drafts stay on the member device. Research-only and other-only submissions are supported.
