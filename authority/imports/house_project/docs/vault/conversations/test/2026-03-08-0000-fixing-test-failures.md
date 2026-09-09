---
tags: [testing, filters, aquisicao]
layer: domain
nature: reference
status: active
created: 2026-03-08
timestamp: 2026-03-08T00:00:00-03:00
expires: 2026-05-07
conversation_id: 6907e125-6318-4b21-a040-ec9773f0b0de
node_type: test
is_session: true
version: 0.1.0
last_updated: 2026-03-08
expected_importance: 3
importance_rationale: "Fixed localized test failures in filter domain tests without broader test infrastructure changes."
---

# Fixing Test Failures

**Date:** 2026-03-08  
**Tags:** #testing #filters #aquisicao

## Summary

Fixed 4 failing tests related to `is_mandatory` defaulting to `True` in `FundFilterConfig` migration `0029`. Updated tests to reflect production behaviour.

## Key Decisions

- `is_mandatory=True` default in migration 0029 is the correct production behaviour
- Tests updated to match this expectation rather than the previous assumption of `False`
- No model changes required — test fixes only

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[development-practices-constitution]] | `derives-from` | Every use case requires at least one integration test |
