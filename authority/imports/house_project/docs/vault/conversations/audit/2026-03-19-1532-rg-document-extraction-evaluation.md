---
tags: [spec, acquisition, refactor, ontology]
node_type: audit
is_session: true
layer:[[domain, architecture]]
nature:[[technical, procedural]]
status: active
created: 2026-03-19
timestamp: 2026-03-19T15:32:07-03:00
expires: 2026-05-18
conversation_id: c1bda833-7735-4730-90c3-ab1f87c89b7b
#
expected_importance: 5
importance_rationale: "Evaluated RG document extraction spec completeness, confirming implementation readiness."
version: 0.1.0
last_updated: 2026-03-19
--- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: ["specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md"]
promoted_candidates: []
---

# RG / Identificacao Document Extraction Evaluation

**Date:** 2026-03-19 15:32 (UTC-03)
**Tags:** #spec #acquisition #refactor #ontology

## Summary

This session focused on reviewing and refining the implementation plan for personal identification document extraction (`specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md`). The initial specification contained a fundamental logic flaw that would have bypassed saving partially extracted data on low-quality image scans throughout the pipeline. We caught and corrected this bug by enforcing an inverted logic pattern where extracted data is always safely persisted before evaluating quality gates. Furthermore, we advanced the theoretical strategy by making the critical ID fields polymorphic, adopting a single `id_documento` key rather than rigid variations per identity subtype (RG vs CNH).

### Resolving Persistence Contradiction
- **Problem/Goal:** The spec suggested skipping data persistence tracking (`continue`) if a scanned ID image was marked low-quality, violating the core rule that salvaged fields (like the document number) must still be stored for downstream kit matching.
- **Decision:** Extract the persistence of `dv.extracted_data` out of the conditional gating logic. The script must definitively save whatever fields it matched before making qualitative assertions (Gate 1 and Gate 2).
- **Changes:** Rewrote the `process_bulk_import.py` logic block in the proposed spec to run persistence (`dv.extracted_data = fields`) ahead of evaluating character limits or critical completeness.

### Factoring for Polymorphic IDs
- **Problem/Goal:** Different ID subtypes traditionally relied on distinct regex keys (`rg_numero`, `cnh_numero`), preventing a cohesive shared set of `critical_fields` for the generalized `"Identificacao"` doc type.
- **Decision:** Standardize the config logic to use a unified `id_documento` generic key mapped to a wide regex that captures any form of numbering label. Move field restrictions directly onto the Django model.
- **Changes:** Updated the `identificacao_generic.json` layout and Django Data Migration instructions to establish this factoring, isolating variant data while solidifying constraints.

Key outputs:
- `rg-document-extraction-implementation.md` — The execution plan was corrected, refined, and made ready for deployment execution.

## Key Decisions

- **Extraction Persistence Log:** Extracted fields must be saved to `DocumentVersion.extracted_data` first, regardless of whether the document fails later qualitative checks.
- **Ontology (Identity Core):** The fields `id_subtype`, `id_documento`, and `data_nascimento` serve as the universal shared critical baseline elements for any identification document model.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `modified` | Remedied logic flaw in quality gate structure and factored the JSON mapping to be functionally polymorphic. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `updates` | Re-drafted the process instructions to ensure no critical structural data is unnecessarily lost. |
| [[002-ccb-validation-workflow/identificacao-doc-type-discovery.md]] | `validates` | Enforces the initial concept of standardizing both ID types into one generalized pipeline. |

---
**User Satisfaction Tracking:** Value ~ 9 (Min: 8, Max: 10, Standard Deviation: 0.5)
