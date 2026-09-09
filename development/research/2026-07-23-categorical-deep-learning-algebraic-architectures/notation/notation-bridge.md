# Notation Bridge

| Symbol | Source meaning | Misuse blocked here |
| --- | --- | --- |
| `C` | category of carriers/implementations | not CAV2 canonicality |
| `M` | monoidal category of parameter objects | not an ML model registry |
| `P` | parameter object in `M` | not a CAV2 evidence packet |
| `P ▷ X` / `P ⊙ₗ X` | action of parameters on a carrier | not governance application |
| `(P,f)` | parametric map with `f : P ▷ X → Y` | not a repository mutation |
| `r : P' → P` | contravariantly oriented reparameterisation | not authority promotion |
| `T=(T,η,μ)` | monad / structural theory | not a workflow lifecycle |
| `(A,a)` | `T`-algebra with `a:T A→A` | not an ontology object |
| `Δ_P` | abstract copy/comultiplication | not proof of practical neural tying |
| `!_P` | abstract delete/counit | not a deletion authorization |
| `γ` | embedding from `C` into `Para(C)` | not a CAV2 promotion map |

## Variance

For a source-level 2-cell `(P,f) ⇒ (P',f')`, the parameter map points
`r : P' → P` and satisfies `f' = f ∘ (r ▷ X)`. The Lean witness preserves that
orientation as `Reparam f g` carrying `g.P ⟶ f.P`.

Example G.8 contains notation that appears reversed relative to Definition G.1.
This tower follows the definition and records the discrepancy rather than
propagating it.
