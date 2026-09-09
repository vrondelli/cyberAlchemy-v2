---
tags: [ccb, validation-experiment, harness, drift-investigation, resolver-wiring, baseline-coverage]
node_type: spec
is_session: true
layer: domain, application
nature: technical, procedural
status: active
created: 2026-05-11
timestamp: 2026-05-11T14:30:00-03:00
expires: 2026-07-10
conversation_id: drift-investigation-2026-05-11
decisions_made: true
contradictions_found: true
specs_updated:
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/validation-experiment-plan.md
promoted_candidates: []
expected_importance: 9
importance_rationale: "Surfaces a structural drift live since v0.3.0+ where the harness never extracts labels at all — produces 0/63 coverage vs prod-mirror script's 40/63. v0.3.5 spec changes seal the Phase 1-3 fix; Phase 4 template data-quality issues backlogged. Cited by every v0.3.5 Change History entry across the validation-experiment spec set."
---

# Baseline coverage drift investigation — harness 0/63 vs script 40/63

## Objective

Record the empirical finding, the four-agent investigation strategy, the root cause, the secondary drifts, the user-sealed Phase 1–4 decisions, and the v0.3.5 spec changes that land Phase 1–3. Phase 4 is backlogged separately. This conversation node is the canonical provenance citation for the v0.3.5 Change History entries across `operations.md` / `governance.md` / `interfaces.md` / `data-model.md` / `validation-experiment-plan.md`.

## Empirical finding

- **Harness**: 0/63 coverage on the 63-DV real CCB corpus under the current baseline rule set (4 prod templates) and the v0.3.4 gate cascade.
- **Prod-mirror script** (`scripts/staged_matching_experiment.py`): 40/63 coverage on the same corpus, same baseline templates, by calling `extract_data_table` directly from `domains/documents_validation/extractors/ccb/_engine.py`.
- The 40-point divergence is too large to attribute to gate-threshold drift or template-data-quality issues alone — it implies a structural break somewhere in the harness pipeline.

## Investigation strategy: four parallel agents

Dispatched four agents in parallel, each with a narrow charter:

- **Agent A** — normalization audit. Compare `core/normalize.py:normalize_for_matching` (harness strict) vs `scripts/staged_matching_experiment.py:_normalize` (script loose). Quantify label divergence on the real corpus.
- **Agent B** — resolver / extraction-path audit. Trace from `core/iteration_runner.py` through `agents/match.py` → `agents/gates.py` → the prod engine. Identify any unwired or stubbed call sites.
- **Agent C** — mask placeholder audit. Compare `core/mask.py:mask_variable_zones` (harness) vs the script's masking logic. Identify placeholder-string format differences.
- **Agent D** — template data-quality audit. Read every baseline template under `rules/baseline/*.json`. Identify dual canonical_text, empty `variable_zones`, broken anchors.

## Root cause (Agent B finding) — RESOLVER UNWIRED

The harness has been structurally broken since v0.3.0+: **it never actually extracts labels from PDFs at all**. Specifically:

- `agents/gates.py` declares a `resolve_labels_factory` parameter. Its docstring says it should be wired to `extract_with_section_config(section_config, pdf_bytes).data_table`.
- The harness has **zero imports** of `domains/documents_validation/extractors/ccb/_engine.py`. The prod engine is never reachable from the harness code path.
- `core/iteration_runner.py:462-468` calls `match_and_store(...)` **WITHOUT** the `resolve_labels_factory` argument.
- `agents/match.py:299-305` defines a default `_empty(_section_config) -> {}` resolver. Without the factory wired through, this stub is silently used.
- `agents/gates.py:122-131` therefore always sees `found_count = 0`, `label_recall = 0.0`, the data-table gate fails for every (DV, template) pair, and the harness reports `matched=False` for every row.

The drift was invisible because the harness was internally consistent: every test, every dashboard view, every report saw the same `0.0` and rendered correctly around it. One broken wire produced a coherent but wrong measurement frame.

## Secondary drifts

- **Normalization drift (Agent A)** — harness `normalize_for_matching` strips diacritics + folds smart-punctuation; script `_normalize` only lowercases and collapses whitespace. ~50% of real CCB labels diverge byte-for-byte (`Endereço` vs `endereco`) between the two functions. At the data-table-gate boundary, even with the resolver wired, the strict normalization would prevent the harness from matching labels the prod-mirror script matches.
- **Mask placeholder drift (Agent C)** — harness `mask_variable_zones` writes empty-string at the masked zone; the prod-mirror script writes `<<zone_name>>` as a sentinel placeholder. This matters only for cross-pipeline comparison (harness vs script), not within-harness. Within the harness, both sides of `ApplyLegalTextGate` use the same `mask_variable_zones` call, so the gate's byte-equality test is preserved.
- **Template data-quality issues (Agent D)** — three baseline templates carry data anomalies that are not root cause of 0/63 but would surface as per-template gate failures once the wiring is corrected:
  - **tpl16**: dual `canonical_text` (`rule.canonical_text` = 31628 chars vs `section_config.sections.legal_text.canonical_text` = 30302 chars).
  - **tpl19**: empty `section_config.sections.legal_text.variable_zones = []` (mask is identity).
  - **tpl20**: zone `company_site2` has `anchor_after = '. A contratação de seu'` that does not appear in the template's `canonical_text`.

## User-sealed decisions (Phase 1–4)

The user reviewed all four agents' findings and sealed the following decisions. **These are not re-litigated by the v0.3.5 spec work.**

- **Phase 1 (immediate)** — Wire `resolve_labels_factory` to call `extract_with_section_config` from the prod engine. Add an adapter if the return shape doesn't match what `gates.py` expects. Make resolver wiring REQUIRED (no optional with empty default). Codified in [operations.md → MatchAndStore inputs](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md#matchandstore) and the new [IF-26 label_resolver_unwired](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md#refusal-cases-exit-1) refusal code.
- **Phase 2 (correctness)** — Adopt option (a): the harness's data-table gate uses the looser script-style `_normalize` (lowercase + whitespace collapse only), matching the prod-mirror baseline. The harness's strict `normalize_for_matching` REMAINS for the IF-23 tripwire and legal-text comparison elsewhere but is NOT used at the data-table-gate boundary. Within-harness, both gate sides go through the same single function. Codified in [operations.md → ApplyDataTableGate algorithm step 6](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md#applydatatablegate), [governance.md → Canonical resolver wiring (Phase 2 normalization clarification)](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md#canonical-resolver-wiring-v035), and [data-model.md → Data-table gate normalization](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md#data-table-gate-normalization-looser-prod-mirror-v035).
- **Phase 3 (apples-to-apples)** — Accept that the harness is its own measurement frame. The 40/63 baseline is the prod-mirror reference; the harness's number is the harness's reference. Cross-pipeline numerical comparison requires explicit alignment of mask format AND normalization (not given by default). Codified in [governance.md → Canonical resolver wiring rule 6](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md#canonical-resolver-wiring-v035).
- **Phase 4 (data quality)** — Backlog the tpl16 / tpl19 / tpl20 issues. Do NOT fix in v0.3.5. Backlogged at [`backlog-ccb-baseline-template-data-quality.md`](../backlog/backlog-ccb-baseline-template-data-quality.md).

## Adapter contract sealed (Phase 1)

The prod engine's `extract_with_section_config(section_config, pdf_bytes)` returns a `dict` with the shape `{doc_type, page_count, tables_per_page, header, data_table, legal_text, footnote, signature}` (per `_engine.py:363-382`). The `data_table` sub-dict — produced by `extract_data_table` at `_engine.py:251-295` — is itself a nested dict `{blind_table_page, blind_table_index, scanned_tables, declared_field_count, extracted_field_count, coverage, fields, by_section, missing}`.

The `resolve_labels_factory` adapter MUST extract `result["data_table"]["fields"]` — a flat `Mapping[json_key, cell_value | None]` per `_engine.py:283-294` (`extract_data_table` builds `flat_fields[json_key] = res["value"]`).

**Keys are `json_key`** (snake_case, prod-side identifier — for example `endereco`, `data_emissao`), NOT `label` (Portuguese display, used inside the extractor as the regex anchor). Values are `None` when the extractor could not resolve a cell for that `json_key` in this DV.

This corrects the v0.3.1 data-model claim that the return shape was `Mapping[label_str, value | None]`; the prod engine has always keyed the flat map by `json_key`. The v0.3.5 gate iterates over the template-declared `(json_key, label)` pairs from `template.section_config.sections.data_table.sections[*].fields[*]` and looks up `resolved.get(json_key)`.

## v0.3.5 spec changes (pointer)

The following spec files have been bumped to v0.3.5, last_updated 2026-05-11, with cross-referencing Change History entries:

- [`internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md`](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md) — `MatchAndStore` adds REQUIRED `resolve_labels_factory`; `ApplyDataTableGate` algorithm pins looser normalization at the boundary; adapter contract sealed.
- [`internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md`](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md) — new refusal code `IF-26 label_resolver_unwired`.
- [`internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md`](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md) — new invariant "Canonical resolver wiring (v0.3.5)" with Phase 2 normalization clarification and Phase 3 measurement framing.
- [`internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md`](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md) — return-shape contract corrected (keys are `json_key`, not `label`); "Data-table gate normalization (looser, prod-mirror)" section added.
- [`internal_tools/ccb-registration-demo/docs/validation-experiment/features/validation-experiment-plan.md`](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/validation-experiment-plan.md) — §6 Open Obligations adds BLOCKED entry for "63-DV end-to-end determinism run" (unblocks when Phase 1 wiring code lands).

## Phase 4 backlog

[`backlog-ccb-baseline-template-data-quality.md`](../backlog/backlog-ccb-baseline-template-data-quality.md) — tpl16 dual canonical_text, tpl19 empty variable_zones, tpl20 broken anchor_after. Three HIGH-priority entries, fix-when-wiring-lands.

## Files touched in this session

- `internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md` — version bump 0.3.4 → 0.3.5, new content in `MatchAndStore` + `ApplyDataTableGate`.
- `internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md` — version bump 0.3.0 → 0.3.5, new IF-26 row.
- `internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md` — version bump 0.3.4 → 0.3.5, new Canonical-resolver-wiring section.
- `internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md` — version bump 0.3.4 → 0.3.5, return-shape paragraph corrected, new Data-table-gate-normalization section.
- `internal_tools/ccb-registration-demo/docs/validation-experiment/features/validation-experiment-plan.md` — version bump 0.3.4 → 0.3.5, §6 BLOCKED entry added.
- `docs/vault/backlog/backlog-ccb-baseline-template-data-quality.md` — new.
- `docs/vault/conversations/2026-05-11-1430-baseline-coverage-drift-investigation.md` — this file.

No code modified. No `production/` spec touched. No commit. Working tree dirty for user review.
