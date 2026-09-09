# Definition Card — DNG and Model Minting

## Source interfaces

The proposal maps a JGS instance to a dynamic neural graph and then to a
384-dimensional latent vector; a specification is embedded, seeded from a
nearby instance, and decoded into LoRA/gate/head weights (PDF pp. 14–16). At
category scale, instances become subgraphs, composition edges connect them,
timestamps encode flow, one Category Latent Vector is produced, and a decoder
generates an SSM/hybrid/MoE checkpoint (PDF pp. 16–17, 23–25). The minted model
is explicitly a derived, lossy snapshot rather than the live source (PDF p. 26).

## Missing contract

- canonical serialization of nodes, edges, weights and timestamps;
- invariance/equivariance under node renaming and harmless graph rewrites;
- encoder/decoder architectures and dimensional constraints;
- training corpus of graph/model pairs;
- losses for weight, function, routing, calibration and resource behavior;
- how one fixed CLV conditions architecture choice and variable-sized weights;
- ship-gate metrics and held-out distribution;
- preservation/loss ledger for state, provenance, composition and auditability.

## Categorical verdict

No adjunction follows from calling the components encoder/decoder. “Category
latent vector” is a learned graph summary, not a categorical invariant. Minting
is best read as a hypernetwork/distillation hypothesis and remains
`open-residue`.

## Empirical verdict

The roadmap leaves every DNG/minting item unchecked (PDF p. 32). The proposal’s
behavioral-equivalence box says to compare held-out outputs (PDF p. 25), which
is a sensible experiment interface but cannot prove equivalence across all
inputs, states, failures or compositions.
