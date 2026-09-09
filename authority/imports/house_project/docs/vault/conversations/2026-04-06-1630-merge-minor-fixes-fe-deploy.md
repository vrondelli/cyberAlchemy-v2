---
tags: [architecture, application, infrastructure, acquisition]
node_type: audit
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-04-06
timestamp: 2026-04-06T16:30:00-03:00
expires: 2026-06-05
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates:
  - "deploy-worker disk cleanup policy → infra premise"
  - "Vercel webhook opacity → CI constitution gap"
expected_importance: 9
importance_rationale: "Large frontend refactor + backend features shipped to prod, exposing two systemic infra weaknesses (worker disk accumulation, Vercel webhook opacity) that require remediation."
---

# merge-minor-fixes-fe: Discovery, Plan, Execution & Deploy

**Date:** 2026-04-06 16:30 (UTC-3)
**Tags:** #architecture #application #infrastructure #acquisition

## Summary

This session covered the full lifecycle of merging the `minor-fixes-fe` branch into `main`: from initial discovery and plan review through conflict resolution, test fixes, and production deployment across all infrastructure components.

The merge consolidated a large frontend refactor (modular Sidebar components, tabbed page decomposition for Cadastros/Contratos, new PendingDocuments page) with backend additions (pending overview feature, schema manifest builder API, celery task adjustments). Discovery revealed the branch's `current_phase` feature spanned 11 files and was removed to avoid migration conflicts. The implementation plan went through multiple revisions (v0.1.0 → v0.4.0) as initial claims about zero conflicts proved wrong — actual merge testing found 8-9 conflicting files. BulkImportTab.jsx required rewriting from FormData to the 3-step signed URL upload flow.

Two test suites required fixes before merge: `useRemessaUpload.test.jsx` (2 failures — tests mocked a single API call but the hook now does a 3-step signed-URL flow) and `test_schema_manifest.py` (8 failures — tests compared canonical field names like `campo_chave` but the builder applies a display-name mapping to `id_parcela`, and tests weren't passing `get_complementary_columns_fn`).

Production deployment hit two infrastructure issues. The GCP deploy-worker failed three consecutive times because the worker VM disk was 100% full (48/49GB from 32 accumulated Docker images). After pruning unused images (freeing 42GB), the worker was manually redeployed via SSH. The Vercel frontend deploy also failed because `pnpm-lock.yaml` was out of sync with `package.json` — the `@playwright/test` dependency existed in package.json but was missing from the pnpm lockfile, causing `pnpm install` to fail on Vercel's build step.

All production components are now deployed: Cloud Run API (smoke test passed), Cloud Run Jobs (bulk import + remessa uploads), Celery worker and beat (manual VM deploy), and Vercel frontend (after lockfile fix).

## Epistemic Impact

**Beliefs challenged:**

1. **"The branch has zero merge conflicts"** — Discovery v0.1.0 claimed this. Actual merge testing found 8-9 conflicting files. Discovery docs were written from static code inspection without running `git merge`.

2. **"CI detects Vercel build failures"** — Vercel's deploy webhook returns HTTP 200 regardless of the actual build result. The CI pipeline has been silently tolerant of frontend build failures.

3. **"The deploy-worker CI step is reliable"** — The worker VM accumulated 32 Docker images (43.7GB) without cleanup. Disk reached 100%, causing three consecutive deploy failures.

**Beliefs confirmed:**

1. Large merges require iterative plan revision (v0.1.0 → v0.4.0), not one-shot execution.
2. Test mocks must be structurally aligned with code under test — both test failures followed the same pattern of mocks lagging behind implementation changes.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `frontend/src/components/Sidebar.jsx` | deleted | Replaced by modular Sidebar/ directory |
| `frontend/src/components/Sidebar/` (11 files) | created | IconRail, DetailPanel, SearchBar, MobileDrawer, SidebarProvider, etc. |
| `frontend/src/pages/cadastros-tabs/` (14 files) | created | Tabbed sub-pages extracted from Cadastros.jsx |
| `frontend/src/pages/contratos-tabs/` (5 files) | created | Tabbed sub-pages extracted from Contratos.jsx |
| `frontend/src/pages/PendingDocuments.jsx` | created | New pending documents page |
| `frontend/src/App.jsx`, `Layout.jsx` | modified | Routing refactor for new page structure |
| `frontend/src/hooks/remessas/__tests__/useRemessaUpload.test.jsx` | modified | Fixed mocks for 3-step signed-URL upload flow |
| `frontend/pnpm-lock.yaml` | modified | Synced @playwright/test entry |
| `frontend/e2e/sidebar-pages.spec.js` | created | Playwright e2e test for sidebar navigation |
| `domains/aquisicao/repositories/pending_overview_repo.py` | created | Pending overview repository |
| `domains/aquisicao/use_cases/get_pending_overview.py` | created | Pending overview use case |
| `shared_services/schema_manifest_builder.py` | modified | Display-name mapping for user-facing field names |
| `shared_services/tests/test_schema_manifest.py` | modified | Fixed display-name mapping assertions + get_complementary_columns_fn |
| `shared_services/interfaces/schema_views.py` | created | Schema manifest API endpoint |
| `domains/aquisicao/tasks/celery_tasks.py` | modified | Task signature adjustments |
| `infrastructure/database/models.py` | modified | Removed current_phase field |

## Connections

- `contradicts` → specs/refactor/docs/frontend/merge-minor-fixes-fe-discovery.md (zero-conflict claim was wrong)
- `derives-from` → specs/refactor/docs/frontend/merge-minor-fixes-fe-implementation-plan.md (execution of this plan)
- `questions` → .github/workflows/deploy-gcp.yml (deploy-worker has no disk cleanup)
- `questions` → .github/workflows/vercel-deploy.yml (webhook doesn't validate build result)

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| Deploy-worker needs Docker image cleanup step — images accumulate until disk full | HIGH | Open |
| Vercel deploy webhook returns 200 regardless of build result — CI can't detect frontend failures | HIGH | Open |
| Discovery process should include dry-run merge as required gate | MEDIUM | Open |
| schema_manifest_builder display-name mapping not covered by spec | MEDIUM | Open |
| pnpm-lock.yaml drift — consider lockfile sync check in pre-commit or CI | LOW | Open |

## Open Questions

- Is `current_phase` needed for any downstream feature, or is its removal permanent?
- Should the Vercel workflow poll the deployment API for actual build status instead of fire-and-forget?
