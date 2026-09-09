---
tags: [vault, ontology, infrastructure]
node_type: constitution
is_session: true
layer:[[ontology, architecture]]
nature: reference
status: active
created: 2026-03-25
timestamp: 2026-03-25T19:01:31-03:00
expires: 2026-05-24
conversation_id: readme-node-type-and-codebase-readmes
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Added `readme` as the 11th node_type to ontology-conventions, establishing a permanent navigational document class distinct from spec/conceptual, and created 7 vault-compliant README files across infrastructure, shared_services, and all four domains."
version: 0.1.0
last_updated: 2026-03-25
---

# README Node Type + Codebase READMEs

**Date:** 2026-03-25 19:01 (UTC-3)
**Tags:** #vault #ontology #infrastructure

## Summary

This session had two interleaved threads: a navigability audit of the codebase and the creation of README files to address documentation gaps. The session began with an assessment of how easy it is to navigate `/docs/vault`, `/domains/`, `/infrastructure/`, and `/shared_services/`. Based on that audit, 7 README files were created. During the labeling step, the existing `node_type` catalog was found to be insufficient — `spec` was initially used but was immediately challenged as incorrect. After reasoning through the ontology's challenge-response test, `readme` was proposed as a new permanent node_type and ratified. The conventions document was updated, all 7 READMEs were corrected, and the ontology now has 11 node_types.

The session is significant primarily because it extended the classification system rather than just the codebase. The README node_type fills a real gap: navigational documents that describe directory structure and purpose have a distinct lifecycle (decay with code structure changes, not conceptual shifts) and a distinct challenge response ("update it to reflect what's actually in the directory") that no prior type captured cleanly.

### Codebase Navigability Audit

- **Problem/Goal:** Understand how easy it is to navigate the repository — specifically `docs/vault`, `domains/`, `infrastructure/`, and `shared_services/`.
- **Decision:** The vault and domains were rated excellent; infrastructure and shared_services were rated good but lacked README entry points. `infrastructure/remessa/` was identified as the hardest area to parachute into cold.
- **Changes:** None — assessment only.

### README Creation

- **Problem/Goal:** Fill the documentation gaps identified in the audit.
- **Decision:** Create READMEs for `infrastructure/`, `infrastructure/remessa/`, `shared_services/`, and all four domain folders.
- **Changes:** 7 README files created with content describing structure, key concepts, core flows, and domain vocabulary where applicable.

### Frontmatter Labels — Wrong node_type Caught

- **Problem/Goal:** Apply correct vault frontmatter to the new README files.
- **Decision:** `node_type: spec` was initially applied, then challenged by the user as incorrect. After reasoning through the challenge-response test, `spec` was rejected (specs describe code *behavior*; READMEs orient you around *structure*).
- **Changes:** All 7 READMEs corrected from `node_type: spec` → `node_type: readme`.

### New `readme` node_type Ratified

- **Problem/Goal:** The ontology had no type for navigational/orientation documents.
- **Decision:** Add `readme` as a new permanent node_type. Challenge response: *"Update it to reflect what's actually in the directory."* Distinct from `spec` (behavior), `conceptual` (context/theory), and `constitution` (enforceable rules).
- **Changes:** `ontology-conventions.md` updated — frontmatter schema, challenge-response table, and node_type count (10 → 11).

Key outputs:
- `infrastructure/README.md` — directory overview and key concepts
- `infrastructure/remessa/README.md` — pipeline architecture and module table
- `shared_services/README.md` — DI container and filter registry orientation
- `domains/aquisicao/README.md` — domain flows and vocabulary
- `domains/documents_validation/README.md` — OCR/bulk import pipeline and kit matching
- `domains/estoque/README.md` — aggregation-only domain, Polars-based
- `domains/liquidacao/README.md` — relationship to aquisicao and estoque

## Key Decisions

- **readme is a valid node_type:** Navigational documents that describe directory structure have a distinct lifecycle and challenge response — they are not specs, not conceptual, and not constitutions.
- **ontology-conventions.md is the governance document:** Adding `readme` was treated as a constitutional change and made through a direct edit to the conventions, not informally.
- **All new .md files require frontmatter:** The convention applies regardless of whether the file lives in `docs/vault/` or in a code directory.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/README.md` | `created` | Directory overview: structure, key concepts, storage and event catalog orientation |
| `infrastructure/remessa/README.md` | `created` | Pipeline architecture, module table, and domain plugin points |
| `shared_services/README.md` | `created` | DI container, filter registry, shared views, storage facade |
| `domains/aquisicao/README.md` | `created` | Core flows, eligibility filters, kit management, domain vocabulary |
| `domains/documents_validation/README.md` | `created` | OCR/bulk import pipeline, document types, kit matching concept |
| `domains/estoque/README.md` | `created` | Aggregation domain, Polars-based computation, read-heavy nature |
| `domains/liquidacao/README.md` | `created` | Upload pipeline, approval flow, relationship to aquisicao and estoque |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/ontology-conventions.md` | `modified` | Added `readme` as 11th node_type: frontmatter schema, challenge-response table, count updated |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `infrastructure/` and `shared_services/` READMEs have no API/contract documentation at domain boundaries | navigability audit | LOW | open |
| `infrastructure/remessa/` is complex — README covers modules but not data flow diagrams | navigability audit | LOW | open |

## Open Questions

- Should the `readme` node_type be added to the Appendix B label catalog with full entry/exit criteria, or is the challenge-response table entry sufficient?
- Should existing vault navigation files (`agent-navigation.md`, `human-navigation.md`) be retroactively relabeled as `node_type: readme`?
