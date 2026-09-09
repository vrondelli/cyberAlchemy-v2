# Learning Pack

## What to retain

1. The paper is a position-paper synthesis of established categorical
   ingredients, with a defensible proposed ML combination.
2. Algebra homomorphisms provide a precise preservation condition; `Para`
   provides typed parametric implementations and reparameterisations.
3. Theorem G.10 gives abstract parameter-comonoid structure, not practical
   neural weight-tying correctness.
4. Appendices I/J construct selected recursive/recurrent families. The general
   bridge is still Conjecture G.12.
5. A small Lean fragment now compiles with positive and negative controls.
6. The paper is useful to CAV2 as external research and a possible future
   typed-coupling source, but changes no authority today.

## Fast validation

```bash
cd domainspec-lean-formalization/lean-engineer
lake env lean \
  ../research/categorical-deep-learning-algebraic-architectures/witness/ParametricMapWitness.lean
```

Expected result: exit code `0`, no output.

## Do not say

- “The paper proves a theory of every architecture.”
- “The Lean repo formalizes categorical deep learning.”
- “G.10 proves a neural implementation ties weights correctly.”
- “The paper validates CAV2 architecture or residue.”
- “Architecture recovery discovers a model from data.”

## Safe downstream sentence

“arXiv:2402.15332v2 is an externally owned categorical position program that
combines established algebraic ingredients to relate selected neural
constraints and parametric implementations; our local Lean witness verifies
only reparameterisation and diagonal-copy examples, and no CAV2 authority
change follows.”
