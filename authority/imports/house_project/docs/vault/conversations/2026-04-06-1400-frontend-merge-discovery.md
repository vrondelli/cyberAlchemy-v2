---
tags: [frontend, merge, minor-fixes-fe, implementation]
node_type: implementation-plan
is_session: true
layer: application
nature: technical
status: completed
created: 2026-04-06
timestamp: 2026-04-06T14:00:00+00:00
expires: 2026-06-05
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/refactor/docs/frontend/merge-minor-fixes-fe-discovery.md, specs/refactor/docs/frontend/merge-minor-fixes-fe-implementation-plan.md]
promoted_candidates: [merge-strategy-premise, backend-acceptance-criteria-premise]
expected_importance: 8
importance_rationale: "Frontend merge introduced new frontend patterns (sidebar, tabs, pending docs) while preserving signed-URL flow; discovered and executed complex multi-phase conflict resolution; established reusable merge strategy and backend acceptance criteria."
---

# Frontend Merge Discovery & Implementation (minor-fixes-fe → main)

**Date:** 2026-04-06 14:00 (UTC)  
**Tags:** #frontend #merge #minor-fixes-fe #implementation

---

## Summary

The session covered the complete lifecycle of merging the `minor-fixes-fe` branch into `main`, spanning discovery, planning, execution, and verification across five sub-sessions. The goal was to integrate frontend improvements (sidebar refactoring, tabbed pages, pending documents module) while preserving main's existing signed-URL upload flow for CSV and document imports.

### Discovery Phase

The discovery phase identified a critical semantic conflict: the branch uses FormData-based upload in BulkImportTab.jsx while main's Contratos.jsx implements a 3-step presigned-URL flow (fetch upload-url → PUT to GCS → confirm with gcs_key). Rather than attempting to port FormData code into main's pattern, the team decided to completely rewrite BulkImportTab to use the signed-URL approach, treating this as a feature improvement on the branch before merge.

The discovery also uncovered a backend architectural fork: the branch introduced a `current_phase` field (plus PHASE_LABELS enum) that spans 11 files across models, tasks, dashboard API, and infrastructure enums. This created a migration diamond (aquisicao/0042_current_phase commit on branch before fork point), requiring either a merge migration or complete removal. The team chose removal to keep the merge atomic and avoid long-term maintenance of a parallel migration path. Nine other backend changes (auth hardening on 2 views, BulkImportListView computed fields, ChecklistView current_version_id) were reviewed and accepted as purely additive, with zero business logic modifications.

### Planning Phase

An implementation plan was written in five phases:
1. **Phase 1 — Merge on branch**: Execute `git merge main` on `merge/minor-fixes-fe`, resolve 9 conflicts, remove current_phase from 11 files, verify no textual errors.
2. **Phase 2 — BulkImportTab rewrite**: Convert FormData flow to 3-step signed URL (upload-url request → PUT to GCS → confirm endpoint).
3. **Phase 3 — Dockerfile**: Verify entrypoint.sh and gunicorn.conf.py exist on branch or update Dockerfile.
4. **Phase 4 — Encoding & dead code**: Fix UTF-8 mojibake in wrapper pages, assess dead code (Contratos.jsx, useRemessaUpload.js) for removal or preservation.
5. **Phase 5 — Test coverage**: Add 23 tests for BulkImportTab, PendingDocuments, and four cadastros tabs (DocumentTemplate, Bancarizador, KitType, TabelaComplementar).

The discovery document was initially v0.1.0 (claiming "zero conflicts"). A trial merge revealed 9 actual conflicts, forcing both documents to be revised: discovery to v0.2.0 (with corrections) and plan to v0.4.0 (with verified conflict details).

### Execution Phase

During execution, the team discovered and fixed several issues:
- **BulkImportTab missing import**: ChevronDown icon import was missing, causing white screen on folder expand. Added to imports.
- **RemessaBatchActions layout bug**: Buttons overlapped on Pendentes page. Changed grid-cols-3 to flex flex-wrap to match responsive design.
- **celery_tasks.py bug**: The branch dropped a `list(...)` call on the remessas queryset but still referenced the variable in a loop, causing a runtime NameError. Restored the list() call.
- **UTF-8 mojibake**: Wrapper pages (Lastros/, Remessas/) had corrupted accents (á → "á" HTML entities). Fixed via Python byte-level replacement to restore original encoding.
- **Contratos.jsx orphaned code**: The branch restructured routes into individual /lastros/* pages, making Contratos.jsx dead code. Identified but left in place (out of scope for merge).
- **useRemessaUpload.js dead code**: ImportExport.jsx does not import this hook. Kept for now pending full codebase scan.
- **ImportExport.jsx polling**: Combined main's 1-hour time-based timeout with branch's mountedRef unmount guard to improve reliability.

All 23 new tests (BulkImportTab, PendingDocuments, DocumentTemplateTab, BancarizadorTab, KitTypeTab, TabelaComplementarTab) were created following the project pattern (module-level remessaApiClient mock from Pendentes.validate.test.jsx) and verified passing. The merge was successfully integrated into main at commit 65fe3f5.

### Decision Patterns & Risk Assessment

The session established three reusable patterns:

1. **Merge strategy**: Feature branches merge onto `merge/*` branch first, test on CI, then fast-forward to main (not direct merge to main). This allows conflict resolution and testing without risk to main.
2. **Conflict precedence**: Main's proven implementation (signed-URL flow, 1-hour timeout, celery prime_portfolio_cache) takes precedence over feature branch code when semantic conflicts exist.
3. **Backend acceptance criteria**: Only additive changes (new model fields, new views, new auth rules) accepted from feature branches. Modifications to existing business logic require architectural review.

Risk assessments:
- **Dockerfile reference issue**: Low risk. Dockerfile not used in prod (Terraform handles infra). Fix scheduled as separate commit after merge stabilizes.
- **useRemessaUpload dead code**: Out of scope for merge. No callers found, but full codebase scan not completed.
- **Unresolved migration question**: Does minor-fixes-fe have migrations on aquisicao beyond 0042_current_phase? Not fully explored; would affect future rebases.

---

## Epistemic Impact

### Contradictions Found & Resolved

1. **Discovery's "zero conflicts" claim vs. actual merge**: Discovery's initial analysis claimed no textual git conflicts. Trial merge revealed 9 actual conflicts (8 content conflicts + 1 add/add on scripts/upload_existing_templates.py). Root cause: theoretical merge-tree analysis missed script refactoring (renames, moves). **Resolution**: Discovery and plan both updated to v0.2.0 and v0.4.0 respectively, with verified conflict lists.

2. **BulkImportTab signed-URL status**: Prior internal discussion assumed BulkImportTab already had signed-URL flow on branch. Team review found it uses FormData instead. **Resolution**: Rewrite BulkImportTab as part of Phase 2, treating it as improving the branch before merge rather than porting code.

3. **Dockerfile file existence**: Discovery stated "entrypoint.sh and gunicorn.conf.py are both new files on minor-fixes-fe." Trial merge confirmed neither file exists on branch. Dockerfile references them but will fail Docker build. **Resolution**: Marked as low-risk (not in prod), verified on branch, flagged for separate fix.

### Discoveries & Confirmations

- **current_phase scope**: Correctly identified as spanning 11 files (models, tasks, enums, API, infra). Removal decision confirmed atomic (no partial imports in app logic).
- **Migration diamond**: Real risk confirmed. Removal during Phase 1 avoids long-term maintenance of a parallel migration.
- **Signed-URL semantic conflict**: Real conflict requiring decision, not a bug. Team chose rewrite over backport.
- **BulkImportListView additions**: Confirmed as query-time computed fields only (duplicates, pct_found, not_identified, processing_complete). No new model fields added; existing counters unchanged.

### Knowledge Graph Implications

This session validates but also challenges the assumption that feature-branch merges can be analyzed statically:
- **Validates**: Backend additions are safely additive; merge strategy (test on branch first) prevents main corruption.
- **Challenges**: Theoretical conflict analysis (merge-tree) is insufficient. Practical trial merge required to find 9 real conflicts. Future merges should assume trial merge as mandatory step.
- **Promotes to decision**: Merge-strategy pattern (always branch first) should be elevated to a premise: "Feature branch merges are tested on an intermediate branch before main integration."

---

## Modified Artifacts

| Artifact | Action | What Changed and Why |
|----------|--------|----------------------|
| frontend/src/components/BulkImport/BulkImportTab.jsx | Modified | Rewrote handleUpload from FormData to 3-step signed-URL flow (upload-url → PUT → confirm). Added missing ChevronDown import. |
| frontend/src/components/ImportExport.jsx | Modified | Added mountedRef unmount guard + preserved 1-hour timeout. Improves polling reliability on component lifecycle. |
| frontend/src/components/RemessaBatchActions.jsx | Modified | Changed grid-cols-3 to flex flex-wrap for responsive button layout on Pendentes page. |
| backend/domains/remessas/celery_tasks.py | Modified | Restored `list(...)` call on remessas queryset (branch had dropped it, causing NameError in loop). |
| frontend/src/pages/Wrapper pages (Lastros/, Remessas/) | Modified | Fixed UTF-8 encoding mojibake (accents corrupted as HTML entities). Byte-level Python replacement. |
| frontend/src/tests/*.test.jsx | Created | 23 new tests: BulkImportTab (renders, loading, upload flow), PendingDocuments (tab behavior), 4 cadastros tabs (list render, loading, form submission). Module-level remessaApiClient mock. |
| specs/refactor/docs/frontend/merge-minor-fixes-fe-discovery.md | Modified | v0.1.0 → v0.2.0. Corrected: 9 conflicts found (not 0), entrypoint files missing (not new), conflict table added. |
| specs/refactor/docs/frontend/merge-minor-fixes-fe-implementation-plan.md | Created | 5-phase implementation plan (merge, BulkImportTab, Dockerfile, encoding, tests). v0.4.0 with verified conflict details and decision rationale. |
| merge/minor-fixes-fe branch | Created | Feature merge branch for conflict resolution and CI testing. Will remain as historical reference post-merge. |
| main @ 65fe3f5 | Modified | Merge completed. All conflict resolutions applied, tests passing, frontend improvements integrated. |

---

## Connections

### Validates
- **[Development Practices Constitution]**: Merge-on-branch strategy aligns with "test before main" principle.
- **[Folder Structure Constitution]**: BulkImportTab location (BulkImport/) and test placement (src/tests/) follow established patterns.

### Contradicts
- **Pre-session assumption**: "Feature merges are low-risk if merge-tree shows zero conflicts." Reality: 9 conflicts found in trial merge. Trial merge is mandatory.

### Questions
- **[QUESTION]**: Does minor-fixes-fe have any migrations on aquisicao beyond 0042_current_phase? Not fully audited; could affect future rebases.
- **[QUESTION]**: Is useRemessaUpload.js truly dead, or used in dead branches? Full codebase scan needed.

### Promoted Candidates
1. **merge-strategy-premise**: "Feature branches are merged onto intermediate merge/* branches, tested on CI, then fast-forwarded to main. Direct merges to main are forbidden." — Candidate for premise to enforce this pattern.
2. **backend-acceptance-criteria-premise**: "Feature branch backend changes are accepted only if additive (new fields, new views, new auth rules). Business logic modifications require architectural review." — Candidate for premise to gate future branch merges.

---

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Verify minor-fixes-fe aquisicao migration completeness | Session discovery | MEDIUM | Open — affects future rebases. |
| Clean up Contratos.jsx (dead code) | Session 1630 insight | LOW | Deferred — orphaned by route restructure, not merge-critical. |
| Scan codebase for useRemessaUpload.js usage | Session 1630 insight | LOW | Deferred — flagged dead but not confirmed via full scan. |
| Fix Dockerfile entrypoint references | Session review blocker | LOW | Deferred — low-risk (not in prod), scheduled after merge stabilizes. |
| Lote performance fixes (Phase 6 concepts) | Session scratchpad | MEDIUM | Deferred — separate branch post-merge stabilization. |

---

## Open Questions

1. **Migration completeness**: Is minor-fixes-fe confirmed to have no other aquisicao migrations beyond 0042_current_phase? Impacts rebase strategy.
2. **Dead code scope**: useRemessaUpload.js and Contratos.jsx flagged but not fully audited. Should they be cleaned in a follow-up sprint?
3. **Rollback plan**: Is pre-merge SHA (65fe3f5 parent) documented for emergency rollback? Not captured in this session.

---

## Session Notes

This session established reusable patterns for complex feature-branch integration:
- **Trial merge is mandatory**: Theoretical analysis insufficient; practical git operations required.
- **Conflict resolution precedence**: Main's proven flow wins over feature branch code when semantic conflicts exist.
- **Backend acceptance gating**: Only additive changes; business logic mods require review.

The merge succeeded at commit 65fe3f5 with all tests passing. The two reusable patterns (merge-strategy, backend-acceptance-criteria) are candidates for elevation to premises or constitutions to enforce on future feature branches.
