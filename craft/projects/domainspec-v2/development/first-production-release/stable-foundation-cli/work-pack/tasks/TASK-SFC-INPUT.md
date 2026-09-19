# TASK-SFC-INPUT — Project-root and P2/C2 binding

Layer/slice/wave: L0 / SFC-S1 / W0.

## Objective

Resolve one explicit project root into an ordered source manifest and bind it to
external P2 profile and C2 causal-evidence owners without self-attestation.

## Source contracts

- `SPEC.md#source-and-profile-contract`, `#causal-conformance-boundary`.
- `DESIGN.md#view-3--low-level-components`, `#authority-and-trust-extension`.
- FPR-02 decisions 2, 3, 7, 8, 9, 10, and 16.
- current resolver/compiler are read-only precedent, not acceptance evidence.

## Algorithm

Normalize the supplied path without fallback; require an existing directory and
`project.json`; resolve real paths; enforce containment; read declared feature
manifests; enumerate feature-local nodes/same-feature edges and project-level
cross-feature edges; reject duplicates/wrong-root/escape; sort by normalized
relative path and stable ID; hash each source and the canonical ordered manifest.
Then verify an externally owned profile receipt and expected/executed causal set
binding before reporting profile/conformance status.

## SWU-SFC-003 — explicit project-root source resolver

- Primary behavior: produce one deterministic contained source manifest only from
  an explicit project root.
- Independent acceptance: byte-identical arbitrary roots yield one normalized
  digest; name/feature/cwd/sibling/symlink/escape/duplicate/wrong-root mutants fail 22.
- Split analysis: containment, topology enumeration, ordering, digest, fixtures,
  and tests are inseparable for one trustworthy source-manifest behavior. Profile
  semantics remain independently testable in 004.
- Dependencies: SWU-SFC-002.
- Write scope:
  - `projects/domainspec-v2/impl/cli/src/input/project-root.ts`
  - `projects/domainspec-v2/impl/cli/src/input/source-manifest.ts`
  - `projects/domainspec-v2/impl/cli/contracts/source-manifest.schema.json`
  - `projects/domainspec-v2/impl/cli/fixtures/input-roots`
  - `projects/domainspec-v2/impl/cli/test/input/project-root.test.ts`
- Done: closed source manifest, stable errors/pointers, topology negatives, no
  project writes, and no fallback branch.
- Validation: `VC-SFC-003`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-003/TASK-SESSION-RESULT.json`.

## SWU-SFC-004 — owner-bound P2/C2 verifier

- Primary behavior: verify exact 13/16 P2 membership and independently owned C2
  expected/executed causal bindings for the resolved source set.
- Independent acceptance: exact approved fixture passes; missing/extra/stale,
  self-issued, mutated-source, causal-removal, and owner-digest mutants fail 20/4.
- Split analysis: P2 and C2 were considered separately, but neither can admit the
  CLI source denominator alone: C2 is defined over the exact P2 source set. The
  verifier preserves distinct receipt owners inside one admission decision.
- Dependencies: SWU-SFC-003 and a profile-owner input satisfying SFC-PR-001.
- Write scope:
  - `projects/domainspec-v2/impl/cli/src/input/profile-binding.ts`
  - `projects/domainspec-v2/impl/cli/src/input/causal-binding.ts`
  - `projects/domainspec-v2/impl/cli/contracts/profile-binding.schema.json`
  - `projects/domainspec-v2/impl/cli/contracts/causal-binding.schema.json`
  - `projects/domainspec-v2/impl/cli/fixtures/profile-bindings`
  - `projects/domainspec-v2/impl/cli/test/input/profile-causal-binding.test.ts`
- Done: exact external owner/digest resolution, no profile registry mutation,
  exact set comparison, causal invalidation mutants, authority none.
- Validation: `VC-SFC-004`.
- Execution owner: Task Session; block rather than invent missing owner receipt.
- Expected receipt: `runs/SWU-SFC-004/TASK-SESSION-RESULT.json`.

## Failure modes

Unknown version/member, unresolved immutable preimage, stale registry digest,
self-issued expected set, set mismatch, and ambiguous owner all fail closed.

