# N09 Design Context

## Objective

Continue from exact N08 selection A. Exact duplicate authored canonical `owns`
facts are rejected. Canonical sources already require `owned-by` to remain generated
and non-authoritative. N09 isolates whether that reverse navigation preserves the
exact D29 dimension or aggregates across dimensions.

## Exact Predicate

For a future dimension-bearing canonical fact `owns_d(o,t)`, Option A would project
`owned-by_d(t,o)` with the same exact admitted dimension `d`. Option B would project
one dimension-free `owned-by(t,o)` navigation pair whenever any admitted dimension
relates the endpoints, aggregating multiple dimensions only in the generated view.

## Evidence Boundary

The exact 14-source denominator is closed in `DESIGN-SCOPE-MANIFEST.json`. DS-D8 and
the relationship registry already forbid authored `owned-by`; D29 makes lifecycle,
custody, and write-responsibility distinct but does not choose inverse representation.

## Dispatch Technique Trace

| Technique | Activation | Effect | Validation |
|---|---|---|---|
| `sequence` | N08 A precedes N09 | one canonical fact before projection | receipt checks |
| `owner_boundary_check` | preserve/aggregate changes generated semantics | A/B authority-gated | prefilter |
| `residue_ledger` | storage, materialization, and other axes remain separate | explicit exclusions | boundary checks |
| `artifact_contract_bridge` | manifest feeds extractor and selector | fixed point | replay |
| `concrete_path_evidence` | 14 SHA-bound sources | no ambient inference | SHA checks |
| `validation_loop` | deterministic generated artifacts | byte identity | validator |
| `frame_handoff` | stop at N09 | one unselected gate | runtime handoff |

A full dispatch document is unnecessary: one owner, one write root, no delegation,
no protected-context crossing, and one terminal gate.

## Obligations

1. Bind exact N08 A and recording-time semantics.
2. Preserve generated-only, non-authoritative `owned-by` in every option.
3. Compare exact dimension preservation with deliberate dimension-free aggregation.
4. Do not select storage syntax, materialization timing, or per-fact representation.
5. Present preserve, aggregate, defer, and stop only.
6. Provide aligned examples with no decision effect.
7. Stop before N09 selection, Plan, or implementation.

Authority effect: `none`.
