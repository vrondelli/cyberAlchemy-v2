# Smallest Witnesses and Negative Controls

The executable artifact lives in the paired Lean tower:

`domainspec-lean-formalization/research/categorical-deep-learning-algebraic-architectures/witness/ParametricMapWitness.lean`

## Type boundary

- `ParametricMap` stores `P` and `P ⊙ₗ X ⟶ Y`.
- `Reparam f g` stores the contravariant map `g.P ⟶ f.P` and commuting equation.
- identity, vertical composition, and associativity compile.

## Discriminating fixtures

| Fixture | Expected | Result |
| --- | --- | --- |
| Boolean negation reparameterises identity-run into negation-run | positive, nonidentity | compiled |
| constant-false run reparameterises to constant-true run | impossible | negation theorem compiled |
| Boolean diagonal reparameterises an untied pair into `(p,p)` | positive copy | compiled |
| Boolean diagonal realizes `(p,!p)` | false | negation theorem compiled |

## Exact boundary

The diagonal fixture validates copying in the cartesian category `Type`. It is
not Theorem G.10, a practical neural weight-tying proof, or a tensor-program
validation.
