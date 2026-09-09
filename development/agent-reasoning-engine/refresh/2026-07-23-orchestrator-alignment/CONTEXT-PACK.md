# Context pack — reasoning-engine / orchestrator alignment refresh

## Selection

- Context Builder mode: `deep`
- Refresh mode: `proposal-only`
- Evidence date: `2026-07-23`
- Target workflow root:
  `cyberAlchemy-v2/development/agent-reasoning-engine/`
- External evidence root:
  `projects/cyberalchemy-orchestrator/`
- External source state:
  - remote advance: `origin/master@6e5936b6d02f4d10c10d215d51a588b5520aa57f`
  - local reasoning-contract commit:
    `05701291d878cab1824c9e0e4193298964f70e79`
- Scope: reconcile the completed private L0 semantic witness with stale
  define/design and Inventory surfaces, then expose—but do not settle—the
  ownership seam between the reasoning engine and the orchestrator's newer ACI,
  Work Bus, protocol, and provenance candidates.
- Excluded: implementation mutation, G-ARE-L0 promotion, ACI contract
  promotion, public/canonical mutation, real effects, and anti-bias efficacy
  claims.

## Obligation matrix

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| `O-ALIGN-01` | Establish the live witness posture without promoting the general engine label. | L0 terminal receipt, current Work Pack, SPEC and architecture selectors. | covered |
| `O-ALIGN-02` | Compare journal, receipt, effect and replay ownership against current ACI evidence. | ACI ADR-001 and Work Pack. | covered |
| `O-ALIGN-03` | Separate accepted W0 decisions from draft/FIX/unimplemented bus, protocol and provenance candidates. | Bus discovery plus assessment, ACP discovery and APT Work Pack. | covered |
| `O-ALIGN-04` | Name exact owner collisions and block only the affected future layers. | Reasoning-engine protocol/governance tasks versus ACI boundaries. | covered |
| `O-ALIGN-05` | Preserve the immediate G-ARE-L0 route and propose the smallest post-promotion design unit. | Work Pack, Craft view and recomposition check. | covered |
| `O-ALIGN-06` | Detect stale repository Inventory projections. | Inventory machine index and two verified synthesis entries. | covered |

Obligation coverage: **6/6**. No runtime handoff is authorized by this context
pack.

## Selected source evidence

| Source and selector | Why selected | Digest / posture |
|---|---|---|
| `implementation/agent-reasoning-engine/generated/runs/evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json` | Terminal evidence for SWU-ARE-001 and its claim ceiling. | SHA-256 `5f622b2a70ef549f9ae545c0152371032cad1a6a5021a3a74ceae96c0d0da6a9`; result `pass`. |
| `development/agent-reasoning-engine/spec/SPEC.md` — Definition posture, non-goals, source contracts | Carries stale `unwitnessed-candidate` wording. | SHA-256 `2b7e57d74f5848802d666e29adc58122fecab501fe19a677f7b44b5e03c7270a`. |
| `development/agent-reasoning-engine/design/ARCHITECTURE.md` — header, source contracts, Views 2/6 | Carries stale witness wording and the actor/journal boundary to reconcile. | SHA-256 `1f1c4c7a7037ad3d944352c6bb0df018816494853c2d034eb79cc0df02616c60`. |
| `development/agent-reasoning-engine/planning/WORK-PACK.md` — SWU manifest, gates, current state | Current status authority: L0 witness complete, promotion pending. | SHA-256 `7f009046513960602257fa374de47bd24bccef9e5032e67e52bc6887ea5370ea`. |
| `planning/work-pack/tasks/TASK-ARE-PROTOCOL-001.md` — SWU-002/003 | Proposes a reasoning-engine-owned journal and observation transport. | SHA-256 `ae96bf088f85152042278ebc0a66a5230a0b77c854e1373ca9acdfa2aca5fed0`. |
| `planning/work-pack/tasks/TASK-ARE-GOVERNANCE-001.md` — SWU-006 | Proposes local durability for receipts/journals. | SHA-256 `978f199e5db738c3100e27ceac37ad47754150fcb465bb0641cb984cb84e425a`. |
| `projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/adrs/ADR-001-persistence-replay-and-canonical-contracts.md` — status, authority, transaction and replay | Accepted ACI W0 decision contract for SQLite journal facts, canonical bytes and effect intents. | SHA-256 `2add074d6895e571230ba80e530cf37698870bd219f1e0202d417a65c6392fed`; accepted for W0 only; runtime gate remains block. |
| `projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/WORK-PACK.md` — control fields, gates, first SWU | Establishes ACI runtime immaturity and owner boundaries. | SHA-256 `873a601e029676fecde92896f15d4b6e78c4d48162b658448debb29dd24e7631`; `workPackGateStatus=block`. |
| `projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/discovery/bus-contracts/README.md` — objective, publication lifecycle, Work Bus boundary | Candidate `submit_work`/`submit_review`, artifact and routing seam. | SHA-256 `70d587a0f5252d44dabe42cfc030e0e41730bf3c9d6e920908be2b2625c517d6`; draft. |
| `projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/discovery/spec-integration-assessment/avaliacao-independente-publication-bridge.md` — evidence table and promotion conditions | Prevents treating the remediated Bus discovery as ratified. | SHA-256 `a98d51f4b4990cc82a962b836d96dbcabf4183926e889c518d668db99508622f`; latest review remains `FIX`, no later PASS receipt. |
| `projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/discovery/agents-communication-protocols/README.md` — ownership and Skill Execution Profile | Candidate seam from skill semantics to confirmed DispatchSpec. | SHA-256 `e365aa804f82b280c13b12a48e69931c103ab736db632a5c5070f621e6d3f02a`; discovery only. |
| `projects/cyberalchemy-orchestrator/docs/features/agent-provenance-telemetry/WORK-PACK.md` — authority boundary and mutation gate | Candidate session/dispatch/research lineage consumer. | SHA-256 `f8808a276ab3413f9b12d4f90f90a101c6826ec4d55852e363498786df56abc4`; `mutationGateStatus=block`. |
| `.arcanum/inventory/entries/agent-reasoning-engine-contract-strategy-result-synthesis.md` | Verified read model still says the evaluator is unwitnessed. | SHA-256 `2e981803e6e36b979a46ff5326ee8c7479511ce14cdf67312cdb019caceefa0b`; stale after L0 receipt. |
| `.arcanum/inventory/entries/cyberalchemy-orchestrator-reasoning-engine-purpose-strategy-result-synthesis.md` | Frozen classification at orchestrator commit `ca560b8`. | SHA-256 `6c5c0f4a8529d1746ddab80b5da6edaff34a081f9f5819ca0de00ac31505fc9f`; historically valid, current-state summary stale. |

Repository Inventory lookup readiness passed against
`.arcanum/inventory/index.json`; the validator reported zero failures and 72
uncontrolled-tag warnings.

## Target inventory

| Target | Owner | Pre-refresh SHA-256 | Proposed posture |
|---|---|---|---|
| `spec/SPEC.md` | Invoke define/refresh | `2b7e57d74f5848802d666e29adc58122fecab501fe19a677f7b44b5e03c7270a` | Record the bounded witnessed L0 slice; retain general-engine non-promotion. |
| `design/ARCHITECTURE.md` | Invoke design/refresh | `1f1c4c7a7037ad3d944352c6bb0df018816494853c2d034eb79cc0df02616c60` | Record L0 evidence and the unresolved ACI binding seam. |
| `planning/WORK-PACK.md` | Invoke plan/refresh | `7f009046513960602257fa374de47bd24bccef9e5032e67e52bc6887ea5370ea` | Add a cross-repository binding blocker without changing the G-ARE-L0 route. |
| `planning/work-pack/tasks/TASK-ARE-PROTOCOL-001.md` | Invoke plan/refresh | `ae96bf088f85152042278ebc0a66a5230a0b77c854e1373ca9acdfa2aca5fed0` | Mark journal/transport write scopes provisional until ownership is decided. |
| `planning/work-pack/tasks/TASK-ARE-GOVERNANCE-001.md` | Invoke plan/refresh | `978f199e5db738c3100e27ceac37ad47754150fcb465bb0641cb984cb84e425a` | Separate artifact-byte ownership from runtime journal authority. |
| `planning/work-pack/waves/W1-L1.md` | Invoke plan/refresh | `1cfb82dadd745e0f2f6acd3faca721313c123954108f8f0d23860f3af850d73e` | Add the binding decision as a W1 entry condition. |
| `.craft/ledger.yml`, `.craft/index.json`, `CRAFT.md` | Craft | `586a5029…`, `d84a4aba…`, `254888a1…` | Add the typed alignment blocker and regenerate views through Craft. |
| `.arcanum/inventory/entries/*reasoning-engine*.md` plus indexes/log | Inventory | entry digests above; index JSON `f2056ca0…` | Preserve historical frozen claims while adding current witness and remote-advance posture. |

## Evidence synthesis

1. The private reasoning engine now has one bounded executable semantic
   witness. The general reasoning-engine label remains unpromoted.
2. Its ordering, typed outcomes, replay, receipt-before-effect rule and
   non-authorizing recommendation are conceptually compatible with ACI.
3. Its planned `RuntimeJournal` and local receipt/journal durability could
   become competing authorities if implemented independently after ACI's W0
   ownership decision. This is a future L1/L2 design blocker, not a reason to
   invalidate L0.
4. A direct binding cannot be authored honestly yet: ACI runtime implementation
   is blocked, Bus Contracts has no post-remediation PASS receipt, ACP remains
   discovery, and APT mutation is blocked.
5. Therefore the smallest coherent next design unit is a documentation-only
   `ACI-REASONING-BINDING` contract that decides authority and maps records
   before actor-protocol or durability mutation.
6. The immediate workflow remains the explicit `G-ARE-L0` owner promotion gate.
   The binding contract is the first proposed post-promotion Invoke design
   route.

## Invariants

1. `implementation_authorized` remains `false`.
2. The L0 receipt closes only the semantic-witness absence; it does not promote
   a general engine, real actor runtime, real effects, ACI compatibility, or
   anti-bias efficacy.
3. ACI ADR-001 is accepted only for its W0 decision scope and does not authorize
   reasoning-engine or ACI runtime mutation.
4. Draft/FIX Bus, ACP and APT material is evidence of candidate seams, not a
   binding authority.
5. Invoke may propose planning/define/design updates. Craft and Inventory retain
   mutation ownership for their own sources and projections.
6. No file outside this refresh package changes in proposal-only mode.

## Excluded candidates

- Directly replacing the reasoning-engine file store with SQLite: excluded
  because this would be target implementation and would bypass both lifecycle
  gates.
- Treating Work Bus or APT schemas as current authority: excluded because their
  gates do not pass.
- Creating the complete ACI binding inside Refresh: excluded because it is a
  design lifecycle artifact with unresolved owner choices.
- Closing the anti-bias gap: excluded because neither repository supplies
  governed efficacy evidence.

## Context Pack Summary

- Task: `invoke refresh agent-reasoning-engine from orchestrator advances`
- Mode: `deep`
- Files selected: 14
- Obligation coverage: `100%`
- Handoff pack: none
- Strict coverage: pass for proposal authoring; runtime handoff not requested
- Blockers: 0 refresh-authoring; downstream blockers are typed in the refresh
  report.

