# E11 D4 Clearance Plan (2026-04-22)

Status: execution-ready
Experiment: E11-technique-specialization
Target decision: clear D4 hold via manual evidence-grade adjudication

## 1) Scope and objective

Run one manual evidence-grade E11 cycle to replace bootstrap-emulated adjudication evidence and resolve the D4 hold.

Objectives:
- Execute a manual full run and a confirming rerun with fixed protocol_version, protocol_hash, and domainspec_version.
- Complete dual-rater adjudication on a minimum 20% subset with third-rater final decisions.
- Produce auditable adjudication rationale logs that support C2 primary and C1 secondary claim review.

Policy lock:
- No claim status upgrade is allowed until every task and go check in this plan is complete.

## 2) Dependency-ordered tasks

| ID | Task | Owner role | Dependencies | Required artifacts |
| --- | --- | --- | --- | --- |
| D4-T1 | Freeze manual-run package (run_id, operator roster, protocol hash lock, baseline ref) | Scientist | none | results/E11-D4-run-lock-2026-04-22.md |
| D4-T2 | Execute manual full run to required sampling floors | Scientist | D4-T1 | data/run-2026-04-22-manual.jsonl |
| D4-T3 | Run strict G4 integrity check on manual full run | Analyst | D4-T2 | results/E11-D4-g4-manual-check-2026-04-22.md |
| D4-T4 | Build adjudication subset manifest (>=20% of manual run rows, stratified) | Adjudication Coordinator | D4-T2 | results/E11-adjudication-subset-manifest-2026-04-22.md |
| D4-T5A | Blind labeling pass on subset | Rater A | D4-T4 | results/E11-adjudication-rater-a-2026-04-22.md |
| D4-T5B | Blind labeling pass on subset | Rater B | D4-T4 | results/E11-adjudication-rater-b-2026-04-22.md |
| D4-T6 | Resolve disagreements and issue final labels with rationale | Third Rater | D4-T5A, D4-T5B | results/E11-adjudication-log.md |
| D4-T7 | Execute confirming rerun with same protocol hash and version pins | Scientist | D4-T3, D4-T6 | data/run-2026-04-22-manual-rerun.jsonl |
| D4-T8 | Re-run gates G1-G4 and compile D4 decision packet | Analyst | D4-T7 | results/E11-D4-decision-packet-2026-04-22.md |
| D4-T9 | Issue claim adjudication recommendation (go/no-go) | Evidence Auditor | D4-T8 | results/E11-claim-delta.md, research/projects/mars/results/MARS-EVIDENCE-STATUS.md |

## 3) Wave plan (parallel vs serial)

| Wave | Mode | Tasks | Exit condition |
| --- | --- | --- | --- |
| W0 | serial | D4-T1 | Manual-run lock artifact approved |
| W1 | serial | D4-T2 | Manual full-run file complete |
| W2 | parallel | D4-T3 + D4-T4 | G4 on manual run passes and subset manifest frozen |
| W3 | parallel | D4-T5A + D4-T5B | Both blind rating outputs complete |
| W4 | serial | D4-T6 | All disagreements resolved by third rater |
| W5 | serial | D4-T7 | Confirming rerun file complete |
| W6 | serial | D4-T8 then D4-T9 | Gates rerun pass and D4 recommendation issued |

## 4) Gate mapping (G1-G4 + D4)

| Gate | Go check | No-go check |
| --- | --- | --- |
| G1 | Protocol remains measurable and locked; single protocol_version/protocol_hash/domainspec_version configuration in run files | Any protocol drift, missing schema contract, or mixed configuration |
| G2 | Source quality command returns g2_violations=0 | Any non-immutable or disallowed source pin |
| G3 | Inventory linkage command returns missing_inventory_index=0, missing_inventory_entries=0, pin_mismatches=0 | Any missing inventory entry/index link or pin mismatch |
| G4 | Strict validator returns violations=0 and no mixed protocol/version configuration across manual and rerun files | Any missing required field, invalid run_id/analysis_unit, or mixed config |
| D4 | All conditions met: sample minima met, adjudication subset >=20%, dual-rater complete, third-rater resolved all disagreements with rationale, confirming rerun complete, G1-G4 rerun pass | Any D4 condition missing or failed |

## 5) Operator checklist (dual-rater + third-rater)

1. Adjudication coordinator computes subset size as ceil(0.20 x total manual run rows) and stratifies across analysis_unit and technique_family.
2. Freeze subset manifest before rating starts; no row substitutions allowed after freeze.
3. Rater A performs blind labeling independently and submits locked output.
4. Rater B performs blind labeling independently and submits locked output.
5. Coordinator compares outputs and creates disagreement queue.
6. Third rater reviews each disagreement and assigns final adjudicated label.
7. For every disagreement, rationale logging is mandatory in results/E11-adjudication-log.md.
8. Required rationale fields per disagreement: row_id, analysis_unit, technique_family, rater_a_label, rater_b_label, final_label, rationale_code, rationale_text, third_rater_id, adjudicated_at.
9. Coordinator records closure metrics: subset_count, subset_ratio, disagreement_count, resolved_count, unresolved_count.
10. remaining_disagreement_count must be 0 before D4-T7 starts.

## 6) Command checklist (post-manual run gate rerun)

From experiment directory:
- cd /home/vrondelli/projects/domainspec-core/research/projects/domainspec/experiments/E11-technique-specialization

Checklist:
- [ ] Run the command block titled G1 quick protocol sanity check in protocol.md.
- [ ] Run the command block titled G2 source quality check (must be zero violations) in protocol.md.
- [ ] Run the command block titled G3 inventory linkage and pin-consistency check in protocol.md.
- [ ] Run the command block titled G4 strict full-tier schema and metadata check for each JSONL row in protocol.md.
- [ ] From repository root, run ./tools/check_github_drift.sh.
- [ ] Record gate outputs and final go/no-go in results/E11-D4-decision-packet-2026-04-22.md.
