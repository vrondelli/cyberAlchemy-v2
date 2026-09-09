---
tags: [pending-overview, aquisicao, spec-002, f-004, roadmap]
node_type: discovery
is_session: true
layer: [application, domain]
nature: [procedural, reference]
status: active
created: 2026-04-10
timestamp: 2026-04-10T23:00:00-03:00
expires: 2026-06-09
conversation_id: f3k9w
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Corrected F-004 placement from spec-003 to spec-002 and catalogued 5 concrete bugs with their fix commits — prevents future misnavigation and provides a fix roadmap."
---

# F-004 Discovery Placement & Roadmap Review

## Summary

This session reviewed recent intellectual and applied work, built a full roadmap from git history and scratchpad files, and focused on correctly placing the F-004 ("Pending Documents Overview") discovery document. The key decision was that F-004 belongs to spec-002 (CCB Validation Workflow), not spec-003 — the discovery was moved to `specs/002-ccb-validation-workflow/docs/pending-overview/`. Five concrete bugs on main were catalogued (DI container not wired, use case is a function not a class, N+1 query, incomplete status filter, frontend reads wrong fields), all with fixes already on `origin/minor-fixes-fe`.

## Files touched

- `specs/002-ccb-validation-workflow/docs/pending-overview/discovery-pending-overview.md`
- `specs/002-ccb-validation-workflow/README.md`
- `specs/003-remessa-upload-with-events/README.md`
