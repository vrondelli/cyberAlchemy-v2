---
module: interactive-ontology-learning-map
version: 0.1.0-candidate
status: candidate-compile-blocked
updatedAt: 2026-07-22
docType: work-pack
---

# WORK-PACK: Interactive Ontology Learning Map

## FPR-02B consumer refresh

- Route: independent read-only consumer proof for the BTE node/edge handoff.
- Required input: source/profile/graph/obligation/receipt identity and explicit
  `candidate` or `authoritative` posture.
- Required checks: semantic bytes/hash invariance, graph/hierarchy/table/GET
  parity, deterministic rebuild, learner/navigation isolation, and fail-closed
  missing/empty/mismatch/unknown-ID/retraction negatives.
- Gate state: `G-POSTURE` and `G-CANDIDATE` are `PASS`; `G-DSV2-SG` remains
  `BLOCKED` for authoritative labeling/rebind only; later executable candidate
  gates remain `NOT_RUN`.
- Write scope: only the selected SWU's declared `prototype/**` paths after its
  Task Session gate; no upstream DomainSpec or Craft mutation.
- Machine boundary:
  `cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/consumer-contract.yml`
  plus `receipt.schema.json`; Markdown is never the handoff source.
- Accepted proof role: `DEC-GCP-002` keeps the narrow EVF consumer run and the
  later BTE breadth rerun fresh, distinct, independently owned, and non-admitting.

## Control fields

| Field | Value |
|---|---|
| workPackGateStatus | `block` for 00C-B: required cross-feature edge is unsupported by the live compiler |
| workableExampleGateStatus | `ready-a2-current-fixture-regeneration-selected` |
| complexity | `high` |
| outputMode | `split` |
| executionPackRef | [EXECUTION-PACK.md](./EXECUTION-PACK.md) |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](./IMPLEMENTATION-LAYERING.md) |
| dispatchTechniqueTrace | [DISPATCH.json](./DISPATCH.json) |
| distillValidationStatus | `pass` — [DISTILL-VALIDATION.md](./DISTILL-VALIDATION.md) |
| activeLayerWindow | `L0C` plus independent `L0C-demo` |
| readinessProfile | `pilot` |
| nextRoute | DomainSpec BTE bounded `task-session` through its refreshed dependency order; return a passing cross-feature-support receipt before resuming 00C-B |

## Objective

Deliver a private, deterministic, source-preserving ontology learning-map witness that makes semantic, epistemic, governance, operational, and pedagogical connections inspectable without collapsing their types or authority.

The planning package is structurally complete. G-OWNER, the code-first candidate posture, the narrow candidate contract/provenance SWU, and the historical A1-A3 chain passed; the bounded A3 repair also returned `iolm-interactive-viewer/v1`. The latest A4 replay then blocked before server bind because the three allowlisted Key-and-Door fixture outputs had changed. Decision `DEC-IOLM-A4-FIXTURE-POLICY-20260722` selected preservation of the current DomainSpec generation, and the fresh A1 rebind now passes against that exact generation with `iolm-fixture-boundary/v1`. Historical receipts remain immutable. Exactly one fresh A2 regeneration lifecycle is selected; A3 revalidation and A4 replay remain gated in that order. Separately, 00C-B remains selected but blocked on its upstream support receipt, and the missing owner-generated `Sg` blocks only the later authoritative rebind. This sibling route cannot weaken or evidence 00C-B. The L0D DomainSpec evidence-consumer task remains planned with two unselected SWUs and does not gate either upstream core.

## Delivery slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
|---|---|---|---|---|---|
| S-000 | Projection owner and schema approval route named | L0 | [W0](work-pack/waves/W0.md) | none | signed/recorded decision with scope and downstream owner |
| S-00C | Candidate graph substrate proves posture, stable identity, provenance, compilation, and graph/hierarchy/table parity | L0C | [W0C](work-pack/waves/W0C.md) | G-OWNER and G-POSTURE | contract negatives, deterministic compile receipt, parity fixture |
| S-00C-UI | Private fixture-backed 4-node/3-edge local UI witness | L0C-demo | [W0C-UI](work-pack/waves/W0C-UI.md) | SWU-IOLM-00C-A | typed A1 boundary, A2 snapshot, A3 viewer, and A4 Firefox/evidence receipts; human checks remain separate |
| S-00D | Private application consumes exact executable proof handles without semantic, identity, provenance, view, or authority drift | L0D | [W0D](work-pack/waves/W0D-DOMAINSPEC-CONSUMER.md) | S-00C plus exact successful upstream stage receipt | fresh narrow EVF receipt; later distinct 13-kind/16-signature BTE breadth receipt |
| S-000B | Exact DomainSpec `Sg` readiness handle verified without changing upstream state | pre-L0 | [W0](work-pack/waves/W0.md) | live guard plus existing FPR-01/02/03/04 owner receipts | schema-valid graph/quotient/retraction receipt and bound handle |
| S-001 | Read-only import/projection contract, source manifest, and failure fixtures locked | L0 | [W1](work-pack/waves/W1.md) | S-000, S-000B | schema validator positive/negative suite |
| S-002 | Deterministic immutable snapshot compiler | L1 | [W2](work-pack/waves/W2.md) | S-001 | repeated clean-build equality and identity-change tests |
| S-003 | AEO/Financial/Craft witnesses compile honestly | L1 | [W2](work-pack/waves/W2.md) | S-001, S-002 | admitted/rejected relation and claim-ladder fixtures |
| S-004 | Bounded GET-only read surface | L1 | [W2](work-pack/waves/W2.md) | S-002 | route inventory, query fixtures, path-boundary tests |
| S-005 | Equivalent learning interface | L2 | [W3](work-pack/waves/W3.md) | S-003, S-004 | graph/hierarchy/table parity and two journeys |
| S-006 | Evidence-backed private pilot decision | L3 | [W4](work-pack/waves/W4.md) | S-005 | determinism, a11y, performance, comprehension receipts |

## Task status board

| Task | Goal | Layer | Complexity | Wave | Gate | Status |
|---|---|---|---|---|---|---|
| [TASK-IOLM-000](work-pack/tasks/TASK-IOLM-000-OWNER.md) | resolve projection owner | L0 | medium | W0 | pass | completed |
| [TASK-IOLM-00C](work-pack/tasks/TASK-IOLM-00C-CANDIDATE-SUBSTRATE.md) | prove the candidate graph substrate through one shared read-model boundary | L0C | high | W0C | G-OWNER + G-POSTURE pass | blocked; `00C-A` pass, option 1 selected, upstream support receipt absent |
| [TASK-IOLM-00C-UI](work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md) | build the separately governed fixture-backed demo sidecar | L0C-demo | medium | W0C-UI | fresh current-generation A1 rebind receipt | active; historical A1–A3 and both blocked A4 attempts preserved, fresh A1 rebind passed, one A2 regeneration selected |
| [TASK-IOLM-DOMAINSPEC-EVIDENCE-CONSUMER](work-pack/tasks/TASK-IOLM-DOMAINSPEC-EVIDENCE-CONSUMER.md) | emit independent narrow EVF and later BTE breadth consumer receipts | L0D | high | W0D | candidate substrate plus exact upstream stage receipt | not-started; both SWUs blocked/unselected |
| [TASK-IOLM-000B](work-pack/tasks/TASK-IOLM-000B-DOMAINSPEC-SG-READINESS.md) | verify exact upstream `Sg` readiness handle | pre-L0 | medium | W0 | blocked by existing FPR owners | not-started |
| [TASK-IOLM-001](work-pack/tasks/TASK-IOLM-001-CONTRACT.md) | lock read-only import/projection contract and fixtures | L0 | high | W1 | blocked by G-DSV2-SG | not-started |
| [TASK-IOLM-002](work-pack/tasks/TASK-IOLM-002-COMPILER.md) | build deterministic compiler | L1 | high | W2 | dependency | not-started |
| [TASK-IOLM-003](work-pack/tasks/TASK-IOLM-003-WITNESSES.md) | compile ontology/Craft witnesses | L1 | high | W2 | dependency | not-started |
| [TASK-IOLM-004](work-pack/tasks/TASK-IOLM-004-READ-API.md) | serve immutable GET queries | L1 | medium | W2 | dependency | not-started |
| [TASK-IOLM-005](work-pack/tasks/TASK-IOLM-005-LEARNING-UI.md) | deliver equivalent UI surfaces | L2 | high | W3 | dependency | not-started |
| [TASK-IOLM-006](work-pack/tasks/TASK-IOLM-006-EVIDENCE-PILOT.md) | verify and pilot private witness | L2/L3 | high | W4 | dependency | not-started |

## SWU execution handoff

| SWU | Parent | Dependencies | Write scope | Acceptance evidence | Validation | Owner | Handoff |
|---|---|---|---|---|---|---|---|
| SWU-IOLM-000-A | TASK-IOLM-000 | none | `work-pack/shared/G-OWNER-DECISION.md` | named schema owner, posture, vocabulary route | decision-gate receipt review: pass | manual/decision-gate | completed; G-OWNER handle recorded |
| SWU-IOLM-00C-A | TASK-IOLM-00C | G-OWNER + G-POSTURE | `prototype/contracts/candidate/`, `prototype/fixtures/candidate-contract/` | posture/provenance schemas plus accept/reject fixtures proving candidate receipts cannot satisfy G-DSV2-SG | schema/fixture validation command recorded in result | task-session | **completed — [result](work-pack/session-evidence/SWU-IOLM-00C-A/RESULT.md)** |
| SWU-IOLM-00C-UI-A | TASK-IOLM-00C-UI | historical contract only | none | no execution receipt exists; prior Context Pack and Goal are historical evidence only | [supersession marker](work-pack/session-evidence/SWU-IOLM-00C-UI-A/SUPERSEDED.md) | invoke refresh | **superseded before execution; never passed and not a parent** |
| SWU-IOLM-00C-UI-A1 | TASK-IOLM-00C-UI | passed `iolm-candidate-contract/v1` plus option-1 fixture decision | source-binding contract/schema, boundary guard/gateway, loopback server, boundary tests; new lifecycle under `session-evidence/SWU-IOLM-00C-UI-A1/rebinds/<run-id>/**` | re-read exact allowlisted Key-and-Door bytes immediately before mutation; bind hashes and nine current values; prove 4/3 IDs and joins, realpath/symlink/pre-bind enforcement, GET/HEAD-only fixed routes, 404/405, no DomainSpec mutation | Python and Node boundary suites | task-session | **completed for the current generation — fresh [result](work-pack/session-evidence/SWU-IOLM-00C-UI-A1/rebinds/20260723T002902Z-current-fixture-rebind/RESULT.md) and [receipt](work-pack/session-evidence/SWU-IOLM-00C-UI-A1/rebinds/20260723T002902Z-current-fixture-rebind/execution-receipt.json) pass; historical root result remains immutable** |
| SWU-IOLM-00C-UI-A2 | TASK-IOLM-00C-UI | fresh current-generation `iolm-fixture-boundary/v1` | snapshot schema/adapter, question selector, generated immutable snapshot, model tests; new lifecycle under `session-evidence/SWU-IOLM-00C-UI-A2/regenerations/<run-id>/**` | regenerate a schema-valid deterministic immutable 4/3 default and 2/1 Player slice with exact current IDs, joins and provenance plus typed negatives | Node model suites | task-session | **selected for one current-generation regeneration; historical [result](work-pack/session-evidence/SWU-IOLM-00C-UI-A2/RESULT.md) remains immutable and stale for this generation** |
| SWU-IOLM-00C-UI-A3 | TASK-IOLM-00C-UI | fresh current-generation `iolm-demo-snapshot/v1` | viewer revalidation plus new lifecycle evidence under `session-evidence/SWU-IOLM-00C-UI-A3/revalidations/<run-id>/**`; implementation changes require a new defect | retain graph/outline/table selection parity, Firefox text-node normalization, provenance inspection, and no rendered-browser claim | all A1–A3 Node/Python and loopback asset checks | task-session | **gated and unselected; historical source-contract and Firefox-repair passes remain immutable** |
| SWU-IOLM-00C-UI-A4 | TASK-IOLM-00C-UI | fresh current-generation A1 -> A2 -> A3 receipt chain | new `generated/runs/<run-id>/**`, `session-evidence/SWU-IOLM-00C-UI-A4/output/playwright/<run-id>/**`, and `session-evidence/SWU-IOLM-00C-UI-A4/replays/<run-id>/**`; existing A4 evidence and all A1–A3 implementation are read-only | Firefox `PW-BB-01`–`PW-BB-10`, deterministic-suite replay, network/console/scope/exclusion evidence, honest manual/overall states | local Playwright wrapper with `--browser firefox` plus receipt aggregation | task-session | **gated and unselected; both blocked A4 attempts remain immutable and no `iolm-browser-acceptance/v1` exists** |
| SWU-IOLM-00C-B | TASK-IOLM-00C | 00C-A | `prototype/project.json`, `prototype/features/cyberalchemy-method/`, `prototype/features/craft/`, `prototype/generated/receipts/` | minimal project/feature/node/connection sources compile twice to the same candidate graph and receipt | minted-project conformance + double-build diff | task-session | **blocked before mutation — [decision](work-pack/session-evidence/SWU-IOLM-00C-B/DECISION-GATE.md)** |
| SWU-IOLM-00C-C | TASK-IOLM-00C | 00C-B | `prototype/generated/views/`, `prototype/tests/parity/`, `prototype/src/ui/read-model/` | graph/hierarchy/table parity fixture plus visible and machine-readable candidate posture | parity oracle + authority-guard negative | task-session | pending dependency |
| SWU-IOLM-DSC-A | TASK-IOLM-DOMAINSPEC-EVIDENCE-CONSUMER | successful `SWU-GCP-001`; candidate contract; 00C-B/C candidate substrate | `prototype/src/domainspec-consumer/`, `prototype/tests/domainspec-consumer/`, one fresh `prototype/runs/domainspec-consumer/<run-id>/` | exact EVF handles consumed with unchanged IDs/relations/provenance, deterministic semantic/view parity, eleven rejected negative classes, and fresh non-admitting receipt | contract/schema validation + deterministic replay + parity/negative suite + write-scope diff | task-session; IOLM owner | blocked by dependencies; unselected |
| SWU-IOLM-DSC-B | TASK-IOLM-DOMAINSPEC-EVIDENCE-CONSUMER | DSC-A; green `SWU-BTE-008` / `verify:bte:core`; fresh BTE core handle | distinct `prototype/runs/domainspec-consumer/<run-id>/`; minimal adapter/test extension only if required | 13/13 kinds and 16/16 signatures consumed with exact denominator/test/result/digest equality; fresh breadth receipt eligible for SWU-BTE-010 | breadth contract/schema validation + exact-set replay + parity/negative suite | task-session; IOLM owner | blocked by dependencies; unselected |
| SWU-IOLM-000B-A | TASK-IOLM-000B | live guard; FPR-01/02/03/04 owner receipts | `work-pack/session-evidence/SWU-IOLM-000B-A/` only | exact schema-valid `Sg`, quotient, retraction, identities, and readiness handle | read-only receipt/schema verification | task-session verify | blocked |
| SWU-IOLM-001-A | TASK-IOLM-001 | G-OWNER and G-DSV2-SG | `prototype/contracts/`, `prototype/fixtures/non-collapse/` | read-only import/projection schemas plus one fixture per law | schema test command chosen with host | task-session | blocked |
| SWU-IOLM-001-B | TASK-IOLM-001 | 001-A | `prototype/manifests/`, `prototype/fixtures/sources/` | default-deny pinned manifest | manifest validator | task-session | blocked |
| SWU-IOLM-002-A | TASK-IOLM-002 | 001-A/B and G-DSV2-SG | `prototype/src/compiler/`, `prototype/tests/compiler/` | read-only `Sg` import and source-preserving projection build | unit/schema tests | task-session | blocked |
| SWU-IOLM-002-B | TASK-IOLM-002 | 002-A | `prototype/src/layout/`, `prototype/src/search/` | deterministic layout/search artifacts | double-build comparison | task-session | blocked |
| SWU-IOLM-003-A | TASK-IOLM-003 | 002-A and G-DSV2-SG | `prototype/fixtures/aeo/`, `prototype/tests/witnesses/` | unchanged imported edge plus EGI-008/010/011 negative receipts | witness tests | task-session | blocked |
| SWU-IOLM-003-B | TASK-IOLM-003 | 003-A | `prototype/fixtures/financial-settlement/`, `prototype/fixtures/craft/` | positive fixture and five-class journey | fixture tests | task-session | blocked |
| SWU-IOLM-004-A | TASK-IOLM-004 | 002-A/B | `prototype/src/api/`, `prototype/tests/api/` | GET-only route family | API tests and route scan | task-session | blocked |
| SWU-IOLM-005-A | TASK-IOLM-005 | 003-B, 004-A | `prototype/src/ui/read-model/`, `prototype/tests/parity/` | shared typed read model and parity oracle | parity tests | task-session | blocked |
| SWU-IOLM-005-B | TASK-IOLM-005 | 005-A | `prototype/src/ui/`, `prototype/tests/ui/` | graph, hierarchy, table, journeys | browser journey tests | task-session | blocked |
| SWU-IOLM-006-A | TASK-IOLM-006 | 005-B | `prototype/tests/evidence/`, `prototype/runs/` | gate receipts for determinism/a11y/perf | full evidence command | task-session | blocked |
| SWU-IOLM-006-B | TASK-IOLM-006 | 006-A | `prototype/pilot/`, `prototype/runs/pilot/` | protocol, raw data, bounded verdict | human review + rubric | manual + task-session evidence | blocked |

Task files carry full source anchors, done criteria, related context, synchronization, and recomposition notes.

## Blockers and deferred residue

| ID | Disposition | Scope | Owner | Resolution |
|---|---|---|---|---|
| G-OWNER | resolved gate | none; handle required downstream | [G-OWNER decision](work-pack/shared/G-OWNER-DECISION.md) | `private-learning-map-product-owner` selected with projection-bounded authority |
| B-VOCAB | resolved for private projection scope | none at candidate stage | projection owner plus definitions/source-owner handback | local enums governed; authority-relevant terms remain candidates upstream |
| SGRM-006 | upstream blocker projection | DomainSpec guard/FPR route | existing DomainSpec owner | owner receipt showing legacy oracle retirement is complete |
| SGRM-007 | upstream blocker projection | DomainSpec guard/FPR route | existing DomainSpec owner | owner receipt showing no executable retired-reference guard remains |
| FPR-01 | upstream prerequisite | G-DSV2-SG | existing FPR-01 owner | authority-baseline receipt |
| FPR-02 | upstream prerequisite | G-DSV2-SG | existing FPR-02 owner | supported-profile receipt |
| FPR-03 | upstream prerequisite | G-DSV2-SG | existing FPR-03 owner | precedence/direction receipt |
| FPR-04 | upstream prerequisite | G-DSV2-SG | existing FPR-04 owner | bounded `Sg`, quotient, and independent retraction receipt |
| G-POSTURE | resolved decision gate | candidate execution posture | operator plus private-learning-map-product-owner | `code-first-candidate-later-authority-rebind` selected 2026-07-20 |
| G-DSV2-SG | local authority gate | authoritative labeling/rebind only | TASK-IOLM-000B read-only verifier | exact FPR receipts and bound read-only `Sg` handle |
| B-IOLM-CROSS-FEATURE | active upstream-receipt blocker | SWU-IOLM-00C-B | DomainSpec minted-project/BTE owner route | execute the independently refreshed and accepted predecessor chain, then return a passing cross-feature-support receipt |
| B-IOLM-A3-FIREFOX-EVENT-TARGET | resolved for A3 repair lifecycle | no longer blocks the viewer code; fresh current-generation A1–A3 receipts still gate A4 | SWU-IOLM-00C-UI-A3 Task Session | fresh [repair receipt](work-pack/session-evidence/SWU-IOLM-00C-UI-A3/repairs/2026-07-22-firefox-event-target/execution-receipt.json) proves text-node normalization and regression coverage; preserve it while revalidating A3 after A2 regeneration |
| B-IOLM-A1-PINNED-FIXTURE-DRIFT | resolved by fresh current-generation A1 receipt | none; A2 now consumes the fresh boundary handle while historical A1-A3 remain audit-only | SWU-IOLM-00C-UI-A1 Task Session | [option-1 decision](work-pack/session-evidence/SWU-IOLM-00C-UI-A4/replays/20260722T182915Z-firefox-replay/decision-receipt.json) plus fresh [A1 receipt](work-pack/session-evidence/SWU-IOLM-00C-UI-A1/rebinds/20260723T002902Z-current-fixture-rebind/execution-receipt.json) |
| B-IOLM-UI-MANUAL-RUNNERS | validation-state blocker only; does not block A1–A3 or automated A4 checks | overall validation `PASS` for SWU-IOLM-00C-UI-A4 and parent TASK-IOLM-00C-UI | named human runners with browser and assistive-technology pairings | complete the required manual checks and persist `manual-results.json`; otherwise overall remains `NOT_RUN` |
| B-IOLM-DSC-A | dependency blocker | SWU-IOLM-DSC-A narrow consumer claim | EVF core owner plus IOLM candidate-substrate owner | successful exact `SWU-GCP-001` receipt and passing 00C-B/C substrate handle |
| B-IOLM-DSC-B | dependency blocker | SWU-IOLM-DSC-B breadth consumer and BTE terminal integration | BTE core owner plus IOLM consumer owner | DSC-A pass and fresh green `SWU-BTE-008` / `verify:bte:core` handle |
| D-WEBSITE | deferred | production integration | website product/architecture owner | select host after private witness evidence |
| D-EDITOR | deferred | maintained journeys | learning-content owner | approve editorial lifecycle after pilot |
| D-PUBLIC | deferred | Arcanum-only derivative | separate projection/publication owners | new Invoke and exact-manifest public proof |
| D-SCALE | deferred | alternate renderer | performance/accessibility review | open only after measured trigger |
| B-SWU-TERM | learner-copy blocker | expanded acronym | Craft definitions owner | resolve definition drift |

## Gate checks

1. `SWU-IOLM-00C-A` passed through Task Session; this receipt does not automatically select or authorize 00C-B.
2. G-OWNER and G-POSTURE are persisted. G-DSV2-SG must close before authoritative labeling/rebind, and candidate evidence can never waive it.
3. Each multi-SWU task executes one selected SWU at a time through Task Session.
4. No two SWUs may write the same path concurrently.
5. Every layer promotion cites its exact evidence receipt.
6. Distill validation passes structural coherence but cannot waive authority.
7. Production website and public derivative remain outside the active execution pack.
8. IOLM consumer runs use only the YAML contract and JSON receipt schema; they cannot author upstream handles, and DSC-A cannot satisfy the DSC-B/BTE breadth slot.
9. Both terminal A4 attempts remain immutable block evidence and emit no acceptance handle. The option-1 decision selected a fresh A1 rebind, which now passes for the current generation; exactly one A2 regeneration is selected, while A3 and A4 stay unselected until their fresh predecessor receipts pass. Automation still cannot claim accessibility or usability success.
10. The workable-example eligibility fence names `SWU-IOLM-00C-B`, `SWU-IOLM-00C-C`, `G-DSV2-SG`, `CROSS_FEATURE_UNSUPPORTED`, promotion, and publication; its evidence cannot satisfy or contradict any of them.

## Technique trace

| Technique | Concrete effect | Status |
|---|---|---|
| `sequence` | owner + posture -> passed L0C candidate contract; then independent sibling routes for the L0C-demo workable example and blocked L0C candidate compile/parity -> independent L0D narrow/later-breadth consumption -> later L0A `Sg` rebind -> expanded compiler/witness/API/UI/evidence | pass |
| `scu_swu_reduction` | twenty-two bounded SWUs; superseded UI-A is non-runnable, historical A1–A3 and A4 evidence are preserved, the fresh current-generation A1 rebind passed, only A2 regeneration is selected, A3–A4 remain gated, and 00C-B remains selected and blocked before mutation | pass |
| `recomposition_proof` | every SWU maps to slice, layer decision, SPEC criterion | pass |
| `artifact_contract_bridge` | define/design contracts become task acceptance evidence | pass |
| `state_namespace_boundary` | projection/source/claim/Craft/publication statuses remain separate | pass |
| `owner_boundary_check` | Decision Gate owns local owner selection; existing FPR owners retain DomainSpec authority; Task Session verifies or mutates only its declared scope | pass |
| `validation_loop` | every slice has positive and negative evidence | pass |
| `execution_receipt_handoff` | each SWU returns artifact, validation, residue, next route | pass |
| `residue_ledger` | blockers and deferred scope are named, owned, and routed | pass |

## Next handoff

G-OWNER, G-POSTURE, and `SWU-IOLM-00C-A` are complete. Historical A1–A3 receipts, the Firefox repair, and both blocked A4 attempts remain immutable. The fresh current-generation A1 rebind now passes and returns `iolm-fixture-boundary/v1`. Build a strict Context Pack and compact Goal for exactly one `SWU-IOLM-00C-UI-A2` regeneration lifecycle, consume only that fresh A1 receipt, preserve the historical A2 result, and stop at a fresh `iolm-demo-snapshot/v1` before selecting A3. The separately operator-selected [cross-feature option 1](work-pack/session-evidence/SWU-IOLM-00C-B/DECISION-GATE.md) remains unchanged: 00C-B stays selected and blocked pending a passing upstream cross-feature-support receipt, and 00C-C stays unselected. The fixture sidecar cannot resolve, bypass, contradict, or evidence against that blocker. The L0D consumer SWUs remain blocked/unselected until the candidate substrate and their exact upstream receipts pass.
