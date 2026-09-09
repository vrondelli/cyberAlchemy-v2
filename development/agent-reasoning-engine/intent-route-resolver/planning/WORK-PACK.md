---
module: intent-route-resolver
version: current
status: l0-witness-complete
updatedAt: 2026-07-30
docType: work-pack
---

# WORK-PACK: Intent Route Resolver

## Control fields

| Field | Value |
|---|---|
| workPackGateStatus | pass |
| complexity | medium |
| outputMode | split |
| executionPackRef | `EXECUTION-PACK.md` |
| layeringArtifactRef | `IMPLEMENTATION-LAYERING.md` |
| dispatchTechniqueTrace | `DISPATCH-TECHNIQUE-TRACE.md` |
| distillValidationStatus | pass |
| swuAtomicityStatus | pass |
| firstUnitNarrownessStatus | pass |
| closeoutSyncStatus | pass |
| activeLayerWindow | L0 |
| lastUpdatedAt | 2026-07-30T18:46:49-03:00 |
| readinessProfile | pilot |

## Objective summary

Deliver a private L0 package at
`cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/`
that deterministically returns canonical advisory route dispositions from typed
JSON intent and a frozen finite catalog. The package is a standalone,
dependency-free ESM adapter with a generic JSON port, an explicit selected-local
compatibility mapper, and a zero-permission add-on manifest.

Success requires exhaustive positive/negative fixtures, order invariance, one
stable clarification, zero external/model/dispatch/effect calls, and a
materialized Node/Chromium L0 receipt. It does not require or permit a
ResonantOS/Augmentor product implementation.

## Source contracts

- [Define specification](../define/SPEC.md)
- [Architecture](../design/ARCHITECTURE.md)
- [Component contracts](../design/COMPONENT-CONTRACTS.md)
- [Authority boundary](../design/AUTHORITY-TRUST.md)
- [State/event contract](../design/STATE-EVENT.md)
- [Integration/versioning](../design/INTEGRATION-VERSIONING.md)
- [Validation contracts](../design/VALIDATION-CONTRACTS.md)
- [Design selection receipt](../design/DESIGN-SELECTION-RESULT.json)

## Delivery slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
|---|---|---|---|---|---|
| S-IRR-01 | request and catalog values fail closed and canonicalize | L0 | W1 | W0 | contract tests |
| S-IRR-02 | eligible routes reduce to the exhaustive disposition algebra | L0 | W2 | S-IRR-01 | resolver and metamorphic tests |
| S-IRR-03 | generic JSON port and selected-local mapper expose a runtime-neutral add-on seam | L0 | W3 | S-IRR-02 | port, mapper, manifest, and import tests |
| S-IRR-04 | fixed fixture matrix emits an immutable Node/Chromium L0 receipt and closes boundaries | L0 | W4 | S-IRR-03 | full suite, browser bytes, witness digest, dependency audit |

## Task status board

| Task | Goal | Layer | Complexity | Waves | Gate | Status |
|---|---|---|---|---|---|---|
| [TASK-IRR-CONTRACT-001](work-pack/tasks/TASK-IRR-CONTRACT-001.md) | implement request and catalog contract validators | L0 | medium | W1 | SWU-IRR-001 and SWU-IRR-002 terminal receipts pass | completed |
| [TASK-IRR-RESOLVE-001](work-pack/tasks/TASK-IRR-RESOLVE-001.md) | implement deterministic eligibility, dominance, disposition, and clarification | L0 | medium | W2 | SWU-IRR-003 and SWU-IRR-004 terminal receipts pass | completed |
| [TASK-IRR-ADAPTER-001](work-pack/tasks/TASK-IRR-ADAPTER-001.md) | implement the generic JSON port, selected-local mapper, and add-on manifest | L0 | medium | W3 | SWU-IRR-005 and SWU-IRR-006 terminal receipts pass | completed |
| [TASK-IRR-WITNESS-001](work-pack/tasks/TASK-IRR-WITNESS-001.md) | materialize the fixed portable L0 witness | L0 | medium | W4 | SWU-IRR-007 Node and Chromium receipt passes | completed |
| [TASK-IRR-VERIFY](work-pack/tasks/TASK-IRR-VERIFY.md) | closure audit | L0 | medium | W4 | closure audit receipt passes | completed |

## Shared SWU manifest

| SWU | Parent | Primary behavior | Dependencies | Write scope | Done criteria | Validation | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| SWU-IRR-001 | TASK-IRR-CONTRACT-001 | validate and canonicalize JSON-only `RouteRequest@1` | W0 | package metadata/index, `src/canonical-json.mjs`, `src/request.mjs`, request tests | exact v1 accepted; malformed/version/posture/non-JSON cases rejected; bytes stable | `node --test .../test/request.test.mjs` | local-fallback | completed |
| SWU-IRR-002 | TASK-IRR-CONTRACT-001 | validate and freeze `CapabilityRouteCatalogSnapshot@1` | SWU-IRR-001 | `src/catalog.mjs`, catalog fixtures/tests, index export | owner/digest/IDs/operators/dominance graph fail closed | `node --test .../test/catalog.test.mjs` | local-fallback | completed |
| SWU-IRR-003 | TASK-IRR-RESOLVE-001 | evaluate route eligibility and explicit dominance | SWU-IRR-002 | `src/eligibility.mjs`, eligibility tests, index export | exclusion precedence, conditional routes, and dominance are deterministic | `node --test .../test/eligibility.test.mjs` | local-fallback | completed |
| SWU-IRR-004 | TASK-IRR-RESOLVE-001 | classify and assemble one canonical `RouteDisposition@1` | SWU-IRR-003 | `src/resolve.mjs`, resolver tests, index export | all four kinds and one-question ambiguity pass; permutation invariant | `node --test .../test/resolve.test.mjs` | local-fallback | completed |
| SWU-IRR-005 | TASK-IRR-ADAPTER-001 | expose a generic JSON runtime port | SWU-IRR-004 | `src/json-port.mjs`, port tests, index/package exports | parse/version/shape failures are typed and canonical bytes are stable | `node --test .../test/json-port.test.mjs` | local-fallback | completed |
| SWU-IRR-006 | TASK-IRR-ADAPTER-001 | map selected-local intent and declare the add-on surface | SWU-IRR-005 | `src/selected-local.mjs`, mapper tests, `addon-manifest.json`, package exports | posture/evidence/digest preserved; missing mapping unresolved; permissions empty | `node --test .../test/selected-local.test.mjs` | local-fallback | completed |
| SWU-IRR-007 | TASK-IRR-WITNESS-001 | execute and materialize the portable L0 witness matrix | SWU-IRR-006 | fixture runner, literal JSON fixtures/tests, private generated run directory | receipt records all fixtures, Node/Chromium bytes, zero-call/import audit, hashes, claim ceiling | full package suite plus browser witness and digest verification | local-fallback | completed |

The full source anchors, exact path inventory, split analysis, and expected
receipt shape are in the linked task files.

## SWU atomicity review

| SWU | Independent boundary | Candidate split considered | Retained rationale | Verdict |
|---|---|---|---|---|
| IRR-001 | request validator passes without catalog logic | canonical codec vs request validator | codec alone proves no route behavior and is only support for canonical request evidence | pass |
| IRR-002 | catalog validator passes without matching | identity/digest vs graph validation | both are one catalog-admission decision and share the invalid-catalog result | pass |
| IRR-003 | produces complete eligibility traces without disposition | predicates vs dominance | dominance only has meaning over eligible set; combined unit owns route-set reduction | pass |
| IRR-004 | returns complete disposition from fixed traces | classifier vs clarification | clarification is a required branch of one exhaustive terminal output | pass |
| IRR-005 | returns canonical JSON for one complete request | parser/serializer vs port | their independent split would expose no complete runtime boundary | pass |
| IRR-006 | returns a generic envelope plus mapping receipt | mapper vs add-on manifest | the manifest declares the mapper entrypoint and permission boundary accepted by the same compatibility slice | pass |
| IRR-007 | materializes a complete immutable portable witness | runner vs receipt/browser artifact | none alone can satisfy the executed cross-runtime evidence boundary | pass |

First-unit narrowness: **pass**. SWU-IRR-001 adds no matching or route claim; it
is the smallest reversible contract proof and touches only new package files.

## Task Session closeout sync contract

For every SWU, the baseline is the exact live digest inventory captured by Task
Session before mutation. Allowed closeout deltas are only `evidence_added`,
`blocker_opened`, `blocker_resolved`, `status_changed`, and `route_changed`.
Closeout may not admit another SWU, authority change, promotion, release,
deployment, or unrelated target.

The shared `terminal-v1` contract requires `run_id`, `swu_id`, `dispatch_id`,
`status`, `files_touched`, `validation`, `blockers`, `residue`, and
`handoff_note`. The shared `owner-v1` contract requires `run_id`, `swu_id`,
`source_receipt_path`, `source_receipt_digest`, `baseline_inventory`,
`baseline_digest`, `admitted_deltas`, `owner_validation`, `status`,
`next_route`, and `residue`.

| SWU | Lifecycle owner route | Terminal source receipt | Declared target inventory | Owner validation | Expected owner receipt | Successor policy |
|---|---|---|---|---|---|---|
| SWU-IRR-001 | `invoke:refresh:apply-approved` | `planning/work-pack/session-evidence/SWU-IRR-001/<run-id>/TERMINAL-RECEIPT.json`; all `terminal-v1` fields | `planning/WORK-PACK.md`; `planning/work-pack/tasks/TASK-IRR-CONTRACT-001.md`; `planning/work-pack/session-evidence/SWU-IRR-001/<run-id>/**` | JSON parse, scoped diff check, request test command, source-anchor integrity | `planning/work-pack/session-evidence/SWU-IRR-001/<run-id>/closeout-sync/OWNER-RECEIPT.json`; all `owner-v1` fields | select only SWU-IRR-002 on pass and unchanged controls; failed validation routes to task repair, changed controls to decision/plan refresh |
| SWU-IRR-002 | `invoke:refresh:apply-approved` | `planning/work-pack/session-evidence/SWU-IRR-002/<run-id>/TERMINAL-RECEIPT.json`; all `terminal-v1` fields | `planning/WORK-PACK.md`; `planning/work-pack/tasks/TASK-IRR-CONTRACT-001.md`; `planning/work-pack/session-evidence/SWU-IRR-002/<run-id>/**` | scoped diff, catalog test, full contract suite, effective-state negatives | `planning/work-pack/session-evidence/SWU-IRR-002/<run-id>/closeout-sync/OWNER-RECEIPT.json`; all `owner-v1` fields | select only SWU-IRR-003 on pass and unchanged controls; failed validation routes to task repair, changed controls to decision/plan refresh |
| SWU-IRR-003 | `invoke:refresh:apply-approved` | `planning/work-pack/session-evidence/SWU-IRR-003/<run-id>/TERMINAL-RECEIPT.json`; all `terminal-v1` fields | `planning/WORK-PACK.md`; `planning/work-pack/tasks/TASK-IRR-RESOLVE-001.md`; `planning/work-pack/session-evidence/SWU-IRR-003/<run-id>/**` | scoped diff, eligibility test, full suite | `planning/work-pack/session-evidence/SWU-IRR-003/<run-id>/closeout-sync/OWNER-RECEIPT.json`; all `owner-v1` fields | select only SWU-IRR-004 on pass and unchanged controls; failed validation routes to task repair, changed controls to decision/plan refresh |
| SWU-IRR-004 | `invoke:refresh:apply-approved` | `planning/work-pack/session-evidence/SWU-IRR-004/<run-id>/TERMINAL-RECEIPT.json`; all `terminal-v1` fields | `planning/WORK-PACK.md`; `planning/work-pack/tasks/TASK-IRR-RESOLVE-001.md`; `planning/work-pack/session-evidence/SWU-IRR-004/<run-id>/**` | scoped diff, resolve test, full suite, order invariant | `planning/work-pack/session-evidence/SWU-IRR-004/<run-id>/closeout-sync/OWNER-RECEIPT.json`; all `owner-v1` fields | select only SWU-IRR-005 on pass and unchanged controls; failed validation routes to task repair, changed controls to decision/plan refresh |
| SWU-IRR-005 | `invoke:refresh:apply-approved` | `planning/work-pack/session-evidence/SWU-IRR-005/<run-id>/TERMINAL-RECEIPT.json`; all `terminal-v1` fields | `planning/WORK-PACK.md`; `planning/work-pack/tasks/TASK-IRR-ADAPTER-001.md`; `planning/work-pack/session-evidence/SWU-IRR-005/<run-id>/**` | scoped diff, JSON-port test, full suite, forbidden-import audit | `planning/work-pack/session-evidence/SWU-IRR-005/<run-id>/closeout-sync/OWNER-RECEIPT.json`; all `owner-v1` fields | select only SWU-IRR-006 on pass and unchanged controls; failed validation routes to port repair, changed controls to decision/plan refresh |
| SWU-IRR-006 | `invoke:refresh:apply-approved` | `planning/work-pack/session-evidence/SWU-IRR-006/<run-id>/TERMINAL-RECEIPT.json`; all `terminal-v1` fields | `planning/WORK-PACK.md`; `planning/work-pack/tasks/TASK-IRR-ADAPTER-001.md`; `planning/work-pack/session-evidence/SWU-IRR-006/<run-id>/**` | scoped diff, mapper test, manifest JSON, full suite, forbidden-import audit | `planning/work-pack/session-evidence/SWU-IRR-006/<run-id>/closeout-sync/OWNER-RECEIPT.json`; all `owner-v1` fields | select only SWU-IRR-007 on pass and unchanged controls; failed validation routes to mapper repair, changed controls to decision/plan refresh |
| SWU-IRR-007 | `invoke:refresh:apply-approved` | `planning/work-pack/session-evidence/SWU-IRR-007/<run-id>/TERMINAL-RECEIPT.json`; all `terminal-v1` fields plus fixture/input/output/witness/browser hashes and harness write inventory | `planning/WORK-PACK.md`; `planning/work-pack/tasks/TASK-IRR-WITNESS-001.md`; `planning/work-pack/tasks/TASK-IRR-VERIFY.md`; `planning/work-pack/session-evidence/SWU-IRR-007/<run-id>/**` | scoped diff, full suite, witness digest, Node/Chromium byte parity, pure-core zero-call/import audit, harness write inventory, link/JSON checks | `planning/work-pack/session-evidence/SWU-IRR-007/<run-id>/closeout-sync/OWNER-RECEIPT.json`; all `owner-v1` fields | route to TASK-IRR-VERIFY only on pass and unchanged controls; failed validation routes to witness repair, changed controls to decision/plan refresh; never auto-select L1 |

## Blockers and deferred decisions

No blocker remains inside the completed L0 frontier. The following items remain
explicitly deferred to later owners.

| ID | Class | Description | Owner route |
|---|---|---|---|
| IRR-R01 | L1 deferral | live capability catalog compiler and admitted registry source | ResonantOS/Arcanum integration owner |
| IRR-R02 | L1 deferral | immutable host `RouteDecision` schema and persistence | ResonantOS host owner |
| IRR-R03 | L2 deferral | natural-language projection quality corpus and thresholds | evaluation owner / Experiment Harness |
| IRR-R04 | L2 deferral | Augmentor/ResonantOS product-browser acceptance | ResonantOS UX owner |
| IRR-R06 | packaging deferral | admission of a shared cross-repository add-on manifest format | add-on lifecycle owner |
| IRR-R05 | parent-plan residue | parent engine ACI-subordinate conformance remains separately planned | Agent Reasoning Engine plan owner |

## Validation strategy

| Check | Scope | Evidence |
|---|---|---|
| design admission | all plan outputs | fixed-point `design-validator-pass` receipt |
| JSON and package shape | new package/artifacts | `jq empty`, `node --check`, package tests |
| exhaustive algebra | resolver | one fixture per kind and invalid subject |
| monotonic uncertainty | resolver | resolving a field to unresolved never improves to candidate |
| permutation invariance | catalog and output | shuffled route/predicate order yields identical bytes |
| no external authority/effect | package | dependency/import audit and call-count test doubles |
| portable adapter | package | generic JSON port, selected-local mapper, zero-permission manifest |
| browser conformance | generated witness | shared Chromium loads the same ESM graph and returns byte-identical vectors |
| source boundary | repository | scoped `git diff --check` and forbidden-path audit |
| closeout | every SWU | Task Session terminal plus Invoke refresh owner receipt |

## Dispatch technique trace

See [DISPATCH-TECHNIQUE-TRACE.md](DISPATCH-TECHNIQUE-TRACE.md). The executable
handoff route is [DISPATCH.json](DISPATCH.json) and must validate before the
gate can pass.

## Distill validation

See [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md). The independent Balancer
accepted the seven-unit standalone-adapter route; terminal revalidation is
pass.

## Handoff

- Current selected unit: none; the seven-unit L0 frontier is closed
- Mutation executed by Task Session: **yes**, under per-unit admission,
  terminal, and lifecycle-owner receipts
- Next action: separate L0 owner evaluation; define and plan installation only
  after selecting a concrete consumer runtime
- Successor route after portable witness: separate owner evaluation; consumer
  installation must be defined/planned in its own runtime context

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
