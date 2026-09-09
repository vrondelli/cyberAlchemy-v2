# Findings — Categorical Deep Learning as an Algebraic Theory of All Architectures

Status: research finding; not authority

Source: Bruno Gavranović *et al.*, [*Position: Categorical Deep Learning is an
Algebraic Theory of All Architectures* (arXiv:2402.15332v2)](https://arxiv.org/abs/2402.15332)

Scope: establish what the paper actually supplies, the smallest checked Lean
contact point, and whether that evidence changes CyberAlchemy v2 (CAV2).
Nothing in this finding promotes a CAV2 definition, authority kind, schema,
implementation obligation, or public claim.

## Executive verdict

**The paper adds a useful, externally owned formal substrate for a narrowly ML
specific problem; it adds no current CAV2 authority delta.** Its durable value
is a precise separation between a structural constraint and a parametric neural
implementation, expressed by algebra homomorphisms and `Para(C)`. The local
Lean witness verifies only the lowest `Para` data layer: parametric maps,
contravariantly oriented reparameterisations, and their vertical category.

The title must be parsed as **“Categorical Deep Learning is an Algebraic Theory
of All Architectures”**, not “an Algebraic Theory of All Architectures” in the
sense of a proved universal capture. The document calls itself a position paper;
the “all architectures” reach and the stronger verification/safety consequences
remain programme claims, not results.

## What the paper contributes — without inheritance inflation

| Layer | What is present | Status and boundary |
| --- | --- | --- |
| Inherited substrate | Monads, (co)algebras, algebra homomorphisms, initial/final semantics, free-monad constructions, `Para`, and geometric equivariance. | Established mathematics and prior work; the paper does not originate these notions. |
| Paper-specific position synthesis | A single proposed bridge: structural theory/constraint → (co)algebra law → parametric implementation in `Para(C)`; worked recoveries cover GDL constraints and RNN/recursive/automata-shaped cells. | Source-backed position plus selected constructions, not a general architecture theorem. |
| General bridge still unproved | A universal account of architectures; formal criteria for practical weight-tying correctness; the lax-endofunctor/free-monad equivalence; empirical superiority, design efficacy, fairness, safety, and compliance. | Blocked from stronger local or paper-derived claims. |

The paper’s architecture operation is **construction/unrolling from a selected
functor and selected cell**. It is not discovery of an unknown architecture from
trained weights, telemetry, or observations.

## Formal chain and proof-status ledger

The usable chain is:

```text
chosen structural theory T / endofunctor F
  -> (co)algebras as semantic carriers
  -> (co)algebra homomorphisms as constraint-respecting maps
  -> Para(C): (P, P ▷ X -> Y), with reparameterisation 2-cells
  -> strong actegorical monad T induces Para(T)                 [G.8 sketch]
  -> lax Para(T)-algebra has a parameter comonoid               [G.10]
  -> copying ΔP can express a selected tying construction
  -> chosen recursive/corecursive cells can be unrolled
```

| Item | Paper status | Permitted finding |
| --- | --- | --- |
| Group-action monad algebra homomorphisms express equivariance | Definition/example derivation (Secs. 2, Appendix C/H) | A concrete constraint can be represented as a commuting law once its action and carriers are supplied. |
| `Para(C)` parametric maps and reparameterisations | Definition G.1; inherited `Para` construction | The low-level data has a local Lean witness. |
| `C -> Para(C)` embedding and connected-colimit preservation | Lemma G.4 / Theorem G.6 under stated strictness and preservation hypotheses | Do not use without those hypotheses. |
| Strong actegorical monad induces `Para(T)` | **Example G.8 construction with coherence check sketched**, not a locally formalised theorem | A next formalisation target only. |
| Lax `Para(T)` algebra induces a parameter comonoid | **Theorem G.10**: stated with a proof that derives `!P` and `ΔP`; remaining coherence is described as tedious/straightforward | The source supports the theorem at its stated abstract level, not a completed local proof or a practical ML correctness result. |
| Full-and-faithful functor | **Corollary G.11 asserted; proof left to the reader.** Printed target is `CoMon(C)` although the parameter is declared in `M`. | Treat as unverified source material. The apparent typing defect is recorded; it is not silently repaired to `CoMon(M)`. |
| Lax endofunctor algebra ↔ algebraically free monad algebra | **Conjecture G.12**, with hypotheses | Must remain conjectural. It cannot justify general unrolling/equivalence claims. |
| RNN/recursive/Mealy/Moore unrollings | Selected Appendix I/J constructions, using lax homomorphisms for 2-endofunctors for clarity | They exhibit construction patterns; they do not prove “all architectures,” empirical performance, or practical tying correctness. |

Primary selectors: [abstract](https://arxiv.org/abs/2402.15332), paper §§2–4;
Definition G.1 (PDF pp. 21–22), Example G.8 and Theorem G.10 (pp. 23–24),
Corollary G.11 and Conjecture G.12 (p. 25), and Appendices I/J (pp. 28–32).
The inspected v2 source file has SHA-256
`7c144554200aa2843e626f9dddf6727bf40546c5003d9d5cbe250c4c478110f1` for its
downloaded source archive; the inspected 32-page PDF has SHA-256
`16d3632a3e323b7fdcc1901c6c44bf1ec28711d3a8cd286485e6cf6a511bc248`.

## Smallest Lean witness

The checked local witness is
[ParametricMapWitness.lean](../../../../domainspec-lean-formalization/research/categorical-deep-learning-algebraic-architectures/witness/ParametricMapWitness.lean).
It defines:

```lean
structure ParametricMap (X Y : C) where
  P : M
  run : P ⊙ₗ X ⟶ Y

structure Reparam (f g : ParametricMap X Y) where
  map : g.P ⟶ f.P
  comm : (map ⊵ₗ X) ≫ f.run = g.run
```

It proves identity, vertical composition, associativity, and that a
reparameterisation preserves the represented run by its defining commuting
equation. It compiled successfully on 2026-07-23 with:

```bash
cd domainspec-lean-formalization/lean-engineer
lake env lean ../research/categorical-deep-learning-algebraic-architectures/witness/ParametricMapWitness.lean
```

This is a compile witness for the *data and vertical 2-cell fragment*, not a
formalisation of `Para(C)` as a 2-category. It proves neither horizontal
composition/coherence, `Para(T)`, a 2-monad, lax algebra, G.10, a neural
architecture semantic, nor a claim about trained weights.

### Fixtures

| Fixture | Result | What it tests | What it does not test |
| --- | --- | --- | --- |
| `negateReparam` | Positive | A Boolean reparameterisation preserves the new run. | A learned model or a constraint theorem. |
| `no_false_to_true_reparam` | Negative | No reparameterisation transforms constant-false into constant-true. | Exhaustive semantic impossibility beyond this finite fixture. |
| `diagonalReparam` | Positive | Precomposing an untied Boolean pair with a diagonal yields the selected tied pair. | G.10, practical weight-tying correctness, or an RNN property. |
| `diagonal_does_not_realize_antiTied` | Negative | The same diagonal does not produce a deliberately anti-tied target. | An empirical comparison or architecture-discovery result. |

The current exact blocker is representational: the installed bicategory support
does not provide bicategorical monads/2-monads needed to state the paper’s lax
`Para(T)` result in the present local route. A distinct modelling project would
also be needed for actual ML/tensor carriers and architecture semantics.

## Does it add something to CyberAlchemy v2?

Yes, as source evidence and a formal contrast; **no, as current local
authority**. CAV2 has a governance bridge:

```text
governed claim/artifact --(owner + evidence + gate)--> allowed authority/work
```

The paper has a mathematical ML bridge:

```text
architecture constraint --(algebra law / semantics)--> parametric implementation
```

They cannot be collapsed. An algebra-law witness could eventually validate a
narrowly declared *ML architecture constraint*, but cannot decide CAV2
promotion, canonicality, safety posture, or repository authority.

This finding satisfies the exploration posture of
[CAV2-D21](../../../authority/definitions/DEFINITIONS.md#cav2-d21-four-facet-action-method):
the source and classification are explicit; this document is the human view;
the Lean compile is a machine-checkable witness; missing 2-monad/ML-semantics
facets are typed residue. It does **not** amend an authority-affecting CAV2
schema, so [CAV2-D25](../../../authority/definitions/DEFINITIONS.md#cav2-d25-schema-amendment-witness)
is not activated. Under [CAV2-D38](../../../authority/definitions/DEFINITIONS.md#cav2-d38-claim-proof-bound),
the paper’s position framing, G.11 gap, G.12 conjecture, and local witness
scope prevent a universal or implementation-ready claim.

### Future candidate relation — local and unpromoted

If an owner later wants a bridge, the only candidate surfaced here is:

```yaml
relation_id: local-candidate-constraint-profile-to-implementation-witness
status: local-unpromoted
source_domain: selected ML architecture
source_object: constraint_profile
target_object: implementation_witness
relation_meaning: a declared implementation satisfies a declared structural law
preservation_condition: named commuting/lax-commuting diagram over named carriers
counterexample_mode: finite fixture or explicit failed law
owner_route: architecture-pattern-inventory -> CAV2 authority model
evidence_required: source citation + formal/fixture witness + challenge review
schema_effect: none now; CAV2-D25 amendment witness required before a machine-view shape becomes load-bearing
authority_effect: none; CAV2-D48 owner-routed promotion required
```

This is a typed coupling proposal, not an equivalence: its source and target
objects, preservation condition, counterexample behavior, owner route, evidence
and promotion effects must remain separately bound. It must not rename CAV2
residue, schema/instance units, fully-faithful functor-stack conditions, or DPI
limits as monad-algebra constraints.

## Non-collapse rules

1. Paper algebra law is not a CAV2 authority rule.
2. Paper construction/unrolling is not architecture discovery.
3. A diagonal fixture is not G.10 and not practical weight-tying correctness.
4. Morrow wiring syntax is not the paper’s lawful `Para` algebra; importing a
   formalism does not create its missing typed arrows, hom-sets, laws, or
   execution semantics.
5. Functor-stack schema/instance residue and source-reinjection/DPI conditions
   remain independently owned; paper constraint satisfaction does not discharge
   them.
6. CAV2’s architecture interface is governance metadata, not an ML architecture
   specification language; any bridge is new design work.
7. No public-shipment implication follows. DomainSpec and Saturn stay private.

## Open residue and bounded recommendation

Open residue:

- local `Para` horizontal composition and 2-category laws;
- bicategorical monad/2-monad and lax-algebra support;
- a local proof of G.10 under fully stated hypotheses;
- G.11’s left-to-reader proof and its source typing issue;
- G.12’s conjectural equivalence;
- a declared ML carrier/category, operational neural semantics, and empirical
  validation; and
- any explicit CAV2-to-ML typed coupling, owner decision, schema amendment, and
  challenge contract.

Recommendation: retain this as a **research / analogy-informed design** tower
and the compiled `Para` fragment as a small formal foothold. Do not promote,
rename CAV2 vocabulary, mutate the Morrow or functor-stack towers, or create an
implementation task from it. A later, separately owned route may propose the
candidate relation above only after naming an ML target domain and supplying a
preservation law, finite positive/negative fixtures, machine-view shape,
challenge contract, and the applicable CAV2 gates.
