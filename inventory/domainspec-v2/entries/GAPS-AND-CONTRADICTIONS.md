---
document_id: domainspec-v2-inventory-gaps/v1
status: open
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# Gaps and Contradictions

## Current contradictions

1. `cyberAlchemy-v2/SOURCE-MAP.md` describes DomainSpec v2 as pre-implementation research precedent, while
   `projects/domainspec-v2/README.md`, `PRODUCT-THESIS.md`, `RUNTIME.json`, and `impl/` describe and implement
   a current private product, CLI, generators, conformance checks, and three language profiles.
2. `cyberAlchemy-v2/development/domainspec-v2/README.md` calls the current source “separate early-v2 material,”
   which no longer matches the implemented baseline.
3. CyberAlchemy says consolidation is governance-based rather than copying, while the requested migration asks
   for DomainSpec to live inside CyberAlchemy. A selected adoption/extraction mode must reconcile these statements.
4. The active runtime baseline and many consumers bind the old repository path, so “move the folder” and
   “preserve existing canonical evidence” are not simultaneously true without a successor-baseline policy.

## Missing work

- One owner-selected repository-extraction mode.
- Canonical DomainSpec product, architecture, and ontology entry surfaces inside CyberAlchemy.
- An exact active-versus-historical migration map.
- A compatibility and deprecation contract for the old source path.
- A successor runtime baseline with rewritten path consumers and full validation.
- A decision on whether formalization belongs wholly to implementation or splits into specifications and proof tooling.

## Open Questions

All listed gaps are migration work. None licenses an inventory process to change canonical claims or source bytes.
