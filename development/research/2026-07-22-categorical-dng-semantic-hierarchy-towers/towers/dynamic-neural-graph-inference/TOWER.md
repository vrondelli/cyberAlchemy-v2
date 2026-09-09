# Tower contract — Dynamic Neural Graph Inference

## Target and question

- **Primary source:** Di Wu et al., *Dynamic Neural Graph Encoding of Inference
  Processes in Deep Weight Space*, TMLR 06/2026, arXiv:2607.02166v1.
- **Depth:** standard.
- **Research lens:** empirical/computational audit of representation, encoder,
  task evidence, and carefully bounded Ponder applicability.
- **Bridge target:** `../../../../2026-07-22-semantic-hierarchy-bridge/findings.md`.

## Evidence boundary

Authority for paper claims is exclusively the local PDF named in
[sources/source-record.md](sources/source-record.md). Its source bibliography is
only a related-work map; no related work was externally inspected. The bridge
findings supply the receiving boundary: model proximity is not a typed semantic
relation, hierarchy, facet, alignment, or authority move.

## Non-goals and hard type boundary

The input object is a trained neural network (or INR/CNN/ViT) represented through
weights, biases, and its engineered forward-pass structure. A Ponder ontology
contains typed records and relations whose semantics require policy, provenance,
review, and validation. Therefore neither a node in the DNG nor its recurrent
memory is thereby a concept, relation, category, hierarchy level, or proof.

This tower does not claim: ontology concept graphs; language embedding semantics;
typed-relation induction; hierarchy/facet induction; cross-hierarchy alignment;
category-theoretic functors/adjunctions; or reproduced paper results.

## Deliverables and closure

The required scaffold is present at [levels](levels/L0-corpus.md),
[gates](gates/closure-gates.md), and [residue](residue/open-residue.md). The
source record, notation, claims, local definitions, distill, decisions, examples,
learning pack, and closeout are linked from [README](README.md).

Closure means **source synthesis closed**, not “DNG validated for Ponder.” The
first empirical blocker is a no-leakage adapter/data/training protocol, so the
next governed route is `research-evidence-harness`.
