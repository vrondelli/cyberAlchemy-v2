---
tags: [ccb, acquisition, pipeline]
node_type: discovery
is_session: true
layer: [domain, application]
nature: [technical, explanatory]
status: active
created: 2026-03-20
timestamp: 2026-03-20T12:14:00-03:00
expires: 2026-05-19
conversation_id: 08fe6c9c-c3b5-4f7b-86c8-7d7b4ce854ac
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/empresa-geradora-discovery.md]
promoted_candidates: [specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md]
expected_importance: 7
importance_rationale: "Identified and validated a zero-template extraction strategy via universal regex (100% on 30 CCBs), plus designed the 'empresa geradora' dimension that decouples document layout from loan emitter — foundational for scaling document processing to new portals."
version: 0.1.0
last_updated: 2026-03-20
---

# Empresa Geradora — Template Matching Discovery & Implementation Plan

**Date:** 2026-03-20 12:14 (UTC-3)
**Tags:** #ccb #acquisition #pipeline

## Summary

This session investigated why 65 documents (30 CCBs + 35 Averbações) from batches 110-111 were classified by doc_type but failed template matching, resulting in `no_template` status and zero field extraction. The root cause is that the current template matching system (Jaccard text similarity + pHash Hamming distance) cannot handle documents from different emitters/portals than the registered templates.

The key discovery was that a new dimension — "empresa geradora" (the entity that produced the PDF) — is needed to properly organize templates and extraction logic. This is distinct from the loan emitter (Bancarizador): a Capital Consig loan produces documents from multiple empresas (CCB from Capital Consig, Averbação from Dataprev/SIAPENET, Antifraude from Unico).

A second major discovery was that **universal regex extraction works with 100% success rate on CCBs** — 16/16 fields extracted from all 30 unmatched CCBs across 2 different layouts, without any template. This is possible because banking regulation (Resolução CMN) standardizes CCB field labels.

The session produced a discovery document, an implementation plan, and a detailed analysis of the empresa inference viability (100% accuracy across 99 documents using text markers like URLs, CNPJs, and institutional names).

### Template Matching Gap Analysis
- **Problem/Goal:** Understand why classified documents weren't being extracted
- **Decision:** The current system lacks the "empresa geradora" dimension, causing cross-emitter template matching failures
- **Changes:** Analyzed Jaccard/pHash distances between batch CCBs and registered templates (Jaccard 0.39 vs threshold 0.85, pHash 22-27 vs threshold 10), confirmed inter-batch CCBs are same emitter (Jaccard 0.87, pHash 2-4)

### Universal Regex Extraction Feasibility
- **Problem/Goal:** Can fields be extracted without templates using regex?
- **Decision:** Yes for CCBs (regulation standardizes labels). Partially for Averbações (requires per-portal regex). LLM reserved as future fallback.
- **Changes:** Developed and tested 16 universal CCB regex patterns achieving 100% extraction on 30 documents

### Empresa Geradora Inference
- **Problem/Goal:** Can the "empresa geradora" be inferred from document content automatically?
- **Decision:** Yes — text markers (URLs, CNPJs, institutional names) provide 100% accuracy. Averbações don't have CNPJ but portal URLs work. For unknown empresas, `empresa=None` falls back to current behavior.
- **Changes:** Created `empresa-geradora-discovery.md` with empirical evidence and `empresa-geradora-implementation-plan.md` with 6-component implementation plan

Key outputs:
- `specs/002-ccb-validation-workflow/empresa-geradora-discovery.md` — discovery document with empirical analysis
- `specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md` — 6-component implementation plan

## Key Decisions

- **Universal regex over LLM for CCB extraction:** Regex is zero-cost and proven 100% effective on regulation-standardized CCB labels. LLM deferred as layer 3 fallback.
- **Empresa geradora ≠ emissor do empréstimo:** The dimension that determines document layout is who produced the PDF, not who originated the loan. These are different entities.
- **URL-based inference for Averbações:** Since Averbações lack CNPJ, empresa inference relies on portal URLs (siapenet.gov.br, dataprev.gov.br) captured in OCR text.
- **Templates become optional, not mandatory:** With universal regex as fallback, templates become an optimization (more precise extraction) rather than a prerequisite. New reason `extracted_no_template` signals successful extraction without template.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | User added ComprovanteEmprestimo and Identificacao keyword patterns for doc_type classification |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/empresa-geradora-discovery.md` | `created` | Discovery document analyzing empresa geradora inference viability with empirical evidence from 99 documents |
| `specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md` | `created` | 6-component implementation plan: model migration, empresa inference, universal_extraction.py, pipeline integration, template registration, discovery update |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| CCB regex untested on non-Capital-Consig SCDCs | This session | ⚠️ HIGH | Open — need real data from other emitters to validate universality |
| Averbação SIAPENET regex patterns not yet written | This session | MEDIUM | Open — layout identified, patterns need implementation |
| Averbação Dataprev (Portal de Operações) regex patterns not yet written | This session | MEDIUM | Open — layout identified, patterns need implementation |
| 15 documents with `doc_type=None` in batch 111 | Batch analysis | LOW | Open — likely new doc types not yet in keyword patterns |

## Open Questions

- Will the universal CCB regex hold for CCBs from other SCDCs (not Capital Consig)?
- Should `empresa` eventually become a ForeignKey to a registered `Empresa` table, or remain a free CharField for flexibility?
- How should the frontend surface the `extracted_no_template` status differently from `extracted_not_cross_checked`?

## Connections

- [[template-matching-coverage-discovery]] — `extends` — This session extends the gap analysis from that discovery with empirical data and a concrete solution
- [[ccb-constitution]] — `validates` — The universal regex respects CCB field requirements defined in the constitution
- [[system-fragilities]] — `extends` — Adds "cross-emitter template matching failure" as a documented fragility with a proposed fix

## Satisfaction

- **Score:** 8
- **Min:** 7
- **Max:** 9
- **Std:** 0.5
