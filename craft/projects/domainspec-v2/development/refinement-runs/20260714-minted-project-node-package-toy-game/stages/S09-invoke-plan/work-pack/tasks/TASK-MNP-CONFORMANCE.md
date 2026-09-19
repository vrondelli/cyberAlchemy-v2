# TASK-MNP-CONFORMANCE — Repeatability, Profiles, and Degraded Modes

Layer: L2  
Status: `SWU-MNP-006` completed; receipt pass

## Purpose and Decision Owned

Establish that the selected contract repeats beyond Key and Door and fails closed across profile/relationship states and damaged artifacts. It does not admit a release or claim cross-feature completeness.

## SWU-MNP-006

- Goal: build and run the production conformance corpus.
- Dependencies: SWU-MNP-003, SWU-MNP-004, SWU-MNP-005.
- Write scope: `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/`, minted-project conformance tests within the derivation-engine package, and conformance receipts below the selected Task Session evidence folder.
- Algorithm:
  1. derive one minimal generic witness from the Key-and-Door obligations without copying or promoting the immutable Refine package;
  2. author a second independently named same-feature consumer fixture using different kinds/signatures within the approved profile;
  3. run positive compile/navigation/view/mint checks on both;
  4. carry the ten S06/S08 negative controls into the production harness;
  5. add node formation failures for each supported kind used;
  6. add relationship-state failures for generated, deprecated, deferred, unknown, wrong endpoint, and disallowed scope;
  7. damage source, graph, manifest, Markdown, registry/profile binding, and generated root independently;
  8. verify deterministic normalized results and stable failure classification;
  9. emit a digest-bound conformance receipt with no admission claim.
- Edge cases: false second corpus derived from first; fixture path leakage; nondeterministic ordering; ambiguous failure precedence; profile changes between runs; partial generation.
- Done criteria: two independent same-feature corpora pass; all negatives fail distinctly; no cross-feature assertion appears; receipt replay succeeds and input mutation invalidates it.
- Acceptance evidence: corpus independence note, result matrix, repeat digest, degraded-mode receipts, deliberate mutation invalidation.
- Verification: `npm --prefix projects/domainspec-v2/impl run engine:test`, `npm --prefix projects/domainspec-v2/impl run typecheck`, and the conformance receipt verifier created inside this SWU.
- Execution owner: local fallback with independent verifier recommended.
- Handoff: conformance receipt only to owner admission gate; route cross-feature pressure back to Refine.

## Completion Evidence

- Session: `task-sessions/20260715-swu-mnp-006/`.
- Two independent corpora; 10 inherited and 26 total degraded cases.
- Validation: targeted `3/3`; engine `100/100`; TypeScript, diff, receipt replay,
  and deliberate fixture/result invalidation pass.
- Conformance repeat digest: `ba0d6f15a2cbe9a6df50fb5b3fd8b9dc1e61ff94e42d82ee801216b3f877bae1`.
- Release admission: not granted.
