# Open residue

1. **Adapter design owner: future implementation task.** Decide whether a
   Ponder input is a serialized typed graph, an execution trace, or a
   representation-learning sample. A DNG needs an ordered event sequence; this
   choice cannot be smuggled in as “ontology hierarchy.”
2. **Dataset owner: research-evidence-harness.** Assemble frozen graph inputs,
   labels, provenance, temporal splits, and holdouts. Include near-negative
   relations and far-positive relations as required by the bridge findings.
3. **Training/metric owner: research-evidence-harness.** Pre-register task loss,
   relation-level metrics, calibration, repeat seeds, and static/set/sequence
   baselines. Rank correlation from CNN accuracy prediction is not a semantic
   correctness metric.
4. **Symmetry owner: target representation design.** Determine whether record
   order is irrelevant, whether relation direction is invariant, and which
   transformations must be equivariant versus rejected. Stable IDs must not be
   freely permuted if they carry references/provenance.
5. **Reproduction owner: external evidence task.** Inspect the code repository,
   pin commit/dependencies/license, verify dataset generation and rerun a small
   table before using availability as a reproducibility claim.

No residue item is a promotion candidate until separate governance accepts it.
