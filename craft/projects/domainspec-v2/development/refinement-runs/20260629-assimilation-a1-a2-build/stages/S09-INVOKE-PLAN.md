# S09 — Invoke Plan (NON-EXECUTED build sequence)

**Stage:** invoke plan · **status:** pass · building is a Task Session next-route (gate g04).

## SWU-A1 — the spec-validator hook (ship first)

1. Add `.claude/hooks/spec-validate.mjs` under `implementation/domainspec/` — resolve the written path; if it matches
   `docs/features/**/*.md`, run `tsx tools/test-derivation-engine/src/cli.ts lint`, `tsx tools/validate-relationships.ts`,
   `tsx tools/validate-doc-links.ts` scoped to that feature; emit non-zero + diagnostics on failure (fail-closed);
   per-machine show-once notice if the toolchain is absent.
2. Register it in `implementation/domainspec/.claude/settings.json` under `hooks.PostToolUse` (matcher `Write|Edit`).
3. **Verify (P8):** edit a deliberately-broken spec doc → hook fires + diagnostic; edit a clean doc → silent; remove
   `tsx` from PATH → one-time notice, no hard fail.
- **Acceptance:** the three owned validators run automatically on spec-doc writes, fail-closed, no false hard-fails.

## SWU-A2 — the concrete-syntax seed (second)

1. In `tools/test-derivation-engine/src/grammar/`, add a terse concrete-syntax production set; map each production to a
   `TAXONOMY.md` meta-concept and desugar into the existing `src/formal/ast.ts` nodes.
2. Add a round-trip test alongside `src/formal/eval.test.ts`: a ~40-line concrete-syntax sample → AST → same obligations
   as the equivalent Markdown spec.
- **Acceptance:** the sample parses into the existing AST and round-trips; no new evaluator; no backend generators.

## Preconditions / guards

- **build-from-owned:** wire/extend only; do not duplicate `validate-*.ts` or the `formal/` grammar (gate g03).
- **public/private:** edits land in the private `implementation/domainspec/` submodule → submodule-first commit
  discipline; nothing touches public `arcanum`.
- **out of scope:** the Lean Row-2 work (separate run); glyph's generators (OVERSHOOT, refused).

## Recommended next route

A **Task Session** on SWU-A1 first (smallest, highest-ROI, no engine change), then SWU-A2.
