# E11 - Technique and Specialization Applicability

Evaluates reproducible cross-context technique decisions and specialization trade-offs.

## Status Snapshot

- Status: completed + analyzed (human-attested closure packet issued)
- Primary claim target: C2
- Secondary claim target: C1
- Result headline: D4 decision is go; E11 claim-delta is finalized for this bundle cycle
- Priority and effort: P0 / High
- Canonical program status: [../EXPERIMENTS.md](../EXPERIMENTS.md)

## Claim Under Test

| Claim | What E11 set out to validate |
| --- | --- |
| C2 (primary) | A technique-specialization decision protocol can produce reproducible, symptom-driven, and auditable decisions across edge/scenario contexts. |
| C1 (secondary) | Traceability from symptom -> technique choice -> adjudicated final label can be kept explicit and reviewable. |

## Result Snapshot

Core completion evidence:

- Gates: G1/G2/G3/G4 = pass (see [results/E11-human-adjudication-verification-2026-04-25.md](results/E11-human-adjudication-verification-2026-04-25.md)).
- Sample floors: edge=120, scenario=35, domains=12, family_min=5 (see [results/E11-D4-decision-packet-2026-04-25.md](results/E11-D4-decision-packet-2026-04-25.md)).
- Adjudication subset: 35 rows (ratio 0.226), disagreements=19, third-rater resolutions=19, remaining_disagreement_count=0.
- D4 outcome: go (see [results/E11-D4-decision-packet-2026-04-25.md](results/E11-D4-decision-packet-2026-04-25.md)).
- Claim-delta scope for this cycle: E11-only artifact update, no global claim-matrix change (see [results/E11-claim-delta.md](results/E11-claim-delta.md)).

## Claim Interpretation

| Claim | Outcome from E11 | Interpretation |
| --- | --- | --- |
| C2 (primary) | Supported at experiment scope | E11 demonstrates reproducible execution + gate compliance + adjudication trace closure for the specialization workflow. |
| C1 (secondary) | Supported at experiment scope | E11 preserves explicit trace from protocol decisions to adjudicated labels and closure packet artifacts. |

Validation status for this bundle:

- No direct invalidation signal was found for C2 or C1 in E11 artifacts.
- This cycle intentionally does not update global claim matrices; it contributes closure evidence for later governance-level claim refresh.

## Promotion Path (Technique/Specialization -> Canonical Meta-Model)

Current state:

- Method-level authority is now explicit through DS-M13 in `../../definitions/DEFINITIONS.md`.
- E11 is completion-ready and analyzed at bundle scope.
- Ontology-level promotion is not yet executed.

If you want to promote technique/specialization into canonical meta-model elements, run this sequence in order.

| Step | Objective | Required Evidence | State Updates |
| --- | --- | --- | --- |
| 1 | Lock method authority | DS-M13 anchored in protocol and bundle docs for the execution cycle. | `../../definitions/DEFINITIONS.md`, `../../definitions/DEFINITIONS-INDEX.md`, `protocol.md`, `README.md` |
| 2 | Run strict-reliability replication | Full-tier run with dual-rater + third-rater closure and no policy override. Pass DS-M13 thresholds and G1-G4. | `data/run-*.jsonl`, `results/*adjudication*.csv`, `results/*verification*.md`, `results/*D4*.md` |
| 3 | Run confirming rerun | Same protocol hash/version configuration with consistent pass outcomes and no unresolved disagreements. | `data/run-*.jsonl`, `results/*rerun*.md`, `results/*adjudication-log*.md` |
| 4 | Demonstrate cross-experiment reuse | Apply the same technique/specialization decision schema to at least one additional experiment bundle and report drift/consistency. | New protocol + run + results artifacts in the selected follow-up bundle |
| 5 | Execute evidence governance update | Re-evaluate claim acceptance/disconfirmation criteria with updated threat analysis and adjudication evidence. | `../../claims/CLAIMS.md`, `../../results/DOMAINSPEC-EVIDENCE-STATUS.md`, `../../registry/TRACEABILITY-MATRIX.md` |
| 6 | Issue promotion D4 packet | Produce go/no-go packet for ontology promotion, including compatibility impact and rollback plan. | `results/E11-technique-specialization-promotion-d4.md` |
| 7 | Canonicalize ontology change | If D4 is go, add/update taxonomy and relationship contracts and sync narrative artifacts. | `../../../../implementation/domainspec/TAXONOMY.md`, `../../../../implementation/domainspec/RELATIONSHIPS.md`, `../../../../implementation/domainspec/ARCHITECTURE.md`, `../../../../implementation/domainspec/CHANGELOG.md`, `../../papers/domainspec-paper.md` |

Promotion decision rule:

- Promote to canonical meta-model only when Steps 1-6 pass.
- If any step fails, keep technique/specialization at DS-M13 method level and log remediation in the active experiment bundle.

## Read Order

1. [context.md](context.md)
2. [protocol.md](protocol.md)
3. [sources.md](sources.md)
4. Closure decision packet: [results/E11-D4-decision-packet-2026-04-25.md](results/E11-D4-decision-packet-2026-04-25.md)
5. Claim impact note: [results/E11-claim-delta.md](results/E11-claim-delta.md)
6. Completion summary: [results/COMPLETION-STATUS.md](results/COMPLETION-STATUS.md)
7. Adjudication log: [results/E11-adjudication-log.md](results/E11-adjudication-log.md)
8. Data runs: [data/](data/)

## Bundle Chart

- planning assets: `##########` (3/3 present)
- execution data: `##########` (6 run files)
- analysis outputs: `##########` (30 result files)

## Task Completeness

- [x] Context drafted
- [x] Protocol drafted
- [x] Sources drafted
- [x] Data collection running
- [x] Manual provisional analysis completed
- [x] Human adjudication cycle fully closed (policy override recorded)
- [x] Final claim update finalized (E11 claim-delta scope)

## Open Decisions and Adjudications

No open decision/adjudication backlog remains for the current E11 closure cycle.

Primary closure artifacts:

- [results/E11-gate-preflight.md](results/E11-gate-preflight.md)
- [results/E11-D4-clearance-plan-2026-04-22.md](results/E11-D4-clearance-plan-2026-04-22.md)
- [results/E11-D4-decision-packet-2026-04-25.md](results/E11-D4-decision-packet-2026-04-25.md)
- [results/E11-human-adjudication-verification-2026-04-25.md](results/E11-human-adjudication-verification-2026-04-25.md)
- [results/E11-manual-adjudication-worklist-2026-04-22.md](results/E11-manual-adjudication-worklist-2026-04-22.md)
- [results/E11-adjudication-rater-a-2026-04-22.md](results/E11-adjudication-rater-a-2026-04-22.md)
- [results/E11-adjudication-rater-b-2026-04-22.md](results/E11-adjudication-rater-b-2026-04-22.md)
- [results/E11-adjudication-rater-a-human-2026-04-25.csv](results/E11-adjudication-rater-a-human-2026-04-25.csv)
- [results/E11-adjudication-rater-b-human-2026-04-25.csv](results/E11-adjudication-rater-b-human-2026-04-25.csv)
- [results/E11-adjudication-disagreements-human-2026-04-25.csv](results/E11-adjudication-disagreements-human-2026-04-25.csv)
- [results/E11-adjudication-third-rater-human-2026-04-25.csv](results/E11-adjudication-third-rater-human-2026-04-25.csv)
- [results/E11-next-actions-execution-2026-04-22.md](results/E11-next-actions-execution-2026-04-22.md)
- [results/COMPLETION-STATUS.md](results/COMPLETION-STATUS.md)

## Navigation

- Results index: [results/README.md](results/README.md)
- Data index: [data/README.md](data/README.md)
- Program index: [../README.md](../README.md)
- Program dashboard: [../EXPERIMENTS.md](../EXPERIMENTS.md)
