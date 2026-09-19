# N05 Distill Validation

## Broad Candidate

“Decide owns cycles” is too broad. It hides whether the three D29 axes share one
policy, whether cycles are rejected or allowed, and whether mixed-dimension paths
participate.

## Split Rounds

1. Split direct self-edges from paths over two or more distinct Entities. N04 already
   closes only self-edges.
2. Split governance shape from behavior. A reject/allow decision across all dimensions
   would silently select uniformity; per-dimension behavior would silently select
   independent governance.
3. Split same-dimension paths from paths whose edge dimensions differ.

## Smallest Coherent Unit

`OwnsCyclePolicyGovernance`: decide whether future same-dimension longer-cycle policy
is one uniform rule over all admitted D29 dimensions or independently owner-governed
per dimension. It owns one primary behavior—policy partitioning—and one reviewable
acceptance boundary. It cannot be split further without losing the comparison.

## Recomposition

The unit recomposes into the later nonnumeric owns topology pass: after N05, one or
several future gates may decide actual longer-cycle behavior. N04 self-edge rejection,
D06 optional uniqueness, and D29 vocabulary remain unchanged.

## Verdict

- Unit selection: `pass`
- Split pressure: behavior, mixed-dimension topology, transitivity, and representation remain separate.
- Plan readiness: blocked at N05 owner selection.
- Authority effect: `none`.
