# Local glossary (unpromoted)

| Term | Source kind | Local meaning | Arcanum/Ponder reading | Promotion | Misuse warning |
| --- | --- | --- | --- | --- | --- |
| static neural graph | primary-source | Fixed graph encoding weights/biases by layers (PDF p.3). | A numerical model representation. | local-only | Not an authored ontology graph. |
| dynamic neural graph / DNG | primary-source | Initial graph plus ordered add/delete events reflecting a neural forward pass (PDF p.5). | Potential ordered-computation representation pattern. | local-only | “Dynamic” is not semantic or historical change. |
| DNG-Encoder | primary-source | Edge-conditioned temporal GNN with target GRU memory (PDF pp.6–7). | Candidate architecture family, not a Ponder evaluator. | local-only | Does not validate ontology claims. |
| recurrent memory | primary-source | Per-node hidden state `s_i(t_l)` (PDF p.7). | Learned representation state. | local-only | Not memory/provenance/authority in governance sense. |
| INR2JLS | primary-source | Weight-to-image joint-latent framework based on DNG-Encoder (PDF pp.8–9). | Example of task-specific supervision. | local-only | Cannot be rebranded as semantic joint space. |
| neuron permutation equivariance | primary-source | Output follows corresponding hidden-neuron reindexing (PDF pp.19–23). | A representation-specific symmetry property. | local-only | Stable Ponder IDs are not hidden neurons. |
| adapter | operator-reading | Explicit map from frozen target data/schema to model tensors/events. | Required bridge artifact. | local-only | Must not silently invent semantics. |
| negative control | operator-reading | Fixture expected not to support the proposed conclusion. | Necessary falsification surface. | local-only | Absence of a control inflates apparent success. |
| hierarchy induction | open-residue | Inferring named order relations under a policy. | Separate operation in bridge findings. | local-only | Not supplied by DNG encoding. |
