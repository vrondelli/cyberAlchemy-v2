---
task: SWU-R3C-003
mode: lean
strict_coverage: pass
created: 2026-07-12
artifact_role: task-session-evidence
---

# Context Pack: SWU-R3C-003

## Objective

Document root DS-D8 as the checker authority, synchronize remediation codes,
and add aggregate wiring only if a stable code-tag extraction input makes the
gate meaningful and fail-closed.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O-001 | Document root authority and current 30-signature consumption. | SWU001 receipt and focused report | covered |
| O-002 | Document active/generated/deprecated/deferred/unknown/wrong-endpoint behavior. | SWU002 tests and CT-COMP-020..025 | covered |
| O-003 | Decide aggregate wiring from current executable inputs. | `package.json`; missing default `governance/tags/code-tags.json` | covered |
| O-004 | Preserve full validation, engine tests, and typecheck. | task validation contract | covered |
| O-005 | Avoid authority or unrelated documentation mutation. | task write scope and owner boundary | covered |

## Selected Sources

1. `WORK-PACK.md` and `TASK-R3C-EDGE.md` SWU-R3C-003 contract.
2. SWU-R3C-001/002 receipts and context packs.
3. `impl/package.json` aggregate and tag scripts.
4. `CODE-TAG-COMPOSABILITY-PATTERNS.md` current pattern projection.
5. `CODE-TAG-REMEDIATION.md` current CT-COMP catalog.
6. `check-code-tag-composability.ts` output contract.
7. Root DS-D8 authority and approved APE refresh.

## Decision

Do **not** add `tags:composability` to `npm run validate` yet. The default
checker input `governance/tags/code-tags.json` does not exist, so aggregate
wiring would fail because extraction state is missing, not because a checked
code graph violates DS-D8. Keep the command explicit and record this as a
future extraction/CI integration gap. This follows the task's instruction to
flag aggregate wiring rather than force it when too broad.

## Write Scope

- `impl/governance/tags/CODE-TAG-COMPOSABILITY-PATTERNS.md`
- `impl/governance/tags/CODE-TAG-REMEDIATION.md`
- no `package.json` change unless validation disproves the missing-input decision
- this task-session evidence directory and work-pack synchronization

## Validation

- `npm --prefix projects/domainspec-v2/impl run validate`
- `npm --prefix projects/domainspec-v2/impl run engine:test`
- `npm --prefix projects/domainspec-v2/impl run typecheck`
- `npm --prefix projects/domainspec-v2/impl run tags:test`
- classified-reference guard through `tools:test`
- `git diff --check`

## Gate Verdict

PASS. SWU001/002 are complete, documentation deltas are explicit, the aggregate
wiring decision is evidence-backed, and all required validation paths exist.
