# Claim ledger — source statements versus audit conclusions

| ID | Kind | Claim / evidence | Citation | Audit status |
| --- | --- | --- | --- | --- |
| C01 | primary-source | DNG represents neural parameters with temporal forward-pass dynamics; DNG-Encoder is recurrent-like. | PDF pp.1–2 | Stated; architecture reconstructed. |
| C02 | primary-source | Static neural graph encodes MLP biases as node features and weights as edge features, often using RFFs. | PDF p.3 | Stated. |
| C03 | primary-source | Static multi-step MPNN introduces the illustrated inverse problem: deeper target state can mix an unwanted `W^2 b^1` term, making bias recovery ill-posed. | PDF pp.4–5 | Analytical paper claim; no independent proof/reproduction here. |
| C04 | primary-source | DNG creates two-layer snapshots by timestamped node/edge additions and deletions. | PDF p.5 | Stated. |
| C05 | primary-source | DNG-Encoder uses FiLM-like conditional scaling message functions and GRU+LayerNorm memory; it does not update edge representations. | PDF pp.6–7 | Stated. |
| C06 | primary-source | INR2JLS maps INR weights through DNG memory and learned spatial vectors to an image-reconstructing joint latent space. | PDF pp.8–9 | Stated. |
| C07 | primary-source | Activation-fitting study uses 1,000 3-layer MLPs train and 500 test; Figure 5 says dynamic error stays low while static degrades after layer one. | PDF p.9 | Paper report; Figure values not machine-extracted. |
| C08 | primary-source | INR2JLS Table 1 accuracies: MNIST 98.6, Fashion 90.6, CIFAR-10 73.2, CIFAR-100 42.4 percent; compared NG-T: 96.83, 85.24, 57.7, 31.65. | PDF p.10 | Paper-reported, not rerun. |
| C09 | primary-source | CNN generalization prediction uses Kendall tau: DNG 0.936 CIFAR-10-GS, 0.867 SVHN-GS, 0.8743 CNN Wild Park; NG-T is 0.935, 0.872, 0.8170. | PDF p.11 | Paper-reported; mixed outcome on SVHN. |
| C10 | primary-source | Ablation: DNG-only is 54.0 CIFAR-10 / 25.7 CIFAR-100, full INR2JLS 73.2 / 42.4; rotation+flip exceeds no augmentation by 6.8 / 9.5 points respectively. | PDF p.12 | Paper-reported; supports components in this setup, not ontology transfer. |
| C11 | primary-source | MNIST INR inference Table 5: INR2JLS 0.0047s, 29.17MB, 1.31 GFLOPs; test setting is single-INR inference. | PDF p.13 | Paper-reported, narrow hardware/context unspecified here. |
| C12 | primary-source | Positional/nonlinearity embeddings did not materially improve reported INR classification. | PDF p.13 | Paper-reported. |
| C13 | primary-source | Paper limits DNG mainly to node-state evolution; says static/tokenized methods can suit weight editing/generation; notes dual-use and residual CNN performance gap. | PDF pp.13–14 | Stated limitation. |
| C14 | primary-source | Appendix gives a neuron-permutation equivariance argument for DNG updates and DNG-Encoder. | PDF pp.19–23 | Paper proof; target group is neural neurons. |
| C15 | primary-source | Transformer appendix: 1,000 SimpleViT/CIFAR-10 models, 12 timestamps; Table 8 DNG tau 0.9028, 0.12 GFLOPs, 25.36MB, 4.38ms. | PDF p.26 | Paper-reported. |
| C16 | inspected | Local PDF exists, has 28 pages, and matches declared SHA-256. | [source record](sources/source-record.md) | Verified locally 2026-07-23. |
| C17 | local-inference | DNG’s mechanism may be reusable as an **ordered, edge-conditioned message-passing encoder** only after target-specific event semantics and labels are specified. | C04–C05 | Conditional; no performance inference. |
| C18 | local-inference | DNG does not itself turn graph structure into semantic relations or hierarchy because its learned signals and evaluation targets are weight-space tasks. | C06–C15; bridge target | Supported boundary. |
| C19 | unverified-transfer | A GNN using DNG-like scheduling will improve Ponder ontology evaluation. | none | **Blocked** pending target evidence. |
| C20 | unverified-transfer | DNG node permutation proof licenses reordering Ponder stable IDs. | none | **Blocked**; wrong symmetry group absent explicit design. |

## Contribution-to-evidence audit

| Claimed contribution | Experiment that bears on it | What it supports | What remains unsupported |
| --- | --- | --- | --- |
| Dynamic graph better matches forward computation | activation fitting (p.9), pure encoder comparison (p.18) | performance on constructed MLP/INR tests vs specified static baselines | universal expressiveness, all architectures, semantic graph benefit |
| DNG-Encoder works for weight-space tasks | INR classification, CNN prediction, ViT appendix (pp.10–11, 26) | reported task metrics on listed datasets | reproduction, calibration, safety, any ontology task |
| INR2JLS joint representation helps | reconstruction/module/augmentation ablations (p.12) | that setup’s classification differences | disentangled causal mechanism beyond controlled variants |
| permutation consistency | Appendix C–D (pp.19–23) | algebraic equivariance under described neuron permutations | semantic equivalence, language/ontology invariance |

The paper’s abstract phrase “approximately 10%” is consistent with the Table 1
CIFAR-100 gap versus NG-T (42.4 − 31.65 = 10.75 percentage points), but all such
arithmetic is a reading of reported results, not independent confirmation (PDF
pp.1, 10).
