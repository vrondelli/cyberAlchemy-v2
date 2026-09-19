---
module: domainspec-v2-foundation-execution
version: current
status: active
updatedAt: 2026-07-17
docType: work-pack
---

# WORK-PACK: DomainSpec v2 Foundation Execution

## Purpose

Executable planning source for restoring the DomainSpec v2 retired-orchestration guard and completing the bounded `FPR-01 -> FPR-04` foundation chain.

## Control Fields

| Field | Value | Notes |
|---|---|---|
| workPackGateStatus | pass | FPR-01/W1 are complete and the FPR-02 lane split is resolved. W2B is in Decision Gate; W2U progresses independently. |
| complexity | high | Cross-authority, cross-capability, multiple owner decisions. |
| outputMode | split | Task and wave contracts are separate files. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Wave scheduler. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0-L3 decision boundaries. |
| dispatchTechniqueTrace | [DISPATCH.json](DISPATCH.json), [FPR01-003 remediation dispatch](dispatches/2026-07-16-fpr01-003-remediation.json), and [FPR-02 lane dispatch](dispatches/2026-07-17-fpr02-lane-separation.json) | Foundation route plus bounded child routes. |
| distillValidationStatus | pass | [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md). |
| activeLayerWindow | L1 (two lanes) | W2B backend Decision Gate and W2U UI development are independently resumable. |
| selectedSWU | none in this foundation refresh | W2B resumes `SWU-FPR02-001`; W2U separately names `SWU-UIP-005` as next. |
| lastUpdatedAt | 2026-07-17 | Apply-approved Invoke refresh date. |
| strictContextRef | [FPR-02 lane-separation context](refreshes/2026-07-17-fpr02-lane-separation/context/CONTEXT-PACK.md) | Strict apply-approved lane refresh context. |
| remediationDispatchRef | [2026-07-16 child dispatch](dispatches/2026-07-16-fpr01-003-remediation.json) | Two parallel-safe repair lanes, strict join, replay, refresh, and ratification gates. |
| readinessProfile | pilot | Bounded first profile, not production. |

## Objective Summary

- Objective: establish a trustworthy guard, ratified authority baseline, exact backend release profile, governed business-to-Spec mapping, and smallest independently verified Spec graph projection while UI development proceeds in a non-blocking sibling lane.
- Primary inputs: accepted product decision, approved roadmap/findings, live Craft state, engine-gap findings, and historical SGRM contracts/receipts.
- Success condition: the backend foundation chain has named receipts, predecessor digests agree, FPR-04 has exactly one source/two nodes/one edge with a separate comparator, UI status is not used as a backend gate, and no artifact claims release authorization.

## Delivery Slices

| Slice | Outcome | Layer | Wave | Dependency | Validation |
|---|---|---|---|---|---|
| S-000 | Restored current zero-active reference proof | L0 | [W0](work-pack/waves/W0-GUARD-REPAIR.md) | historical SGRM receipt + live four-violation state | clean audit + seeded active failure + digest-drift failure |
| S-001 | Ratified non-contradictory authority baseline | L1 | [W1](work-pack/waves/W1-AUTHORITY-BASELINE.md) | S-000 receipt | baseline validator + count/path/status/direction mutants |
| S-001R | Close FPR01-003 repository-input blockers and replay its existing package | L1 | [W1R](work-pack/waves/W1R-FPR01-003-REMEDIATION.md) | completed definitions reconciliation + blocked FPR01-003 receipt | exact guard proof + normalized sample proof + deterministic aggregate replay |
| S-002B | Frozen backend supported profile and digest | L1 | [W2B](work-pack/waves/W2B-BACKEND-PROFILE.md) | S-001 receipt + lane decision | backend all-artifact validator + typed negative matrix |
| S-002U | Required UI development profile and owner packet | L1 parallel | [W2U](work-pack/waves/W2U-UI-PROFILE.md) | S-001 receipt; no W2B dependency | externally owned UI receipts and audit |
| S-003 | Governed B plane and total B-to-Spec map | L2 | [W3](work-pack/waves/W3-BUSINESS-SPEC.md) | S-002B receipt + direction decision | total-map validator + deletion/endpoint/orphan/collapse mutants |
| S-004 | Tiny authoritative Sg and bounded retraction | L3 | [W4](work-pack/waves/W4-SPEC-PROJECTION.md) | S-003 receipt | source/graph/quotient verifier + independent comparator mutants |

## Task Status Board

| Task | Goal | Layer | Wave | Gate | Status |
|---|---|---|---|---|---|
| [TASK-SGRM-GUARD-REOPEN](work-pack/tasks/TASK-SGRM-GUARD-REOPEN.md) | Reopen SGRM-006/007 against live drift | L0 | W0 | 006 and 007 retry receipts accepted | completed |
| [TASK-FPR-01-AUTHORITY-BASELINE](work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md) | Ratify one source/count/status baseline | L1 | W1 | verified FPR01-004 ratification receipt synchronized | completed |
| [TASK-FPR01-003-REMEDIATION](work-pack/tasks/TASK-FPR01-003-REMEDIATION.md) | Close the two remaining validation-input blockers and replay FPR01-003 | L1 | W1R | both repairs and deterministic replay PASS | completed |
| [TASK-FPR-02-SUPPORTED-PROFILE](work-pack/tasks/TASK-FPR-02-SUPPORTED-PROFILE.md) | Freeze exact backend admitted/exercised profile | L1 | W2B | lane split resolved; four backend/pilot decisions remain | in-progress-decision |
| [TASK-FPR-02U-UI-PROFILE](work-pack/tasks/TASK-FPR-02U-UI-PROFILE.md) | Project the existing required UI profile into the FPR route | L1 parallel | W2U | independently governed; `SWU-UIP-001..004` complete, `SWU-UIP-005` next | external-in-progress |
| [TASK-FPR-03-BUSINESS-SPEC](work-pack/tasks/TASK-FPR-03-BUSINESS-SPEC.md) | Resolve direction and emit total B-to-Spec map | L2 | W3 | blocked by FPR-02B and frontier | not-started |
| [TASK-FPR-04-SPEC-PROJECTION](work-pack/tasks/TASK-FPR-04-SPEC-PROJECTION.md) | Compile and independently retract tiny Sg | L3 | W4 | blocked by FPR-03 | not-started |

## SWU Execution Handoff

Every row below is an execution handle under an existing SGRM or FPR owner, not a new lifecycle or gap identity.

| SWU | Parent | Source anchors | Dependencies | Write scope | Done/evidence | Validation | Owner | Handoff |
|---|---|---|---|---|---|---|---|---|
| `SWU-SGRM-006-R1` | SGRM guard | live audit; SGRM-006/007 contracts; four files | none | existing SGRM package `runs/SWU-SGRM-006/RETRY-001/` only | line-level disposition JSON + receipt | JSON parse; reviewer confirms every match covered | local Task Session + SGRM plan-owner review | completed |
| `SWU-SGRM-007-R1` | SGRM guard | approved disposition; guard/allowlist/tests | SGRM-006-R1 | exact guard allowlist/tests/package script + `runs/SWU-SGRM-007/RETRY-001/` | zero violations, seeded active and digest drift killed | `npm ... audit:retired-orchestration`; focused tests; typecheck | local Task Session | completed |
| `SWU-FPR01-001` | FPR-01 | meta-types, relationships, definitions, homing decision, EGI-001/002/020 | SGRM-007-R1 | FPR evidence draft/census only | deterministic census with source provenance and disagreements | schema/parse + repeat-run equality | definitions/validation local fallback | completed |
| `SWU-FPR01-002` | FPR-01 | census + `DEC-DSV2-SPEC-HOMING` + active direction sources | FPR01-001 | unchanged FPR decision/disposition packet + Task Session receipt only | every disagreement has an approved owner disposition and the packet remains digest-bound | structural/referential checks + in-memory negative mutants | definitions/layering owners | completed |
| `SWU-FPR01-003` | FPR-01 | approved dispositions | FPR01-002 | baseline, schema, deterministic validator | non-contradictory baseline validates | positive + stale count/path/status/direction fixtures | validation owner | completed |
| `SWU-FPR01003-GUARD-001` | [FPR01-003 remediation](work-pack/tasks/TASK-FPR01-003-REMEDIATION.md) | blocked receipt; definitions receipt; allowlist; frozen manifest; guard/tests | completed definitions reconciliation | exact allowlist entries + task receipt only | reviewed matches; zero violations; frozen manifest unchanged | audit command + focused guard tests + typecheck | local-fallback Task Session + SGRM guard review | completed |
| `SWU-FPR01003-SAMPLE-001` | [FPR01-003 remediation](work-pack/tasks/TASK-FPR01-003-REMEDIATION.md) | sample SPEC; normalized parser and tests | normalized grammar contract | sample SPEC + task receipt only | required tables exist; no relationship invented; deterministic lint green | engine lint twice + normalized-spec tests + docs | local-fallback Task Session + content-owner review | completed |
| `SWU-FPR01003-REPLAY-001` | [FPR01-003 remediation](work-pack/tasks/TASK-FPR01-003-REMEDIATION.md) | both repair receipts; baseline package; blocked receipt | both repair SWUs PASS | superseding FPR01-003 receipt and replay evidence only | canonical repeat, mutants, and aggregate validation all pass | authority validator twice + mutants + full `validate` | local-fallback Task Session + independent validation | completed |
| `SWU-FPR01-004` | FPR-01 | baseline + validator results | FPR01-003 | owner-ratification evidence only | owner receipt binds baseline and input digests | independent receipt verification | definitions/validation/layering owners | completed |
| `SWU-FPR02-001` | FPR-02B | FPR-01 receipt; lane contract; product decision | FPR01-004 | backend decision packet only | exact backend profile plus pilot/origin/redaction/claim/owner decisions | Decision Gate review | claim/semantic owners | in progress; resume four remaining groups |
| `SWU-FPR02-002` | FPR-02B | approved backend decision packet | FPR02-001 | backend product/profile schemas and artifacts, pilot matrices, validator | stable digest consumes every backend/pilot artifact | two-run digest equality + schema validation | profile/validation owner | blocked |
| `SWU-FPR02-003` | FPR-02B | backend profile validator | FPR02-002 | backend fixtures/evidence only | empty, unknown, absent, UI, placeholder, missing obligation, unresolved origin, empty redaction all fail distinctly | negative matrix command | independent validation owner | blocked |
| `SWU-FPR03-001` | FPR-03 | FR-FPR-ONTOLOGY-DIRECTION; prior ontology findings | FPR02-003 | `decisions/ontology-spec-direction.md` only | direction, supersession, provenance, contradiction policy accepted | Decision Gate + definitions review | semantic/definitions owners | blocked |
| `SWU-FPR03-002` | FPR-03 | direction decision + profile | FPR03-001 | BO/BK/B graphs and schemas | CT-1 and EC-3/EC-4 exist with stable IDs/provenance | schema validation + digest | ontology/business owners | blocked |
| `SWU-FPR03-003` | FPR-03 | BO/BK/B + authoritative Spec disposition | FPR03-002 | B-to-Spec map, validator, evidence | total map; typed deletion/endpoint/orphan/collapse failures | map verifier + mutants | semantic/validation owners | blocked |
| `SWU-FPR04-001` | FPR-04 | FPR-03 receipt + FPR-02 profile | FPR03-003 | required-doc registry, exact source manifest, schemas | one required source resolves; missing/empty/deferred inputs fail | source-manifest verifier | semantic/validation owners | blocked |
| `SWU-FPR04-002` | FPR-04 | exact source manifest + schemas | FPR04-001 | Sg graph + semantic manifest + compiler module/tests | exactly two nodes/one admitted edge; total profile mapping | compiler tests + graph schema | engine owner | blocked |
| `SWU-FPR04-003` | FPR-04 | Sg + authority edge registry | FPR04-002 | quotient registry + local G/compiler IR | every rename/loss is enumerated; unapproved quotient fails | quotient validator + direction mutant | semantic/engine owners | blocked |
| `SWU-FPR04-004` | FPR-04 | Sg, G, quotient registry | FPR04-003 | independent verifier + evidence only | separate Sg-to-G-to-Sg-canonical comparator; node/field/edge/quotient mutants fail | `verify-spec-projection.cjs` + independence review | independent validation owner | blocked |

## Blockers and closed prerequisites

These are plan-local labels, not new Craft gap identities.

| Blocker | Status | Scope | Description | Existing owner | Resolution |
|---|---|---|---|---|---|
| `PLAN-B1-GUARD-RED` | resolved | W0 | The accepted 007 retry receipt proves the current guard and its negative controls. | SGRM-006/007 | proof refresh recorded; W1 opened |
| `PLAN-B2-BASELINE` | resolved | W1 | Census, dispositions, implementation, reconciliation, repairs, deterministic replay, and independent ratification are complete. | FPR-01 owners | verified FPR01-004 receipt and synchronization |
| `BLK-FPR01003-002` | resolved | W1R | Exact reference classifications are receipt-bound and the fail-closed audit reports zero violations. | SGRM guard owner | `SWU-FPR01003-GUARD-001` PASS receipt |
| `BLK-FPR01003-003` | resolved | W1R | The normalized sample is deterministic, preserves zero-edge semantics, and aggregate validation passes. | implementation content/engine owner | `SWU-FPR01003-SAMPLE-001` PASS receipt |
| `PLAN-B3-PROFILE` | active | W2B | Backend admitted/exercised set, machine boundary, provider, origin/redaction, claims/rollback, and owners remain unresolved. | FPR-02B owners | resume Decision Gate before backend schema promotion |
| `PLAN-G-UI-LANE` | independent | W2U | UI graph integration, authority packet, and audit remain in progress but do not block W2B or FPR-03. | `ui-profile-implementation` owners | continue `SWU-UIP-005..007` under its own receipts |
| `PLAN-B4-DIRECTION` | active | W3 | Precedence/supersession/provenance/contradiction are open. | `FR-FPR-ONTOLOGY-DIRECTION` | Decision Gate and definitions review |
| `PLAN-B5-QUOTIENT` | active | W4 | Permitted Sg-to-G mappings are not yet named. | FPR-04 | enumerate only after authoritative Sg exists |

## Dispatch Technique Trace

| Technique | Applied to | Expectation | Status |
|---|---|---|---|
| sequence | W0 -> W4 | no successor starts without predecessor receipt | pass |
| scu_swu_reduction | first execution boundary | disposition is separated from guard mutation | pass |
| recomposition_proof | SWUs -> FPR route | every unit contributes to one named FPR/SGRM owner | pass |
| state_namespace_boundary | Craft, authority, generated graphs | projections never become authority | pass |
| owner_boundary_check | Invoke -> Task Session/Decision Gate/owners | plan does not claim execution or promotion | pass |
| validation_loop | each wave | positive proof and deliberate red control are paired | pass |
| residue_ledger | blockers and deferred scope | unresolved choices remain visible | pass |
| handle_handoff | repairs -> replay -> refresh | downstream owners consume verified receipt handles | pass |
| execution_receipt_handoff | every W1R execution boundary | structured receipts bind artifacts, validation, blockers, and residue | pass |
| concrete_path_evidence | W1R task and child dispatch | no wildcard write or evidence paths | pass |
| observability_grouping | child dispatch lifecycle | future receipts share one child dispatch ID | pass |
| authority_split_gate | replay -> refresh -> ratification | execution cannot synchronize or self-ratify | pass |

## Gate Checks

1. FPR-01, W1, W1R, and every FPR01 SWU are completed from verified receipts.
2. The lane split is resolved; historical FPR02 Task Session receipts remain immutable.
3. Backend `SWU-FPR02-001` resumes at its four remaining owner decisions. UI `SWU-UIP-005` may proceed independently under the UI work-pack.
4. Implementers cannot choose an authority, supported profile, claim boundary, origin route, or redaction policy.
5. Craft, the canonical roadmap, the expected manifest, and generated projections must agree on the two independent lanes.
6. No output may set or imply `production_authorized: true`.
7. This refresh changes planning/continuation structure only; it executes neither lane and authorizes no release.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-07-14 | Initial Invoke plan from accepted roadmap and live guard evidence | Codex / Invoke |
| 2026-07-14 | Apply-approved refresh consumed the accepted 006 receipt and selected `SWU-SGRM-007-R1` under Decision Gate Option 1 | Codex / Invoke refresh |
| 2026-07-14 | Proof refresh consumed the accepted 007 retry receipt, closed W0, and selected but did not execute `SWU-FPR01-001` | Codex / Invoke refresh |
| 2026-07-16 | Activation refresh consumed the accepted FPR01-001 receipt and the closed adoption decision, then selected but did not execute `SWU-FPR01-002` | Codex / Invoke refresh |
| 2026-07-16 | Receipt refresh consumed the verified FPR01-002 PASS receipt and selected but did not execute `SWU-FPR01-003` | Codex / Invoke refresh |
| 2026-07-16 | Blocker refresh consumed the FPR01-003 blocked-with-code receipt, preserved its implementation, and denied successor selection | Codex / Invoke refresh |
| 2026-07-16 | Invoke plan added W1R remediation contracts, selected the exact guard-classification SWU, and preserved the replay/ratification split | Codex / Invoke plan |
| 2026-07-17 | Apply-approved refresh consumed the superseding FPR01-003 PASS receipt, completed W1R, and selected but did not execute `SWU-FPR01-004` | Codex / Invoke refresh |
| 2026-07-17 | Apply-approved refresh consumed the verified FPR01-004 receipt, completed FPR-01/W1, resolved PLAN-B2, and left FPR-02 available but unselected | Codex / Invoke refresh |
| 2026-07-17 | Apply-approved Invoke refresh resolved the FPR-02 backend/UI lane split, created W2B/W2U projections, and preserved separate execution/receipt ownership | Codex / Invoke refresh |
