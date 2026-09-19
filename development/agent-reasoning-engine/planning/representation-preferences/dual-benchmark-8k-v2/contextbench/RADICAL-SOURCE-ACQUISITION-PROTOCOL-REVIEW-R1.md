# Radical source acquisition protocol review R1

Verdict: coherent candidate direction, with concrete registration decisions still required. Design review only; no implementation or live admission. No model, tokenizer or evaluator calls were made. Frozen sources were not changed.

## Implementable distinction

Build a bounded index from the assigned pinned repository tree **before any model observation**, then expose a separately named ranked-source tool. Its corpus is the admitted source inventory, not the archive of already delivered reads. A successful tool response supplies exact contiguous source bytes from an indexed snapshot; only a later successful matching model-request receipt can credit delivery. Existing read/edit/get-patch duties and the final native context selection remain unchanged.

A discriminating fixture starts with an empty read archive and places the only query match in a never-read tracked file. The new tool must return a reconstructable span from it; archive-only retrieval cannot. A second fixture must show that merely indexing/ranking that file produces no delivered-evidence or export credit.

## Decisions required before prospective registration

1. **Treatment and ordering.** “Before patch exploration” is not yet an enforced phase: the proposed initial summary plus optional tool could be ignored. Choose either an explicitly bounded acquisition phase before edits, with stated exit/abstention behavior and allocation inside the existing budget, or an optional indexed-search tool with a narrower hypothesis. Do not claim the former while implementing the latter. Pin the ancestor candidate and whether receipt-budget R2 is inherited; changing its budget policy simultaneously must be explicit.
2. **Corpus and reproducibility.** Specify enumeration from the pinned Git tree, ordering, admitted encodings/extensions, generated-file rules, symlink/submodule handling and deterministic exclusion precedence. “Source” and “generated” need testable rules. Declare file count, per-file bytes, total admitted bytes, postings/entries, build time/memory/disk bounds, failure behavior and partial-inventory manifest. No task-specific allowlist derived from past gold.
3. **Exact retrieval.** Pin tokenizer/normalization, case and identifier splitting, stop words, path/text weights, scoring formula, ties, minimum match, no-hit behavior, window boundaries, maximum returned spans/bytes, overlap merging and stable pagination. Choose a fixed initial design before outcome feedback; the protocol need not identify a theoretically best lexical ranking.
4. **Snapshot behavior.** A minimal first version can index pinned base only while retaining existing current-source read/edit tools; if current indexing is included, define atomic invalidation/rebuild after every edit, generation/content-hash cursor binding and stale-query rejection. Never return old bytes labeled current-now. Preserve old snapshots for immutable recovery rather than silently reinterpret identifiers after edits.
5. **Native delivery contract.** Use a distinct tool/schema and additive adapters. Existing episode requires the exact repository toolset. Existing `search` admission/binder requires `utf8.includes(args.query)`, so tokenized/path-weighted ranking can fail that contract even for legitimate results. New adapters must bind query/index generation, path/revision/source digest, line range and exact bytes; define reduction, omission metadata and immutable recovery, fresh observation identities, coverage-ledger inclusion, terminal export and saved-prediction reconstruction. Ranking alone never establishes relevance or delivery. Include forged/stale/mismatched results and unknown-tool tests.
6. **Resource and prompt contract.** Specify the protected inventory-summary shape, omission count, maximum prompt contribution and schema cost. Preserve 8K/96K/96 calls/2048 output and 88K/95 exploration plus 8K/one final unless separately amended. Declare request/index tokenizer ceilings and final reserves, pending accounting, shared two-worker allocation and no retries. Bound non-model indexing CPU/memory/storage separately; zero model calls is not zero resource cost.
7. **Measurement and native lineage.** Register a distinct candidate identity, exact four-task schedule, selected H-R and counterhypotheses, mechanism/changes from ancestor, success/falsifier, stop rules, complete cost denominator and test DAG. Keep all-task perfection as the strong quality target; “more relevant acquisition” needs an explicit descriptive metric and cannot be inferred from read volume. Record indexed/admitted, raw retrieved, bounded-view, receipt-confirmed, base-projected and finally selected evidence separately. Retain changed-line mapping limitations and all incomplete tasks. No matched savings claim while controls are suspended; retain the original15% target and untouched confirmation requirement.

## Contract caveats

The protocol's phrase “existing read/edit/test capabilities” overstates the current public toolset: it exposes list_files, read_file, literal search, apply_edits and get_patch, but no test-execution tool. Preserve the existing issue-resolution attempt rather than silently adding test execution. A future test runner would require explicit scope, resource and evidence decisions.

Source-index construction must use assigned public task/repository inputs only. Evaluator annotations, answer patches and previous gold-derived paths/ranges stay outside generator/index inputs. Existing aggregate census numbers motivate the hypothesis but do not authorize reference-guided ranking or task-specific tuning.

The new-source mechanism is meaningfully distinct, but a candidate changing corpus access, ranking, prompts and phase ordering is not a clean single-component causal comparison. Historical comparisons remain descriptive. No non-code transfer, semantic understanding or patch correctness follows merely from native context metrics.

## Required registration/work sequence

Resolve decisions above → native prospective records and distinct schedule → index/tool/provenance construction → never-read-source, stale-version, omission/recovery and full accounting tests → production reconstruction/storage stress → exact freeze and real tokenizer qualification → separate reviewed candidate-only run → all-outcome native score/census/decision. No fresh controls or additional worker pool.

## Exact reviewed bindings

- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/RADICAL-SOURCE-ACQUISITION-PROTOCOL-R1.md` — `429549ae504b0a87ba7b991f8d632e0334131fb520f70cb2ce2c30e12f32662f`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/receipt-budget-episode-r2.mjs` — `9a9401e411d8b114597023ac772c00206a7c0d0c0d002b6893ecfc29bd0716c1`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/receipt-budget-schedule-r1.mjs` — `9ff18a0fcf13a9409f0f36e271d908a72a4a9b66abc40a0adcb4ce30a5aaa0ff`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-delivery-r1.mjs` — `ac2aff4dee4348dec76562331267f20a3e5a137bd9da9e0a2d957fa5c8d48e20`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-admission-r1.mjs` — `c11ccad82f8631112cc0e98817065a6049f7deaf3abdf60868dcc60413d63375`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-recovery-r1.mjs` — `d201ac02ac47daf28d780eb3bcd68d273e4986988ad2da62c8152aa35297683b`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-prediction-r1.mjs` — `5c5d47345309d975713655d20a290b6428d7d6f14561feefd276d3f04804c6d3`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/FRONTIER-RESOURCE-HYPOTHESES-R2.md` — `70d4bf178c4280f29812e3633e8ef1419f742c3e85f3297f426073b18853ed61`
- `/home/vrondelli/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs` — `e87bf3ce5cfd7ffb6891f25649cc918e6fe3597ea081192be5a7b1042cb816b9`

## Open Questions

Which explicit acquisition ordering and bounded lexical specification will be registered? Base-only first version or a versioned current index? What measured inventory limits fit the assigned repositories and WSL budget? Can newly delivered relevant evidence improve interpretation/final selection rather than just increase cost? Perfect native quality,15% cumulative model-token savings and untouched confirmation remain unresolved. The protocol and FRONTIER-RESOURCE-HYPOTHESES-R2.md own these decisions.
