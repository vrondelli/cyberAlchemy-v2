---
tags: [testing, semantic-index, personal-assistant, ci-cd]
node_type: test
is_session: true
layer: cross-cutting
nature: normative
status: active
created: 2026-04-10
timestamp: 2026-04-10T18:23:00+00:00
expires: 2026-06-09
conversation_id: ~
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "django-view-tests-must-be-pure-pytest — belongs in development-practices-constitution.md"
expected_importance: 6
importance_rationale: "Closed a significant test coverage gap across two tools layers and surfaced a durable operational constraint (no Django test subclasses in tools/) that should be promoted to the development practices constitution."
---

# Test Audit and Coverage — Tools Layer (semantic-index + personal-assistant)

**Date:** 2026-04-10 18:23 (UTC)
**Tags:** #testing #semantic-index #personal-assistant #ci-cd

## Summary

### Context

This session covered three related pieces of work: a test audit of uncommitted changes, writing all the missing tests, and extending `run_tests.py` to include the tools layer.

### Audit

The session began by executing the `test-uncommited-changes` skill against the full diff. The diff was large (327 files), but the meaningful production changes were concentrated in nine files: the pre-commit hook, three CI workflows, `urls.py`, `models.py` (personal assistant), `views.py` (personal assistant), `embeddings/client.py`, `models.py` (semantic index), `setup.py`, and `cli.py`. These changes implemented the full Gemini embedding pipeline (actual API calls + DB upsert), a new Django REST backend for semantic index queries, and a SQL migration system. The audit identified 5 critical gaps (entire `views.py` untested, `upsert_embeddings` had no rollback/validation coverage, SQL migration system had zero tests), 8 important gaps (DB env var resolution, `call_gemini_embed` boundaries, key parsers), and produced a structured coverage matrix artifact.

### Tests written

All audit findings were acted on across four files, resulting in 83 net-new or rewritten tests:

- **`internal_tools/personal_assistant/backend/tests.py`** — 15 pure pytest functions covering `get_registry` (file-absent, caching, read-once), `query_view` (400/403/500/503/200, question stripping), and `chat_view`.
- **`internal_tools/semantic_index/tests/test_embeddings_runtime.py`** — expanded from 4 to 40 tests. Added `_coerce_vector` object attribute paths, all key parser edge cases (`_parse_term_from_key`, `_parse_anchor_key`), DB env var priority/fallback chain (`_get_db_connection_params`), and full `upsert_embeddings` validation (invalid prefix, missing file/line, unknown source_type, rollback on DB error, commit+close on success).
- **`internal_tools/semantic_index/tests/test_setup_migrations.py`** — new file, 14 tests for the migration tracking table creation, apply/skip/idempotency contract, registry integrity, and `SQLMigration` immutability.
- **`internal_tools/semantic_index/tests/test_models.py`** — new file, 14 tests for `EmbeddingTermRecord` and `EmbeddingAnchorRecord` Pydantic contracts (required fields, optional term, type coercion).

### Django test constraint discovered

A concrete infrastructure constraint was discovered during the test-writing step: pytest-django triggers full DB setup (`django_db_setup` fixture) for **all** Django test subclasses, including `SimpleTestCase`. The local Postgres instance has a collation version mismatch that prevents test DB creation, so any test using Django test classes would fail in setup. All Django view tests were rewritten as pure pytest functions with `RequestFactory` to bypass this entirely. This is a normative constraint that should be promoted to `development-practices-constitution.md`.

### run_tests.py

`run_tests.py` was updated to add `internal_tools/semantic_index/tests` and `internal_tools/personal_assistant/backend` to `TEST_DIRS`. The tools tests run cleanly with the same flags (`--reuse-db`, `--timeout=60`) — `--reuse-db` is harmless for plain pytest tests. The docstring coverage list was also updated to reflect the new suites.

## Epistemic Impact

- **Confirmed:** pytest-django triggers full DB setup even for `SimpleTestCase` subclasses. This extends the existing constraint in `test-infrastructure-status.md` with a concrete workaround: use pure pytest functions instead of Django test subclasses for any test that doesn't need the ORM.
- **Confirmed:** the local Postgres collation version mismatch (`2.36` vs `2.41`) actively blocks test DB creation. The mitigation is to avoid creating the test DB entirely — use `--reuse-db` with a pre-existing DB, or pure pytest for DB-free tests.
- **Spec drift fixed:** `run_tests.py` silently excluded all `internal_tools/` tests. Fixed.
- **Promoted candidate:** "Django view tests in `internal_tools/` must be written as pure pytest functions, not Django test subclasses" — belongs in `development-practices-constitution.md`.

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `internal_tools/personal_assistant/backend/tests.py` | modified | Rewritten as 15 pure pytest functions; previous Django test subclasses dropped to avoid DB setup |
| `internal_tools/semantic_index/tests/test_embeddings_runtime.py` | modified | Expanded from 4 to 40 tests covering all new embedding pipeline functionality |
| `internal_tools/semantic_index/tests/test_setup_migrations.py` | created | New 14-test file for SQL migration system |
| `internal_tools/semantic_index/tests/test_models.py` | created | New 14-test file for Pydantic persistence contracts |
| `run_tests.py` | modified | Added `internal_tools/semantic_index/tests` and `internal_tools/personal_assistant/backend` to `TEST_DIRS` |

## Connections

- `contextualizes` → `docs/vault/constitution/development-practices-constitution.md` (the constraint on Django test subclasses should be added there)
- `validates` → memory:`test-infrastructure-status.md` (confirmed and extended the existing DB constraint note)

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| Promote "no Django test subclasses in tools/ — use pure pytest" to `development-practices-constitution.md` | Discovered when rewriting `personal_assistant` tests | HIGH | open |
| Collation version mismatch on local Postgres — document resolution path or enforce Docker-based test DB | Extended from `test-infrastructure-status.md` | MEDIUM | open |
| Verify CI runs all 83 tool tests after `TEST_DIRS` update | `run_tests.py` change not yet validated in CI | MEDIUM | open |
| Remaining "important" audit gaps not yet written (8 items from coverage matrix) | Test audit | LOW | open |
