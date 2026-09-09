# Final Learning Pack

## 1. What the architecture is

The proposal describes four coupled substrates:

1. **JGS fast path.** Small LoRA/gate/head specialists share a frozen 19.5M
   SSM+JEPA backbone. The proposal names retrieval, working-memory,
   document-kind, contradiction and curiosity roles (PDF pp. 4–5, 10–11).
2. **WaveDB dual memory.** A graph layer stores instances, gaps, examples,
   composition/proximity/provenance edges and lifecycle metadata; a vector layer
   stores instance, pattern, state, joint and example embeddings and supports ANN
   queries (PDF pp. 6–7, 11–13, 20).
3. **LLM slow path and curiosity.** Low-distance/low-confidence routing escalates
   to LLM deliberation, decomposition, synthesis or labeling. A learned
   curiosity policy chooses Observe, Probe, Synthesize, Interact or Defer and a
   training pipeline proposes a new specialist (PDF pp. 8–9, 13–14, 17–20,
   27–31).
4. **DNG generation/minting.** Proposed graph encoders/decoders map instances to
   a latent, map specifications to specialist weights, and map the entire graph
   to a category latent vector and then a standalone model (PDF pp. 14–17,
   23–26, 32).

Persistence, startup/shutdown, validation, graph update and rollback are
designed but not evidenced as implemented (PDF pp. 20–23, 29–32).

## 2. Literal, incomplete, and analogy-only category theory

### Literal after conservative reconstruction

A typed directed wiring graph can generate a free category: specialists are
vertices, declared wires are generating arrows, empty paths are identities, and
path concatenation is associative. This is a local construction prompted by the
proposal’s object/morphism/path language (PDF pp. 1, 11–12), not something the
source fully defines. It formalizes **wiring syntax only**.

### Incomplete architecture interfaces

- Graph nodes/edges and executable pathways are plausible interfaces.
- A representation map from adapter-specific states to a shared space is
  proposed.
- Variant replacement is a useful compatibility requirement.
- Slow-to-fast compilation, curiosity/training, and encode/decode are useful
  feedback interfaces.

Each needs typing and tests before it supports a categorical theorem.

### Analogy-only

- The no-op **instance** is not a typed identity **arrow**, and unit laws are
  absent (PDF p. 1).
- The shared backbone lacks source/target categories, an arrow map, and
  identity/composition preservation; common latent width does not guarantee
  associativity (PDF pp. 1, 11).
- Variant swapping lacks two functors, components and naturality squares
  (PDF p. 1).
- `LLM⊣JGS`, `Curiosity⊣Training`, and `DNG-Encode⊣DNG-Decode` lack typed
  categories/functors, natural hom-set bijections, naturality and triangle
  identities (PDF pp. 2–3).
- The “growth functor” is a pipeline/state transition without a category of
  states and preservation laws (PDF p. 2).
- “Morphism gap” is used for low support/ambiguity, not the absence of a typed
  arrow (PDF pp. 8–9).
- “Soul of the category” is metaphor for a learned vector (PDF p. 17).

No source categorical claim is `defined-with-laws`.

## 3. Exact contribution to the semantic-hierarchy algorithm

The source usefully reinforces the graph/geometry split. Its bounded
contribution is:

1. pin an encoder, distance metric and ANN index and generate a model
   neighborhood;
2. record uncertainty as a coverage gap with stable IDs;
3. retain graph endpoints, direction, utility/validity and provenance;
4. let an LLM propose—but not assert—composition, distinctness, labels or a new
   specialist;
5. select an evidence-acquisition strategy and retain examples, negatives and
   teacher provenance;
6. after a separate acceptance policy, project named operational paths.

The corresponding source interfaces appear on PDF pp. 8, 11–14, 17–20 and
27–31. A `composes_after` edge may become evidence for a separately governed
operational-order candidate. It is not a semantic parent, ancestor or facet.

## 4. What it cannot contribute

The proposal supplies no demonstrated operation for:

- converting proximity into a typed semantic predicate;
- choosing a named order policy or rejecting cycles;
- assigning semantic facets;
- inducing a hierarchy;
- aligning two named hierarchies or views;
- interpreting vectors as learned semantics;
- proving preservation with the local Lean fractal/cofractal/S2/S3 taxonomy.

That last taxonomy is explicit about units, counits and preservation conditions,
but has no interpretation map for this architecture. The Vect-codomain semantics
bridge remains open in the local formalization research.

## 5. Smallest witnesses and negative controls

Start with the finite fixtures in
[smallest-witnesses.md](examples/smallest-witnesses.md):

- free three-node wiring category;
- same-width/incompatible-payload composition negative;
- pure versus stateful associativity;
- one complete naturality square family;
- one finite adjunction with exhaustive hom tables and a triangle-failing
  negative;
- pinned near-negative/far-positive proximity cases;
- separate order and facet fixtures with reversal/cycle/multi-level cases;
- curiosity baselines, teacher disagreement and privacy/adversarial controls;
- a two-specialist minting comparison retaining state, failure, abstention,
  provenance and componentwise loss.

The proposal’s worked 33-example, `.81` accuracy, `.72` lower-bound and `PASS`
sequence is not a witness because no run provenance, dataset or method is
provided (PDF pp. 28–29).

## 6. Evidence-harness handoff

`research-evidence-harness` should own:

- append-only JSONL schemas for neighborhoods, gaps, proposals, labels, training
  runs, generated models and adjudications;
- source/model/config/checkpoint digests;
- gold positive, negative, reversal, cycle, state/effect and drift fixtures;
- objective vectors for quality, calibration, privacy, cost, generalization,
  fidelity and compression;
- deterministic dry-run validators;
- reviewer rubrics and claim-ID verdicts for CL-05, CL-14, CL-16–26 and CL-29–30.

Formal claims CL-01–13 should not be handed to empirical evaluation alone. They
first need typed definitions and finite law witnesses; mechanized proof can
follow only when the proposed categories and functors are concrete.

## 7. Honest cutoff

The architecture is coherent enough to seed experiments and interface design,
especially around structure/geometry separation and active evidence gathering.
It is not evidence of categorical soundness, self-growing intelligence, DNG
generation, or LLM minting. All roadmap tasks are unchecked (PDF pp. 29–32).
The tower therefore closes the source-backed understanding and hands empirical
adjudication forward; it does not close the ten listed residues or promote any
term.
