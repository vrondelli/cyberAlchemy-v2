---
tags: [cost-optimization, gcp, gemini-api, cloud-run, infrastructure]
node_type: discovery
is_session: true
layer: architecture, application
nature: technical
status: active
created: 2026-04-06
timestamp: 2026-04-06T14:00:00-03:00
expires: 2026-06-05
conversation_id: k8m3p
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/docs/gemini-optimization/gemini-cost-optimization.md, specs/cloud_services/iac/gcp-infrastructure-migration.tf]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Identified four redundant Gemini API call patterns that inflate monthly costs by 28%, with prioritized fixes ranging from trivial (queryset bug) to medium-effort (circuit breaker), enabling R$200+/month savings."
---

# Session: GCP Cost Optimization

**Date:** 2026-04-06 14:00 (UTC-3)
**Tags:** #cost-optimization #gcp #gemini-api #cloud-run

## Summary

This session addressed GCP cost optimization through two parallel initiatives: infrastructure configuration and API efficiency analysis. The first decision fixed the Cloud Run service configuration in Terraform by setting `cpu_idle = true`, preventing charges for idle CPU during periods of zero request traffic — a cost-saving mechanism that was missing from the baseline infrastructure code. The second initiative produced a comprehensive discovery document analyzing redundant Gemini API calls in the document extraction pipeline (`domains/documents_validation/`), identifying four high-impact cost leaks that collectively account for unnecessary API spending.

The Gemini API optimization discovery found that current implementation re-calls Gemini API multiple times on the same documents without checking if extraction has already succeeded: (1) `reprocess_folder()` re-runs the full extraction pipeline unconditionally, calling `_try_gemini_extraction()` even when `dv.extracted_data` is already populated; (2) the `retry_holerite_gemini` management command retries documents where Gemini already processed the image and found no usable data, wasting API credits with near-zero chance of different output due to an overwritten queryset bug; (3) the system lacks an "extraction attempted" marker field to distinguish documents never sent to Gemini from those already processed and failed, causing unnecessary retries; (4) the Gemini call logic has no circuit breaker on 5xx errors, so during API outages every document in a batch independently triggers up to 4 retry calls instead of failing fast.

The discovery document prioritized fixes into four levels: P1 (trivial — add `if dv.extracted_data` guard to reprocess logic, fix overwritten queryset bug), P2 (medium — add `gemini_attempts` integer field with migration), and P3 (medium — implement module-level circuit breaker on consecutive 5xx responses). With Gemini API representing R$212.25/month (28% of total GCP spend) on the current cost baseline, these fixes directly address the second-largest cost driver in the system.

## Epistemic Impact

**Contradictions found:** None.

**Validation:** The discovery document validates that the current extraction pipeline was designed without API efficiency constraints. The retry patterns and reprocess logic were built for correctness (ensure documents are extracted) but not for cost-awareness (minimize redundant calls). This is a common tradeoff in early-stage systems.

**Spec drift:** The Terraform decision file (`terraform-decisions.md`) now includes explicit justification for the `cpu_idle = true` setting and the cost impact of the three-tier extraction strategy (Gemini primary, Cloud Vision fallback, Tesseract last-resort). No contradictions with existing documented decisions — this is an enhancement to the baseline.

**Promoted candidates:** None at this time. The discovery document should inform a future implementation plan when the cost impact is re-evaluated against engineering effort (estimated effort: P1 fixes = 4 hours, P2 = 8 hours, P3 = 6 hours).

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/cloud_services/iac/gcp-infrastructure-migration.tf` | modified | Added `cpu_idle = true` to Cloud Run `google_cloud_run_v2_service` template to prevent idle CPU billing during periods of zero requests |
| `specs/002-ccb-validation-workflow/docs/gemini-optimization/gemini-cost-optimization.md` | created | New discovery document analyzing four redundant Gemini API call patterns in extraction pipeline with prioritized fix proposals (P1–P3) and cost impact analysis; marked as `node_type: discovery, status: draft, veracidade: high, convicção: high` |

## Connections

- `derives-from`: Bulk import pipeline architecture — `specs/002-ccb-validation-workflow/docs/pipeline/`
- `relates-to`: Extraction service implementation — `domains/documents_validation/services/gemini_extraction.py`, `domains/documents_validation/use_cases/extraction_steps.py`
- `relates-to`: Terraform infrastructure baseline — `specs/cloud_services/docs/architecture/terraform-decisions.md`
- `contextualizes`: GCP cost baseline documented in terraform-decisions.md (monthly estimate ~$230–$325)

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement guard on `_step_extract_unmatched`, `_step_extract_matched_non_ccb`, `_step_extract_matched_ccb` to skip Gemini when `extracted_data` is populated | Gemini cost discovery, finding 1 | HIGH | pending |
| Fix overwritten queryset in `retry_holerite_gemini.py:49` — narrow filter to documents where `extracted_data` is null/empty only | Gemini cost discovery, finding 2 | HIGH | pending |
| Add `gemini_attempts` integer field to `DocumentVersion` model with migration | Gemini cost discovery, finding 3 | MEDIUM | pending |
| Implement circuit breaker in `gemini_extraction.py` on consecutive 5xx responses | Gemini cost discovery, finding 4 | MEDIUM | pending |

## Open Questions

- What is the actual monthly cost impact of the redundant Gemini calls identified? (Estimate: R$50–$100/month based on reprocess frequency and failure rates, but requires query of historical extraction logs to validate.)
- Is the `force_re_extract` flag for reprocess a necessary operational need, or can all reprocess operations safely skip Gemini if data already exists?
- Should `django-celery-beat` be adopted to replace the instance-name-based beat scheduling (currently only runs on first instance of MIG), to enable horizontal scaling of scheduled tasks?
