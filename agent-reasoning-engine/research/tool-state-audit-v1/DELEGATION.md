# Requested audit delegation

Authority effect: none. User explicitly requested two Sol medium auditors and a third recap agent. This sheet scopes that authorized dispatch; it grants no implementation or live-run effects.

| Role | Model | Read scope | Exclusive write scope |
| --- | --- | --- | --- |
| Tool contracts | gpt-5.6-sol, medium | ARE benchmark tools and directly used runtime/schema modules; associated failure evidence | tool-contracts/ |
| Experiment traces | gpt-5.6-sol, medium | All ARE benchmark experiment evidence; direct source links needed to classify events | experiment-traces/ |
| Experiment recap | inherited model | ARE benchmark/research indexes, plans, results and receipts across experiment families | experiment-recap/ |

Dependencies: each audit runs independently. Parent owns objective, synthesis and plan. No nested delegation. Source and frozen evidence are read-only; no provider calls, Docker runs, fixes, commits or external messages. Local read-only analysis and report scripts are allowed within the assigned output directory. Do not expose secrets or raw hidden reasoning.

Join: all three reports must include coverage, evidence paths, limitations and Open Questions. Parent checks concrete findings, separates historical from current defects, reconciles counts and prioritizes candidates before planning changes. Close condition: three completed reports, verified synthesis, saved objective and DAG plan. Missing evidence stays explicitly missing.

## Open Questions

How complete is historical coverage, which failures recur across families, and which changes are supported by reproducible current-source evidence? Owned by PLAN.md after synthesis.
