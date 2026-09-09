---
tags: [pipeline, acquisition, liquidation, infrastructure, application]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-02
timestamp: 2026-04-02T14:00:00-03:00
expires: 2026-06-01
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Activated COPY FROM STDIN as default staging path (5 min vs 45 min at 3.3M rows), fixed silent Celery serialization bug that left frontend hanging, and corrected parcela identity hash that used a non-existent column."
---

# COPY Staging Activation and Pipeline Bug Fixes

**Date:** 2026-04-02 14:00 (UTC-3)
**Tags:** #pipeline #acquisition #liquidation #infrastructure #application

## Summary

This session focused on debugging and fixing the remessa upload pipeline, specifically enabling the COPY FROM STDIN optimization for staging inserts and fixing multiple bugs that surfaced during end-to-end testing with a 3.3M-row CSV file.

### COPY FROM STDIN Activation and Testing

The `USE_COPY_STAGING` feature flag was implemented in a previous session but defaulted to `false`. After discovering that uploads were still using the slow ORM `bulk_create` path (3,357 chunks of 1,000 rows, ~45 minutes), the default was changed to `true`. This revealed that `prepare_aquisicao_staging_df` referenced a column `sacado_cpf_cnpj` that doesn't exist in the clean DataFrame — the upload rules FORMATTING_MAP already renames it to `sacado_cnpj_cpf`. The coalesce logic was removed entirely, and `parcela_aquisicao_hash` was simplified to only accept `sacado_cnpj_cpf`. The COPY path was confirmed working: 3.3M staging rows inserted in ~5 minutes vs ~45 minutes on the ORM path.

### Celery Result Serialization Bug

After the upload completed successfully (data written to DB), the frontend remained stuck on "Aplicando critérios..." indefinitely. Investigation revealed that the Celery task's return value contained `valor_total` as a Python `Decimal`, which isn't JSON-serializable. Celery silently failed to store the SUCCESS result in Redis, leaving it stuck on the last PROGRESS state. A targeted `float()` fix wasn't sufficient because other non-serializable types could exist in the result dict (dates, UUIDs, etc.). A recursive `_make_serializable` function was added to both aquisicao and liquidacao celery tasks to catch any type.

### Frontend Progress Stages

The upload frontend only showed "Processando..." with no indication of which phase was running. `update_state` calls were added at each pipeline phase, and `StageRemessaService.stage()` received a `progress_cb` parameter. The frontend now shows: Validando os dados → Subindo remessas → Subindo parcelas → Subindo contratos → Aplicando critérios.

### Cloud Run Dispatcher Tests Hanging

Four tests in `test_cloud_run_dispatcher.py` (aquisicao + liquidacao) hung forever because `.run()` entered `_poll_cloud_run_progress` which loops with `time.sleep(5)`. Fixed by mocking both `_poll_cloud_run_progress` and `update_state`.

### `ccb_freshness` Filter NameError

The filter had a variable `staging_qs` that was never assigned to `dates`, causing `NameError: name 'dates' is not defined` on every remessa. Fixed by materializing the queryset directly as `dates`.

### Test Runner Hardening

`run_tests.py` was getting stuck due to zombie pytest processes from previous runs. Added `_kill_stale_pytest_processes()` cleanup and `--timeout=60` per-test guard via pytest-timeout.

### Diagram Simplification

The aquisicao upload flow diagram had a `USE_CLOUD_RUN_JOBS_REMESSA` decision diamond that implied two different pipelines. Since both paths run identical code on different infrastructure, the diamond was removed and replaced with an annotation on the Phase 2 subgraph.

## Epistemic Impact

Two foundational beliefs were challenged and corrected:

1. **sacado_cpf_cnpj as a component of parcela identity.** The field was embedded in `parcela_aquisicao_hash` and the ORM builder as if it were part of the parcela's canonical identity. The session revealed it does not exist in the source data at that point in the pipeline and was never a valid identity component. This is a spec drift fix — the identity hash spec and its consumers were silently wrong.

2. **COPY FROM STDIN as an opt-in optimization.** The prior assumption (reflected in the default `USE_COPY_STAGING=False`) was that COPY was an optional performance enhancement that could default off. After the 3.3M-row test (~5 min vs ~45 min), it is clear that ORM bulk-insert is operationally infeasible at production volumes. The default was flipped, which reflects a changed belief about what "the normal path" is.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/aquisicao/tasks/celery_tasks.py` | modified | Added progress stages, `_make_serializable`, Decimal import |
| `domains/aquisicao/tasks/upload_stager.py` | modified | Removed `sacado_cpf_cnpj` coalesce from hash and ORM builder |
| `domains/aquisicao/tests/test_cloud_run_dispatcher.py` | modified | Mocked `_poll_cloud_run_progress` and `update_state` |
| `domains/aquisicao/tests/test_upload_stager_copy.py` | modified | Removed `sacado_cpf_cnpj` from test fixtures and coalesce test |
| `domains/aquisicao/domain/filters_criteria.py` | modified | Fixed `dates` NameError in `ccb_freshness` filter |
| `domains/aquisicao/repositories/repositories.py` | modified | Added per-chunk COPY logging |
| `domains/liquidacao/tasks/celery_tasks.py` | modified | Added progress stages, `_make_serializable` |
| `domains/liquidacao/tests/test_cloud_run_dispatcher.py` | modified | Mocked `_poll_cloud_run_progress` and `update_state` |
| `infrastructure/entity_identity.py` | modified | Removed `sacado_cpf_cnpj` param from `parcela_aquisicao_hash` |
| `infrastructure/tests/test_entity_identity.py` | modified | Removed alias test for removed parameter |
| `infrastructure/remessa/stage_remessa_service.py` | modified | Added `progress_cb` param, phase logging, bumped batch size to 10k |
| `house_project/settings.py` | modified | `USE_COPY_STAGING=true`, chunk sizes 1k→10k |
| `run_tests.py` | modified | Zombie process cleanup, `--timeout=60` per test |
| `docs/vault/diagrams/aquisicao-upload-flow.md` | modified | Removed Cloud Run decision diamond |

## Connections

- **validates** `specs/003-remessa-upload-with-events/2026-04-01-staging-copy-from-plan.md` — COPY path confirmed working at 3.3M rows
- **contextualizes** `specs/entity-identity/` — `sacado_cpf_cnpj` removed from parcela hash; identity spec should be updated

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| No integration test for COPY path at scale | Session observation | MEDIUM | Open |
| `ccb_freshness` filter has no test coverage | NameError found manually | HIGH | Open |
| `_make_serializable` duplicated in aquisicao and liquidacao | Code review | LOW | Open |
| Entity identity spec still references `sacado_cpf_cnpj` | Spec drift | MEDIUM | Open |

## Open Questions

- Is the COPY chunk size of 500k optimal, or would larger/smaller chunks improve throughput on Cloud SQL?
- Should `_make_serializable` be applied at the Celery result backend level instead of per-task?
