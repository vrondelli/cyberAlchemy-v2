# Validation

Date: 2026-07-23

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| official source | PASS | arXiv v2 metadata and 32-page PDF |
| source hashes | PASS | source record |
| title parse and claim-status distinctions | PASS | source record, claim ledger |
| explorer preservation | PASS | three verbatim sections in `research.md` |
| synthesis/reviewer convergence | PASS | subagent closeout |
| writer restriction | PASS | writer changed only `findings.md` |
| standalone findings audit | PASS | Bourbaki final `ACCEPT` |
| Lean compile | PASS | exit `0`, no output |
| Lean placeholders | PASS | no `sorry` or `admit` |
| positive/negative fixtures | PASS | compiled witness |
| relative Markdown links | PASS | all links in both towers resolve |
| whitespace/diff integrity | PASS | `git diff --check` for both tower paths |
| scoped mutation | PASS | new CAV2 tower, paired Lean tower, append-only ledgers/read models only |
| dispatch close | PASS | `resolved`, nine agents, one loop |
| Inventory | PASS | dry-run/add and `validate-index-json.sh` |
| observability | PASS | central ledger line 299 plus by-sigil/capability projections |
| authority boundary | PASS | zero current CAV2 authority delta |

## Lean command

```bash
cd domainspec-lean-formalization/lean-engineer
lake env lean \
  ../research/categorical-deep-learning-algebraic-architectures/witness/ParametricMapWitness.lean
```

Observed: exit `0`, empty stdout/stderr.

## Link command boundary

A filesystem validator scanned Markdown links under:

- `cyberAlchemy-v2/development/research/2026-07-23-categorical-deep-learning-algebraic-architectures/`
- `domainspec-lean-formalization/research/categorical-deep-learning-algebraic-architectures/`

HTTP, mail, and same-page anchors were excluded; every relative target existed.

## Parent approval

Approved as a local research result. Open residue remains open, and no
definition, schema, ontology, implementation, or public promotion follows.
