---
node_type: work-pack
is_session: false
status: candidate
created: 2026-07-10
authored_by: invoke (mode: plan)
define: ./DEFINE.md
design: ./DESIGN.md
layering: ./implementation-layering.md
target_artifact: DomainSpec v2 R1 AXIOMS definition-sync repair
complexity: medium
output_mode: swu-handoff
next_route: task-session
mutation_boundary: plan-only; task-session owns authority artifact mutation
---

# R1 AXIOMS Definition-Sync Repair - Work-Pack

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass | Ready for one bounded task-session. |
| complexity | medium | Two authority surfaces plus semantic-definition alignment risk. |
| outputMode | swu-handoff | Split pending R1 sync into repair-first and sync-after units. |
| executionPackRef | n/a | Execution detail is inline. |
| layeringArtifactRef | `implementation-layering.md` | L0-L5 boundaries. |
| dispatchTechniqueTrace | inline | See Dispatch Technique Trace. |
| distillValidationStatus | pass | Minimal coherent unit is paired AXIOMS.md/YAML metadata repair. |
| activeLayerWindow | L1-L3 | Human surface, machine companion, validation receipt. |
| readinessProfile | internal continuation | R1 closeout addendum before parent sync. |

## Objective Summary

Patch the R1 AXIOMS authority pair so it is definition-synchronized with
CAV2-D49/D53/D54 before parent closeout sync records R1 as closed.

## Current State

- SWU-R1A-001 is complete: `authority/AXIOMS.md` and `authority/AXIOMS.yml`
  exist, `impl/spec/AXIOMS.md` no longer carries independent authority, and
  Saturn-routed material is preserved.
- SWU-R1A-002A is complete as of 2026-07-10:
  `authority/AXIOMS.{md,yml}` now carry CAV2-D49/D53/D54 alignment metadata and
  row classifications, with validation evidence in
  `TASK-SESSION-SWU-R1A-002A.md`.
- SWU-R1A-002B is complete as of 2026-07-10: parent manifest, Craft source
  ledger, Craft human view, and related Batch-1 status now record R1 as closed
  while keeping R2/R5/R6 residue open.
- The accepted research finding says the remaining R1 repair is classification
  and metadata correction, not a redesign.
- The previous `SWU-R1A-002` parent-sync route is still valid, but should be
  sequenced after this repair.
- No new owner decision is required for the minimal repair.

## Delivery Slices

| Slice ID | Outcome | Layer | Dependencies | Validation |
| --- | --- | --- | --- | --- |
| S-R1B-001 | `AXIOMS.md` names CAV2 alignment and row classifications. | L1 | accepted findings; CAV2-D49/D53/D54 | Human review against row table. |
| S-R1B-002 | `AXIOMS.yml` carries root and per-entry compatibility metadata. | L2 | S-R1B-001 | YAML parse; forbidden-kind scan. |
| S-R1B-003 | Validation receipt proves R1 remains valid after the patch. | L3 | S-R1B-001; S-R1B-002 | DomainSpec validation, diff check, receipt. |
| S-R1B-004 | Parent closeout sync resumes. | L4 | S-R1B-003 | Full R1 sync validation. |

## Task Status Board

| Task ID | Goal | Layer | Source | Gate Status | Status |
| --- | --- | --- | --- | --- | --- |
| TASK-R1B-CLASSIFY | Apply the CAV2 definition-sync metadata/classification patch. | L1-L3 | this work-pack; findings | pass | done |
| TASK-R1B-SYNC | Resume parent R1 closeout sync after classification passes. | L4 | SWU-R1A-002A receipt | pass | done |

## SWU Execution Handoff

| SWU ID | Parent Task | Source Anchors | Related Context | Dependencies | Write Scope | Done Criteria | Acceptance Evidence | Validation Surface | Execution Owner | Handoff Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-R1A-002A | TASK-R1B-CLASSIFY | `../research/axiom-definition-sync-fix/findings.md`; `../../../../authority/AXIOMS.md`; `../../../../authority/AXIOMS.yml`; CAV2-D49/D53/D54 | SWU-R1A-001 receipt; this addendum | SWU-R1A-001 complete | `authority/AXIOMS.md`; `authority/AXIOMS.yml`; local task-session receipt | Human and machine AXIOMS surfaces classify rows under CAV2-D49/D53/D54 without changing R1 substance. | `TASK-SESSION-SWU-R1A-002A.md` plus passing validation commands. | YAML parse; `npm --prefix projects/domainspec-v2/impl run validate`; forbidden-kind scan; `git diff --check` | local-fallback | complete |
| SWU-R1A-002B | TASK-R1B-SYNC | `IMPORT-MANIFEST.md`; `.craft/ledger.yml`; `CRAFT.md`; SWU-R1A-002A receipt | Original SWU-R1A-002 parent sync | SWU-R1A-002A complete | `IMPORT-MANIFEST.md`; `.craft/ledger.yml`; `CRAFT.md`; local closeout receipt; related Batch-1 status | R1 parent state closes with definition-sync evidence and without hiding R2/R5/R6 residue. | `TASK-SESSION-SWU-R1A-002B.md` plus full validation receipt. | `npm --prefix projects/domainspec-v2/impl run validate`; `tags:test`; `engine:test`; `typecheck`; diff check | local-fallback | complete |

## SWU-R1A-002A Execution Detail

1. Read the accepted row-level repair table in
   `../research/axiom-definition-sync-fix/findings.md`.
2. In `authority/AXIOMS.md`, add a `CAV2 Definition Alignment` section that:
   - Names CAV2-D53, CAV2-D54, and CAV2-D49.
   - States this file is a DomainSpec v2 R1 continuity surface.
   - States `Definition` is a cataloging rollup only.
   - States `local_role` and `cav2_shape.primary` do not create a local
     authority taxonomy.
3. Add row classification blocks:
   - A1/A2/A3: `local_role: invariant-shaped`,
     `cav2_shape.primary: CAV2-D54`,
     `authority_kind_rollup: Definition`.
   - A4/A6: `local_role: routed-pointer`,
     `cav2_shape.primary: not-applicable`,
     `authority_kind_rollup: Definition`.
   - A5: `local_role: split-routed-pointer`,
     `cav2_shape.primary: CAV2-D54` for the retained DomainSpec shift-left
     fragment and `not-applicable` for the Saturn reflection fragment,
     `authority_kind_rollup: Definition`.
4. In `authority/AXIOMS.yml`, replace ambiguous root authority metadata with:
   - `canonical_surface`
   - `authority_surface`
   - `authority_kind_rollup: Definition`
   - `cav2_alignment.refs`
   - `cav2_alignment.first_class_authority_kinds`
5. Add matching per-entry metadata in YAML.
6. Rename A2 `validates` to `downstream_validation` or an equivalent
   non-enforcement field.
7. Preserve existing row IDs, retained text, A2/C6 substance, Saturn routing,
   and `impl/spec/AXIOMS.md` absence/non-authority status.
8. Record a task-session receipt for the repair.

## Validation Commands

Run after patching:

```sh
python3 -c "import yaml; yaml.safe_load(open('projects/domainspec-v2/authority/AXIOMS.yml'))"
npm --prefix projects/domainspec-v2/impl run validate
rg 'authority_kind:\s*(axiom|invariant)' projects/domainspec-v2/authority/AXIOMS.yml projects/domainspec-v2/authority/AXIOMS.md
git diff --check -- projects/domainspec-v2/authority/AXIOMS.md projects/domainspec-v2/authority/AXIOMS.yml
```

The `rg` command should return no matches. If it returns matches, the repair is
not closeable.

## Non-Goals

- No CAV2-D49 amendment.
- No D53 rewrite.
- No CAV2-D34 repair.
- No R2/R5/R6 edits.
- No public Arcanum edits.
- No parent sync until `SWU-R1A-002A` passes.

## Dispatch Technique Trace

| Technique | Evidence |
| --- | --- |
| sequence | Parent sync is deferred until definition-sync passes. |
| scu_swu_reduction | Original SWU-R1A-002 is split into 002A repair and 002B sync. |
| recomposition_proof | Existing R1 substance remains unchanged; only semantic metadata is corrected. |
| validation_loop | YAML parse, DomainSpec validate, forbidden-kind scan, and diff check are mandatory. |
| owner_boundary_check | CAV2 definitions are referenced read-only; DomainSpec does not create authority kinds. |
| authority_split_gate | `Definition` rollup is cataloging only and must be guarded in both surfaces. |
| artifact_contract_bridge | `AXIOMS.md` and `AXIOMS.yml` must agree on row classifications. |
| concrete_path_evidence | All execution paths are repo-local and named above. |
| residue_ledger | D34 mismatch and first-class kind amendments remain explicit residue. |
| execution_receipt_handoff | The next actor is `task-session`, not direct mutation in Invoke. |

## Distill Validation

Pass. The work reduces to one coherent semantic-governance unit:

> Synchronize the R1 AXIOMS human and machine surfaces with CAV2-D49/D53/D54
> through compatibility classification metadata, then validate.

Anything smaller leaves either `AXIOMS.md` or `AXIOMS.yml` stale. Anything
larger starts making owner-gated decisions that the accepted research rejected
for this repair.

## Completion Criteria

`SWU-R1A-002A` is complete only when:

- `AXIOMS.md` and `AXIOMS.yml` carry matching CAV2 alignment.
- A1/A2/A3 are D54-shaped unless explicitly rewritten by a future owner.
- A4/A6 are routed and A5 is split-routed.
- No `authority_kind: axiom` or `authority_kind: invariant` remains.
- YAML parse, implementation validation, forbidden-kind scan, and diff check
  all pass.
- The task-session receipt says `SWU-R1A-002B` is the next route.
