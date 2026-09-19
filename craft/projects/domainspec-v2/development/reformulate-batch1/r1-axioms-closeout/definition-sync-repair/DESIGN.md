---
node_type: design
is_session: false
status: candidate
created: 2026-07-10
authored_by: invoke (mode: design)
define: ./DEFINE.md
work_pack: ./WORK-PACK.md
layering: ./implementation-layering.md
target_artifact: DomainSpec v2 R1 AXIOMS definition-sync repair
boundary: INTERNAL; planning addendum only; no authority artifact mutation in this Invoke pass
---

# Design - R1 AXIOMS Definition-Sync Repair

## Architecture Intent

Bring the R1 AXIOMS human and machine surfaces into sync with CAV2-D49,
CAV2-D53, and CAV2-D54 while preserving the already executed R1 authority-home
closeout.

The design deliberately uses a small compatibility layer instead of creating a
new authority kind, splitting invariants, or moving local R1 material into the
CAV2 definition spine.

## Source Contracts

| Contract ID | Source | Required | Notes |
| --- | --- | --- | --- |
| SC-R1B-001 | `../research/axiom-definition-sync-fix/findings.md` | yes | Accepted fix and row-level repair table. |
| SC-R1B-002 | `../../../../authority/AXIOMS.md` | yes | Human authority surface to patch in task-session. |
| SC-R1B-003 | `../../../../authority/AXIOMS.yml` | yes | Machine companion to patch in task-session. |
| SC-R1B-004 | `../../../../../cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` | yes | CAV2-D49/D53/D54 source definitions. |
| SC-R1B-005 | `../WORK-PACK.md` | yes | Existing R1 SWU state and parent sync handoff. |

## View 1: Context View

R1 has already produced `authority/AXIOMS.{md,yml}` and removed independent
authority from `impl/spec/AXIOMS.md`. The open problem is not the authority
home; it is semantic alignment between the local R1 row labels and the current
CAV2 definition system.

This repair sits before parent closeout sync. If `SWU-R1A-002` went straight to
`IMPORT-MANIFEST.md`, `.craft/ledger.yml`, and `CRAFT.md`, it would risk
recording R1 as closed while `AXIOMS.{md,yml}` still overclaims its D53/D49
status.

## View 2: High-Level Structure View

The repair has three coordinated surfaces:

1. Human framing in `authority/AXIOMS.md`.
2. Machine metadata in `authority/AXIOMS.yml`.
3. Validation and receipt evidence for the R1 closeout stream.

The semantic owner remains CAV2. DomainSpec v2 only records compatibility
metadata for its R1 continuity surface.

## View 3: Low-Level Components View

`AXIOMS.md` should add a `CAV2 Definition Alignment` section that:

- Names CAV2-D53, CAV2-D54, and CAV2-D49.
- Says this file catalogs axiom-shaped and invariant-shaped R1 rows.
- States that `Definition` is a cataloging rollup only.
- States that `local_role` and `cav2_shape.primary` do not create a local
  authority taxonomy.

Each active retained row should carry a visible classification block:

- `local_role`
- `cav2_shape.primary`
- `authority_kind_rollup`

Required row classification:

| Row | local_role | cav2_shape.primary | authority_kind_rollup |
| --- | --- | --- | --- |
| A1 | `invariant-shaped` | `CAV2-D54` | `Definition` |
| A2 | `invariant-shaped` | `CAV2-D54` | `Definition` |
| A3 | `invariant-shaped` | `CAV2-D54` | `Definition` |
| A4 | `routed-pointer` | `not-applicable` | `Definition` |
| A5 | `split-routed-pointer` | `CAV2-D54` for retained DomainSpec fragment; `not-applicable` for Saturn fragment | `Definition` |
| A6 | `routed-pointer` | `not-applicable` | `Definition` |

`AXIOMS.yml` should replace ambiguous root authority wording with surface
metadata:

- `canonical_surface: projects/domainspec-v2/authority/AXIOMS.md`
- `authority_surface: projects/domainspec-v2/authority/AXIOMS.yml`
- `authority_kind_rollup: Definition`
- `cav2_alignment.refs.axiom: CAV2-D53`
- `cav2_alignment.refs.invariant: CAV2-D54`
- `cav2_alignment.refs.authority_kind_enumeration: CAV2-D49`
- `cav2_alignment.first_class_authority_kinds.axiom: false`
- `cav2_alignment.first_class_authority_kinds.invariant: false`

A2 should replace `validates` with a downstream metadata field such as
`downstream_validation` or `derived_checks`.

## View 4: Workflow Process View

1. Patch `authority/AXIOMS.md` with CAV2 alignment framing and row
   classifications.
2. Patch `authority/AXIOMS.yml` with root alignment metadata and per-entry
   classifications.
3. Preserve existing row IDs, A2/C6 substance, Saturn routing, and
   `impl/spec/AXIOMS.md` non-authority status.
4. Validate YAML, implementation validation, diff whitespace, and forbidden
   `authority_kind: axiom|invariant` usage.
5. Record the task-session receipt.
6. Resume parent sync as `SWU-R1A-002B` only after the definition-sync patch
   passes.

## View 5: Decision Flow View

Resolved without a new decision:

- Add compatibility classification metadata.
- Use `Definition` as cataloging rollup only.
- Keep A1/A2/A3 D54-shaped for now.
- Keep A4/A6 routed and A5 split-routed.
- Treat the CAV2-D34 citation mismatch as upstream residue, not an R1 repair.

Decision-required moves:

- Amend CAV2-D49 to add first-class `axiom` or `invariant` kinds.
- Rewrite any R1 row into a true D53 world/domain axiom.
- Split a new DomainSpec invariant authority surface.
- Change A2/C6, Saturn routing, R5/R6, or public Arcanum content.

## View 6: Dependency Interface View

Read-only dependencies:

- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`
- `projects/domainspec-v2/development/reformulate-batch1/r1-axioms-closeout/research/axiom-definition-sync-fix/findings.md`
- Existing R1 closeout artifacts under
  `projects/domainspec-v2/development/reformulate-batch1/r1-axioms-closeout/`

Mutable dependencies in the next task-session:

- `projects/domainspec-v2/authority/AXIOMS.md`
- `projects/domainspec-v2/authority/AXIOMS.yml`
- A local task-session receipt under the R1 closeout stream

Deferred parent sync dependencies:

- `projects/domainspec-v2/IMPORT-MANIFEST.md`
- `projects/domainspec-v2/.craft/ledger.yml`
- `projects/domainspec-v2/CRAFT.md`

## Dispatch Technique Trace

| Technique | Use |
| --- | --- |
| sequence | Place definition-sync before parent R1 closeout sync. |
| scu_swu_reduction | Split pending SWU-R1A-002 into patch-first and sync-after units. |
| recomposition_proof | Show that the repair recomposes with the original R1 closeout without changing scope. |
| validation_loop | Require parse, implementation validation, forbidden-kind scan, and diff check. |
| owner_boundary_check | Keep CAV2 definitions read-only and DomainSpec metadata subordinate. |
| authority_split_gate | Prevent local labels from becoming first-class authority kinds. |
| artifact_contract_bridge | Keep human `AXIOMS.md` and machine `AXIOMS.yml` synchronized. |
| concrete_path_evidence | Bind every claim to current local paths and the accepted findings file. |
| residue_ledger | Preserve upstream D34 and future authority-kind amendments as residue. |
| execution_receipt_handoff | Route execution to task-session rather than silently patching authority files. |

## Distill Check

Pass. The smallest coherent unit is a paired classification/metadata patch to
`AXIOMS.md` and `AXIOMS.yml`, plus validation evidence. Smaller units would
either leave the human and machine surfaces out of sync or let parent closeout
certify stale semantics.
