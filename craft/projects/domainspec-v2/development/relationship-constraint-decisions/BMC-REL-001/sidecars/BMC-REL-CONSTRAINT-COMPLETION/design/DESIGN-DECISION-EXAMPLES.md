# Complexity Example Ladder — Creates Duplicate Authorship

Decision effect: `none`. These examples explain the same unselected Decision
Gate options. They do not change admissibility, select an option, prove runtime
behavior, or authorize implementation.

Shared invariant: the same canonical proposition
`CreateOrder --[creates]--> Order` is authored twice. In every rung, the two
action options receive equivalent treatment.

## Low Complexity — One Source File

Scenario: one authoring file repeats the exact edge on two lines.

- Option A — reject: validation reports the second authored line as a duplicate
  and admits no result until the source is repaired. Benefit: drift is visible.
  Cost: the author must remove the duplicate.
- Option B — coalesce: normalization admits one canonical edge and records both
  source-line handles as merge provenance. Benefit: the graph remains usable.
  Cost: normalization needs a precise provenance contract and may mask careless
  duplication.
- Option C — defer: the source and packet remain unchanged; later Design is
  blocked on this question.
- Option D — stop: the constraint-completion route terminates without a policy.

Hypothesis: line-based authored records exist. This example does not prove a
storage format or an implementation location.

## Medium Complexity — Two Independent Fragments

Scenario: a feature fragment and an imported collaboration fragment each
author the same `CreateOrder --[creates]--> Order` proposition before one
candidate graph is assembled.

- Option A — reject: the assembled input fails with a diagnostic naming both
  fragments; an owner must choose which authored source remains. Benefit:
  canonical authorship ownership becomes explicit. Cost: legitimate merge
  workflows need a repair step.
- Option B — coalesce: assembly emits one admitted proposition while retaining
  both fragment handles and deterministic merge evidence. Benefit: independent
  fragments can converge. Cost: provenance and stale-source reconciliation
  become acceptance-critical.
- Option C — defer: both fragments and the unresolved packet facet remain as
  they are; assembly cannot claim a completed duplicate policy.
- Option D — stop: no continuation design is produced.

Hypothesis: independent fragments are an allowed input shape. This example does
not prove that such a merge workflow currently exists.

## Complex — Canonical Edge, Declared Occurrences, And Generated View

Scenario: two fragments author the same canonical `creates` proposition; a
Workflow also has two distinct step IDs that reuse `CreateOrder`; and a
`creation_targets` projection is generated from the canonical edge.

- Option A — reject: only the repeated authored `creates` proposition is
  rejected. The two step IDs remain legitimate declared occurrences, and the
  generated projection is not counted as a second authored fact. Benefit: all
  axes stay explicit. Cost: fragment repair is still required before the
  projection can be regenerated from a clean source.
- Option B — coalesce: only the repeated authored `creates` proposition is
  merged with provenance. The two step IDs remain distinct, and exactly one
  projection is generated from the admitted fact. Benefit: convergence without
  axis collapse. Cost: the system must prove deterministic merge provenance,
  occurrence separation, and generated-only projection authorship together.
- Option C — defer: no behavior is invented; the duplicate facet stays
  unresolved and all later validation remains pending.
- Option D — stop: the route ends; no duplicate, occurrence, or projection
  policy is advanced.

Hypotheses: the three representations can appear in one future authoring flow.
This example does not prove their current serialization, executable fixtures,
runtime event sourcing, or packet acceptance.

## Recommendation Preserved

Recommend Option A because D27 says one canonical proposition is authored once,
and rejection exposes competing authorship at the earliest boundary. Option B
remains structurally admissible when multi-fragment convergence is a confirmed
requirement and exact provenance is part of the accepted contract.
