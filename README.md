# Last Z Alliance Planner

Member website: https://samuelmm97.github.io/lastz-alliance-planner/

Members choose screenshots, enter their construction bonus, confirm detected buildings, and submit a plan. No login is required. The same browser's next submission updates its existing plan. Different devices produce separate submissions; names are self-reported, not verified game identities.

Leaders use **Alliance access** in the footer and enter the leader key. The key is checked on the server; it is never shipped in the public website. The local key file is `.local/leader-access.txt`, excluded from Git. Share it only with alliance leaders. Only a hash is configured in the backend.

## Hosting

GitHub Pages hosts the member interface. A separately deployed Sites/Cloudflare Worker with D1 stores confirmed plans. `public/config.json` contains its public API URL. Backend source is in the separately tracked `alliance-backend` checkout, excluded from this public repository. Its `.openai/hosting.json` retains the actual backend project ID.

The public website includes owner-approved example screenshots, but no member uploads, private account snapshots, tokens, or leader credentials. English OCR runs locally using vendored Tesseract.js files. Screenshots are temporary and not stored or sent to the backend. Only the name, speed bonus, confirmed buildings and plan text are sent after pressing Submit. A device-local draft and random update token are stored in the browser. Leaders can see up to the 500 most recent submissions. Rate limits apply per connecting IP (30 API requests/hour).

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
Heroes (including equipment), vehicles and training have simple confirmed manual goals. Portrait recognition and automatic hero/vehicle cost inference are not implemented. Optional owned/needed quantities refer to one identical item, not total affordability. Training duration is the adjusted in-game batch timer, never divided by speed again. Research and vehicle goals target matching Full Preparedness and Duel/Balanced windows. Hero EXP targets Heroes Full Preparedness; other hero goals use their eligible Duel day. Natural training targets the next feasible training Full Preparedness window. Resources are not reserved between scenarios. These categories share a readable summary with leaders, and drafts stay on the member device. Research-only and other-only submissions are supported.

## Live timeline and visual inventory guide
The homepage shows 42 consecutive four-hour Full Preparedness windows with a live Now marker and second-by-second countdown. Local timestamps follow the selected game-clock offset. Users can swipe, browse forward, select a window, or return to now. Matching Duel/Balanced windows are highlighted but actual scoring eligibility must be confirmed in-game. Screenshot guides use responsive numbered HTML overlays on the alliance owner's five original warehouse images; counts are examples, not a member's inventory. Wrench/blueprint icons remain explicitly unverified candidates. No OCR inventory identification or automatic allocation of consumables is implied.

## Building List screenshot reading
Portrait, four-column Building List screenshots are read one card at a time. Each card's name is paired with its own level above it, preserving separate copies of the same building. Adaptive grayscale cleanup preserves the outlined white level digits, and a confident digits-only pass resolves common outline artifacts. Visible green timer bars mark buildings already upgrading. Other layouts retain the normal text reader; unclear levels remain blank for manual confirmation.

Verified in the browser against the owner's four example Building List images. Unit regressions cover level/name pairing, grid geometry, weak OCR rejection and running-upgrade detection. Uploaded screenshots and OCR results remain on the device until members submit confirmed plan details. Reading again adds entries without overwriting existing manual edits.

## Timeline spending and natural training
The timeline recommends construction/research/training speedups and eligible vehicle materials only in matching Full Preparedness + Alliance Duel windows (including applicable Balanced-day overlaps). Other windows say to save them and show the next overlap. Hero EXP is labeled Full Preparedness only; hero shards, skill books and equipment are not assumed to score in Heroes Full Preparedness. The hero goal form explicitly separates level-up EXP from Duel materials, and plan summaries use the corresponding single-event label. The warehouse guide is an item reference, not blanket permission to spend.

Members can enter the training batch timer as hours and minutes directly above the timeline. Named troop goals from the review form feed the same timeline. Start and finish markers target the next feasible training Full Preparedness window, with a one-minute margin at its beginning; the adjusted in-game timer is used as entered, without speedups or a second speed-bonus adjustment. Active goals are skipped. Each goal is an independent queue scenario; camp availability and parallel batches must be confirmed by the member. The timeline timer is remembered on-device; named troop goals are included in submitted plan summaries.

Scoring references checked October 5, 2026: https://last-z.wiki/events/full-preparedness-event/ and https://lastz.guide/events/alliance-duel/. The owner's instruction governs Hero EXP timing; current live task lists remain the final check. Existing server calendar assumptions are unchanged.

## Screenshot support and building artwork
Screenshot help displays a support code and website version, with Report screenshot issue and Copy diagnostics buttons. Automatic diagnostics record image counts and dimensions, reader stages, duration, missing-level counts, corrections, cancellations and failures, plus broad browser/platform categories. No screenshots, OCR text, filenames, member names or credentials are included. Failed sends retain up to 50 events locally for retry. Leaders see seven-day activity and recent issues under Alliance access after entering their key. The backend limits records to 2,000 and removes records older than seven days on subsequent writes; diagnostic requests have a separate rate limit from plan submission.

Saved building lists are not automatically re-read. To refresh old results, select Replace my current building list with these screenshots and read the originals again. Missing levels are highlighted and can be filtered. Conflicting readings remain blank for confirmation. Safari image decoding has an Image fallback. The four supplied examples were verified with all 55 upgradeable levels and four running upgrades.

Building review and recommendation rows use matching artwork from the owner's example screenshots. The 29 available building types have explicit name-to-image positions; other types use neutral initials instead of unrelated artwork.

## Contextual item highlights
The timeline's screenshot guide follows the selected Full Preparedness and Duel window. Construction, research and training speedups are highlighted only in matching Duel/Balanced overlaps. Save-only and natural-training windows show instructions without highlighted consumables. Heroes windows explain Hero EXP without highlighting warehouse books or shards; vehicle windows omit unverified wrench/blueprint candidates. Independent inventory tabs have been removed so members cannot accidentally show a conflicting spending image for the selected time.

## Failure-triggered Hermes recovery and Telegram
Anonymous observability is POSTed to `https://lastz-alliance-plans-api.samuelm.chatgpt.site/api/diagnostics`, stored in the existing backend D1 diagnostics table, and readable only with the leader key. Leaders use Alliance access → Screenshot & upload health. This is already a backend-backed service; GitHub Pages hosts the frontend only. Screenshots, OCR text and credentials are never included in diagnostics.

The owner's Windows task `Last Z Alliance Planner Health` runs `ops/health_monitor.py` every five minutes and at logon. It runs while this PC is on and the owner is signed in; this is not a cloud 24/7 agent. It reads the latest 200 diagnostic records (server storage retains up to 2,000 records over seven days), groups retries per support code/version/category/day, queues incidents durably and starts at most one eight-minute Hermes run per hour. Task Scheduler prevents overlapping monitor instances and restarts failed tasks. Backend outages require two consecutive failed polls. Healthy checks make no AI calls. Telegram uses the existing privately paired helicopter bot; no Telegram credentials or leader key enter the website. The existing helicopter launcher's executable probing and Hermes environment setup are reused without changing that watcher.

Local configuration is `.local/health-monitor-config.json`. Status, queued incidents, notification outcomes and Hermes results are under `.local/health-monitor/`; these are ignored by Git. Inspect task state with `Get-ScheduledTaskInfo -TaskName 'Last Z Alliance Planner Health'`. Use `python ops/health_monitor.py --check` for a read-only connectivity/incident check. `--diagnose-only` invokes Hermes without allowing source edits. Cancellation and healthy/manual readings do not trigger recovery. A reported failure does not imply the cause can be repaired without the original screenshot; missing reproduction evidence returns needs-follow-up. Verified frontend fixes may be tested and published; backend fixes require the Sites owner deployment workflow.

The initial diagnostic test reached the live backend, delivered Telegram setup/issue/result messages and ran Hermes. It reported the actual two text-mode iOS failures and correctly left recovery unconfirmed while source edits were in progress and original failed images were absent.

## High-resolution screenshot reading
Grid detection now runs on a normalized-width layout image while individual labels, levels and active-timer detection retain the original image pixels. When the heading is unreadable, repeated building rows plus right-hand-column evidence can identify the grid. A secondary layout pass cannot replace a better detected row set with fewer rows. All 55 supplied original levels still matched; a generated 1320×2868 fixture read 15 of 16 levels correctly and left one uncertain level blank. This is coverage for resolution handling, not verification against the member's unavailable original failed images.

Real game examples captured October 5, 2026: hero roster, EXP, skill books, shards; research trees, costs, bonus and queue; active troop batch; vehicle level and named material tooltips. Portrait panels are cropped from the game to exclude surrounding chat. These examples identify fields and materials; they do not confirm event eligibility. No upgrades, purchases or item use were performed during capture. Active remaining timers must not be entered as full new-batch durations.

