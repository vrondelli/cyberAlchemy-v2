# E11 D4 Decision Packet (2026-04-22)

- generated_at_utc: 2026-04-22T16:32:54.904495+00:00
- scope: post-manual-run D4 decision evaluation

## Gate Results

| Gate | Status | Evidence |
| --- | --- | --- |
| G1 | pass | protocol sanity (SC/schema/gates present) |
| G2 | pass | g2_violations=0 |
| G3 | pass | missing_inventory_entries=0, pin_mismatches=0 |
| G4 | pass | violations=0 on manual+rerun |

## D4 Condition Checks

- sample_floor_pass: True (edge=120, scenario=35, domains=12, family_min=5)
- adjudication_subset_pass: True (subset_count=35, subset_ratio=0.226)
- dual_rater_outputs_present: True
- third_rater_resolved: True
- confirming_rerun_pass: True
- evidence_grade_human_adjudication_pass: False

## D4 Decision

- D4 decision: no-go
- reason: adjudication mode is provisional AI, not evidence-grade human adjudication

## Required Remediation

- replace provisional AI blind labels and third-rater decisions with human adjudication outputs for the same frozen subset or regenerate subset under human workflow.
- keep protocol/version/hash lock unchanged and reissue this decision packet after human adjudication rerun-check.
