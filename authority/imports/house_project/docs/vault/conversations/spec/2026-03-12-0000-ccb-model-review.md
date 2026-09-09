---
tags: [ccb, spec, models]
layer: domain
nature: reference
status: active
created: 2026-03-12
timestamp: 2026-03-12T00:00:00-03:00
expires: 2026-05-11
conversation_id: 66fe3b5f-b94d-47fc-b06c-69008f3c217b
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-12
expected_importance: 5
importance_rationale: "Reviewed CCB domain models against spec, identified model-spec drift."
---

# CCB Workflow — Model Review & Backlog Update

**Date:** 2026-03-12  
**Tags:** #ccb #spec #models

## Summary

Reviewed the complexity and current state of the CCB Validation Workflow (Spec 002), covering 8 phases and 12+ models. Identified two redundant models (`DocumentTypeConfig` and the `DocumentFieldConfig` / `extraction_config` split), a missing folder↔document traceability link, and a set of software and business inefficiencies. User decisions were captured and 9 new backlog items were written to `backlog.md`.

## Key Decisions

- **`DocumentTemplate` is the canonical template model.** `DocumentTypeConfig` is redundant (never used in Phases 2–5) and must be removed.
- **`KitType` (`document_kit_type`) is not a template.** It is a bundle config declaring which doc types a contract needs. No FK to `DocumentTemplate` — they are intentionally separate.
- **All template knowledge must live on `DocumentTemplate`:** `DocumentFieldConfig` fields (`critical_fields`, `non_critical_fields`, `non_critical_threshold`) should be merged into `DocumentTemplate`.
- **`DocumentVersion` needs a direct `contrato` FK** (currently only reachable via `DocumentChecklist`) and a `folder_result` FK to `DocumentsFolderResult` to make the full bulk-import lineage traceable.
- **Pending folder results (HIGH priority):** Folders in `pendente` status have no follow-up workflow or alerting. Defined operator workflows per reason and a dashboard/notification requirement.
- All software inefficiencies (GCS copy, ProdutoKitConfig compaction, late tipo_produto validation, StagedFile template link loss, OCR task batching) are captured as LOW priority.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/backlog-ccb.md]] | `updates` | 9 new backlog items added covering model redundancy, folder↔document linking, software inefficiencies (LOW), and pending-folder alerting (HIGH) |
|[[002-ccb-validation-workflow/ccb-entities.md]]| `contextualizes` |Entity definitions reviewed; `DocumentTypeConfig` flagged for removal|
|[[002-ccb-validation-workflow/ccb-implementation-phases.md]]| `contextualizes` |Phase status and model surface area reviewed|
