# S06 — Design: the build plan

**Stage:** invoke design · **status:** pass · selected route: **A1 first, then A2**

## A1 — spec-semantic validator hook (do first; S cost)

**What:** a fail-closed **PostToolUse** hook in `implementation/domainspec/.claude/settings.json` that runs the
*owned* validators when a spec doc under `docs/features/**` is written, surfacing diagnostics to the model.

**Components (all owned — wire, don't build):**
- `tsx tools/test-derivation-engine/src/cli.ts lint` — the doc-semantic lint.
- `tsx tools/validate-relationships.ts` — relationship integrity.
- `tsx tools/validate-doc-links.ts` — link integrity.

**Shape:**
- `hooks.PostToolUse` matcher on `Write|Edit` where the path matches `docs/features/**/*.md`.
- A small runner script (e.g. `.claude/hooks/spec-validate.mjs`) that resolves the written path, runs the three
  validators scoped to that feature, and emits non-zero + the diagnostics on failure (fail-closed).
- Borrow the **multi-IDE "show-once" install-notice** UX from allium's `hooks/allium-check.mjs` (per-machine marker)
  so a missing toolchain warns once, then stays quiet — never spam.

**Acceptance:** writing a spec doc with a broken relationship/link triggers the hook and surfaces the diagnostic; a
clean doc is silent; a missing `tsx`/node toolchain prints the one-time notice and does not hard-fail the session.

**Why first:** it is the only conceded genuine gap, S cost, and it makes spec-semantic validation *automatic instead
of remembered* — which de-risks every subsequent spec edit, including A2 iteration.

## A2 — terse concrete-syntax seed (second; S–M cost)

**What:** extend the **existing** grammar (`src/grammar/index.ts`) + formal AST (`src/formal/ast.ts`) to accept a
terse single-file concrete syntax whose every production maps to a `TAXONOMY.md` meta-concept, **desugaring into the
existing AST** (which `src/formal/eval.ts` already evaluates).

**Discipline (claim ≤ proof):**
- It is a **syntax skin over the owned engine** — no parallel concept set, no new evaluator.
- Do **not** port glyph's grammar or its Express/Postgres/Zod generators (the table's OVERSHOOT-2): the engine's
  target is *test obligations*, not a running backend. Borrow glyph's `grammar/glyph.peg` only as a design reference.

**Acceptance:** a ~40-line concrete-syntax sample parses into the existing formal AST and round-trips through the
engine (same obligations as the equivalent Markdown spec).

## Layering

A1 = infrastructure/wiring (hook + owned CLIs) → independently shippable, no engine change. A2 = a grammar front-end
over the owned AST → depends only on the existing `formal/` surface, not on A1. Sequence A1→A2 by ROI/cost, not by
hard dependency.
