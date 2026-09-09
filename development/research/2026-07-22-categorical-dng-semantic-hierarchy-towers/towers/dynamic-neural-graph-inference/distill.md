# Distill

## One-sentence model

DNG converts a neural network’s ordered, layerwise weight computation into a
sequence of small bipartite graphs, then uses edge-conditioned messages and
recurrent node state to learn a representation for **weight-space tasks**.

## Compositional spine

`weights + biases + architecture` → `RFF node/edge features` → timestamped
two-layer DNG snapshots → conditional message passing → GRU/LN memories →
task head; for INR2JLS, `final memory + learned spatial vectors` → image
reconstruction feature map → frozen-encoder classification (PDF pp.3, 5–10).

## What to borrow carefully

- An **explicit sequence policy** instead of assuming a whole graph should be
  processed in one undifferentiated pass.
- Edge-conditioned messages where edge values genuinely parameterize a declared
  computation.
- A testable symmetry contract tied to a named representation group.
- Ablations that isolate encoder, supervision, augmentation, and baseline
  effects rather than treating a full pipeline result as one mechanism.

## Analogy only

“Sequential graph processing may help respect a declared evaluation pipeline.”
This is an operator analogy. A neural forward pass has mathematical and learned
computational semantics; an ontology projection/review pipeline has governance
semantics. They are not interchangeable merely because both have stages.

## Block

- “DNG learns an ontology hierarchy.”
- “DNG memory is a semantic concept embedding.”
- “Neuron-permutation equivariance validates entity-ID permutation.”
- “INR image reconstruction demonstrates language/ontology understanding.”
- “Reported CIFAR/accuracy-prediction gains predict Ponder gains.”

## Honest cutoff

The paper provides a concrete architecture and useful experiment-design cues.
It supplies no target representation, no labels, no target metrics, and no
evidence that an ontology-evaluating GNN should use this architecture. The next
question is experimental design, not paper interpretation.
