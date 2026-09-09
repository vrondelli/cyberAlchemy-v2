# Invoke Refresh — Candidate Posture Apply

- Evidence date: `2026-07-20`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Handoff status: `ready`
- Target: `cyberAlchemy-v2/development/interactive-ontology-learning-map/`
- Approved posture: `code-first-candidate-later-authority-rebind`

## Approval

The operator selected option 1 for `DEC-CAV2-IOLM-POSTURE-001` on 2026-07-20.
The selection authorizes the scoped plan refresh proposed in the
[2026-07-15 package](../2026-07-15-minted-runtime-route/REFRESH-PATCH-PROPOSAL.md).
It does not authorize prototype implementation outside Task Session.

## Applied deltas

- Closed the posture decision in the owning CyberAlchemy Craft ledger.
- Added explicit `candidate` and `authoritative` postures to one normalized graph boundary and one UI/read-model pipeline.
- Activated L0C candidate planning and retained L0A for later owner-issued FPR `Sg` rebind.
- Added `TASK-IOLM-00C` and W0C with three sequential SWUs.
- Selected only `SWU-IOLM-00C-A`, bounded to candidate contract/provenance schemas and reject fixtures.
- Narrowed `G-DSV2-SG` to authoritative labeling/rebind; its owner and closure contract are unchanged.
- Refreshed the main Dispatch and Distill artifacts for the new route.
- Updated Craft machine and human projections from the canonical ledger.

## Boundaries preserved

- No prototype source, generated graph, UI, API, test, or run receipt was created.
- No DomainSpec FPR state, source definition, ontology relation, admission state, or release claim changed.
- Candidate evidence cannot satisfy `G-DSV2-SG`.
- No production website, publication, account, collaboration, or editorial lifecycle was selected.
- No private material was written under public `arcanum/`.

## Validation

Validation completed on 2026-07-20:

- YAML/JSON parse: `PASS`.
- Main IOLM Dispatch Spec: `PASS`.
- Apply-refresh Dispatch Spec: `PASS`.
- Distill validate: `PASS`; `SWU-IOLM-00C-A` owns one independently reviewable contract/provenance behavior and recomposes into W0C.
- Craft coverage: `PASS`; 115 indexed rows, exact family/selectors/open-decision/path projections, and fresh ledger hash.
- Changed/new local Markdown links: `PASS`.
- Pre-existing untouched link drift: `FLAG` — `CONTEXT.md` and `GLOSSARY-CONSISTENCY.md` each reference `../../ontology/CANONICAL-KINDS.md`, which does not resolve from their current location. This refresh did not silently widen scope to repair them.
- Prototype and public/private boundary: `PASS`; no prototype or public Arcanum file changed.
- Diff hygiene: `PASS` via `git diff --check`.

## Next route

Context Builder may prepare `SWU-IOLM-00C-A` for one Task Session. Stop after that unit's receipt; 00C-B and 00C-C remain unselected.

## Remaining target-lifecycle blocker

`G-DSV2-SG` remains open for L0A authoritative labeling/rebind. It does not block the selected L0C candidate unit and cannot be closed by candidate conformance, parity, or UI evidence.

Two pre-existing broken relative links remain in untouched IOLM context/glossary artifacts. They do not block the selected contract/provenance SWU, but should be repaired through a separately scoped documentation update.
