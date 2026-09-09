# Final learning pack — DNG without semantic overreach

## What DNG actually does

The paper treats a neural network as data. For each layer, bias-derived node
features and weight-derived edge features are represented (with RFFs); instead
of retaining one static whole-network graph, it presents consecutive two-layer
snapshots through add/delete events. The DNG-Encoder sends edge-conditioned
messages from the prior-layer node memories and writes the new layer’s GRU/LN
memory. This tries to follow the network’s layerwise forward computation and
avoid the static model’s claimed deep-layer inverse problem (PDF pp.3–7, 17–18).

INR2JLS adds learned spatial vectors to final DNG memory, decodes the result to
the image represented by an INR, freezes that encoder, then trains a classifier
on the feature map (PDF pp.8–10). The paper reports strong INR results, CNN
generalization prediction, and an appendix ViT task; its measurements remain
paper-reported in this tower, not reproduced (PDF pp.10–13, 26).

## Borrowable representational mechanism

Borrow **only** an engineering pattern: if target data has a legitimate,
versioned ordered computation/projection pipeline, it may be encoded as a
sequence of graph events and processed by edge-conditioned recurrent messages.
The ordering must be declared and auditable. This is B01/B02
`borrow-carefully`, not a claim that ordered graphs discover semantics.

## Does it apply to a GNN evaluating Ponder ontologies?

Not yet. It can be a research hypothesis, but the source input type is neural
weights and architecture; Ponder objects are typed, provenance-bearing records
and relations. DNG contains no mechanism for relation semantics, hierarchy
policy, facet assignment, alignment, authority, or category-theoretic maps.
The semantic-hierarchy bridge separately requires typed-relation proposals,
independent order/facet operations, componentwise alignment, and explicit
residue. DNG supplies none of those.

## Exact obligations before trying it

- Publish a frozen adapter from versioned target records/projection to tensor
  features and event schedule; explain every timestamp.
- Preserve stable IDs, directions, predicates, provenance, review state, and
  authority effect outside the learned claim; prohibit authority mutation.
- Supply gold task labels and target-specific metrics; do not recycle INR
  accuracy or Kendall tau.
- Pin splits/seeds/digests; establish static-GNN, set/record, and simple-rule
  baselines with matched budgets.
- Run W1 and N1–N5 from [adapter witnesses](examples/adapter-witnesses.md),
  including near-but-not-related and far-but-related cases.
- Audit leakage, calibration, error slices, and human review path.

## What cannot transfer

The paper’s forward-pass timestamp cannot be renamed ontology depth. A
weight edge cannot become a typed semantic relation. A GRU memory cannot become
a concept’s meaning or evidence. The neuron permutation proof cannot erase
stable identifiers/references. Image reconstruction does not establish language
semantics. The paper’s stated code link is not a reproducibility receipt.

## Route to research-evidence-harness

Create an append-only run schema containing adapter digest, fixture IDs, policy,
feature/label separation, split digest, model/baseline configs, seed, output
predictions, metrics, calibration, reviewer adjudications, and failures. Require
JSONL fixture validation, deterministic dry runs, and a claim-adjudication
receipt. Until these exist, the only safe conclusion is a bounded architectural
analogy.

## Learning checkpoint

If a proposed feature is “timestamp = hierarchy level,” reject it. Ask instead:
“What declared process does this event represent, and what fixture could prove
the score is not merely learning order, lexical proximity, or authority state?”
