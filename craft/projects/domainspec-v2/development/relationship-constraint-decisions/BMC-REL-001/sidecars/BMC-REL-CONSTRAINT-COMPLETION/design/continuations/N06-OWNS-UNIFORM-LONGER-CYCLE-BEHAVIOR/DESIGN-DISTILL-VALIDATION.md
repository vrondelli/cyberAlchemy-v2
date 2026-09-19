# N06 Distill Validation

## Broad Candidate

“Decide owns cycles” remains too broad if it includes self-edges, mixed-dimension
paths, transitivity, exception vocabularies, or representation.

## Split Rounds

1. N04 removes direct self-edges from this subject.
2. N05 selects one uniform policy surface rather than dimension-specific policies.
3. N06 isolates one same-dimension behavior predicate: a directed closed path over
   two or more distinct Entities is rejected or allowed.
4. Mixed-dimension paths and conditional exception vocabularies remain separate.

## Smallest Coherent Unit

`OwnsUniformLongerCycleBehavior`: one uniform reject-versus-allow rule for
same-dimension canonical `owns` cycles over two or more distinct Entities. Splitting
further would remove one side of the required behavior comparison.

## Recomposition

The unit recomposes with N04 and N05 into the nonnumeric owns topology pass without
changing D06 optional uniqueness or D29 vocabulary. It leaves representation and
executable enforcement for later lifecycles.

## Verdict

- Unit selection: `pass`
- Split pressure: mixed-dimension topology, transitivity, closure, representation, and runtime remain separate.
- Plan readiness: blocked at N06 owner selection.
- Authority effect: `none`.
