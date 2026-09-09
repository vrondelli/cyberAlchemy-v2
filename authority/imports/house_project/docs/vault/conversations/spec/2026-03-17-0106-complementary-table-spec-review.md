---
tags: [spec, models]
layer: domain
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T01:06:37-03:00
expires: 2026-05-16
conversation_id: 688b6171-8462-4187-9b27-325d8ebf356c
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 5
importance_rationale: "Reviewed complementary table spec, evaluating design for extra column configuration."
---

# Complementary Table Spec Review

**Date:** 2026-03-17 01:03 (UTC-3)  
**Tags:** #spec #models

## Summary

Reviewed `spec-complementary-table-registration.md` against the codebase. Identified critical gaps: secondary table data storage is undefined (only the schema config model exists, not where actual CSV values land), 7 new Main Table columns + `numero_ipoc` are listed but not included in the model migration plan, `mandatory_condition` syntax is unspecified, and the "CSV Column" dropdown source is ambiguous. Produced a detailed implementation plan pending user decisions on these open questions.

## Key Decisions

- **Pending:** Secondary table data storage approach — proposed `JSONField` on `AquisicaoManual` vs EAV table
- **Pending:** `mandatory_condition` JSON schema format
- **Pending:** Whether CSV column names are free-text input or picked from a list
- Implementation plan proposes `TipoInstrumento` model, `ComplementaryTableColumnConfig` model, CRUD APIs, pipeline validation updates, and two new Cadastros tabs

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[003-remessa-upload-with-events/spec-complementary-table-registration.md]]| `validates` |Identified gaps in storage, model migrations, and conditional logic|
