# N19 Distill Validation

## Broad Candidate

“Decide `belongs-to` topology” is too broad. It hides policy governance, direct
self-edge behavior, longer cycles, duplicates, partial-view/closure behavior,
mandatory membership, representation, runtime, and numeric bounds.

## Split Rounds

1. Split fixed D07 one-parent-per-kind uniqueness from every ordinary packet facet.
2. Split direct equal-endpoint facts from paths over two or more Entities.
3. Split governance shape from behavior: reject/allow across all kinds would silently
   select uniformity, while a kind-local answer would silently select independent governance.
4. Preserve duplicates, transitivity, closure, mandatory membership, representation,
   runtime, and numeric policy as independent residue.

## Smallest Coherent Unit

`BelongsToSelfEdgePolicyGovernance`: decide whether future direct self-edge behavior is
one uniform rule over every admitted D30 kind or independently owner-governed per kind.
It owns one primary behavior—policy partitioning—and one reviewable acceptance boundary.
It cannot be split further without losing the comparison.

## Recomposition

After N19, one or several later gates may decide actual direct self-edge behavior. D07
conditional uniqueness, D30 vocabulary, `belongs-to`/`owns` non-collapse, and N18 remain
unchanged.

## Verdict

- Unit selection: `pass`
- Split pressure: behavior, longer cycles, duplicates, closure, existence, representation,
  runtime, and numeric policy remain separate.
- Plan readiness: blocked at N19 owner selection.
- Authority effect: `none`.
