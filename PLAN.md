# PLAN.md

## Current

_(none)_

## Planned

_(none)_

## Done

### Phase: gold-janus theme — Done (2026-11-15)

**Goal:** Replace the Sunset theme with `frontend/gold-janus-theme.css`: gold on black in
dark mode, gold paired with a muted teal, semi-flat surfaces, radius unchanged (10px).

**Decisions:**
- Janus has no secondary-accent token, so the teal is `--janus-focus` and `--janus-info`
  (focus rings, links, info tones); gold is `--janus-accent`.
- Semi-flat: surfaces sit just above the background (contrast 1.06 dark, 1.08 light) and
  are outlined by borders; `--janus-shadow`, used only by popups, is short and soft.
- Light mode uses a dark gold (`#7a5808`) and dark teal so text in those colours stays
  readable on near-white.
- The app is always dark: `Page.js` sets `<BaseTheme mode="dark" />`. The light tokens
  stay in the theme file for apps that use `mode="system"` or `"light"`.

**Validation:** every text colour reaches at least 5.4:1 on surface, raised and
background in both modes (WCAG AA is 4.5), and `--janus-border-strong` (field borders)
at least 3.2:1. The running app in Chromium, dark and light: the tokens apply, no
console errors, checked by screenshot. `npm run check` exit 0 (lint 5 files, format 11
files clean, `tsc` clean, 10/10 tests).

**Limitations:** checked in Chromium only. Gold is used where Janus uses the accent
(buttons, tints, links in BaseTheme); headings and body text stay warm off-white.

### Phase: januse lint and format in the gate — Done (2026-11-14)

**Goal:** Lint and format the example with januse from janus-elements, and make both part
of `npm run check`.

**Steps:**
- [x] `npm run lint`, `format`, `check-format` scripts; `check` runs lint and the format
      check before `tsc` and the tests
- [x] Format applied once (10 files, whitespace and line breaks only)
- [x] README and AGENTS.md describe the gate

**Decisions (2026-11-14):**
- Format `backend/`, `test/` and the hand-written frontend files; lint only the
  hand-written frontend files. januse lint has no Node globals for consumer projects, so
  backend and test lint stays with `tsc`. No janus-elements change for this.
- Files are listed by name in `package.json`: `frontend/` also holds the generated
  `client.js`/`client.d.ts` and the synced `frontend/lib`, and januse has no ignore option.
- `frontend/index.html` was left out at first: januse flattened its import map and needed
  two passes. Fixed in janus-elements `9cabe2e`; added back after re-pinning
  janus-elements (`9cabe2e`) and gold-janus (`fb30acc`).

**Validation:** before formatting the gate stopped at `format --check: 10 file(s) would
change`; after, `npm run check` exit 0 (lint 5 files clean, format 10 files clean, `tsc`
clean, 10/10 tests, about 3 s). The running app, before and after formatting, in Chromium,
Firefox and WebKit: same page text and same position and size for all 54 elements, no
console errors.

**Limitations:** new frontend files must be added to the lists in `package.json`;
`frontend/gold-janus-theme.css` is not formatted (januse does not format CSS).

### Phase: Consistent user index types; dev on localhost — Done (2026-11-14)

**Goal:** From the second review: every user-index parameter is a `number` (2), dev mode
is reachable from this machine only (10.4, via gold-janus), and `CLAUDE.md` exists as
`AGENTS.md` says (10.5).

**Steps:**
- [x] Acceptance tests first
- [x] `updateUser`, `getByIndex`, `deleteUser` take `index: number`; non-integers give 400
- [x] `UsersTable` passes numbers
- [x] `CLAUDE.md` → `AGENTS.md` symlink

**Done when:**
1. All three index methods accept a number and reject a string or a non-integer with 400.
2. Started like `npm run dev`, the app answers on 127.0.0.1 and refuses connections on the
   machine's other addresses.

**Decisions:** Integer check in the API (`Number.isInteger`), since the validator only knows
`number`.

**Validation:** `npm run check`, with the local gold-janus linked into `node_modules`:
10 tests, 10 pass, about 2.8 s (twice). The index tests were written first and failed (5
failures) against the string-index API. The dev-mode test ran rather than skipped: this
machine's LAN address refused the connection.

**Final validation:** after gold-janus was pushed and pinned (now `ac60309`), `npm run check`
against the real install, no link: 10/10.

### Phase: Adopt hardened gold-janus; add a test gate — Done (2026-11-14)

**Goal:** Apply the example-side fixes from the 2026-11-14 review (items 5.3, 7.1,
10.1–10.4) and use the hardened gold-janus API (`ApiError`, `nextEvent()`).

**Steps:**
- [x] `npm run check` = `tsc --noEmit` + `node --import tsx --test`; AGENTS.md names it
- [x] Acceptance tests over HTTP against the running app, written before the code
- [x] Stream generators wait with `nextEvent()`, which stops on disconnect
- [x] Invalid user index throws `ApiError(400, …)`
- [x] `tsx` moved to `dependencies` (it runs `npm start`)
- [x] Page subtitle says gold-janus; PLAN/README match reality

**Done when:**
1. `npm start` serves `/` and `/client.js`.
2. Users: create, update, delete round-trip through `/gold_request` and appear on the
   `/gold_sse` users stream.
3. A cross-site form post to `deleteUser` gets 403 and no user is removed.
4. `createUser` with a malformed user gets 400; an out-of-range index gets 400
   "Invalid user index".
5. An image upload reaches the image stream and leaves no temp file behind.
6. `tsx` is listed under `dependencies`.

**Decisions:**
- Test runner: `node:test` via `tsx` (approved 2026-11-14).
- Acceptance runs over HTTP only; no browser automation (would need a new dependency).
- Depends on unpushed gold-janus changes; validated against the local checkout linked into
  `node_modules` for the run, then restored.

**Validation:** `npm run check` with the local gold-janus checkout linked into
`node_modules/gold-janus` (installed copy moved aside, restored afterwards): `tsc --noEmit`
clean; 6 tests, 6 pass, about 2 s. All six criteria are tested in
`test/acceptance.test.ts`; written first, it failed only on criterion 4 (plain `Error`
became a generic 500) until the API used `ApiError`. Manual `gild({dev:true})` smoke on a
spare port: page served with the HMR script, `Users.getByIndex` answered, `/client.js` 200.

**Final validation:** after gold-janus was pushed and reinstalled, `npm run
check` against the real install, no link: `tsc --noEmit` clean, 6/6 pass.

**Hardening findings:**
- `package-lock.json` changed only by `tsx` and its esbuild/fsevents subtree losing
  `"dev": true`; git dependency pins unchanged.
- The acceptance test checks temp uploads by listing the shared `os.tmpdir()/gold-uploads`
  before and after; another app uploading at the same moment could make it fail spuriously.

**Limitations:**
- No browser tests; the UI is checked by hand.
- Out of scope and unchanged: users are addressed by list position (review item 6),
  `getByIndex` is unused, `setImage` accepts any content type (item 4.2).

### Phase: Wire gold-janus + stock januse — Done

**Goal:** Depend on `gold-janus` and `janus-elements` from GitHub; drop the custom UI
server; serve UI and API from one process.

**Done when (at the time):**
1. `npm run dev` uses januse through `gild({dev:true})` — met
2. API imports `gold-janus` — met
3. Production start still works — met

**Validation (at the time):** `npm install`, `npm run dev` (UI and API on `:3010`),
`npm start`. Earlier notes about `file:../gold-janus`, CORS, `clientBaseUrl` and
`npm run build` describe a setup that no longer exists.

### Phase: Port frontend to Janus + keep gold-ts — Done

Superseded by the phase above for the API dependency; Janus UI remains.
