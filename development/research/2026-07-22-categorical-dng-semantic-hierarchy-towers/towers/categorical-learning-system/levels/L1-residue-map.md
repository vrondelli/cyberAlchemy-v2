# L1 — Residue Map

## Formal/axiomatic audit matrix

| Construct claimed | Required data/laws | Present | Classification | Residue |
| --- | --- | --- | --- | --- |
| category `C` | objects, hom-sets, identities, composition, closure and laws | named nodes/edges/path examples (p. 1) | local-inference only as `Path(G)` | runtime semantics/equality |
| identity | `id_A:A→A`, left/right unit laws | “pass-through/no-op instance” (p. 1) | analogy-only | arrow/object confusion |
| composition | typed operation and associativity | chaining and assertion (pp. 1, 11) | local-inference for paths | typed/effectful execution witness |
| backbone functor | categories, object/arrow maps, preservation | representation mapping (pp. 1, 11) | analogy-only | all categorical data except partial map intuition |
| variant natural transformation | two functors, components, naturality | swap example (p. 1) | analogy-only | every naturality square |
| LLM/JGS adjunction | typed functors, natural hom-bijection or unit/counit and triangles | suggestive formulas (pp. 2–3) | analogy-only | categories, typing, naturality, triangles |
| Curiosity/Training adjunction | same | directional workflow (p. 2) | analogy-only | entire adjunction |
| Encode/Decode adjunction | same | paired learned interfaces (pp. 2, 14–17) | analogy-only | entire adjunction and reconstruction evidence |
| growth functor | category of system states/transitions plus preservation | workflow diagram (p. 2) | analogy-only | state category and arrow mapping |
| DNG instance generation | graph encoding, latent, decoder, objective, evaluation | interface diagram (pp. 14–16) | architecture-interface | implementation and runs |
| curiosity/training growth | policy, data, validation, update and safety evidence | flow/equation/roadmap (pp. 17–20, 28–32) | architecture-interface | reproducible fixtures and metrics |
| model minting | category serialization, learned decoder, fidelity/compression tests | pipeline and roadmap (pp. 23–26, 32) | open-residue | complete empirical program |

## Bridge residue

The exact bridge target rejects embedding-to-hierarchy collapse. Against that
boundary, the proposal offers:

- **usable interface:** nearest-neighbor lookup, distance/gate uncertainty,
  graph storage/traversal, stable instance/gap/example records, provenance,
  candidate wiring direction, active acquisition strategies (PDF pp. 8,
  11–14, 17–20, 27–31);
- **not supplied:** typed semantic predicate induction, named order policy,
  cycle-safe hierarchy construction, facet policy, gold memberships, alignment
  ledger, or calibration;
- **forbidden inference:** calling an ANN neighborhood, composition edge,
  cluster, or learned latent dimension a semantic hierarchy.

## Related formalization boundary

The local Lean files define explicit unit/counit predicates over named
adjunctions and distinguish unit/counit and S2/S3 preservation slots. They
demonstrate the level of typing needed for a formal claim. They do not interpret
JGS, WaveDB, DNG, embeddings, or learned semantics. The local
presheaf-in-Vect findings also leave the Vect-codomain residue theorem open.
Therefore no Lean result upgrades a proposal claim.
