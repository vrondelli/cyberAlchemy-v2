---
tags: [ccb, testing]
layer: domain
nature: reference
status: active
created: 2026-03-12
timestamp: 2026-03-12T16:37:02-03:00
expires: 2026-05-11
conversation_id: 0d902665-5cad-404f-ba8e-c214910d4390
node_type: test
is_session: true
version: 0.1.0
last_updated: 2026-03-12
expected_importance: 3
importance_rationale: "Fixed test skips and warnings, localized cleanup without new test patterns established."
---

# Fix Test Skips and Warnings

**Date:** 2026-03-12 16:37 (UTC-3)  
**Tags:** #ccb #testing

## Summary

Ran `run_tests.py` and investigated 3 skipped tests and 10 warnings. The 3 skips were all in `TestPipelineReasonCodes` due to `imagehash` not being installed; fixed by `pip install imagehash Pillow`. Two categories of actionable warnings were resolved: `SyntaxWarning: invalid escape sequence '\s'` in `ocr_service.py` docstrings (fixed by doubling all backslashes in regex examples), and `DeprecationWarning: datetime.utcnow()` in `run_ocr.py` (replaced with `datetime.now(timezone.utc)`). Suite went from 1062 passed / 3 skipped / 10 warnings to **1065 passed / 0 skipped / 5 warnings** (remaining 5 are third-party PyMuPDF SWIG warnings).

## Key Decisions

- `imagehash` + `Pillow` added as project dependencies (installed in venv)
- Use `datetime.now(timezone.utc)` instead of `datetime.utcnow()` going forward
- Regex examples in docstrings must use doubled backslashes (`\\s`, `\\S`, `\\d`) since Python 3.12 warns on invalid escape sequences even inside triple-quoted strings

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[aquisicao/services/ocr_service.py]] | `updates` | Fixed invalid escape sequences (`\s`, `\S`, `\d`) in docstrings |
| [[aquisicao/use_cases/run_ocr.py]] | `updates` | Replaced `datetime.utcnow()` with `datetime.now(timezone.utc)` |
