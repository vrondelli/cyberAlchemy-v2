# Refine Seed Proposal — assimilation A1/A2 build readiness

- **run_id:** 20260629-assimilation-a1-a2-build
- **target:** the two ASSIMILATE-NOW candidates from the external-assimilation dispatch — A1 (spec-semantic validator hook) + A2 (terse concrete-syntax seed) — in `implementation/domainspec/`
- **preset:** compact · **research:** no-research (all local)
- **source:** [ASSIMILATION-TABLE.md](../../../domainspec-v2/research/2026-06-29-external-assimilation-allium-grain-glyph/ASSIMILATION-TABLE.md) (A1, A2 rows + DO-THIS-NOW)

## Precedent (verified inline this run — build-from-owned)

- **A1 validators exist:** `tools/validate-relationships.ts`, `tools/validate-doc-links.ts`, and the engine CLI
  `tools/test-derivation-engine/src/cli.ts` exposes a `lint` command (`tsx src/cli.ts lint`, scripted as `lint:docs`).
  `implementation/domainspec/.claude/settings.json` has **no validation hook today** → A1 is pure wiring of owned
  validators into a fail-closed PostToolUse hook. Genuine gap, S cost.
- **A2 grammar surface exists:** `tools/test-derivation-engine/src/grammar/` + `src/formal/{ast,eval}.ts` already
  implement a grammar + formal AST + evaluator → A2 is "extend the existing grammar to a terse concrete syntax that
  desugars into the taxonomy," NOT a new PEG from scratch. More owned than the table assumed; cost downgraded S–M.

## Done criteria

A build-ready non-executed plan: A1-first sequence, the exact owned commands the hook invokes, acceptance criteria,
and the A2 extension point on the existing `formal/` grammar. Claim ≤ proof; build-from-owned (no re-building owned validators/grammar).

## Write scope

Run folder only (`projects/domainspec-v2/development/refinement-runs/20260629-assimilation-a1-a2-build/`). The build
itself (editing `implementation/domainspec/`) is a Task Session next-route, not this run.
