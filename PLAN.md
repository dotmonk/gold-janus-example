# PLAN.md

## Current

### Phase: Consistent user index types; dev on localhost — Implemented, waiting on gold-janus push (2026-11-14)

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

**Blocked:** against the installed gold-janus (`0010202`) the gate is 9/10; the dev-mode
test fails because that version still listens on all interfaces in dev. Push gold-janus
and reinstall (`npm install github:dotmonk/gold-janus#patriarch`).

## Planned

_(none)_

## Done

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

**Final validation:** after gold-janus was pushed (`0010202`) and reinstalled, `npm run
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
