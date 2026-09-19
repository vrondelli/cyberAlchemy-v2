# DSR-001 execution context

Status: candidate session evidence. Authority effect: none.
User request: “so lets do 1”. Selected unit: DSR-001, the first ready unit of
phase 1. Native local execution; no delegation or runtime handoff.

## Scope and evidence obligations

Task Session and Context Builder (lean) control this bounded execution. The
task is operational preservation, not a new compiler capability or ontology.

| Obligation | Controlling source and selector | Execution choice |
| --- | --- | --- |
| Preserve selected current bytes | [Work items](../WORK-ITEMS.json), DSR-001 action/acceptance | Digest-address every selection and archive existing bytes. |
| Preserve exact historical identity | [Evidence](../EVIDENCE.json), selected_sources/baseline | Preserve the original planning evidence; refresh in a separate epoch. |
| Separate current, frozen, packaged and generated states | [Plan](../PLAN.md#dsr-001), task contract | Distinct inventories and byte comparisons, no inferred acceptance. |
| Detect concurrent drift | [Validation](../VALIDATION.md#v02), preservation method | Rehash before/after capture, before synchronization and at closeout; no exclusive-lock claim. |
| Keep admission separate | [Decisions](../DECISIONS.md#dec-01), actual gate | DEC-01 is not required to preserve bytes; no completion-definition selection made here. |

Five context files; all selected excerpts map to obligations; no runtime handoff.
Baseline members and package manifests are task data, not additional instruction
context. BMC references are recorded as present/missing, not recovered here.
SFOL session reconstruction and capability classification remain later units.

## Write and preservation boundary

Create only files under this recovery directory. After preservation validates,
synchronize only DSR-001 and its current frontier in WORK-ITEMS.json and PLAN.md,
with exact before/after digests. Preserve their original bytes in the archive.
No compiler, canonical, accepted-decision, archive, index, commit, external or
publication changes. No Invoke workflow.

The compressed preimage bundle is a generated backup artifact. Its objects map
SHA-256 keys to base64 original bytes, including selected dirty files and HEAD/
index preimages. Paths and modes live in source-snapshot.json. Recovery must
write into a new explicitly selected directory; this tool never restores over
working files. This is a selected-input backup, not a whole-repository backup.

No blocker-level choice is required: additive local preservation is reversible
and explicitly requested. Missing historical receipt bytes are retained as
absence, not manufactured. Presence of an archive never admits current source.

## Validation and next boundary

Run snapshot.test.mjs; capture once; verify all objects, paths and current hashes;
synchronize exact planning rows; then verify with exact synchronization digests.
Capture refuses overwrite. Future input drift requires a fresh evidence epoch,
not rewriting this one. Task completion does not close phase 1 or product tests.
No reusable sigil lifecycle changed; experiment harness is not applicable.

## Open Questions

Unresolved product choices remain in [DECISIONS.md](../DECISIONS.md). No open
choice blocks this preservation-only unit.
