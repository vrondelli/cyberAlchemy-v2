# Empirical/computational audit

All numbers below are transcribed from the primary PDF. “Supports” states the
narrowest conclusion consistent with the described experiment. It does not
upgrade a reported table into an independently reproduced result.

## 1. Does the dynamic object address the stated static-graph issue?

The paper’s analytical setup says a static MPNN can approximate the first MLP
layer but, when all layers update with the same static graph passes, a deeper
node state may contain `b^2 + W^2 b^1`; recovering `b^2` from this mixed state
is described as an ill-posed inverse problem. The scalar example uses
`w1=3, b1=2, w2=5, b2=1`, making the undesired term 10 (PDF pp.4–5).

The empirical check generates 1,000 random three-layer MLPs for training and
500 structurally identical MLPs for testing, samples inputs and records every
layer activation. It compares equal-style message/update functions on static
and dynamic graphs by MSE between predicted and true activations. Figure 5
reports low dynamic-model error across depths, with static error increasingly
degrading beyond layer one (PDF p.9).

**Supports:** this construction’s dynamic schedule is associated with better
activation fitting than the named static implementation at depth. **Does not
support:** a proof of general superiority across all GNNs, architectures,
training regimes, or non-neural graphs. Figure data points were not independently
recovered/rerun here.

## 2. INR classification and joint-latent supervision

The paper evaluates MNIST, FashionMNIST, CIFAR-10, and CIFAR-100 INRs. It says
the first three use three-layer, hidden-32 SIRENs and describes splits of 45,000
training images for MNIST/CIFAR or 55,000 for FashionMNIST, 5,000 validation,
10,000 test. Ten additional differently initialized SIRENs are trained per
training image; validation/test images retain one. CIFAR-100 uses three-layer,
hidden-32 SIRENs trained 5,000 steps with Adam at `5e-5` (PDF pp.26–27).

For full INR2JLS, node and edge Fourier size is 128 with scale 3; message and
GRU hidden dimensions are 512. The image reconstruction stage uses batch 64,
Adam `1e-4`, 400,000 steps and early stopping; classifier stage uses batch 128,
AdamW `1e-4`, 200,000 steps and early stopping (PDF p.27). These details help
reproduce the authors’ setup but do not include code revision, device, seed
list, data digest, or a local run receipt.

Table 1 reports ten-view augmentation accuracy (%):

| Method | MNIST | FashionMNIST | CIFAR-10 | CIFAR-100 |
| --- | ---: | ---: | ---: | ---: |
| NFN | 92.9 | 75.6 | 46.6 | 20.55 |
| INR2ARRAY (NFT) | 98.5 | 79.3 | 63.4 | 31.30 |
| NG-GNN | 97.3 | 86.53 | 55.11 | 26.50 |
| NG-T | 96.83 | 85.24 | 57.7 | 31.65 |
| INR2JLS | 98.6 | 90.6 | 73.2 | 42.4 |

The source’s “approximately 9%/10%” gain aligns with full INR2JLS minus NG-T:
15.5 points CIFAR-10 and 10.75 CIFAR-100, while the closest baseline may differ
by dataset (PDF pp.2, 10). **Supports:** reported performance of the full
pipeline under this data/model protocol. **Does not support:** that DNG alone,
the dynamic schedule alone, or a semantic representation alone causes all gain.

## 3. Ablations clarify but do not fully isolate mechanism

Table 3 compares full INR2JLS to INR-INR weight reconstruction and to component
removals. On CIFAR-10 / CIFAR-100: INR-INR is 56.3 / 30.6, DNG-Encoder-only is
54.0 / 25.7, no latent generator is 54.5 / 28.1, while full INR2JLS is 73.2 /
42.4. Table 4 says no augmentation is 66.4 / 32.9, Gaussian-noise augmentation
67.3 / 33.0, and rotation/flip 73.2 / 42.4 (PDF p.12).

Appendix B removes joint-latent supervision, augmentation, and static-baseline
probe features; Table 7 reports DNG 96.60, 78.40, 54.00 against NG-GNN 79.60,
71.10, 43.94 and NG-T 83.43, 72.13, 44.69 on MNIST, FashionMNIST, CIFAR-10
respectively (PDF p.18).

**Supports:** the full pipeline and each selected ablation differ materially in
the reported setup; the pure graph comparison favors DNG under the authors’
probe-feature decision. **Caution:** augmentation, representation objective,
capacity, data construction, and baseline configuration are experimental
choices. No ablation evaluates ontological typed-relation inference.

## 4. CNN and transformer generalization prediction

For CNN classifier generalization, the target is test accuracy predicted from
CNN parameters. The source follows prior work for CIFAR-10-GS/SVHN-GS and uses
the heterogeneous CNN Wild Park benchmark. It maps final-layer/final-time node
memories through an MLP and trains with binary cross entropy; metric is Kendall
rank correlation tau (PDF p.11, p.27).

Table 2 reports: DNG `0.936±0.000`, `0.867±0.002`, `0.8743±0.0021`; NG-GNN
`0.930±0.001`, `0.863±0.002`, `0.8040±0.0090`; NG-T `0.935±0.000`,
`0.872±0.001`, `0.8170±0.0070`, respectively across CIFAR-10-GS, SVHN-GS, and
CNN Wild Park (PDF p.11). The DNG score is not highest on SVHN-GS: NFN (HNP)
is `0.931±0.005`, and NG-T exceeds DNG. Any summary claiming universal dominance
would be false.

The transformer appendix creates 1,000 SimpleViT CIFAR-10 classifiers, stops
them at different epochs, records parameters/test accuracy, and uses 80/10/10
train/validation/test. Its two transformer blocks plus embedding/output form 12
timestamps. Table 8 reports DNG `tau=0.9028±0.005`, `0.12` GFLOPs, `25.36` MB,
`4.38` ms; NG-GNN `0.8844±0.006`, `3.22`, `54.49`, `5.94`; NG-T
`0.8917±0.002`, `44.69`, `446.95`, `11.77` (PDF p.26).

**Supports:** reported rank prediction and inference profiling on the authors’
particular CNN/ViT zoos. **Does not support:** semantic accuracy, causal model
understanding, ontology quality, a validated cross-hierarchy metric, or a
hardware-independent efficiency claim.

## 5. Efficiency, symmetry, and limitation audit

Table 5’s MNIST-INR single-sample inference comparison reports INR2JLS at
`0.0047±0.00018` seconds, `29.17` MB and `1.31` GFLOPs; NG-GNN is `0.0124`,
`27.40`, `2.13`, while other methods have higher reported cost (PDF p.13).
This is a single narrow setup; it is not a capacity plan for a target adapter.

Table 6 reports nearly equal results with positional and nonlinearity embeddings
added, a claim attributed to DNG’s timestamp-specific message layers (PDF p.13).
Appendix C–D supplies the neuron-permutation proof, not a measurement of
arbitrary semantic graph invariance (PDF pp.19–23).

The paper itself limits DNG to node-state evolution and says static/tokenized
models may suit weight editing/generation, flags dual-use risk of property
inference from weights, and admits INR classification lags analogous image-space
CNN tasks (PDF pp.13–14). These limits reinforce the bridge decision: no target
deployment claim can be made from the source alone.
