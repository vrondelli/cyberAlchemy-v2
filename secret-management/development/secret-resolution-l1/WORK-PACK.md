---
workPackId: projects/secret-management/development/secret-resolution-l1/WORK-PACK.md
status: selected-one-unit
workPackGateStatus: ready
admissionTiming: selected-unit-at-task-session
selectedUnit: SWU-SEC-002A
authorityClass: private
publicationClass: internal
updatedAt: 2026-08-16
---

# Work Pack — Secret Resolution L1

## Objective

Prove one provider-neutral fake-local grant/resolver/lease transaction in the
independent secret-management project, while keeping SOPS, CLI, provider,
migration, and production work explicitly blocked.

## Source And Authority

- Current product authority: live bytes under `projects/secret-management`.
- Historical planning source: the 2026-08-12 secret-store refinement run under
  `projects/lucifers-lights`; it remains immutable source evidence.
- Current user selection: apply the recommended L1 split and run one Task
  Session for L1A.
- Evidence ceiling: candidate-local, single-process, single-threaded CPython
  3.12; no production or real-secret claim.

## Current Evidence Snapshot

| Evidence | Result | Scope |
| --- | --- | --- |
| secret L0 unittest discovery | 6/6 pass | opaque reference/redaction only |
| ElevenLabs static projection | 7/7 pass | no secret resolution/provider effect |
| voice network-denied | 3/3 pass | no socket/DNS/runtime network |

The snapshot satisfies the local dependency for L1A only.

## Task Board

| Task/SWU | Layer | Primary Behavior | Status | Execution Route |
| --- | --- | --- | --- | --- |
| `TASK-SEC-001` / `SWU-SEC-001` | L0 | opaque reference and redacted evidence | candidate-evidence-complete | none; preserve regression |
| [`TASK-SEC-002A`](work-pack/tasks/TASK-SEC-002A.md) / `SWU-SEC-002A` | L1A | one structurally granted fake resolution and bounded consumption | selected-pending-admission | `task-session:execute` |
| `TASK-SEC-002B` / `SWU-SEC-002B` | L1B | SOPS-backed resolver adapter | blocked-policy | decision plus new refresh/readiness |
| `TASK-SEC-003` / `SWU-SEC-003` | L1C | redacted describe/doctor CLI | blocked-dependency | separate selection after L1A |
| later process/cloud/migration units | L2/L3 | external or operational effects | blocked-authority | separate work packs |

## Selected SWU Atomicity

`SWU-SEC-002A` has one behavior: an already-issued structural grant authorizes
exactly one fake resolver call and one bounded callback consumption, while every
pre-resolution rejection makes zero resolver calls. Grant checks, resolver call
count, and lease clearing stay together because only the full transaction proves
the fail-closed boundary. Exports, tests, and README are projections/evidence,
not independent children.

## Exact Product Write Scope

| Path | Baseline | Operation |
| --- | --- | --- |
| `projects/secret-management/secret_management/execution.py` | absent | create |
| `projects/secret-management/tests/test_fake_resolution.py` | absent | create |
| `projects/secret-management/secret_management/__init__.py` | `5635561174f91e0a3384c42c0a08548581981af93bb46aa2102502547610d78d`, 528 bytes | update |
| `projects/secret-management/README.md` | `3ee49baa6680b8477b71892ccae013d8b09de73173adb30419bf1d1eca4e1125`, 774 bytes | update |

No other product writes are admitted.

## Done And Validation Contract

Acceptance-critical done criteria and five structured argv-only validation
commands are normative in `work-pack/tasks/TASK-SEC-002A.md` and mirrored in
`WORK-PACK.json`. They cover valid use, every pre-resolution denial, replay,
callback return/failure, retained view, representation/serialization privacy,
missing mapping, focused/full secret tests, existing voice regressions, static
effect/coupling guards, and exact-target whitespace.

## Execution Policy

- Admission timing: `selected-unit-at-task-session`.
- Execution mode: one unit.
- Current semantic entry: `selection-ready`; Implementation Readiness must emit
  one non-authoritative `SWU-SEC-002A` selection before material admission.
- Task Session must independently verify exact plan, selection, material package,
  producer receipt, context pack, baselines, validation contracts, write algebra,
  and single-use admission.
- Automatic decisions: internal tool choice, bounded capability routing, and
  fresh Task Session resumption.
- Stop decisions: semantic/product choice, scope expansion, destructive or
  irreversible effect, credentials/secret access, external network/message,
  cost/risk acceptance, promotion/publication/deployment, and failed critical
  validation.

Machine projection:
`WORK-PACK-EXECUTION-ENTRY.json`.

## Task Session Closeout Sync Contract

| Field | Contract |
| --- | --- |
| terminal source receipt | `runs/20260816T134104Z/task-session/task-session-terminal-receipt.json` |
| closeout owner | `invoke:refresh:apply-approved` through Continuation Router |
| target inventory | `WORK-PACK.md`, `WORK-PACK.json`, `work-pack/tasks/TASK-SEC-002A.md`, `GAP-LEDGER.md` |
| pass delta | mark only 002A evidence-complete and attach exact receipt refs |
| preserved state | 002B, 003, concurrency, trusted-consumer, cloud, migration, and production blockers |
| owner validation | JSON parse/parity, expected status transitions only, exact receipt digest/ref, scoped whitespace |
| expected owner receipt | project run-local `invoke-closeout-receipt.json` |
| successor policy | unique result is no automatic successor; return blocked choices only |

Closeout authority cannot alter implementation bytes, unblock L1B/L1C, promote,
publish, deploy, commit, or push.

## Blockers And Deferred Scope

The normative ledger is `GAP-LEDGER.md`. In particular:

- SOPS recipient/recovery/CI identity policy remains absent.
- CLI is not selected.
- trusted-callback exfiltration and concurrent replay are outside L1A evidence.
- real credentials, external effects, provider calls, voice integration,
  migration, publication, deployment, commit, and push are forbidden.

## Gate Result

- Plan authoring: ready after exact Invoke material validation and apply.
- Work-Pack audit: plan-once semantic audit required; no unit selected by audit.
- Selected Task Session: only `SWU-SEC-002A`, after selection and material
  admission receipts.
- L1B/L1C/later work: blocked and not executable in this route.
