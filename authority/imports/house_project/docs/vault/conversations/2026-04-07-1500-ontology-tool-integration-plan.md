---
tags: [ontology, extraction, implementation-plan, architecture]
node_type: implementation-plan
is_session: true
layer: ontology, application
nature: technical, procedural
status: active
created: 2026-04-07
timestamp: 2026-04-07T15:00:00+00:00
expires: 2026-06-06
conversation_id: q5vt2
decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: ["specs/ontology/docs/data-foundations/discovery-extraction-pipeline.md"]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Established the execution path for aligning the extraction pipeline with v0.3.0 design decisions (edges from dictionary only, taxonomy_type on CodeAnchor only) and resolved prior debates about linter ordering and model naming, providing concrete checkpoints for a six-phase integration overhaul."
version: 1.0.0
last_updated: 2026-04-07
---

# Session: Ontology Tool Integration Plan

**Date:** 2026-04-07 (UTC)  
**Tags:** #ontology #extraction #implementation-plan #architecture

## Summary

The session audited the ontology extraction pipeline in `tools/ontology/` and identified ten integration gaps that prevent the pipeline from functioning end-to-end. Starting from an initial list of five issues (tag_scanner not called from CLI, duplicate Anchor models, test import paths, wrong field usage in embeddings, redundant CLI code), the analysis expanded to reveal a broader pattern: `tag_scanner.py` was copied from `specs/ontology/tools/domain_tagging/` without being integrated into the unified pipeline designed in `discovery-extraction-pipeline.md`.

The core architecture is sound—`models.py`, `dictionary_extractor.py`, `registry/builder.py`, `embeddings/client.py`, `setup.py`, and `cli.py` all cohere well and align with the design. However, the pieces don't connect: the scanner is never called, models have conflicting definitions, tests use fragile imports, and dead code blocks remain in place contradicting settled decisions about edge inference and taxonomy type location.

The session produced a detailed six-phase implementation plan with concrete checkpoints for each phase. Phases 1–2 form the critical path: (1) refactor tag_scanner.py, implement the dictionary linter, and fix tests; (2) wire the scanner into the CLI with proper lint gates and typed RawCodeAnchor data flow. Phases 3–6 correct models, update extractors, retire duplicate files, add comprehensive tests, and update documentation. The plan maps all ten issues to specific phases and sections, specifies model renames for clarity (Anchor→RawCodeAnchor/CodeAnchor, TermEntry→DictionaryTerm, Edge→OperationalOntologyEdge, UnifiedRegistry→OperationalOntologyRegistry), and includes verification commands for each checkpoint.

Key decisions reaffirmed: edges come from the dictionary only (no code inference), and taxonomy_type lives on code anchors, not dictionary terms—aligning with v0.3.0 design decisions from prior sessions (r3k8m, m8k4v). The linter was moved from Phase 4 to Phase 1 based on the discovery spec principle that "if the dictionary is malformed, nothing else runs." The plan also surfaces open questions about linter scope (minimal vs. comprehensive schema validation) for future work.

## Epistemic Impact

**Validates:**
- Prior session (r3k8m): edges from dictionary only, no automatic code-level inference
- Prior session (r3k8m): taxonomy_type removed from dictionary; lives only on code anchors (CodeAnchor objects)
- Prior session (m8k4v): dictionary linter must be Phase 1, not Phase 4 (blocks other phases)
- Prior session (m8k4v): model naming clarifications (RawCodeAnchor vs CodeAnchor distinction)

**Surfaces and Corrects:**
- Specification drift: linter ordering was initially considered Phase 4; corrected to Phase 1 based on discovery principle
- Dead code blocks contradicting settled decisions: `infer_edges()`, old `build_registry()`, `emit_yaml()`, `emit_markdown()` still present in tag_scanner.py despite v0.3.0 decision that edges come from dictionary only

**Promoted Candidates:**
- The dictionary linter behavior (error vs warning handling, exit codes) could be promoted to a focused axiom or constitution about "validation gates in the ontology pipeline" if tested across multiple projects.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/ontology/docs/data-foundations/implementation-plan-extraction-pipeline.md` | Created | Six-phase roadmap (480+ lines) addressing all ten integration gaps. Specifies model renames, phase dependencies, code changes, verification commands, and resolved questions from prior sessions (r3k8m, m8k4v). Provides execution framework for enforcing v0.3.0 design decisions across the entire pipeline. |

## Connections

| Document | Edge | Description |
|----------|------|-------------|
| `specs/ontology/docs/data-foundations/discovery-extraction-pipeline.md` (v0.4.0) | `derives-from` | This plan executes the design and resolves ambiguities in the discovery |
| `docs/vault/ontology-conventions.md` | `contextualizes` | Plan uses taxonomy terminology (node_type, layer, nature) to guide future vault nodes |
| `tools/ontology/` (codebase) | `targets` | Plan describes all code changes and checkpoints for integration |
| Prior session r3k8m | `builds-on` | Reaffirms edge inference removal and taxonomy_type location decisions |
| Prior session m8k4v | `builds-on` | Incorporates linter ordering correction and model naming clarifications |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Comprehensive schema validator for dictionary (field format enforcement, edge verb vocabulary, duplicate H3 check) | Phase 1b open question | MEDIUM | Not in scope — Phase 1 implements minimal linter; comprehensive validation deferred |
| Pre-commit hook integration wiring (`--validate` gate in `.pre-commit-config.yaml`) | "What This Plan Does NOT Cover" section | HIGH | Blocked until Phase 2 completes (requires working pipeline first) |
| CI/CD workflow for Stage 2 (authoritative extraction) | "What This Plan Does NOT Cover" section | HIGH | Blocked until Phase 2 completes |
| pgvector embedding upsert implementation (currently a stub) | "What This Plan Does NOT Cover" section | MEDIUM | Requires Gemini API key and running Postgres; beyond scope |
| GitNexus integration (call graph enrichment for edges, code evidence validation) | Phase 2 (future) in discovery | MEDIUM | Separate implementation plan required; noted as future Phase 2 in discovery v0.3.0 |

## Open Questions

1. **Dictionary linter scope:** Phase 1b specifies a minimal linter (H3 description, Code equivalent/Unanchorable check, edge target validation). Should it grow incrementally inside this plan to include comprehensive schema validation (field formats, edge verb vocabulary, duplicate H3), or should comprehensive validation be a separate follow-up plan?

2. **Embedding table naming consistency:** Phase 3 renames `ontology_embeddings` → `operational_ontology_embeddings` (aligned with two-graph naming: operational vs conceptual). Is this the right time, or should it be deferred until after the pipeline is working?

---

**Files to read for implementation:**
- `specs/ontology/docs/data-foundations/implementation-plan-extraction-pipeline.md` — the full executable plan
- `specs/ontology/docs/data-foundations/discovery-extraction-pipeline.md` (v0.4.0) — the design this plan implements
