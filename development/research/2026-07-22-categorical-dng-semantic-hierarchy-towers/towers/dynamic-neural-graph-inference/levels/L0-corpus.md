# L0 — corpus and extraction boundary

## Corpus

One immutable primary PDF, recorded at [source record](../sources/source-record.md).
Extraction used `pypdf`; visual figures were not independently numerically read.
The PDF itself is the resolver for ambiguous typography/equations.

## Paper structure recovered

| PDF pages | Content used |
| --- | --- |
| 1–2 | abstract, motivation, stated contributions, code claim |
| 3–7 | static neural graph, inverse-problem argument, DNG conversion, DNG-Encoder |
| 8–9 | INR2JLS objective and activation-fitting study |
| 10–13 | downstream results, ablations, efficiency, stated limitations |
| 17–23 | claimed expressiveness and permutation-equivariance proofs; complexity |
| 24–28 | CNN/transformer extensions and detailed data/model/training setup |

## Direct-source anchor list

- Static neural graph: layerwise node features correspond to biases and edge
  features to weights; RFFs are used in their construction (PDF p.3).
- DNG event construction: add new layer nodes/edges and, after the first layer,
  delete the layer two steps back; each snapshot contains two adjacent layers
  and their directed bipartite edges (PDF p.5).
- DNG-Encoder: edge-conditioned elementwise message, GRU plus LayerNorm node
  memory update, no edge updates (PDF pp.6–7).
- INR2JLS: decode weight-derived latent features into the represented image,
  not back into weights (PDF pp.8–9).
- Performance numbers are paper-reported in Tables 1–8 (PDF pp.10–13, 18, 26).

## What the corpus cannot establish

The PDF is a weight-space ML paper. It supplies no Ponder ontology dataset,
relation labels, semantic hierarchy ground truth, cross-view alignment metric,
or category-theoretic construction. Absence from this source is not evidence of
impossibility; it is an explicit transfer gap.
