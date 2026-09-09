# Dispatch technique trace

| Technique | Why active | Artifact / gate effect | Validation expectation |
|---|---|---|---|
| `sequence` | Receipt verification must precede status synthesis, which must precede handoff. | Orders source check → inventory → signals → proposal → receipt. | No target mutation occurs before or during proposal authoring. |
| `concrete_path_evidence` | The readiness result depends on four exact evidence files and five drifted targets. | Pins selectors and SHA-256 digests in the context pack and report. | Receipt digests match live files; target pre-refresh digests remain unchanged. |
| `artifact_contract_bridge` | Task Session evidence must become an Invoke refresh proposal without inflating its claim. | Maps the policy gate result into planning/Craft deltas. | Every proposed change names its source signal and owner. |
| `owner_boundary_check` | Invoke owns planning refresh; Craft owns its ledger and generated views. | Splits apply work into an Invoke delta and a Craft lifecycle handoff. | No `.craft/**`, `CRAFT.md`, planning, or implementation target is changed. |
| `residue_ledger` | Closing policy blockers does not close semantic-witness or downstream readiness gaps. | Preserves six active gaps and the separate apply/SWU authorization blockers. | Report lists remaining residue and never claims an evaluator witness. |
| `validation_loop` | Proposal completeness needs machine and semantic checks. | Gates JSON/schema validity, artifact presence, source hashes, and mutation invariants. | All declared checks pass before the owner receipt is terminal. |
| `execution_receipt_handoff` | Continuation routing needs a terminal owner result. | Produces `OWNER-RECEIPT.json` and joins the prior continuation route. | Receipt identifies exact artifacts, blockers, residue, and next route. |

## Skipped techniques

- Fan-out/dialectic/tournament techniques: skipped because the controlling
  evidence is already terminal and independently boundary-reviewed; this step
  contains no independent judgment lanes.
- Decision techniques: skipped because refresh scope, target inventory, and
  proposal-only mode are explicit.
- Distill: skipped because the required report is already a bounded state delta;
  additional reduction would remove owner and residue detail.
- Runtime subagents: `none`; the route is a single local owner step and performs
  no delegated lifecycle work.
