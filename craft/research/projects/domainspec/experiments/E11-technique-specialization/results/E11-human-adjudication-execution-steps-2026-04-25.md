# E11 Human Adjudication Execution Steps (2026-04-25)

## Objective

Clear E11 D4 by replacing provisional AI adjudication with evidence-grade human adjudication, then reissuing the D4 decision packet and claim delta.

## Non-Negotiable Locks

Do not change these values during this closure cycle:

- protocol_version: E11-v1
- protocol_hash: 55e46da11e220b258400131440ebba5b20d12e145105001b62bc5cc99957b613
- domainspec_version: 1.8.2
- source run: data/run-2026-04-22-manual.jsonl
- confirming rerun: data/run-2026-04-22-manual-rerun.jsonl
- frozen subset source: results/E11-adjudication-subset-manifest-2026-04-22.md

If any lock changes, stop and open a new run-lock packet before continuing.

## Exit Criteria

E11 is finishable only when all items below are true:

1. Human rater A and human rater B independently label the frozen subset rows.
2. Human third rater resolves every disagreement with explicit rationale.
3. Evidence-grade adjudication replaces provisional AI labels in canonical adjudication artifacts.
4. D4 decision packet is reissued as go.
5. Claim delta recommendation is updated from no-go to go (or remains no-go with explicit reason).
6. MARS evidence status is updated consistently with the final D4 decision.

## Inputs You Will Use

- results/E11-adjudication-subset-manifest-2026-04-22.md
- results/E11-manual-adjudication-sheet-template.csv
- results/E11-D4-decision-packet-2026-04-22.md
- results/E11-claim-delta.md
- results/E11-adjudication-log.md
- protocol.md (for G1-G4 verification command blocks)

## Human Execution Procedure

### Step 1: Freeze the Human Adjudication Round

Create a short note file named:

- results/E11-human-adjudication-round-lock-2026-04-25.md

Record:

- operator names for rater-a-human, rater-b-human, rater-c-human
- confirmation that frozen subset is unchanged
- confirmation that protocol and version lock values are unchanged

### Step 2: Prepare Blind Rating Sheets

From the frozen subset manifest, create two identical blank sheets:

- results/E11-adjudication-rater-a-human-2026-04-25.csv
- results/E11-adjudication-rater-b-human-2026-04-25.csv

Required columns:

- row_id
- analysis_unit
- technique_family
- selected_technique
- rater_label
- rationale_code
- rationale_text
- rated_at

Allowed labels:

- needed
- likely-needed
- not-needed

### Step 3: Run Blind Human Rating Pass A

Rater A fills only their own sheet.

Rules:

- no access to rater B labels
- no access to previous provisional AI labels
- one label per row
- rationale must be present for every row

### Step 4: Run Blind Human Rating Pass B

Rater B fills only their own sheet under the same rules.

### Step 5: Build Disagreement Queue

Adjudication coordinator compares A vs B and creates:

- results/E11-adjudication-disagreements-human-2026-04-25.csv

Columns:

- row_id
- rater_a_label
- rater_b_label
- disagreement_flag

### Step 6: Third-Rater Human Resolution

Human third rater resolves all disagreements and writes:

- results/E11-adjudication-third-rater-human-2026-04-25.csv

Required fields per disagreement:

- row_id
- final_label
- rationale_code
- rationale_text
- third_rater_id
- adjudicated_at

No remaining disagreement is allowed.

### Step 7: Rebuild Canonical Adjudication Log

Update canonical log file:

- results/E11-adjudication-log.md

Requirements:

- adjudication_mode must be human-evidence-grade
- total_subset_rows must match frozen subset count
- disagreements count must match A/B comparison output
- third_rater_resolutions must equal disagreements
- remaining_disagreement_count must be 0
- include full third-rater resolution table for disagreement rows

### Step 8: Reissue D4 Decision Packet

Create a new packet file:

- results/E11-D4-decision-packet-2026-04-25.md

Set condition checks from current run state and human adjudication state.

Expected values for go:

- sample_floor_pass: True
- adjudication_subset_pass: True
- dual_rater_outputs_present: True
- third_rater_resolved: True
- confirming_rerun_pass: True
- evidence_grade_human_adjudication_pass: True
- D4 decision: go

If any item is false, decision must remain no-go with explicit blocker.

### Step 9: Update Claim Delta

Update:

- results/E11-claim-delta.md

Include:

- pointer to new D4 decision packet
- final d4_decision
- status_change recommendation for C2 and MARS-C2
- explicit rationale tied to human adjudication completion

### Step 10: Run Gate Verification and Repository Checks

From experiment directory, run the exact command blocks in protocol.md for:

- G1 quick protocol sanity check
- G2 source quality check
- G3 inventory linkage and pin-consistency check
- G4 strict full-tier schema and metadata check

From repository root, run:

- ./tools/check_github_drift.sh

Record outputs in:

- results/E11-human-adjudication-verification-2026-04-25.md

### Step 11: Propagate Final Status

Update these files to reflect final E11 state:

- research/projects/mars/results/MARS-EVIDENCE-STATUS.md
- research/projects/mars/registry/TRACEABILITY-MATRIX.md
- research/projects/domainspec/experiments/EXPERIMENTS.md

## Completion Checklist

- [ ] Human round lock note created
- [ ] Human rater A sheet completed
- [ ] Human rater B sheet completed
- [ ] Human disagreement queue created
- [ ] Human third-rater resolution file completed
- [ ] Canonical adjudication log updated to human-evidence-grade mode
- [ ] New D4 decision packet issued
- [ ] Claim delta updated
- [ ] G1-G4 verification rerun and recorded
- [ ] Drift check rerun and recorded
- [ ] MARS status and traceability propagated
- [ ] Experiment index status updated

## Recommended Final Decision Rules

Use go only if all are true:

- D4 decision packet is go
- unresolved_count is 0
- evidence_grade_human_adjudication_pass is true
- G1/G2/G3/G4 all pass on current artifacts

Otherwise keep no-go and explicitly document the exact remaining blocker.
