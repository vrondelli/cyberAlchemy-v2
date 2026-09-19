# N20 Distill Validation

## Broad Candidate

“Decide `belongs-to` self-relations” is too broad. It hides direct self-edges,
two-or-more-Entity cycles, duplicates, transitivity, closure, partial-view behavior,
mandatory membership, representation, runtime, cross-feature, and numeric policy.

## Split Rounds

1. Preserve N19's already-selected uniform governance shape.
2. Split one direct equal-endpoint fact from paths over two or more Entities.
3. Split validity behavior from repair target or mandatory membership.
4. Preserve duplicates, transitivity, closure, representation, feature scope, runtime,
   and numeric policy as independent residue.

## Smallest Coherent Unit

`BelongsToUniformSelfEdgeBehavior`: decide whether one direct canonical
`belongs-to_k(e,e)` proposition is rejected or allowed uniformly for every current and
later admitted D30 kind. It owns one primary behavior—direct self-edge validity—and one
reviewable acceptance boundary. It cannot be split further without losing the binary
behavior comparison established by N19.

## Recomposition

After N20, later gates may decide longer cycle behavior and other ordinary packet
facets. D07 conditional uniqueness, D30 vocabulary, `belongs-to`/`owns` non-collapse,
and N19 uniform governance remain unchanged.

## Verdict

- Unit selection: `pass`
- Split pressure: longer cycles, duplicates, closure, existence, replacement parents,
  representation, feature scope, runtime, and numeric policy remain separate.
- Plan readiness: blocked at N20 owner selection.
- Authority effect: `none`.
