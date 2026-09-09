# CyberAlchemy Exchange White Paper Research Package

Status: working draft; evidence-bounded; not approved for publication

This package starts the CyberAlchemy Exchange white paper for KEP, the
Knowledge Expansion Protocol. CyberAlchemy Exchange is the product; KEP is the
technical protocol it uses. The package separates the readable paper from its
local-source ledger, external related work, claim adjudication, evidence matrix,
and unresolved research residue.

## Contents

- `WHITE-PAPER.md` — the current narrative draft.
- `SOURCES.json` — byte-bound local sources and checked external primary
  sources.
- `CLAIM-LEDGER.md` — claim kind, support, ceiling, and paper disposition.
- `EVIDENCE-MATRIX.md` — what each receipt proves and does not prove.
- `RELATED-WORK.md` — comparison with selected protocol white papers.
- `RESEARCH-PLAN.md` — bounded route from this draft to a reviewable paper.
- `research/` — compact research-tower scaffold and open residue.
- `validate.py` — local digest, reference, and section checks.

## Validate

```bash
python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/white-paper/v1/validate.py
```

Validation proves only that the draft package is structurally present and its
selected local sources have not drifted. It does not validate scientific
novelty, security, legal claims, product-market fit, publication readiness, or
the correctness of external projects.

## Authority boundary

The package is research and explanatory prose. It does not change canonical
definitions, adopt a Product Capability, admit an ontology or DomainSpec
artifact, accept implementation conformance, deploy a service, or publish the
paper.
