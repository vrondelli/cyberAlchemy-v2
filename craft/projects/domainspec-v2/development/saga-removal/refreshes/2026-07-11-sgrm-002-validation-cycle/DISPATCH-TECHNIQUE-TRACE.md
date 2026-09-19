# Dispatch Technique Trace

| Technique | Activation | Effect | Validation |
|---|---|---|---|
| `sequence` | User requested refresh followed by Task Session. | Refresh completes and validates before execution resumes. | Refresh receipt must name `task-session` as next route. |
| `artifact_contract_bridge` | SGRM-002's validator failed on one field owned by a later task. | The authority task gains a one-field schema bridge without inheriting schema deletion. | Task, work-pack, wave, layering, and dispatch must agree. |
| `owner_boundary_check` | The repair crosses from canonical authority into one implementation field. | Only `edge_participation.source_of` is admitted; criterion, card, fixtures, identity, and deletion stay excluded. | Focused scope text and later Task Session diff guard. |
| `validation_loop` | The original failure was a hard validator contradiction. | `validate:rels` remains mandatory; dispatch and docs are revalidated during refresh. | Full dispatch validator and docs validator pass. |
| `concrete_path_evidence` | The blocker identifies an exact file and field. | Every applied delta points to the blocked receipt, decision artifact, or schema path. | Refresh JSON maps each signal to targets. |
| `residue_ledger` | The bridge intentionally leaves a legacy schema for later deletion. | SGRM-004 remains the explicit deletion owner. | Work-pack gap and layering text preserve the residue. |

## Skipped Techniques

- `scu_swu_reduction`: skipped because the existing SWU remains coherent after a
  single-field boundary amendment.
- `recomposition_proof`: skipped as a separate artifact because the existing
  implementation layering already owns recomposition and was refreshed in place.
- New full dispatch creation: skipped because a full dispatch already exists;
  its affected step was updated and revalidated successfully.

## Result

PASS. Every selected technique changes a target artifact, gate, evidence check,
or residue route; none is decorative.
