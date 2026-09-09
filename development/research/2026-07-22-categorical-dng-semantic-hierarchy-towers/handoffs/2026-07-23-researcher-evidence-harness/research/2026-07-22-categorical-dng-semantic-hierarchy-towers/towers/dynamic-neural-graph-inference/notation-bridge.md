# Notation bridge — what the paper actually constructs

## A. Static neural graph (paper notation)

For an L-layer MLP \(M\), weights \(W^l \in R^{d_l\times d_{l-1}}\) and
biases \(b^l\in R^{d_l}\) become graph \(G=(V,E)\). `v^l` is the set of
feature vectors for neurons in layer `l`; `e^l` is the set of edge features
between `l-1` and `l`. The paper says biases construct node features and weights
construct edge features; it uses RFF representations for both (PDF p.3).

This is a parameter/topology encoding, not a graph of input-data examples or a
model's run-time activation graph. The paper makes inputs learnable vectors for
the dynamic construction (PDF p.5); it does not claim these vectors are natural
language or ontology embeddings.

## B. Dynamic neural graph (DNG)

`G^T=(G^{t0}, O^[t1:tL])`. At `t0`, graph `G` contains input nodes `v^0`.
At each layer timestamp `t_l`, operation `O^{t_l}` adds `v^l` and `e^l`. For
`1 < l <= L` it also deletes `v^{l-2}` and `e^{l-1}` as printed in Eq. 3; the
resulting snapshot is the two-adjacent-layer directed bipartite graph
`G^{t_l}=({v^{l-1},v^l}, e^l)` (PDF p.5). The deletion description and symbolic
subscript are potentially easy to misread; use Eq. 3 plus the stated snapshot,
not an invented persistent whole-network graph.

For CNNs, each scalar kernel weight is an edge. A channel pair therefore has
`h_l * w_l` edges; zero edges pad pairs to a common number (PDF p.6). Appendices
describe flattening/residual conversion (PDF pp.24–25) and an engineered
multi-head-attention conversion into three timestamps (PDF pp.25–26).

## C. DNG-Encoder

For MLP one-edge pairs, target message is:

`m_i(t_l) = sum_{j in N_i} (W_m1^{t_l} e_ij(t_l)) elementwise-product (W_m2^{t_l} s_j(t_l-))`.

For CNN multi-edge pairs, each source memory is projected by a head per edge,
the edge-conditioned head messages are concatenated and passed through MLP
`phi_h`, then aggregated across source nodes (Eq. 5). Target memory is:

`s_i(t_l) = LayerNorm(GRU(m_i(t_l), v_i(t_l)))` (Eq. 6).

The paper gives timestamp-indexed message transforms, a GRU node-memory update,
and no edge representation update because an edge exists only at its timestamp
(PDF pp.6–7). This is “recurrent-like,” but its time is an architecture-derived
forward-pass schedule, not generic temporal observation time.

## D. INR2JLS

The final DNG memory `s(t_L)` is concatenated with each learned spatial vector
`theta_s^n`; latent generator `phi_g` emits `F^n`. Reshaping all `F^n` creates a
feature map `F`, which a transposed-convolution decoder reconstructs into the
original image. Objective is image MSE, not weight reconstruction (Eqs. 7–9,
PDF pp.8–9). A subsequent classifier freezes DNG-Encoder and latent generator,
then trains a CNN on augmented `F_aug` with cross entropy (PDF p.10).

## E. Symmetry statement and its boundary

The paper defines hidden-neuron permutation by simultaneous row/column
adjustment of adjacent `W` matrices and bias permutation (Eq. 13); it proves
graph updates and encoder message/update functions equivariant under the induced
node/edge permutation (PDF pp.19–23). This supports an **equivariance claim for
the paper’s engineered neural-weight representation under its stated group**.
It does not prove invariance/equivariance for arbitrary Ponder records, stable
identifiers, relation labels, authority status, or semantic equivalence.

## F. Translation guard

| Paper object | Careful local reading | Forbidden substitution |
| --- | --- | --- |
| neuron node `v_i^l` | position in a neural layer with bias-derived feature | ontology concept |
| weight edge `e_ij^l` | learned numeric parameter between adjacent layers | typed semantic relation |
| timestamp `t_l` | scheduled forward-pass stage | hierarchy level or event provenance |
| memory `s_i(t_l)` | encoder hidden state | semantic truth or authority |
| weight-space label/accuracy | downstream supervised target | ontology validity/alignment |
