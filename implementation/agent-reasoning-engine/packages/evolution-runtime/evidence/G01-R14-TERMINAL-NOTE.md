# G01 r14 terminal run — private development evidence

The frozen 24-task r14 campaign is **terminal failed**, not live. Its guarded
serial coordinator stopped after the thirteenth ordered task on 2026-10-02:
**12 scored pairs, one unscored pair, 11 unattempted tasks**. It did not retry,
replace, or top up the frozen cohort. The unscored task was
`python-sphinx-765e5e14`: control reached `final_context_selected`, while the
ARE candidate ended `run_error` with
`intent-anchor-episode.non-tool-corrections-exhausted` and no prediction.
The pair-result SHA-256 is
`695475937bd4a90a7559d3868826d22d8d34a4cbcac7cfa32865a2988ec75ba4`.
The first unattempted task is `python-ansible-6c2ff818`.

The complete 1,273-file, 76,005,026-byte VPS campaign was copied to
`/home/vlad_/are-benchmark-archive/g01-r14-terminal-run-20261002/campaign/`.
A full sorted remote/local per-file SHA-256 comparison passed. All **13/13**
attempted-task source archives under
`/home/vlad_/are-benchmark-archive/g01-product-replication-r14/pairs/`
independently matched their archive hashes and pair-result bindings; the
pair-13 source archive SHA-256 is
`9a2402d85fa01c69dbc51792f3a9206e7d81317e35823f82ce2510d02a997a43`.
The coordinator reclaimed only each already verified source scratch tree.
No campaign evidence was deleted.

The frozen definition SHA-256 remains
`ca7b9dc4c9fd9537e63f14f8c644c54ebba63d29b044c3406ed956737f101efb`
and campaign freeze SHA-256
`9dedcda5586e059bda95adfd08decd9c452006d1c53b64361fb8150a6a827754`.
The **24/24 valid-pair prerequisite failed**, so no prospective r14 aggregate
interval gate or superiority claim can be reported, regardless of the first
12 partial scores. This development-only, cap-three population also cannot
establish full ContextBench or general ARE superiority. A successor requires a
separately versioned source and clean, predeclared cohort; r14 cannot be
resumed as if still live.

A read-only [independent receipt audit](/home/vlad_/are-benchmark-archive/g01-r14-terminal-run-20261002/TERMINAL-RECEIPT-AUDIT.json)
using the versioned [auditor](../research/g01-fast-live-v1/audit-campaign-r11.mjs)
then passed all 12 scored-pair native hashes and recomputed File-/Span-F1,
the frozen source/plan/config bindings, the pair-13 raw failure shape, and
absence of remaining pair results. Auditor source SHA-256 is
`c38f0dcfc3de72f310d91d70f84d80c124ce27b0458a261c2abf10f252e25210`.
This verifies receipt integrity, not the missing prospective denominator or
any superiority interval.

As **descriptive development diagnostics only**, the 12 audited scored pairs
have mean candidate-minus-control Span-F1 **+0.2353** and File-F1 **+0.4491**;
aggregate known-token and arm-duration ratios are **0.7327** and **0.9574**.
Only **5/12** scored pairs pass all four directional checks. The failed
denominator, task-specific losses, and near-neutral duration ratio make a
reliability plus efficiency investigation more useful than a product claim.
These values are not the frozen 24-task interval analysis, and the unscored
pair is not discarded from the prospective denominator.

## Exposed failure mechanism and r46 source candidate

The candidate's retained convergence metadata shows two admitted queries and
six confirmed base reads, but its required substantive anchor was the
standalone issue-template heading `Describe the bug`. That heading had no
source support, so readiness stayed false; four consecutive `stop` responses
then exhausted the non-tool correction limit. This diagnosis uses only
convergence and correction metadata, not model reasoning, tool outputs,
credentials, environment dumps, evaluator labels, or gold content.

A separate r46 source copy strips that **standalone heading only** before
deriving anchors, with a regression test. The 412-file source tree differs
from r45 in exactly the convergence module and its test, and is pinned at
SHA-256 `b97b3718c55c9ffb19cd6c8d140d8147580f8c6db1d6d2c98476a99e38aa54df`.
On the exact exposed Sphinx task, a provider-free replay of its existing
queries, support and six reads makes the new substantive anchor ready, with
**6/6** substantive reads. The pinned VPS qualification passed **106/106
Node** and **27/27 Python** tests. The [r46 source receipt](/home/vlad_/are-benchmark-archive/g01-r14-r46-source-evidence-r1/SOURCE-QUALIFICATION.json)
is checksum-matched to its VPS original at SHA-256
`df9f803944461aec3f27e5babdec762fd5675da212766e566fd689a189955b66`.
This is a prospective reliability-source qualification, **not** a repair of
frozen r14, a new model episode, a scored pair, or proof that a fresh campaign
will finish. The next campaign needs a separately selected clean cohort and
freeze before GLM dispatch.

## Open Questions

- Will r46's source-level mechanism transfer to fresh tasks without increasing
  candidate duration or degrading native quality?
- Can a separately frozen successor achieve 24/24 validity and positive
  origin-clustered quality and efficiency intervals on a defensible fresh
  population?
