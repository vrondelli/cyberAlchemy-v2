# Define Downstream-Utility Experiment

Status: `prepared-pre-execution-not-authorized`

Protocol ID: `define-downstream-utility@1`

## Decision Question

Does a structured Definition Pack improve downstream plan fidelity,
implementation correctness, human understanding, and total rework compared
with a ticket and with information-matched prose notes?

The fourth condition separately tests whether runtime evidence gating adds
value beyond the pack.

## Conditions

| ID | Material available | Question isolated |
| --- | --- | --- |
| `ticket_only` | ticket plus normal access to the frozen source corpus | current baseline |
| `equivalent_notes` | ticket plus the pack's selected facts as ordinary prose | effect of additional selected information |
| `definition_pack` | ticket plus the same facts in Definition Pack structure | effect of structure |
| `definition_pack_evidence_gate` | same pack plus runtime commitment conditions | effect of enforcement |

## Prepared Artifacts

- `PROTOCOL.md` — task selection, randomization, stages, and stop rules;
- `runtime/RUNTIME-DESIGN.md` — interactive controller, isolation, session,
  evaluation, review, evidence, and implementation-layer design;
- `runtime/README.md` — L1/L2 command guide, persisted files, and explicit safety
  boundary;
- `runtime/cli/define.mjs` and `runtime/cli/runtime.mjs` — prepare-only wizard,
  command adapter, append-only ledgers, derived state, and exclusive run lock;
- `runtime/cli/isolation.mjs`, profile, schema, and fixtures — exact-commit
  four-condition agent bases, evaluator-only hidden truth, and rehearsal receipt;
- `runtime/cli/block.mjs`, L3 materials, schema, and tests — neutral synthetic
  packet compilation, sealing, four-cell evidence, and joined validation;
- `runtime/BENCHMARK-ADMISSION.md` — later public benchmark research and
  admission boundary;
- `runtime/tests/prepare-cli.test.mjs` — restart, question visibility,
  one-step transition, locking, and zero-model regression checks;
- `TASK-SELECTION.md` — frozen sampling frame and ambiguity rubric;
- `FACT-SET-CONTRACT.md` — atomic fact parity and pack-content boundary;
- `METRICS.md` — formulas, comparisons, and pilot continuation rule;
- `CLAIM-BOUNDARY.md` — permitted and blocked claims;
- `evidence/run-row.schema.json` — append-only row contract;
- `evidence/task-selection.schema.json` — pre-outcome sampling record;
- `evidence/condition-manifest.schema.json` — information and attribution bindings;
- `evidence/validate_task_selection.py` — ambiguity and pilot-shape validator;
- `evidence/validate_condition_manifest.py` — parity and condition-boundary validator;
- `evidence/validate_run.py` — row and four-condition-block validator;
- `evidence/validate_experiment_bundle.py` — digest join across task selection,
  condition manifests, run rows, and condition costs;
- `evidence/calculate_metrics.py` — descriptive condition summary;
- `evidence/test_condition_manifest.py` and `evidence/test_run_contract.py` —
  negative regression checks for attribution, unknowns, evidence kinds, and
  live-pilot shape;
- `evidence/fixtures/` — synthetic passing and failing rows.

## Evidence State

Synthetic fixtures prove only that the data contract accepts expected shapes,
rejects known defects, and calculates labeled dry-run summaries. No live run
exists. The L1 runtime can validate a selected task file, collect preparation
answers, and move a local run from `draft` to `prepared`. The L2 rehearsal can
construct and verify isolated source bases. The L3 synthetic chain validates a
neutral four-condition evidence block. `prepared` does not freeze or authorize
a pilot, start a model session, or execute hidden tests. Synthetic rows cannot
support a product-effect claim.

Use `validate_experiment_bundle.py --live-pilot ...` only for a selected live
pilot. It composes the task-selection, manifest, and row validators and requires
24 joined `live_run` rows: four conditions for each of six distinct tasks,
split into two low-ambiguity controls and four high-ambiguity tasks.
