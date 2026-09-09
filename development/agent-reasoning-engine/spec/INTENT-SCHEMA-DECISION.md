# Local IntentRecord selection decision

Decision: **PASS — admitted run-02 option A selected**

Scope: private local candidate used by the agent reasoning-engine authoring
package. This is not a canonical CAV2 definition/schema decision, semantic truth
claim, implementation authorization, or public contract.

## Decision provenance

- Gate: [`../experiments/intent-schema/runs/2026-07-22-intent-schema-02/SCHEMA-SELECTION-GATE.md`](../experiments/intent-schema/runs/2026-07-22-intent-schema-02/SCHEMA-SELECTION-GATE.md)
- Admitted result: [`../experiments/intent-schema/runs/2026-07-22-intent-schema-02/RESULT.md`](../experiments/intent-schema/runs/2026-07-22-intent-schema-02/RESULT.md)
- Adjudication packet: [`../experiments/intent-schema/runs/2026-07-22-intent-schema-02/adjudication-packet.json`](../experiments/intent-schema/runs/2026-07-22-intent-schema-02/adjudication-packet.json)
- Terminal receipt: [`../receipts/intent-schema-live-run.json`](../receipts/intent-schema-live-run.json)
- Operator selection: direct response `A`, recorded
  `2026-07-22T11:56:09-03:00`.

Run 01 is excluded. Its selector/excerpt-status/timestamp proposal was not
admitted and has no effect on this decision.

## Selected treatment

| Concern | Decision | Selected rule |
|---|---|---|
| `source` | revise local guidance | Semantic expresser/accountable authority must not be inferred from technical file provenance; unsupported source is `unresolved`. |
| `purpose` | retain | Keep distinct from the current output hypothesis. |
| `scope` | retain | Keep boundaries and exclusions distinct from constraints. |
| `constraints` | retain | Preserve binding rules and forbidden moves. |
| `target_pressure` | retain | Missingness is visible and does not justify field removal. |
| `current_output_hypothesis` | retain | Keep revisable and non-authorizing so replacement pressure stays inspectable. |
| `revision_route` | revise local guidance | Require explicit owner authority or mark the field `unresolved`; do not infer it from navigation. |
| `raw_intent` | retain | Preserve exact captured expression beside the projection. |
| identity and version | retain | Keep stable record and local schema attribution. |
| whole-field posture | retain | Finer-grained provenance remains a later experiment. |
| `revision_history` | unresolved | Select no item schema until revision-bearing evidence exists. |

The existing `raw_intent.captured_at` remains recorder metadata only. This
decision selects no timestamp split, source-declared-time semantics, or new
envelope field.

## Residue and owner routes

| Residue | Effect | Owner route |
|---|---|---|
| One-author interpretation | No inter-rater consistency claim | future experiment owner |
| Fifteen local records | No representative or universal-fitness claim | intent-contract owner |
| No populated source attribution | Nested source-value structure remains provisional | intent-contract owner with source-bearing evidence |
| No accepted revisions | Revision-history granularity remains unselected | revision-bearing experiment owner |
| No finer-grained posture test | Whole-field posture remains the selected minimum only | future experiment owner |

## Downstream constraint

Invoke design and plan may consume `intent-record.selected-local@1` as a local
input contract. They must preserve unresolved source/revision ownership, must
not treat inferred target pressure as an accepted premise, and must not claim
canonical promotion, evaluator implementation, or reasoning-engine admission.
