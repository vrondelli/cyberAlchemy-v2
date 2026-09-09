# L1 — residue map

| Residue | Why source evidence does not close it | Required next evidence | Status |
| --- | --- | --- | --- |
| DNG for Ponder ontology evaluation | Paper inputs are neural-network weights/topology, not typed ontology records. | Versioned adapter and schema-bound fixtures. | open |
| Relation/hierarchy semantics | Paper predicts INR labels and CNN/ViT accuracy, not predicates, parenthood, facets, or alignment. | Gold typed relations, hard negatives, human review. | open |
| Transfer benefit | No Ponder baseline or ablation exists in paper. | Pinned train/test protocol and baseline comparison. | open |
| Permutation handling for ontology IDs | Proof covers hidden-neuron permutations with corresponding parameter transformation. | Explicit symmetry group for target representation, if any. | open |
| Code/data reproducibility | PDF makes a repository claim only. | Commit digest, licensed data manifest, rerun receipts. | open |
| Recurrent time semantics | DNG time is engineered forward-pass order, not event history or conceptual evolution. | Target time/order policy and leakage analysis. | open |

The bridge target independently requires a typed relation proposal before any
order/facet operation and refuses scalar alignment claims. Nothing in DNG closes
that requirement.
