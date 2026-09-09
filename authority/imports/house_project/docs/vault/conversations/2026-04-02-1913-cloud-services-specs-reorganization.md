---
tags: [architecture, infrastructure, vault, agents]
node_type: audit
is_session: true
layer: architecture
nature: procedural, reference
status: active
veracidade: high
convicção: high
created: 2026-04-02
timestamp: 2026-04-02T19:13:00-03:00
expires: 2026-06-01
conversation_id: r4k9
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/cloud_services/docs/architecture/cloud-infrastructure-discovery.md
  - specs/002-ccb-validation-workflow/ (multiple files reorganized)
  - specs/003-remessa-upload-with-events/ (multiple files reorganized)
  - specs/event_system/ (multiple files reorganized)
  - specs/refactor/ (multiple files reorganized)
  - Multiple README.md files across /specs/
promoted_candidates:
  - vertical-slice convention for /specs/ → should be formalized in folder-structure-constitution.md or spec-writing.md
expected_importance: 6
importance_rationale: "This session established and enforced the vertical-slice structural convention across all 9 spec folders, creating a durable navigational contract that all future agents will depend on — and produced the first ever spec-layer documentation of the production cloud stack."
---

# Cloud Services & Specs Reorganization

**Date:** 2026-04-02 19:13 (UTC-3)
**Tags:** #architecture #infrastructure #vault #agents

## Summary

This session reorganized the entire `/specs/` directory to apply a consistent structural pattern across all spec folders. Prior to this session, spec folders had inconsistent structures — some flat, some with ad-hoc subdirectories, none following a unified convention. The agreed pattern was: README + backlog at root, and a `docs/` folder with vertical slices for different concerns.

The session began by migrating all files from `refactors/infrastructure/` into `specs/cloud_services/`, the appropriate long-term home for infrastructure specs. A new artifact was created — `specs/cloud_services/docs/architecture/cloud-infrastructure-discovery.md` — documenting the full production stack (Cloud Run Service, VM MIG, Redis, GCS, Cloud Run Jobs). This was the first ever spec-layer document covering the production infrastructure.

Seven additional spec folders were reorganized following the same vertical-slice pattern: `002-ccb-validation-workflow/` into 7 slices (pipeline, ai-identification, kit-matching, critical-fields, cloud-vision, spec, data-model), `003-remessa-upload-with-events/` into 6 slices (pipeline, events, filter-system, complementary-table, user-management, cloud-run), `event_system/` into 3 slices (discovery, implementation, guides), `refactor/` into 4 slices (domains, dashboard, shared-services, fund-filters), and three smaller folders (`entity-identity/`, `004-convertors-migrations/`, `004-operations-control-center/`) each into 1 slice.

One outstanding item was flagged and left open: verification that the agent-written READMEs for `002-ccb-validation-workflow/` and `003-remessa-upload-with-events/` correctly follow the readme-pattern format. All other READMEs were corrected during the session. The vertical-slice convention is now applied uniformly across the entire `/specs/` tree, but it is not yet formally codified in any constitution or skill — it exists as demonstrated practice only.

## Epistemic Impact

- **validates** `readme-pattern.md`: The pattern was operationalized across the full `/specs/` tree; it proved applicable without exception.
- **questions** `folder-structure-constitution.md`: The vertical-slice pattern for `/specs/` exists in practice but may not be formally declared — if it isn't, this session surfaces the gap.
- **Spec drift fixed:** `specs/cloud_services/` was absent; infrastructure specs were mislocated in `refactors/infrastructure/`. Corrected by migration.
- **New ground:** `cloud-infrastructure-discovery.md` was created from scratch — the production stack had no spec-layer representation before.
- **promoted_candidates:** The vertical-slice convention (README + backlog at root, `docs/<slice>/` subdirectories) should be promoted to a formal rule in `folder-structure-constitution.md` or `spec-writing.md`.

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `specs/cloud_services/` (entire directory) | created | New canonical home for infrastructure specs, migrated from `refactors/infrastructure/`; vertical-slice structure applied |
| `specs/cloud_services/docs/architecture/cloud-infrastructure-discovery.md` | created | First spec-layer doc for the production stack (Cloud Run Service, VM MIG, Redis, GCS, Cloud Run Jobs) |
| `specs/002-ccb-validation-workflow/` (7+ files) | modified | Reorganized into 7 vertical slices |
| `specs/003-remessa-upload-with-events/` (6 files) | modified | Reorganized into 6 vertical slices |
| `specs/event_system/` | modified | Reorganized into 3 slices: discovery, implementation, guides |
| `specs/refactor/` | modified | Reorganized into 4 slices: domains, dashboard, shared-services, fund-filters |
| `specs/entity-identity/`, `specs/004-convertors-migrations/`, `specs/004-operations-control-center/` | modified | Each reorganized into 1 vertical slice |
| Multiple `README.md` files across `/specs/` | modified | Restructured to 4-section readme-pattern |

## Connections

- derives-from: `readme-pattern.md` (pattern applied)
- questions: `docs/vault/constitution/folder-structure-constitution.md` (vertical-slice convention not yet formally declared)

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| Verify `specs/002-ccb-validation-workflow/README.md` and `specs/003-remessa-upload-with-events/README.md` follow readme-pattern exactly | Scratchpad outstanding item | MEDIUM | Open |
| Promote vertical-slice convention from demonstrated pattern to formal rule in `folder-structure-constitution.md` or `spec-writing.md` | Epistemic gap — pattern exists but is not declared | MEDIUM | Open |

## Open Questions

- Does `folder-structure-constitution.md` already declare the vertical-slice pattern for `/specs/`? If not, this session is the precedent — it should be formalized.
