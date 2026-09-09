# Definition cards

## Card 1 — DNG snapshot

- **Definition:** At a forward-pass timestamp, DNG retains the source and target
  neural layers plus weighted directed edges between them (PDF p.5).
- **Why it matters:** It makes temporal ordering structural rather than merely a
  positional embedding.
- **Test question:** Can an adapter name the computation/projection stage that
  every added/deleted node and edge represents?
- **Do not confuse with:** a persistent ontology graph or a hierarchy slice.

## Card 2 — edge-conditioned message

- **Definition:** A learned transform of an edge feature gates/scales a learned
  transform of source memory before aggregation (Eq. 4, PDF p.7).
- **Why it matters:** Weight values influence the simulated computation.
- **Test question:** Does the target edge feature have stable, legitimate
  numerical meaning, or are we encoding a predicate label as a false “weight”?
- **Do not confuse with:** the edge being semantically true because it was
  consumed by a message function.

## Card 3 — equivariance contract

- **Definition:** Under a named neuron permutation and paired parameter change,
  DNG graph/encoder outputs permute correspondingly (PDF pp.19–23).
- **Why it matters:** Weight representations contain arbitrary neuron ordering.
- **Test question:** What exact target transformation preserves the prediction
  task and feature meanings?
- **Do not confuse with:** invariance to deleted provenance, reversed relations,
  or arbitrary stable-ID renaming without reference resolution.

## Card 4 — joint latent supervision

- **Definition:** INR2JLS trains a feature map from INR weights to reconstruct
  the represented image, rather than reconstructing weights (PDF pp.8–9).
- **Why it matters:** It illustrates that supervision target shapes learned
  representation.
- **Test question:** What legally and semantically valid target is available for
  ontology evaluation, and does it leak authority decisions?
- **Do not confuse with:** evidence that any “joint latent space” is semantic.
