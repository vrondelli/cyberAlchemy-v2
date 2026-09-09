---
tags: [ontology, architecture, pipeline, document-validation]
node_type: discovery
is_session: true
layer: ontology, domain
nature: technical
status: active
created: 2026-04-11
timestamp: 2026-04-11T23:03:27+00:00
expires: 2026-06-10
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/ontology/docs/domainspec/domains/document_validation/spec.yaml]
promoted_candidates: [internal_tools/semantic_index/docs/refactor/DISCOVERY-extraction-pipeline-v2.md, internal_tools/semantic_index/docs/refactor/DISCOVERY-aliases-and-term-optionality.md]
expected_importance: 8
importance_rationale: "Two architectural corrections (dictionary optional, category from code tag) unblock the extraction pipeline v2; spec.yaml grew 68% (28→47 concepts); CodeAnchor.prefix is small but load-bearing."
---

# DomainSpec Extraction Pipeline v2 & Coverage Expansion

**Date:** 2026-04-11 23:03 (UTC)
**Tags:** #ontology #architecture #pipeline #document-validation

## Summary

### Review of Previous Session's Work

Session started by reviewing the domainspec-tagging-completion session output and the `/specs/ontology/docs/domainspec` folder structure. The DomainSpec structure was solid — 28 concepts tagged, spec.yaml generated, 5 robot-talks tensions resolved — but several gaps needed addressing.

### spec.yaml Category Field & CodeAnchor.prefix

The first concrete change was adding a `category` field (biz/sys) to each concept in spec.yaml. Initially pulled from the dictionary term's prefix, Victor correctly identified it must come from the code tag itself. This led to adding a `prefix` field to the `CodeAnchor` model in `models/models.py` and updating `builder.py` to pass through `raw.prefix` from the tag scanner. The extraction pipeline now preserves the biz/sys distinction from code to spec.yaml without dictionary dependency.

### Pipeline v2 Architecture

Victor proposed a new extraction pipeline flow: (1) business registers terms in dictionary, (2) dev tags code with entity/type/edges, (3) extract tags + validate with GitNexus → generate per-domain YAML, (4) consume YAML → DB tables. Key decisions: dictionary is optional (enriches but doesn't gate), GitNexus serves as both discovery AND validation, spec.yaml is always generated (never hand-authored), and edges no longer live in dictionaries — only in code tags. Captured in `DISCOVERY-extraction-pipeline-v2.md`.

### Coverage Gap — 20 New @sys Tags

Victor identified that spec.yaml was far from complete. The entire `services/` layer (Gemini extraction, OCR, field validation), the `extraction_steps.py` pipeline, deduplication logic, and universal extraction were all unmapped. Victor classified: all data extraction (Gemini, OCR, universal, pipeline steps like classify/merge/rename) are `@sys`; business logic (cross-check, kit evaluation, contrato lookup) stays `@biz`. Four new system dictionary terms were added (GeminiExtraction, OCRService, ExtractionPipeline, UniversalExtraction). `OCRResult` was tagged as a value-object. All 11 extract methods got `@edge: produces → OCRResult`. spec.yaml grew from 28 to 47 concepts (27 biz, 20 sys, 34 edges).

### Alias & Term Optionality

Victor clarified that aliases should come from the dictionary IF a term exists, but code tags should NOT require a dictionary term. A function can be tagged without a full dictionary entry — the dictionary enriches but doesn't gate. Captured in `DISCOVERY-aliases-and-term-optionality.md`.

### Code Cleanup

Removed the `@biz` tag from `sanitize_ccb_id` (plumbing, not business logic). Identified that `sanitize_ccb_id` and `strip_ccb_check_digit` form a pipeline where only the latter is the actual business operation.

## Epistemic Impact

| Dimension | Item |
|-----------|------|
| **Challenged and overturned** | Dictionary is mandatory for ontology extraction. Corrected: dictionary is optional; extraction proceeds from code tags alone. |
| **Challenged and overturned** | `category` field (biz/sys) must be sourced from the dictionary term. Corrected: category comes from the code tag (`@biz` / `@sys`), not from dictionary lookup. |
| **Challenged and partially resolved** | Edges live in the dictionary. Decision: edges in v2 pipeline live only in code tags; dictionary edges are being removed. |
| **Created** | DISCOVERY-extraction-pipeline-v2 — new architecture where dictionary is optional, edges are code-tag-only, GitNexus validates, per-domain YAML replaces monolithic registry. |
| **Created** | DISCOVERY-aliases-and-term-optionality — aliases come from dictionary when term exists; code tags do not require dictionary terms. |
| **Confirmed** | spec.yaml is the right unit of domain extraction output (replacing registry.json per-domain). |
| **Surfaced** | ~50% of business functions in document_validation domain are still untagged. |

## Modified Artifacts

| Artifact | Action | What Changed |
|----------|--------|--------------|
| `internal_tools/semantic_index/models/models.py` | Modified | Added `prefix` field to `CodeAnchor` model |
| `internal_tools/semantic_index/registry/builder.py` | Modified | Builder passes `raw.prefix` through to `CodeAnchor` |
| `domains/documents_validation/services/gemini_extraction.py` | Modified | 7 `@sys` tags + `@edge: produces → OCRResult` |
| `domains/documents_validation/services/ocr_service.py` | Modified | 3 `@sys` tags + `OCRResult` value-object + edges |
| `domains/documents_validation/domain/universal_extraction.py` | Modified | 2 `@sys` tags + edge |
| `domains/documents_validation/domain/ccb_normalization.py` | Modified | Removed `@biz` from `sanitize_ccb_id` |
| `domains/documents_validation/use_cases/extraction_steps.py` | Modified | 6 `@sys` tags |
| `domains/documents_validation/use_cases/process_bulk_import.py` | Modified | 1 `@sys` tag (`_process_folder`) |
| `docs/vault/dictionary-sys.md` | Modified | 4 new terms + index update |
| `specs/.../document_validation/spec.yaml` | Modified | Regenerated: 28 → 47 concepts (27 biz, 20 sys, 34 edges) |
| `generated/ontology-registry.json` | Modified | Regenerated with prefix field per anchor |
| `internal_tools/.../DISCOVERY-extraction-pipeline-v2.md` | Created | v2 pipeline architecture |
| `internal_tools/.../DISCOVERY-aliases-and-term-optionality.md` | Created | Aliases and term-optionality rules |

## Connections

- **derives-from** → `claude/current_conversations/2026-04-11-1900-q7m2x-domainspec-tagging-completion.md` (continues tagging work)
- **questions** → `internal_tools/semantic_index/OVERVIEW.md` (v2 pipeline proposes replacing current architecture)
- **contextualizes** → `specs/ontology/docs/domainspec/README.md` (DomainSpec framework)

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| ~50% of business functions in `document_validation` still untagged | HIGH | Open |
| v2 pipeline DISCOVERY needs implementation plan | HIGH | Open |
| Dictionary edges removal not yet executed | MEDIUM | Pending |
| `field_validation.py` read but not tagged | MEDIUM | Deferred |
| Per-domain YAML migration path (deprecate registry.json) | MEDIUM | Open |
| GitNexus edge validation implementation | MEDIUM | Open |

## Open Questions

1. Should `--strict` default change in CI to accommodate term-optional tags?
2. Cross-domain edges: where do they live when `document_validation` references `aquisicao` concepts?
3. Should Gemini extraction have its own value-object (like OCRResult) instead of returning raw tuples?
