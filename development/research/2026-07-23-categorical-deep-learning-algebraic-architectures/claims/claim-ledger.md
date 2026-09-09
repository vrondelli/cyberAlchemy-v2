# Claim Ledger

| ID | Claim | Status | Evidence / boundary |
| --- | --- | --- | --- |
| CL-01 | Monad/(co)algebra and fold/unfold machinery underlies the account | `inherited` | Sections 2, B; established universal algebra |
| CL-02 | Geometric equivariance is recovered as a group-action algebra-homomorphism condition | `defined/standard-derivation` | Example 2.6 |
| CL-03 | `Para(C)` has parametric 1-cells and contravariant reparameterisation 2-cells | `defined/inherited` | Definition G.1; Cruttwell/Capucci ancestry |
| CL-04 | `C` embeds identity-on-objects into `Para(C)` | `proved` | Lemma G.4 |
| CL-05 | the embedding preserves connected colimits | `proved-with-hypotheses` | Theorem G.6; strict connected colimits |
| CL-06 | a strong actegorical monad induces `Para(T)` | `sketched-construction` | Example G.8 |
| CL-07 | a lax algebra's parameter obtains comonoid structure | `proved-source-theorem` | Theorem G.10; compressed coherence proof |
| CL-08 | G.10 alone proves practical neural weight tying correct | `blocked` | no implementation/numerical/executable witness |
| CL-09 | the G.11 functor is full and faithful as printed | `asserted-unproved/type-residue` | proof left to reader; `CoMon(C)` suspicious because `P∈M` |
| CL-10 | lax endofunctor algebras and free-monad algebras are equivalent | `conjecture` | Conjecture G.12 |
| CL-11 | selected folding, recursive, Mealy, and Moore cells can be typed and unrolled | `worked-example` | Appendices I/J |
| CL-12 | the source proves general architecture recovery/discovery | `blocked` | starts from chosen functor/cell; G.12 remains conjectural |
| CL-13 | the source's general verification, fairness, safety, and compliance benefits hold | `position-or-aspiration` | Section 4; no empirical/executable validation |
| CL-14 | low-level parametric maps/reparameterisations are representable locally in Lean | `compiled-local-witness` | paired Lean tower |
| CL-15 | nonidentity, impossible, diagonal-positive, and diagonal-negative cases discriminate the relation | `compiled-local-witness` | paired Lean fixtures |
| CL-16 | full `Para`, a 2-monad, G.10, equivariance, or RNN semantics are Lean-verified here | `blocked` | explicitly outside witness scope |
| CL-17 | the paper contributes a new CAV2 authority object | `blocked` | authority delta zero |
| CL-18 | the paper is useful as an external formal owner and future design candidate | `local-research-finding` | CAV2 comparison |

## Contribution split

1. **Inherited substrate:** category theory, monad algebra, (co)algebra
   semantics, free monads, `Para`, and GDL symmetry framing.
2. **Paper-specific position synthesis:** the proposed combination into a
   constraint-to-parametric-implementation account plus selected worked ML
   constructions.
3. **Unproved program:** the general bridge, universal coverage, practical
   correctness, and downstream safety/verification benefits.
