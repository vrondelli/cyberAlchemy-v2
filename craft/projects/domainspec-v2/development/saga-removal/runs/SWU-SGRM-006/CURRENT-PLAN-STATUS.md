# Current-Plan Status: SWU-SGRM-006

This table classifies every current guidance/plan family selected from the
SWU-SGRM-001 manifest. A retained Saga match is acceptable only when the file
explicitly marks it historical, superseded, cancelled, or completed migration
evidence.

| Surface | Files | Current status | Saga-match disposition |
| --- | --- | --- | --- |
| Product taxonomy | `impl/spec/TAXONOMY.md` | 13 active backend types plus 11 formation-deferred UI labels; Workflow declares intra-/cross-feature scope | zero matches |
| Learning projection | `impl/spec/meta-types/LEARNING-ORDER.md` | 24 staged labels; 13 active backend types; scoped Workflow | zero matches |
| Governance tags | `impl/governance/tags/CODE-TAG-COMPOSABILITY-PATTERNS.md`; `CODE-TAG-REMEDIATION.md` | implementation guidance names scoped Workflow only | zero matches |
| Repository overview | `README.md` | formal-modeling catalog describes cross-feature Workflow and reuses the historical corpus without reviving a type label | zero matches |
| Discovery | `discovery/domainspec-v2-discovery.md` | current 13+11 counts; retained Saga mentions state the completed collapse decision | completed-decision context only |
| DS-D1 active route | `development/ds-d1-improvement-plan/{WORK-PACK.md,EXECUTION-PACK.md,IMPLEMENTATION-LAYERING.md,PLAN-TRANSPORT.md,ds-d1-improvement.dispatch.json}` | collapse selected; SWU-DSD1-008 cancelled; SWU-DSD1-009 routed through SGRM-001..005; no final-closeout overclaim | resolved/cancelled/migration-open labels only |
| DS-D1 task/wave/shared views | `development/ds-d1-improvement-plan/work-pack/{tasks/TASK-DSD1-SAGA.md,tasks/TASK-DSD1-SYNC.md,tasks/TASK-DSD1-VERIFY.md,waves/W2.md,shared/context.md,shared/cross-task-gaps.md,shared/traceability.md}` | Saga task completed-collapse-routed; active W2 contains backend hardening only | historical branch text or explicit cancellation only |
| Governing decision | `development/ds-d1-improvement-plan/decisions/DEC-DSD1-SAGA-FORK.md` | preserved read-only | governing decision |
| Candidate ledger | `development/meta-type-definitions/CANDIDATES.md` | 13 backend candidates; retired DS-D1.10 gap preserved; Workflow admits both scopes | zero matches |
| Completed formalization baseline | `development/meta-type-formalization/{DESIGN.md,implementation-layering.md,WORK-PACK.md}` | original 14-type execution evidence retained behind current-authority supersession notices | historical baseline only |
| R3 active route | `development/r3-l2-relationship-hardening/{WORK-PACK.md,EXECUTION-PACK.md}`; active task/wave files | TASK-R3H-SAGA-LAWS and SWU-R3H-006/007 cancelled; active dependencies and promotion gates exclude them | cancellation/status evidence only |
| R3 superseded design snapshots | `development/r3-l2-relationship-hardening/{DESIGN.md,DESIGN-TRANSPORT.md,DISTILL-VALIDATION.md,GLOSSARY-CONSISTENCY.md,IMPLEMENTATION-LAYERING.md,PLAN-TRANSPORT.md}`; shared context/traceability | files preserved with explicit supersession notice | historical planning evidence only |
| Novice experiment baseline | `development/comprehension-novice-test/{DEFINE.md,DESIGN.md,WORK-PACK.md,stall-dataset.md,task-coverage-audit.md}` | frozen pre-collapse instrument/data; rerun as written prohibited | historical baseline only |
| Comprehension model | `development/spec-comprehension-model/{DESIGN.md,ORDER.md}` | old Saga learning/edge observations explicitly superseded | historical baseline only |
| Consumed R3 handoff | `development/reformulate-batch1/HANDOFF-novice-test-edge-findings.md` | later collapse resolution precedes preserved handoff body | historical handoff only |
| Saga-removal package | `development/saga-removal/**` | active migration plan and receipts; SGRM-008 still owns final closeout | allowed removal-plan/evidence references |
| Inventory read models | four DomainSpec v2 Saga/boundary entries plus `index.md` and `index.json` | all current summaries route to collapse/removal; none routes directly to hardening | historical-result text plus current routing overlay |
| Negative implementation proof | `impl/spec/__fixtures__/relationships/bad-saga-orchestrates-operation/SPEC.md` and its test | intentionally preserved rejection witness | active negative proof, not an active type |

## Scan Verdict

- Product/current authoring guidance: PASS, zero Saga matches.
- Executable DS-D1 and R3 waves: PASS, no Saga-hardening task is runnable.
- Retained current-plan matches: PASS, each is explicitly historical,
  superseded, cancelled, completed-decision, migration-plan, or negative-proof
  evidence.
- Historical research, decisions, refreshes, and receipts: preserved.
- Final zero-active-reference guard: not claimed here; owned by SWU-SGRM-007.
