# R1 Axiom Definition-Sync Findings

Dispatch: `2026-07-09-r1-axiom-definition-sync-fix-research`

## Concise Answer

Minimal repair is a classification/metadata correction inside
`projects/domainspec-v2/authority/AXIOMS.md` and
`projects/domainspec-v2/authority/AXIOMS.yml`, not a redesign, split, or new
authority-kind amendment. Keep the R1 continuity surface and existing A1/A2/A3
plus routed A4/A5/A6 content, but stop implying that every active row is a
first-class CAV2-D53 axiom. A1/A2/A3 should be treated as invariant-shaped
under CAV2-D54 unless an owner later rewrites one into a true D53
world/domain axiom with downstream fan-out. A4/A6 stay routed pointers, and
A5 stays split between a DomainSpec D54-shaped shift-left fragment and a Saturn
reflection pointer. The catalog authority-kind rollup remains `Definition`
because CAV2-D49 does not currently enumerate `axiom` or `invariant` as
first-class authority kinds. [Tarski] [Lawvere] [Kuhn] [Wittgenstein]

The repair belongs in the existing R1 closeout stream, preferably
`SWU-R1A-002`, because it clarifies D53/D54/D49 alignment without changing R1
substance, Saturn routing, A2/C6 semantics, or moving material into definitions.
[Simon]

Evidence labels such as `[Tarski]` and `[Simon]` name dispatch returns, not
canonical authority. The canonical authority for this recommendation is
CAV2-D53, CAV2-D54, CAV2-D49, and the current DomainSpec v2 AXIOMS surface.

## Verdict Matrix

| Candidate fix | Owner | Witnessed? | Sound? | Verdict |
| --- | --- | --- | --- | --- |
| Add CAV2 alignment metadata and per-row classification only | DomainSpec R1 continuity surface; semantic ownership by CAV2-D53/D54/D49 | Yes [Tarski] [van Lamsweerde] [Lawvere] | Yes, if marked compatibility-only and non-authoritative [Kuhn] [Wittgenstein] | **Accept** |
| Rename ambiguous `authority: authority/axioms` to `authority_surface` or `canonical_surface` | DomainSpec R1 metadata | Yes [van Lamsweerde] [Wittgenstein] | Yes, avoids conflating surface path with authority kind [Tarski] | **Accept** |
| Add `authority_kind_rollup: Definition` | CAV2-D49 | Yes [Tarski] [van Lamsweerde] [Lawvere] | Yes, only as cataloging rollup, not semantic conversion [Wittgenstein] | **Accept with guard sentence** |
| Add `local_role` and `cav2_shape.primary` per row | DomainSpec R1 continuity metadata | Yes [van Lamsweerde] [Lawvere] | Yes, only if explicitly non-first-class and used by validation/closeout [Kuhn] [Popper] | **Accept with guardrails** |
| Split `INVARIANTS` out or move rows into definitions | New design / governance change | No, beyond required repair [van Lamsweerde] [Simon] | No for minimal R1 repair; expands scope [Lawvere] | **Reject** |
| Add first-class `axiom` / `invariant` authority kinds | CAV2-D49 owner-gated amendment | Yes as a possible future path [Tarski] [Simon] | Not sound without owner gate and enumeration amendment [Kuhn] | **Decision required; do not do now** |
| Encode D34 as constitution in DomainSpec tests | CAV2 upstream definition repair | Yes, mismatch observed [Tarski] | No; current D34 is Authority, so this would bake in known drift [Tarski] [Lawvere] | **Reject** |
| Alter A2/C6 substance, Saturn routing, or R5/R6 material | Outside R1 clean repair | No [Simon] | No; over-edits closeout surface [Simon] | **Reject** |

## Required Row-Level Repair

This table is the load-bearing classification the patcher should apply. It
keeps A1-A6 visible while preventing the current file name from implying that
every row is a CAV2-D53 axiom.

| Row | Current issue | local_role | cav2_shape.primary | authority_kind_rollup | CAV2 subject test | Minimal edit |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | The row says implementation may not become semantic authority by accident, which is a project artifact/workflow must-hold, not a world/domain truth. | `invariant-shaped` | `CAV2-D54` | `Definition` cataloging only | DomainSpec artifacts can violate A1 by letting implementation become semantic authority, so breach is drift/defect. | Add row classification; keep A1 text and bindings; do not call it a pure D53 axiom unless a future owner rewrites a separate grounding axiom. |
| A2 | The row binds to C6 and checkable adapter-line dependency constraints. | `invariant-shaped` | `CAV2-D54` | `Definition` cataloging only | DomainSpec can violate A2 through forbidden adapter-line dependencies, so it is a must-hold system/artifact condition. | Add row classification; rename `validates` to a downstream/non-enforcement field such as `downstream_validation` or `derived_checks`; keep A2/C6 substance unchanged. |
| A3 | The row requires runnable/computable validation for blocking governance methods, which is checkable gate/invariant material. | `invariant-shaped` | `CAV2-D54` | `Definition` cataloging only | A governance gate can violate A3 by lacking a runnable path, so breach is drift/defect rather than a false world premise. | Add row classification; keep validation and promotion bindings downstream; do not embed validator execution as axiom substance. |
| A4 | The material was dropped from DomainSpec axiom authority and routed to Saturn. | `routed-pointer` | `not-applicable` | `Definition` cataloging only | No active DomainSpec row remains to classify; any future D53/D54 shape belongs to the Saturn owner route. | Keep as routed material with owner route; do not reclassify as an active DomainSpec axiom or invariant. |
| A5 | The material is split: shift-left blocking remains in DomainSpec validation governance/C5, while reflection routes to Saturn. | `split-routed-pointer` | `CAV2-D54` for the DomainSpec shift-left fragment; `not-applicable` for the Saturn reflection fragment | `Definition` cataloging only | The retained DomainSpec fragment is checkable shift-left validation behavior; the reflection fragment is not active DomainSpec authority. | Record the split explicitly; classify only the retained shift-left fragment as D54-shaped; leave reflection routed to Saturn. |
| A6 | The material was dropped from DomainSpec axiom authority and routed to Saturn feedback-budget ownership. | `routed-pointer` | `not-applicable` | `Definition` cataloging only | No active DomainSpec row remains to classify; any future D53/D54 shape belongs to the Saturn owner route. | Keep as routed material with owner route; do not reclassify as an active DomainSpec axiom or invariant. |

## Exact Recommended Patch Shape

### `AXIOMS.md`

Patch only the metadata/alignment framing and row classification language. Do
not rewrite substantive axiom text, move sections, split invariants, or change
routed R1 content. [van Lamsweerde] [Simon] [Lawvere]

Recommended shape:

```md
## CAV2 Definition Alignment

This file is a DomainSpec v2 R1 continuity surface. It catalogs axiom-shaped and invariant-shaped R1 rows against the current CAV2 vocabulary.

- CAV2-D53 `axiom`: a world/domain truth held as given, with possible fan-out into premises, invariants, and constitution rules.
- CAV2-D54 `invariant`: a checkable must-hold on system behavior or artifacts.
- CAV2-D49 `authority kind`: the closed first-class authority-kind enumeration.

Under CAV2-D49, `axiom` and `invariant` are not currently first-class authority kinds. This surface therefore rolls up under `Definition` for cataloging purposes only. That rollup does not convert rows into definitions, does not make `axiom` or `invariant` first-class authority kinds, and does not redefine CAV2-D53 or CAV2-D54.

`local_role` and `cav2_shape.primary` are compatibility classifications for this R1 continuity surface only. They do not create a local authority taxonomy, change CAV2-D49, or bypass CAV2 ownership.
```

For each active retained row, add or normalize a short classification block:

```md
- local_role: axiom-shaped | invariant-shaped
- cav2_shape.primary: CAV2-D53 | CAV2-D54
- authority_kind_rollup: Definition
```

For routed rows A4-A6, use `local_role: routed-pointer` or
`split-routed-pointer`, and set `cav2_shape.primary: not-applicable` for
material no longer active in DomainSpec authority.

Required row rule:

- Use `cav2_shape.primary: CAV2-D53` only when the row is a world/domain
  truth held as given and downstream material fans out from it. [Tarski]
  [Popper]
- Use `cav2_shape.primary: CAV2-D54` only when the row is a checkable
  must-hold on system behavior or artifacts. [Tarski] [Popper]
- Do not embed validator/gate material as if it were itself the axiom. [Tarski]
- Do not cite or encode `CAV2-D34 = constitution` in this file or tests.
  [Tarski] [Lawvere]

### `AXIOMS.yml`

Patch root metadata and per-entry metadata only. Do not introduce
`authority_kind: axiom` or `authority_kind: invariant` anywhere. [Tarski]
[van Lamsweerde]

Recommended root shape:

```yaml
canonical_surface: projects/domainspec-v2/authority/AXIOMS.md
authority_surface: projects/domainspec-v2/authority/AXIOMS.yml
authority_kind_rollup: Definition
cav2_alignment:
  refs:
    axiom: CAV2-D53
    invariant: CAV2-D54
    authority_kind_enumeration: CAV2-D49
  first_class_authority_kinds:
    axiom: false
    invariant: false
  note: >
    This R1 continuity surface classifies rows as axiom-shaped or
    invariant-shaped for compatibility with CAV2-D53 and CAV2-D54.
    Under CAV2-D49, axiom and invariant are not first-class authority
    kinds; Definition is a cataloging rollup only.
```

Recommended entry shape:

```yaml
entries:
  - id: A1
    local_role: invariant-shaped
    cav2_shape:
      primary: CAV2-D54
    authority_kind_rollup: Definition

  - id: A2
    local_role: invariant-shaped
    cav2_shape:
      primary: CAV2-D54
    authority_kind_rollup: Definition
```

Apply the same pattern to A1-A3 without changing row IDs, anchors, or
substantive text unless a future owner explicitly rewrites the row into a
D53-shaped world/domain axiom. For A4-A6, preserve routed-material status and
use the row-level repair table above rather than forcing a D53/D54
classification onto material no longer active in DomainSpec authority. [Simon]
[Lawvere]

Non-vacuity requirement: R1 closeout must actually depend on
`cav2_shape.primary`. D53-shaped rows require fan-out/evidence handling as
world/domain truths; D54-shaped rows require checkable must-hold validation.
Otherwise the metadata repair is cosmetic. [Popper]

## Decision Needs

No new decision is needed for the minimal repair: classification metadata,
authority-surface rename, D49 rollup, and CAV2 alignment note all preserve R1
scope. [Simon] [Lawvere]

A new owner-gated decision is required before any of these changes:

- Add `axiom` or `invariant` to the CAV2-D49 first-class authority-kind
  enumeration. [Tarski] [Kuhn]
- Move AXIOMS material into definitions or split invariants into a new
  authority surface. [van Lamsweerde] [Simon]
- Change A2/C6 substance, Saturn routing, or R1 routed closeout scope. [Simon]
- Repair the upstream CAV2-D34 citation mismatch by changing CAV2 definitions
  or tests. [Tarski]

## Validation Requirements

Run validation after patching:

```sh
python - <<'PY'
import yaml
with open("projects/domainspec-v2/authority/AXIOMS.yml") as f:
    yaml.safe_load(f)
PY

npm --prefix projects/domainspec-v2/impl run validate
git diff --check
rg 'authority_kind:\s*(axiom|invariant)' projects/domainspec-v2/authority/AXIOMS.yml projects/domainspec-v2/authority/AXIOMS.md
```

Acceptance checks:

- `AXIOMS.yml` parses. [van Lamsweerde]
- No YAML row uses `authority_kind: axiom` or `authority_kind: invariant`.
  [Tarski] [van Lamsweerde]
- Every active retained row passes the subject test: D53 for world/domain
  truth; D54 for checkable system/artifact must-hold. Routed rows are marked
  routed instead of forced into active DomainSpec authority. [Tarski] [Popper]
- A1/A2/A3 and routed A4/A5/A6 content remain present. [Simon] [Lawvere]
- Validator/gate material is not embedded as axiom substance. [Tarski]
- No DomainSpec test encodes `D34 = constitution`. [Tarski]
- `implementation/spec/AXIOMS.md` remains absent/non-authority if that is the
  current R1 condition. [Simon]
- Existing R1 gates pass, and parent sync records R1 residue/closure without
  touching R5/R6. [Simon]

## Upstream Residue

CAV2-D34 has a live citation mismatch: D53/D54 cite D34 as constitution, but
current D34 is Authority. This is upstream CAV2 residue and should not be
repaired indirectly through DomainSpec R1 AXIOMS tests or metadata. [Tarski]
[Lawvere]

CAV2-D49 remains closed: `axiom` and `invariant` are semantic shapes, not
first-class authority kinds, unless a future owner-gated amendment changes the
enumeration. [Tarski] [Kuhn] [Wittgenstein]

The recommended R1 repair leaves behind an explicit compatibility layer. That
layer is acceptable only while it stays visibly subordinate to CAV2-D53/D54/D49
and does not become a shadow taxonomy. [Kuhn] [Wittgenstein]
