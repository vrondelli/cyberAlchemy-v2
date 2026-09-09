---
tags: [testing, aquisicao, liquidacao]
layer: domain
nature: reference
status: active
created: 2026-03-09
timestamp: 2026-03-09T00:00:00-03:00
expires: 2026-05-08
conversation_id: 278ee285-bb26-4e08-a59f-34d10af6fa8e
node_type: test
is_session: true
version: 0.1.0
last_updated: 2026-03-09
expected_importance: 5
importance_rationale: "Large-scale test writing session covering aquisicao and liquidacao domains, validating business rules."
---

# Writing Missing Test Files

**Date:** 2026-03-09  
**Tags:** #testing #aquisicao #liquidacao

## Summary

Wrote and verified 3 new test files covering net-new code with no prior test coverage. 27/27 tests pass. Confirmed the deleted `ValidateRemessa*` use cases were correctly merged into `ApproveRemessa*`.

## Key Decisions

- `AquisicaoInternalAPI` tested for fund-scoped match, cross-fund isolation, empty `campo_chaves`, and return type (set of tuples, not ORM objects)
- Liquidacao cross-fund routing: matched → `LiquidacaoManual`, unmatched → `LiquidacaoManualSemParcela`, both in same batch → correct split
- `RequestBatchDownloadAPI` tested for aquisicao (202), liquidacao (202), invalid type (400), unknown remessa_id (404), unauthenticated (401)
- Key insight preserved: `AquisicaoInternalAPI` must use DI injection pattern (mock in test, not real call)

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[development-practices-constitution]] | `validates` | 27 new tests provide integration coverage for 3 APIs |
| [[folder-structure-constitution]] | `validates` | New test files placed correctly inside domain test dirs |
