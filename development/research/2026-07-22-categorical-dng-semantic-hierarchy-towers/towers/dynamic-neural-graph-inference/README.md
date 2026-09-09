# Dynamic Neural Graph Inference — research tower

Local, unpromoted empirical/computational audit of *Dynamic Neural Graph Encoding
of Inference Processes in Deep Weight Space* (Wu et al., TMLR 06/2026;
arXiv:2607.02166v1). This tower asks a deliberately narrow question: what does
the paper's dynamic neural graph (DNG) encode, and which parts—if any—are safe
to adapt to a graph neural network that evaluates Ponder ontologies?

The answer is bounded. DNG is a representation of a neural network's **weights,
biases, and ordered forward-pass topology**. It is not an ontology graph, a
language-semantic model, a hierarchy inducer, a facet classifier, an alignment
method, or a category-theoretic adjunction. See [bridge decisions](bridge-decisions.md)
and [final learning pack](final-learning-pack.md).

## Start here

1. [TOWER.md](TOWER.md) gives scope, evidence boundary, and closure state.
2. [source record](sources/source-record.md) fixes the local primary source.
3. [notation bridge](notation-bridge.md) makes the formal objects inspectable.
4. [claim ledger](claim-ledger.md) separates paper statements, inspection,
   local inference, and unverified transfer.
5. [empirical audit](empirical-audit.md) reads every reported task and ablation
   at its actual evidentiary strength.
6. [related-work map](related-work-map.md) bounds the paper-cited comparison set.
7. [final learning pack](final-learning-pack.md) is the operator-facing answer.

All terms in this directory are **local-only and unpromoted**. Nothing here
changes Inventory, ontology authority, public Arcanum, a sigil, or a runtime
contract.

## Evidence convention

`PDF p.N` means the physical page N of the preserved local PDF. “Paper-reported”
means extracted from that PDF only; it is not a reproduced measurement. “Inspected”
means a local-file check recorded here. “Local inference” is an explicit analyst
deduction. No external source or repository Inventory seed is authority for this
lane.

## Directory map

- `levels/`: corpus, residue, and closure plan.
- `gates/`: audit criteria and outcomes.
- `residue/`: unresolved questions and owners.
- `sources/`: immutable PDF and its provenance record.
- `definitions/`: governed-but-local cards, not canonical definitions.
- `examples/`: small positive/negative adapter witnesses.

## Lane status

**Closed for source-backed synthesis; open for implementation evidence.** The
paper is adequately reconstructed. Any actual Ponder adapter, experiment, or
claim of ontology benefit must move to `research-evidence-harness` under a
separate governed task.
