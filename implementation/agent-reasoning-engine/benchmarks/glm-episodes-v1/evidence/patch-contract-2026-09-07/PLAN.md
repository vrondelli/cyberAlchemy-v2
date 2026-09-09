# Patch-contract v4 construction and live check

## Product frontier

D65 continuation of [the context sweep](../context-sweep-2026-09-07/README.md).
Owner-directed native mutation authorized by “do next”, reaffirmed by the
interruption recovery request. No additional ontology dependencies.

DAG: precise rejection diagnostics → opt-in final patch contract reminder →
strict rejection and legacy-behavior tests → source freeze → six fresh live
trials → checked reports and analysis. The reminder appears after all allowlisted
files have executed reads or at the existing forced final boundary; it does not
declare delivery or authorize skipping required recovery.

Retain the strict parser, v3 behavior and defaults. Never repair an invalid
candidate automatically. Expose exact parser reasons in candidate_validation.
Run retention-tool-pairs once per policy and 8000/10000/12000 threshold (six
arms); no failure replacements, unchanged fixture/oracle and caps. Per arm:
12 model, 24 tokenizer calls, 580 seconds. Aggregate: 72/144 calls. Freeze the
schedule and sources before live calls. These are fresh trials on the same task,
not held-out tasks or a controlled causal comparison with v3.

## Operational tasks and owners

The operator owns credential/provider availability; failures count as outcomes.
No operational prerequisite blocks local construction. Publication, default
activation and deployment remain deferred owner decisions. A longer continuity
fixture is the next independent product frontier, frozen separately.
The interrupted environment lost prior /tmp raw runs. The optional historical
report test cannot use those missing inputs; validate it against the new run.

## Open Questions

Does the reminder improve compliance over repeated controlled trials? What
prompt cost does it impose? Can a longer task exercise recycling at all limits?
