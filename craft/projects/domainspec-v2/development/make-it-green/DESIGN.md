---
node_type: design
is_session: false
status: candidate
boundary: INTERNAL — domainspec-v2 impl/ "make it green" design (invoke design mode)
created: 2026-06-29
authored_by: invoke (mode: design)
target_artifact: projects/domainspec-v2/impl (test suite + validation gate)
target_owner: DomainSpec v2 owner
---

# Make `impl/` Green — Design

## Objective

Finish the Batch-1/2 **reformulation** that node-instantiation flushed out: make every check in
`projects/domainspec-v2/impl/` pass on its own. This is the "tests-green" half of the build-proof
(build-standalone is already proven).

## Target state ("green" = all RC 0, from `impl/`)

```
npm run engine:test   # the engine's own vitest suite
npm run tags:test     # the code-tag tooling tests
npm run typecheck     # already green
npm run validate      # C9 docs + C11 rels + C10 engine-lint (validation governance gate)
```

## The three diagnosed gaps (root causes, cited)

| Gap | Root cause | Evidence |
| --- | --- | --- |
| **G1** engine `l3-domain-rules` fails | tests read external corpora by relative path; `AEO_DIR` → `projects/domainspec-v2/docs/features/agent-execution-orchestrator` (absent); `FS_DIR` → repo-root `validation/poker-team/…` (resolves only by depth coincidence) | `src/grammar/l3-domain-rules.test.ts:13-20` |
| **G2** tag tests "no suite found" | files are **`node:test`** (`import test from "node:test"`), run under `vitest`; harness calls **`pnpm dlx tsx`** (no pnpm in v2) | `governance/tags/tools/tests/*.test.ts:12,23` |
| **G3** `npm run validate` not runnable-green | validators target v1 paths (`docs/features/`, repo-root `RELATIONSHIPS.md`); v2 has no feature packs | `tools/validate-doc-links.ts:13`, `tools/validate-relationships.ts:27-34` |

## Design decisions

- **D1 — Fixture strategy = SELF-CONTAINED (relocate into v2).** Copy the two corpora into
  `impl/test-derivation-engine/__fixtures__/` and repoint the test paths to them.
  *Rationale:* the freeze goal (v2 standalone, v1 frozen) forbids tests resolving into v1 paths.
  *Alternatives rejected:* repoint-at-v1 (couples to the frozen tree); synthetic fixtures (loses real-corpus coverage). Fixtures are **test data**, legitimately brought (distinct from the manifest's "leave v1 production data").
- **D2 — Tag tests run under `node:test`, pnpm coupling removed.** Fix the `tags:test` script to use
  the node test runner via tsx (`tsx --test …`), and replace `pnpm dlx tsx` → the local tsx
  (`node_modules/.bin/tsx`) in `runTsxScript`. *Rationale:* match the code's actual runner; v2 is npm.
- **D3 — Validators retargeted to the v2 spec surface.** Make the features-root + relationships path
  configurable/default to v2 (`impl/spec/RELATIONSHIPS.md`; an `impl/spec/features/` surface), and seed
  **one minimal valid feature fixture** so `validate` is non-vacuously green. *Rationale:* C9/C10/C11
  need a v2 surface to enforce against; reading v1 is forbidden.

## Layering (value/cost; each layer green before the next)

- **L0 — engine suite green** (G1): the build-proof fully green; smallest unit proving "v2's core builds + tests pass standalone."
- **L1 — tag tooling green** (G2): drift-governance tooling verified.
- **L2 — validation gate runnable** (G3): `npm run validate` green; C9/C10/C11 *enforce*, not just declared.
- **L3 — hardening:** wire `validate` + the owned fail-closed PostToolUse hook into CI / pre-commit so green stays green.

## Boundaries

Read-only on v1 (copy fixtures *out*, never edit v1); the engine `src/rules` moat untouched; no new
runtime deps (only test-runner wiring); claim ≤ proof — "green" is the named commands at RC 0, nothing more.
