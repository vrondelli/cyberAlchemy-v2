# ContextBench execution research

Status: live development round two in progress; ContextBench NOT cleared. Owner: executing agent.
Authority effect none. Active user goal: complete the plan and clear the benchmark.

The [current plan](../tool-state-audit-v1/PLAN.md) and [continuity contract](../CONTINUITY.md)
remain controlling guidance. [continuity.json](continuity.json) binds enduring
ARE purpose, initial GLM/small-window work, current ContextBench milestone, exact
ontology method and predecessor evidence. Four [candidate hypotheses](hypotheses.json)
separate useful state, null/task understanding, presentation reduction and tool/
measurement failure. [C3 selection](selection-v1.json) chooses a bounded delivered-
evidence index under the [issue-resolution protocol](PROTOCOL-v1.md). No treatment
implementation or live experiment was frozen at that initial selection boundary.
The current [round-two freeze](freeze-round2.json) and
[work state](work-state-frozen-v2.json) now bind the successor implementation.

## Current live evidence

Round one completed one baseline: 22 calls, 45,264 model tokens, five recycles,
no patch and no native score. The final response contained prose plus fenced JSON;
the strict parser rejected the envelope without a correction opportunity.
[Learning](round1-learning.json) and the
[selected-hypothesis review](round1-selected-hypothesis-review.json) preserve that
failure and the absence of a paired H1 result. Fifteen unstarted cells were paused.

Round two preserves the same eight deterministically selected development tasks,
two arms, 8K window and 96K cumulative token cap per cell. It adds at most one
tools-disabled terminal correction within the existing 24-call limit, using the
existing bounded parser and complete schema/reference diagnostics. Old output is
not retroactively accepted or scored. [Successor continuity](round2-continuity.json)
binds the initial objective, method and counterevidence. Live handles and the
current execution frontier are owned by [progress.json](progress.json).

## Acceptance and scope

[acceptance.json](acceptance.json) defines the project-specific target before any
live model outcomes. This is not an official upstream pass threshold. The scope
remains all 1,136 pinned tasks, with 903 development and 233 reserved confirmation
identities selected by source/language-stratified hashes without outcome selection.
Small windows: 8K/10K/12K. Cumulative input/output tiers: 48K/96K/192K; the primary
comparison tier is 96K. Exact physical-call caps and per-round matrices await G.

Clearance requires at least five percentage points of paired mean final-span F1
improvement over the matched baseline on reserved confirmation at each window,
positive repository-cluster bootstrap 95% lower bounds, no decline in the named
coverage/precision guards, consistent gain direction in two repetitions, full
scope accounting and validated instrumentation. F1 is a derived statistic from
native span scores. Token tiers, model-output allowance and context size are
separate limits. Report missing data and failed tasks; no subset clearance.

These criteria are a preregistered engineering target, not a forecast. Frozen
thresholds are not loosened to accommodate failure. Reserved data used for tuning
becomes exposed; any further confirmation needs an explicit fresh-evidence design.
The pinned inventory contains 66 repository identifiers; cluster grouping will use
those exact identifiers and remain fixed in the analysis implementation.

## Current verified progress

- Pinned upstream revision `1436c28a8eb95496da4ea69ad458b9f8a8eb7d61` and full
  dataset hash. Inventory confirms 1,136 rows across eight languages.
- Implemented a source-bound delivery-to-trajectory exporter; ten adversarial
  controls pass. A receipt bridge now verifies exact captured request bodies and
  source bytes; eight delivery, three receipt-export and six token-budget tests
  pass. Historical replay covers 20 completed episodes, not new benchmark runs.
  A bounded index and terminal-response selection binder each pass six focused
  controls. These components still need live runner wiring; search/paging and
  source coordinates after edits remain unfinished. See
  [component review](component-review-v1.json) for exact tested sources and limits.
- Three unchanged native-evaluator controls pass. A deliberate displacement keeps
  cumulative span coverage at 1.0 while final span coverage becomes 0.0. Missing
  final context returns an extraction error. This is instrument evidence, not
  benchmark success or a measured GLM benefit.

See [implementation and controls](../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/README.md).

## Dataset issue retained

The full inventory has three empty gold-context lists (one each in C++, JavaScript
and Rust), with no metadata/commit mismatch. All eight native language parsers
are available. [Preflight](../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/dataset-preflight.json)
and [source investigation](../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/empty-gold-investigation.json)
retain the exact identities. The Hugging Face dataset at revision
`c2855792b006af41c67202d33883fb9d46362853` has the identical full-parquet SHA-256;
this is not a stale local copy. Do not score missing annotations as vacuous success,
fabricate replacements, silently remove tasks or claim full clearance. Resolve
annotation coverage while continuing independent runner/instrument work.

## Next construction tasks

1. Verify all task/revision identities and parser coverage; review native empty-gold
   and edit-location fallback behavior. Gold/reference patches remain evaluator-only.
2. Bind actual delivered and final-selected context to live request receipts,
   including search excerpts/paging and source freshness. An archive entry cannot
   count as delivered evidence.
3. Complete competing-hypothesis selection and one discriminating protocol; reuse
   verified old controls without confusing retrieval with post-delivery retention.
4. Bind finite development matrix, token/call caps, independent scoring and exact
   D08 task criteria; run offline gate, then dispatch the first frozen live cells.
5. Preserve every result and learning decision; continue successor rounds until
   the declared confirmation acceptance is met. No SWE-bench follow-on.

## Open Questions

What minimal ARE runner adapter faithfully preserves native task behavior and
actual final selections? How should partial-line observations map without crediting
unseen bytes? Which immutable execution adapter verifies D08 task criteria? Which
state intervention best distinguishes H1 from H2/H3? Full live benchmark execution,
confirmation and all acceptance decisions remain outstanding.
