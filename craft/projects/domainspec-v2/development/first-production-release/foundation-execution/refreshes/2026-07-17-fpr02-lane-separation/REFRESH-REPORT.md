---
mode: refresh
phaseStatus: pass
mutationMode: apply-approved
refreshed_at: 2026-07-17
---

# Invoke Refresh Report: FPR-02 Lane Separation

## Result

The operator-directed refresh separates FPR-02 into two independently resumable lanes:

- `FPR-02B` owns the 13-type backend first-release profile, product and pilot decisions, claims, negatives,
  rollback, callback/origin, redaction, accountable owners, and stable digest.
- `FPR-02U` owns the required eleven-concept UI development profile and its later DS-D1, DS-D8, and
  supported-profile owner packet.

The lanes share the ratified FPR-01 baseline and existing compiler/graph contracts, but have no cross-lane
completion dependency and no implicit join. `FPR-02B` remains blocked by four backend decision groups.
`FPR-02U` has `SWU-UIP-001..004` complete and `SWU-UIP-005` next. Neither status changes the other.

## Typed refresh signals

| Signal | Type | Applied meaning |
|---|---|---|
| `RS-FPR02-LANE-001` | `route_changed` | FPR-02 became a coordination parent with backend and UI child lanes. |
| `RS-FPR02-LANE-002` | `blocker_resolved` | UI admission and UI completion were removed from backend entry and exit gates. |
| `RS-FPR02-LANE-003` | `status_changed` | The backend gate now records one resolved split decision and four remaining backend decision groups. |
| `RS-FPR02-LANE-004` | `evidence_added` | The UI lane consumes its live work-pack state: SWU-UIP-001..004 complete, SWU-UIP-005 next. |
| `RS-FPR02-LANE-005` | `artifact_drift` | Foundation, Craft, backend-engine, and visibility projections were stale against the lane decision. |

## Applied artifact groups

- New lane contract: `profile-lanes/README.md` and `profile-lanes/fpr02-lanes.yml`.
- Refreshed backend decision: four backend-only groups remain; UI is independent.
- Refreshed foundation Invoke plan, layering, work-pack, tasks, waves, execution pack, dispatch, transport,
  shared ledgers, and Distill result.
- Refreshed UI work-pack, architecture, layering, transport, and machine design with `FPR-02U` identity.
- Refreshed backend type test-engine plan so only `FPR-02B` blockers remain.
- Added separate Craft child contexts and synchronized the canonical and machine roadmap projections.
- Added this strict context pack, lane dispatch, refresh report, and Distill validation.

## Authority boundary

This refresh changes planning and disposable read models only. It does not select or execute a SWU, resolve
the four backend decisions, admit a successor backend profile, canonically activate UI concepts, change DS-D1
or DS-D8, mutate schemas or runtime, rewrite historical Task Session receipts, admit UI to a release, or
authorize production.

## Validation

- YAML and JSON parse checks: PASS for Craft, the graph manifest, lane contract, dispatches, machine context,
  UI design, backend transport/observability, and presentation copy.
- Dispatch validation: PASS for the foundation route, lane-separation child route, and backend test-engine route.
- Craft pointer validation: PASS for 24 indexed IDs and 50 artifact-path mappings; both child contexts resolve
  to their lane-local next move.
- Lane graph validation: PASS with 18 nodes and 40 edges; both parent branch edges exist and no sibling join or
  dependency exists.
- Roadmap generation and deterministic `--check`: PASS.
- Visibility tests: 30 passed, 0 failed; copy coverage is 74/74 fields.
- Markdown/frontmatter link validation: PASS.
- Scoped whitespace/error check: PASS.
- Production authorization assertion: false.

The Invoke refresh itself is therefore `phaseStatus: pass`. This does not lift the target gates: `FPR-02B`
remains `block` and `FPR-02U` remains `flag` because those statuses belong to their own lifecycle evidence.

## Independent next routes

1. Backend: resume `SWU-FPR02-001` at the four backend profile/pilot decision groups; then ratify the successor
   profile version and node-body mapping before backend test-engine execution.
2. UI: run `SWU-UIP-005` under `development/ui-profile-implementation/WORK-PACK.md`.

Each route requires its own selected Task Session, strict runtime context, write scope, and receipt.
