# G1 router exclusion scope

Status: bounded source-level repair, 2026-09-26. No host-task activation,
release approval, or deployment claim.

## Defect and repair

The request router previously concatenated `raw_request`, `target_refs`, and
`constraints` for lexical routing regardless of caller field posture. An
inferred constraint describing the read-only Companion UI therefore triggered
the candidate IMPLEMENT policy's broad `read only` exclusion and blocked an
explicit implementation objective. Conversely, an excluded explicit objective
could fall through to a lexical route suggested by another constraint.

The router now uses only the raw request and structured target/constraint fields
marked `explicit` for lexical signals and exclusions. The candidate decision
profile no longer treats `read only` as a procedural prohibition on
implementation; `do not implement` remains an exclusion. An explicitly
excluded objective blocks rather than falling through to an incidental route.
The source profile, compiled route policy bundle, wrapper source hash, and
compiled repository runtime bundle were synchronized.

## Verification

- Router, CLI, and runtime-bundle focused suites: 40 passed, 0 failed.
- Combined router package and CLI suite: 67 passed, 3 failed before the
  repository runtime bundle was synchronized; the three failures were
  `cli.context-profile-mismatch` and all passed on rerun after rebuilding.
- End-to-end `decide route` plus `decide context` for “Implement a read-only
  Companion Threads dashboard” with an inferred read-only constraint: both
  direct; selected `CA2-ROUTE-IMPLEMENT`.
- Current profile digest: `415ba3910cf862165208e7040a6d5b0ddcf947ad008911a4baa2d6cf0cfa5e03`.
- Current route policy bundle digest: `212e850822d0a310df377338db4ca9a26fb63584bbeea9a18ec8f00234cc337b`.

## Claim ceiling and open questions

This proves the tested local routing and context-preflight behavior only. It
does not make the current desktop task ARE-controlled, validate all host
ingress paths, or prove the full Companion UI. The active host handover and
UI validation questions remain with the integration work pack.
