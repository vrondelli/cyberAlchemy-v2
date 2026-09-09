# Define Agentic-Engineering Evidence Tower

Status: `closed-local-research-prepared-experiment`

Promotion scope: `local-research-only`

Cutoff: `2026-08-29`

## Purpose

This package asks one bounded question:

> Does a structured CyberAlchemy Define intervention improve the quality and
> continuity of downstream planning and implementation, compared with a normal
> ticket and with the same information presented as ordinary notes?

The package has three parts:

1. a source-backed research tower;
2. a Standard Distill result that identifies the smallest meaningful test; and
3. a dry-run evidence harness for a future controlled experiment.

It does not run the live experiment and does not claim that Define works.

## Why This Package Exists

The current Define documents explain what Define means and what a Definition
Pack contains. E10 already proposes a DomainSpec-versus-freeform productivity
comparison. Recent arXiv studies add stronger evidence about task meaning,
context files, action bias, evidence gates, hidden human repair, and human
understanding.

This package joins those sources without rewriting either the Define package or
E10. E10 remains a predecessor experiment. This package tests the narrower
product claim that Define improves the next stage.

## Reading Order

1. `TOWER.md`
2. `levels/L0-corpus.md`
3. `SOURCE-RECORDS.md`
4. `tracks/source-claim-ledger.md`
5. `levels/L1-residue-map.md`
6. `GLOSSARY.md`
7. `DEFINITIONS.md`
8. `DISTILLED-KNOWLEDGE.md`
9. `distill/STANDARD-DISTILL.md`
10. `experiment/README.md`
11. `experiment/PROTOCOL.md`
12. `experiment/runtime/RUNTIME-DESIGN.md`
13. `experiment/runtime/README.md`
14. `experiment/FACT-SET-CONTRACT.md`
15. `experiment/TASK-SELECTION.md`
16. `experiment/METRICS.md`
17. `experiment/CLAIM-BOUNDARY.md`
18. `FINAL-LEARNING-PACK.md`
19. `gates/closure-gates.md`
20. `residue/open-residue.md`
21. `CONTAINER.md`

## Boundaries

- Private CyberAlchemy research only.
- arXiv records are research sources, not canonical CyberAlchemy definitions.
- A Definition Pack is the core Define intervention.
- An evidence-conditioned execution gate is a separate runtime intervention.
- Synthetic fixtures validate the harness shape only.
- No live participants, agents, repositories, publication, promotion, release,
  or deployment are authorized by this package.

## Validate

From the repository root:

```bash
python3 cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/validate_package.py
python3 cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/validate_run.py cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/fixtures/pass.jsonl
python3 cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/validate_condition_manifest.py cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/fixtures/condition-manifest-pass.json
python3 cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/validate_experiment_bundle.py cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/fixtures/task-selection-pass.json cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/fixtures/pass.jsonl cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/fixtures/condition-manifest-pass.json
python3 cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/calculate_metrics.py cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/fixtures/pass.jsonl
```

For the dependency-light container route, see `CONTAINER.md`. The container
runs validation, the L1 preparation, L2 isolation, and L3 synthetic-chain
runtime tests, and metric calculation. It does not run live agents.

## Claim Ceiling

This package can support a decision to run a controlled pilot. It cannot support
a claim that Define improves plans, implementations, productivity, customer
value, or product-market fit.
