---
tags: [infrastructure, pipeline]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-02
timestamp: 2026-04-02T17:00:00+00:00
expires: 2026-06-01
conversation_id: ~
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "gcloud --args= quoting rule for flag-like values"
expected_importance: 3
importance_rationale: "Fixed three production-blocking CI/CD bugs (VPC name mismatch, gcloud --args parsing, stale test path) with no architectural changes or new enforceable rules."
---

# CI/CD Pipeline Fixes: VPC Names, --args Syntax, Test Paths

**Date:** 2026-04-02 17:00 (UTC)
**Tags:** #infrastructure #pipeline

## Summary

This session debugged and fixed multiple cascading failures in the GitHub Actions deploy pipeline for the Django/GCP project. The session started with the user asking whether current changes were live on prod, which led to checking deploy run `23910480353` — revealing that `deploy-bulk-import-job` was failing while all other jobs passed. Three distinct bugs were identified and fixed, culminating in the discovery that a prior commit had broken all Cloud Run executions by renaming the VPC to a non-existent network.

### Topic 1: deploy-bulk-import-job `--args` parsing failure

**Problem:** `gcloud run jobs create` was failing with `argument --args: expected one argument`. The remessa upload jobs succeeded with the same `--args` pattern, which was initially confusing.

**Why remessa passed:** Remessa jobs already existed in GCP and took the `update` path (which has no `--args`). The bulk import job was new and hit the `create` path. This masked the bug for all previously deployed jobs.

**Alternatives considered:** Initial hypothesis was that inline secret values in `ENV_VARS` (POSTGRES_PASSWORD, REDIS_PASSWORD, etc.) contained special characters that broke shell quoting and corrupted subsequent flags. This led to refactoring the bulk import job to use `--set-secrets` instead of expanding secrets into `ENV_VARS`. The refactor was kept as a security improvement but did not fix the error.

**Root cause:** `--args "-m,..."` passes a value starting with `-m`, which gcloud's argparse interprets as a new flag rather than the argument value for `--args`. Fixed by using `--args="-m,..."` syntax.

### Topic 2: CI test path broken

**Problem:** `django-tests.yml` ran `pytest liquidacao/tests/` but that path does not exist — tests were moved to `domains/liquidacao/tests/` during an earlier domain restructuring. The workflow had been failing on every push.

**Fix:** Updated to `domains/liquidacao/tests/`. Commented-out paths for `aquisicao` and `estoque` were also updated.

### Topic 3: VPC network name mismatch — root cause of all Cloud Run upload failures

**Problem:** After the `--args=` fix deployed, uploads still failed immediately with `VpcNetworkNotFound`: `Direct VPC network house-project-vpc / subnetwork house-project-subnet do not exist`.

**Investigation:** Compared VPC config across all GCP job execution generations via audit logs:
- **Gen 1–9** (working): `zefra-hub-vpc` / `zefra-hub-subnet`
- **Gen 10+** (broken, from 16:24 UTC today): `house-project-vpc` / `house-project-subnet`

Gen 10 corresponded to commit `d4c73a4` which had renamed all 18 VPC/subnet references in the workflow. The network `house-project-vpc` does not exist in GCP.

**Why this was silent:** The deploy step always succeeds — it only updates the Cloud Run job definition. The `VpcNotFound` error only surfaces at execution time when a user triggers an upload.

**Fix:** Replaced all 18 occurrences back to `zefra-hub-vpc` / `zefra-hub-subnet`.

## Epistemic Impact

Two forms of spec drift were discovered and corrected:
1. `django-tests.yml` referenced a test directory that no longer existed after domain restructuring.
2. `deploy-gcp.yml` had 18 VPC references pointing to non-existent GCP resources.

The VPC incident confirms a general operational risk: infrastructure-as-code changes that reference named external GCP resources fail silently at deploy time and only surface at execution time.

**promoted_candidates:**
- The `--args=` quoting rule (flag-like values require `=` syntax with gcloud) is non-obvious and undocumented in the project.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `.github/workflows/deploy-gcp.yml` | `modified` | Bulk import secrets moved to --set-secrets; --args/--command use = syntax; all 18 VPC/subnet references restored to zefra-hub-vpc/zefra-hub-subnet |
| `.github/workflows/django-tests.yml` | `modified` | Test path corrected from liquidacao/tests/ to domains/liquidacao/tests/ |

## Connections

- Contextualizes `docs/vault/constitution/development-practices-constitution.md` — the VPC incident illustrates why infrastructure references need validation against live GCP state.

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| No automated check validates that GCP resource names in workflow files (VPC, subnet, service accounts) match live GCP resources | VPC name mismatch investigation | MEDIUM | open |
| `--args=` quoting rule for gcloud is undocumented — future additions could repeat this mistake | `--args` parsing failure | LOW | open |

## Open Questions

- `docker-compose.prod.yml` exists and is referenced in `scripts/deployment/deploy_remote.sh` but is unused by the current CI/CD pipeline. Should both be deleted to avoid confusion?
