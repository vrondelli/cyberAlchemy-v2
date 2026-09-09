---
module: ontology-evidence-workbench-semantic-navigation
version: current
status: selected-swu-005-preflight
updatedAt: 2026-08-02
docType: work-pack
---

# WORK-PACK: OEW Semantic Navigation

## Control fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass-for-task-session-preflight | option 2 preserves the historical build identity and admits a separately owned semantic-navigation binding for fresh SWU-004 preflight |
| complexity | high | multiple owner gates, semantic/UI/browser layers and split contracts |
| outputMode | split | task and wave files are execution-bearing |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | cross-task choreography |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0–L3 decisions |
| dispatchTechniqueTrace | [PLAN-TECHNIQUE-TRACE.md](PLAN-TECHNIQUE-TRACE.md) | full route in `../DISPATCH.json` |
| distillValidationStatus | pass | true Balancer block, repair replay and final exact close completed |
| swuAtomicityStatus | pass | 21 one-behavior decision/mutation SWUs |
| firstUnitNarrownessStatus | pass | SWU-OEWSN-004 passed its pure relation-record boundary; SWU-OEWSN-005 is the next narrow renderer boundary |
| closeoutSyncStatus | pass | exact rows in `CLOSEOUT-SYNC-INVENTORY.json` |
| activeLayerWindow | L0 | relation truth before navigation breadth |
| readinessProfile | pilot | one local Body War prototype and comparable rerun |
| selected_swu | SWU-OEWSN-005 | selected only after the SWU-OEWSN-004 terminal and owner receipts passed |
| mutation_authorized | false | this closeout selects the successor only; a fresh live Task Session must admit every SWU-OEWSN-005 product write |

## Objective and success

Implement CR-01 through CR-12 without losing exact relation arrows, blockers,
source provenance, profile ownership or the full-graph escape. Success requires
all L0/L1 mutation receipts, the L2 comparable delta, and read-only
recomposition verification; no single screenshot or browser reachability is
sufficient.

## Delivery slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-000 | owner-approved Body War profile choices | admission | [W0](work-pack/waves/W0-OWNER-DECISIONS.md) | none | four exact decision rows and frozen profile digest |
| S-001 | lossless relation record and one accessible selected-edge scene | L0 | [W1](work-pack/waves/W1-L0-RELATION-CORE.md), [W2](work-pack/waves/W2-L0-RELATION-UI.md) | OD-04 only | unit fixtures plus browser/contrast/keyboard witness |
| S-002 | projected Home, portals, cards and exact restoration | L1 | [W3](work-pack/waves/W3-L1-CONTEXT-NAVIGATION.md) | S-001 | portal/Back/show-all state and browser matrix |
| S-003 | complete Path and control semantics | L1 | [W4](work-pack/waves/W4-L1-PATH.md), [W5](work-pack/waves/W5-L1-CONTROLS.md) | S-001; OD-02/03 | hop, focus, mode, disclosure, contrast and copy matrices |
| S-004 | comparable Body War quality delta | L2 | [W6](work-pack/waves/W6-L2-QUALITY-LOOP.md) | S-002, S-003 | frozen replay and independently valid delta receipt |
| S-005 | claim-ceiling and recomposition close | L2/L3 | [W7](work-pack/waves/W7-VERIFY.md), [W8](work-pack/waves/W8-L3-PORTABILITY.md) | S-004 | read-only audit; L3 remains deferred |

## Task board

| Task | Goal | Layer | Waves | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-OEWSN-00-PROFILE-DECISIONS](work-pack/tasks/TASK-OEWSN-00-PROFILE-DECISIONS.md) | record context, Path, zero-count and relation-encoding choices | admission | W0 | owner answers | complete |
| [TASK-OEWSN-01-RELATION-CORE](work-pack/tasks/TASK-OEWSN-01-RELATION-CORE.md) | own one lossless versioned relation record | L0 | W1 | OD-04 pass plus dedicated build-binding preflight | complete-terminal-pass |
| [TASK-OEWSN-02-RELATION-UI](work-pack/tasks/TASK-OEWSN-02-RELATION-UI.md) | render redundant semantics and role-sensitive edge operation | L0 | W2 | relation core terminal PASS | selected-preflight |
| [TASK-OEWSN-03-CONTEXT-NAVIGATION](work-pack/tasks/TASK-OEWSN-03-CONTEXT-NAVIGATION.md) | implement home, portals, cards and restoration | L1 | W3 | OD-01, relation UI | blocked |
| [TASK-OEWSN-04-PATH](work-pack/tasks/TASK-OEWSN-04-PATH.md) | derive and render complete Path explanations | L1 | W4 | OD-02, relation core | blocked |
| [TASK-OEWSN-05-CONTROLS](work-pack/tasks/TASK-OEWSN-05-CONTROLS.md) | repair modal, modes, disclosures, contrast and provenance copy | L1 | W5 | relation UI; OD-03 for counts | blocked |
| [TASK-OEWSN-06-QUALITY-LOOP](work-pack/tasks/TASK-OEWSN-06-QUALITY-LOOP.md) | replay frozen matrix and emit atomic deltas | L2 | W6 | L1 complete | blocked |
| [TASK-OEWSN-VERIFY](work-pack/tasks/TASK-OEWSN-VERIFY.md) | verify recomposition and ceilings | L2 | W7 | quality receipt | ready-after-implementation |
| [TASK-OEWSN-PORTABILITY-READINESS](work-pack/tasks/TASK-OEWSN-PORTABILITY-READINESS.md) | assess second-project admission | L3 | W8 | second project authorization | deferred |

## Smallest Working Units

The canonical machine manifest is [SWU-MANIFEST.json](SWU-MANIFEST.json).

| Range | Ownership | Count | Atomicity |
| --- | --- | ---: | --- |
| SWU-OEWSN-001–003, 021 | one owner decision each | 4 | manual, independently recordable |
| SWU-OEWSN-004 | one relation-record derivation | 1 | first narrow reversible mutation |
| SWU-OEWSN-005–006 | edge rendering; edge keyboard behavior | 2 | independent browser boundaries |
| SWU-OEWSN-007–009 | home derivation; portal restoration; card/profile semantics | 3 | separate state/render/profile concerns |
| SWU-OEWSN-010–011 | Path derivation; Path surface/recovery | 2 | pure algorithm before UI |
| SWU-OEWSN-012–016, 019–020 | modal; modes; Filter; contrast; trust copy; Export; projection counts | 7 | separate interaction/visual/copy/data-state behaviors |
| SWU-OEWSN-017–018 | frozen runner; delta receipt verifier | 2 | producer and independent validator |

`SWU-OEWSN-004` completed with terminal PASS in Task Session attempt
`20260802T022042Z`. The dedicated `OEWSN-BUILD.binding.json` preserved the
historical `overlay-manifest.json`, `first-working-version-manifest.json`,
`L1-BUILD.lock.json`, and patches 0001–0002 while seven semantic typed tests and
the immutable local dashboard build passed. The terminal receipt preserves one
noncritical residue: 229 of 231 Body War relations resolve one graph tuple, but
`provider-belongs-runner` and `runner-owns-provider` each encounter two
byte-equivalent tuples and correctly fail `GRAPH_EDGE_AMBIGUOUS`. SWU-OEWSN-005
is selected only for fresh Task Session preflight; this closeout grants no
product mutation authority.

## Task Session closeout

Every mutation SWU 004–020, excluding manual decision SWU-021, has a
predeclared exact target inventory, baseline
rule, delta classes, owner validation, expected receipt and deterministic
successor in [CLOSEOUT-SYNC-INVENTORY.json](CLOSEOUT-SYNC-INVENTORY.json).
Admission and material/output partition rules are in
[MUTATION-ADMISSION-CONTRACT.json](MUTATION-ADMISSION-CONTRACT.json).

## Resolved owner gates and remaining gaps

| ID | Class | Description | Owner | Repair |
| --- | --- | --- | --- | --- |
| OD-01 | resolved owner gate | full admitted 237-node/231-relation source; all 12 bounded contexts are portal Home entrances | Body War profile owner | frozen in approved profile and Decision Gate receipt |
| OD-02 | resolved owner gate | deterministic relation-bearing comparator | Body War profile owner | frozen in approved profile and Decision Gate receipt |
| OD-03 | resolved owner gate | zero-count values remain visible and disabled with literal non-color cues | Body War profile owner | frozen in approved profile and Decision Gate receipt |
| OD-04 | resolved owner gate | semantic-family v1 predicate-color and presentation-pattern tables | Body War profile owner plus semantic-navigation owner | frozen in approved profile and Decision Gate receipt |
| G-01 | evidence gap | cross-scene relation encoding unexecuted | Task Session/UX evidence owner | run W2 and W6 matrices |
| G-02 | deferred evidence ceiling | comprehension/trust/workload/preference unproved; no human/novice A/B is required for this single-owner prototype | human-study owner | separately authorize only if human-outcome claims are later requested |
| G-03 | portability gap | no second project profile | future capability owner | execute only after first delta and explicit second-project scope |
| G-04 | resolved execution blocker | SWU-004 originally mutated the shared overlay manifest while two immutable build bindings were outside its scope | Invoke | Decision Gate option 2 selected a dedicated semantic-navigation binding; historical inputs stay read-only and the repair is live-validated by the next Task Session |
| G-05 | noncritical evidence residue | two Body War source relations still map to duplicate byte-equivalent graph tuples and fail closed | relation adapter owner | preserve `OEWSN-RELATION-DUPLICATE-TUPLES`; no total 231-edge selection claim until a stable graph-edge identity exists |

## Dispatch technique trace

`sequence`, `scu_swu_reduction`, `recomposition_proof`, `validation_loop`,
`owner_boundary_check`, `handle_handoff`, `residue_ledger`,
`execution_receipt_handoff`, `authority_split_gate`,
`artifact_contract_bridge`, `concrete_path_evidence`, and
`approval_semantics_map` are mapped in `PLAN-TECHNIQUE-TRACE.md` and the full
validated dispatch.

## Distill validation

Validated target: 21 one-behavior SWUs plus two allowed closure/readiness
exemptions. Final verdict and Balancer receipt are recorded in
[PLAN-DISTILL.md](PLAN-DISTILL.md). A structural Distill pass cannot override
OD-01–OD-04 or authorize mutation.

## Gate checks

1. OD-01–OD-04 are resolved by the approved profile and Decision Gate receipt;
   their values remain scoped to their declared consumers.
2. Design selection is pass; planned witnesses remain `plan-evidence-pending`.
3. SWU-OEWSN-004 is complete with terminal PASS receipt
   `planning/work-pack/session-evidence/SWU-OEWSN-004/20260802T022042Z/receipt.json`;
   its duplicate-tuple residue and candidate-local claim ceiling remain open.
4. SWU-OEWSN-005 is selected for fresh preflight. It may consume the completed
   relation record, but must preserve the `GRAPH_EDGE_AMBIGUOUS` failure and may
   not claim total 231-edge selection. The first UI Task Session owns patch 0003
   under sequential closeout.
5. Product validation, generated receipts, scoped whitespace and browser
   evidence are mandatory; lifecycle bookkeeping cannot replace them.
6. No source or planning artifact may claim ontology, release or production
   authority.
