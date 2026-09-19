# N08 Design Context

## Objective

Continue from exact N07 selection A. Mixed-dimension closure alone does not invalidate
a canonical `owns` path. N08 isolates what happens when the exact same canonical
`owns` proposition is authored more than once.

## Exact Predicate

An exact duplicate has the same canonical `owns` verb, owner Entity concept ID,
target Entity concept ID, admitted D29 dimension ID, and admitted authority or
feature context. Different dimensions are distinct facts. Different owners for one
target and dimension are D06 uniqueness conflicts, not exact duplicates.

## Evidence Boundary

The exact 14-source denominator is closed in `DESIGN-SCOPE-MANIFEST.json`. The packet
marks `owns.proposed_decision.duplicates` unresolved. N01 and N03 resolved exact
duplicates only for `creates` and `orchestrates`, explicitly without globalizing a
duplicate policy.

## Dispatch Technique Trace

| Technique | Activation | Effect | Validation |
|---|---|---|---|
| `sequence` | N07 A precedes N08 | preserves topology decisions | receipt checks |
| `owner_boundary_check` | reject/coalesce changes authored semantics | A/B authority-gated | prefilter |
| `residue_ledger` | other duplicate and owns axes remain separate | explicit exclusions | boundary checks |
| `artifact_contract_bridge` | manifest feeds extractor and selector | fixed point | replay |
| `concrete_path_evidence` | 14 SHA-bound sources | no ambient inference | SHA checks |
| `validation_loop` | deterministic generated artifacts | byte identity | validator |
| `frame_handoff` | stop at N08 | one unselected gate | runtime handoff |

A full dispatch document is unnecessary: one owner, one write root, no delegation,
no protected-context crossing, and one terminal gate.

## Obligations

1. Bind exact N07 A and recording-time semantics.
2. Classify only exact duplicate authored canonical `owns` facts.
3. Preserve D29 dimension identity and D06 uniqueness conflicts.
4. Present reject, coalesce-with-provenance-obligation, defer, and stop only.
5. Keep provenance retention conditional until B is selected and later designed.
6. Provide aligned examples with no decision effect.
7. Stop before N08 selection, Plan, or implementation.

Authority effect: `none`.
