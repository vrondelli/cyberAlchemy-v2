# Invoke Refresh report: TDE @4 exact apply

## Outcome Brief

The exact 84-file `dsv2-tde-multiformalism-profile-epoch@4` planning candidate was created and live-validated. The lifecycle wording and unit-validation command now pass on canonical bytes, while implementation remains gated behind v2 closure, independent review, and exact owner acceptance.

- Objective: apply the frozen @4 planning candidate without crossing acceptance or execution boundaries.
- Result: 84 create-only files are byte-equal to staging; WPRA, Implementation Readiness, unit, lifecycle, Dispatch, and controller structural checks pass.
- Why it matters: the planning baseline is now live and exact, so the next lawful work is preacceptance evidence—not product implementation.

## Boundary and Next Decision

- Changed: exactly 84 canonical planning files under `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4/**` plus run-local apply evidence under `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T234828Z-tde-r4-lifecycle-command-repair-apply/**`.
- Unchanged: stopped @3, accepted @2, proposal bytes, material bytes after handoff, product code, authority, owner acceptance, selection, chain approval, Task Session, Victor decision, Git, Craft, telemetry, publication, release, and deployment.
- Open questions: none inside the approved apply scope; v2 consumer closure, independent review, and reflection adoption remain intentionally unperformed.
- User decision: none for apply closeout.
- Next action: run v2 preacceptance closure and independent review before generating a renewed exact Rondelli acceptance request.

## Technical Details

- Phase status: `pass`
- Handoff status: `ready`
- Mutation mode: `apply-approved`
- Applied changes: `84 create`, `0 update`, `0 delete`
- Material package digest: `fe48f463b428afec6c8126b33bd4de454b38f5fb362b36306c62a5cedfa9d1ad`
- Material receipt SHA-256: `ad2f9421ad241ffc56ed4b8d80609a688526e728b5bd0205a6185bcd03d1f170`
- Candidate manifest SHA-256: `655e56a9e6798695652789a4147e9ecf57539eeae637bb524c4937f5225dc078`
- Inventory digest: `e450921cbe2072c9142b992289db3e49564040cda54bc9727fba6a85a89ef565`
- Proposal material digest: `e53224d9cade91854acfb9fa4435c38c59b56d06aa3ec6e39098f422b512ca05`
- Canonical semantic digest: `61aea5107edca198f4dddd67e316af5e8c9a6fcb8c5cdb8f6826f3d5bea8122f`
- WPRA: `PLAN_SEMANTIC_READY`, runtime admission `pending-selection`, mutation ready `false`
- Implementation readiness: `PLAN_IMPLEMENTATION_READY`, proof-only, reusable `false`, mutation ready `false`
- Controller: expected `EPOCH_APPROVAL_INVALID`; `MANIFEST_SHAPE_INVALID` absent; no controller state or Task Session created
- Governance defects: both initial failed exits remain preserved; sidecar-authorized readiness and Dispatch corrections passed without changing candidate, material, proposal, canonical, or WPRA bytes
- Preacceptance: owner request not emitted; v2 closure/review/adoption are the next gate
- Distill: skipped because the exact frozen ten-unit decomposition was unchanged
- Authority effect: `none`
