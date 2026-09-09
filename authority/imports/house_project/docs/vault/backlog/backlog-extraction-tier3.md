---
title: Extraction Tier 3 — Implementation Backlog & Postmortem
description: Status of Tier 3 refactor implementation against original plan. Tracks completed work, missing abstractions, and deferred architectural features.
node_type: backlog
layer: architecture, domain
nature: procedural, technical
status: active
version: 0.1.0
last_updated: 2026-04-13
---

# Extraction Tier 3 — Implementation Backlog & Postmortem

## Context

The Extraction Tier 3 refactor was designed to transform seven hardcoded `_step_*` functions in [extraction_steps.py](../../../domains/documents_validation/use_cases/extraction_steps.py) into a data-driven pipeline of `PipelineStep` objects threading a `FolderState` accumulator.

**Original plan:** [extraction-tier3-implementation-plan.md](../../../specs/002-ccb-validation-workflow/docs/extraction-refactor/docs/refactor/extraction-tier3-implementation-plan.md) (9 phases, 2026-04-13)

**Current state audit:** [extraction-tier3-tagging-audit.md](../../../specs/002-ccb-validation-workflow/docs/extraction-refactor/docs/code-tagging/extraction-tier3-tagging-audit.md) (2026-04-13)

## Backlog Categories

### Completed / Done

---

## [2026-04-13] HIGH — Phase 0–6 Core Pipeline Classes — ✅ DONE

**Context:**
All foundational and operation step classes from the original plan (Phases 0–6) have been implemented and properly tagged with `@sys` annotations. The basic extraction pipeline is functional.

**Completed items:**
- ✅ `FolderState` (value-object) — folder-scoped aggregates + pipeline-run scratch
- ✅ `RerunScope` (value-object) — rerun filtering logic
- ✅ `TransientExtractorError` (exception) — retryable error handling
- ✅ `PipelineStep` (interface) — protocol for all pipeline steps
- ✅ `ExtractionPipeline` (workflow) — orchestrator class
- ✅ 10 concrete operation steps:
  - `DocTypeIdentificationStep`, `EmpresaIdentificationStep`, `MergeIdentificacaoStep`
  - `ExtractStep`, `ContratoLookupStep`, `KitEvaluationStep`
  - `CrossCheckStep`, `RenameStep`, `PersistStep`
  - `MultipleCCBGuardStep`

**Affected files:**
- `domains/documents_validation/domain/extraction/pipeline.py` — ✅ tagged
- `domains/documents_validation/domain/extraction/pipeline_step.py` — ✅ tagged
- `domains/documents_validation/domain/extraction/folder_state.py` — ✅ tagged
- `domains/documents_validation/domain/extraction/rerun.py` — ✅ tagged (RerunScope + TransientExtractorError)
- `domains/documents_validation/domain/extraction/steps/*` — ✅ all 10 steps tagged
- `domains/documents_validation/use_cases/extraction/persist_step.py` — ✅ tagged

---

## Architectural Resilience & Robustness

---

## [2026-04-13] MEDIUM — Support Classes Not Implemented (Simplification vs. Plan) — ❌ NOT DONE

**Context:**
The original Tier 3 plan (§4.1, §4.2, §4.3, §7.3) specified **cascading strategies**, **support interfaces**, and **gate rules** to handle extraction failures gracefully. The current implementation exists but is **incomplete vs. the plan**:

- **Missing**: `CascadingStep` abstract base class (strategies cascade without an ABC?)
- **Missing**: `Strategy` and `ExtractorStrategy` protocol/interface
- **Missing**: `GateFailure` and `SkippedUpstreamFailure` value-objects
- **Missing**: `CriticalFieldGate` and `ConfidenceGate` rule classes
- **Missing**: `MergePlan` dataclass (merge side effects should be deferred to `PersistStep`)

**Why this matters:**
1. **Deferred persistence:** The plan mandates that `MergeIdentificacaoStep` writes a plan, not execute GCS uploads directly. Without `MergePlan`, it may still execute inline, breaking atomic persistence.
2. **Cascading strategy logic:** Without `CascadingStep` ABC, steps may not respect `RerunScope` filtering correctly or handle transient retries via `_with_transient_retry()`.
3. **Gate failure propagation:** Without `GateFailure`/`SkippedUpstreamFailure`, downstream steps don't know why an upstream step failed, losing observability.

**What needs to be done:**
1. **Decide:** Are these support classes intentionally omitted (simplified design) or still pending implementation?
   - If **intentional:** Document why (e.g., "gates are inline in step logic for now, revisit if extractors add more failure modes")
   - If **pending:** Prioritize Phase 7 & 8 implementation per the original plan
2. **Verify behavior:** Confirm that:
   - `MergeIdentificacaoStep` defers GCS uploads to `PersistStep` (no inline mutations)
   - Steps respect `RerunScope.dvs` filtering correctly
   - Failed DVs are annotated so observability/debugging works
3. **Update plan:** If classes remain unimplemented, create a new spec documenting the simplified architecture vs. original design

**Affected files:**
- `domains/documents_validation/domain/extraction/cascading_step.py` — ❌ Not implemented (was planned)
- `domains/documents_validation/domain/extraction/strategy.py` — ❌ Not implemented (was planned)
- `domains/documents_validation/domain/extraction/rerun.py` — ❌ `GateFailure`, `SkippedUpstreamFailure` not present
- `domains/documents_validation/domain/extraction/merge_plan.py` — ❌ Not implemented (was planned)
- `domains/documents_validation/domain/extraction/gates.py` — ❌ Not implemented (was planned)
- `domains/documents_validation/domain/extraction/steps/merge_identificacao.py` — ⚠️ Needs audit: does it defer or execute GCS inline?
- `domains/documents_validation/domain/extraction/steps/extract.py` — ⚠️ Needs audit: does it use gate rules or inline logic?

---

## [2026-04-13] MEDIUM — Tier 2 Extractors Not Retagged — ❌ NOT DONE

**Context:**
The original plan (§7.1) proposed collapsing `PrimaryGeminiExtractor` and `FallbackGeminiExtractor` into a single `Gemini` class and retagging `TemplateRegex` and `UniversalRegex` as `@sys` operations. These remain untagged.

**Why this matters:**
The semantic index ([semantic-index MCP tool](../../../.claude/plugins/superpowers/skills)) expects all extractors to be tagged so they appear in `semantic_query("extraction pipeline")` results. Untagged extractors break discoverability.

**What needs to be done:**
1. Tag existing extractors in-place:
   - `TemplateRegex` (operation) at `domains/documents_validation/domain/extraction/extractors/template_regex.py`
   - `UniversalRegex` (operation) at `domains/documents_validation/domain/extraction/extractors/universal_regex.py`
   - `PrimaryGeminiExtractor` and `FallbackGeminiExtractor` (or collapse into single `Gemini`)
2. Decide whether to unify Gemini variants:
   - If **keep separate**: tag both and document why they're not unified
   - If **unify**: refactor to single `Gemini` class per plan §7.1, then tag
3. Validate that `registry.py` references match tagged classes (run `validate_registry()` at startup per plan)

**Affected files:**
- `domains/documents_validation/domain/extraction/extractors/template_regex.py` — ❌ Not tagged
- `domains/documents_validation/domain/extraction/extractors/universal_regex.py` — ❌ Not tagged
- `domains/documents_validation/domain/extraction/extractors/primary_gemini.py` — ❌ Not tagged
- `domains/documents_validation/domain/extraction/extractors/fallback_gemini.py` — ❌ Not tagged
- `domains/documents_validation/domain/extraction/extractors/cascade.py` — ❌ Marked for deletion (still present?)
- `domains/documents_validation/domain/extraction/registry.py` — ⚠️ Must reference only tagged extractors

---

## Technical Debt & Refactoring

---

## [2026-04-13] HIGH — Document Simplification Decision — ❌ NOT DONE

**Context:**
The Tier 3 implementation plan is ~70% complete (core steps + pipeline), but ~30% of the original design (support classes, gates, strategies) is **not present**. The audit correctly identifies this as a "simplified variant" but offers **no justification** for why.

This creates ambiguity:
- Was the simplification **intentional** (to ship faster, accept less abstraction)?
- Was it **accidental** (phases 7–9 deferred)?
- Is this a **permanent architectural choice** or **tech debt to revisit**?

**Why this matters:**
Future maintainers and agents need to know:
1. Whether to build on this simplified design or extend toward the full plan
2. Whether failure modes (gate exhaustion, transient retries) are handled correctly
3. Whether to implement missing abstractions or keep logic inline

**What needs to be done:**
1. Review the original implementation PRs to find where the decision was made to simplify
2. Document the trade-off explicitly:
   - **Pros of simplified design:** fewer classes, logic is local to steps, easier to debug
   - **Cons:** loss of cascading failure handling, no deferred gate evaluation, tight coupling of step logic
3. Create a new spec or update the discovery doc explaining the **actual** architecture vs. the **planned** architecture
4. If phases 7–9 are deferred, add them to the project backlog with clear prioritization

**Affected files:**
- `specs/002-ccb-validation-workflow/docs/extraction-refactor/docs/refactor/extraction-tier3-implementation-plan.md` — needs a "Post-Implementation Notes" section explaining what was omitted and why
- `specs/002-ccb-validation-workflow/docs/extraction-refactor/docs/code-tagging/extraction-tier3-tagging-audit.md` — "Analysis: Implementation Variant" section is correct but incomplete (says what was omitted, not why)
- New file: `docs/vault/specs/extraction-tier3-simplified-rationale.md` — explain the architectural trade-off and its implications

---

## [2026-04-13] MEDIUM — Verify Deferred Persistence in MergeIdentificacaoStep — ❌ NOT VERIFIED

**Context:**
The original plan (§3, "MergePlan dataclass — defer merge side effects") mandates that `MergeIdentificacaoStep` must NOT delete DVs or upload to GCS directly; it writes a plan object, and `PersistStep` executes it atomically. This is critical for maintaining ACID properties across the pipeline.

**What needs to be done:**
1. Audit `MergeIdentificacaoStep.run()` — confirm it returns a `FolderState` with a deferred plan, no inline mutations
2. Audit `PersistStep.run()` — confirm it executes the merge plan within a single database transaction
3. If either step performs inline mutations, refactor to use a `MergePlan` dataclass (or equivalent deferred-action pattern)
4. Write integration tests that verify: merge plan is executed atomically even if GCS upload fails afterward

**Success criteria:**
- `MergeIdentificacaoStep` returns early with a plan; no GCS, no DB mutations
- `PersistStep` wraps merge execution in `transaction.on_commit()` and emits events
- Test: if GCS fails during `PersistStep`, DVs are still deleted correctly (no orphaned data)

**Affected files:**
- `domains/documents_validation/domain/extraction/steps/merge_identificacao.py` — audit implementation
- `domains/documents_validation/use_cases/extraction/persist_step.py` — audit implementation
- New test: `test_extraction_pipeline/test_merge_plan_deferred_execution.py`

---

## [2026-04-13] LOW — Update Dictionary and Semantic Index — ✅ IN PROGRESS

**Context:**
The semantic-index MCP tool ([.claude/plugins/superpowers/skills/semantic-index.md](../../../.claude/plugins/superpowers/skills/semantic-index.md)) needs to index all extraction pipeline classes so `semantic_query("extraction pipeline")` returns them.

**What needs to be done:**
1. Confirm all 14 currently tagged classes are in the embeddings (Postgres vectors):
   - 4 core classes: `FolderState`, `RerunScope`, `TransientExtractorError`, `PipelineStep`, `ExtractionPipeline`
   - 10 operation steps (all named `*Step`)
2. Run `semantic_query("extraction pipeline")` from a user prompt and verify results include at least 8 of the 10 steps
3. Update `docs/vault/dictionary-sys.md` with the 14 implemented classes and their brief descriptions
4. If support classes are implemented later (phases 7–9), add them in a follow-up commit

**Affected files:**
- `docs/vault/dictionary-sys.md` — add entries for all 14 classes

---

## Next Steps (Priority Order)

1. **HIGH / BLOCKING:** Clarify whether the simplified design is intentional or deferred
   - Review PR comments, commit messages, or Victor's notes
   - Add a "Rationale" section to the plan documenting the decision
   
2. **HIGH / BLOCKING:** Verify deferred persistence in `MergeIdentificacaoStep` and `PersistStep`
   - If not deferred, refactor to use `MergePlan` or equivalent
   - Add integration test for atomic merge + GCS
   
3. **MEDIUM:** Implement or document Phase 7–9 classes (gates, strategies, support interfaces)
   - If deferred: add to a separate backlog with clear milestone
   - If intentionally omitted: document why and accept technical debt
   
4. **MEDIUM:** Tag Tier 2 extractors (`TemplateRegex`, `UniversalRegex`, Gemini variants)
   - Decide whether to unify Gemini classes
   - Ensure `registry.py` references are all tagged
   
5. **LOW:** Update semantic index and dictionary once all tagging is complete

---

## Governance Notes

- All tags follow: `@sys: <ClassName> | type: <type>`
- Valid types: `workflow`, `interface`, `value-object`, `operation`, `rule`, `exception`
- Tags live in class docstrings (not comments)
- One tag per class; no duplicates
- Changes to this backlog should reference the extraction-tier3 plan and audit documents

---

## Decision Log

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2026-04-13 | Create backlog to consolidate plan vs. implementation gap | Audit found 75% of planned support classes missing; no documented justification | Victor |
| Pending | Simplification: intentional or deferred? | Need to clarify architectural intent before continuing to phases 7–9 | Victor |
| Pending | Implement or defer support classes (gates, strategies)? | Dependent on above decision | TBD |
| Pending | Unify Gemini extractors? | Original plan suggested yes; need to decide scope of Tier 3 refactor | Victor |
