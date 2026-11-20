# FRICTION.md

## `null` holes in Janus `html` templates

Interpolating `null` into `html\`...\`` leaves a null child. Nested components
that re-render those children (e.g. `Panel` via `${this.childElements}`) throw
(`typeof null === "object"` then `.tagName`). Prefer `""` or omit the branch.
**Status:** resolved upstream in janus-elements `09fb3f3` (`null` / `false` / `true`
in template content render nothing, like `undefined`).

## Validating against an unpushed sibling package (2026-11-14)

**Rule:** "Use the entry points `README.md` documents"; validation counts only "for the
same code and environment".
**What happened:** the example's changes need the new gold-janus exports, but
`node_modules/gold-janus` is a git install pinned to the old commit. The suite was run
with the local gold-janus checkout symlinked into `node_modules` (installed copy moved
aside and restored afterwards), so the result covers the local code, not what
`npm install` produces today.
**Cost:** a manual swap per run, and a phase that stays open until gold-janus is pushed.
**Status:** resolved 2026-11-14: gold-janus pushed; suite passes against the real install.
