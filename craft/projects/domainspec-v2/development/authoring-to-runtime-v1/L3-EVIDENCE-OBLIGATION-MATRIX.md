# L3 evidence obligation matrix — E01 through E04

Date: 2026-09-20; current-byte review 2026-10-02. Status: E05 candidate
evidence. Authority effect: none.

## Purpose

E05 qualifies the bounded E01–E04 evidence chain by binding every inherited
done-criterion to a current behavioral oracle. The authoritative machine-readable
matrix is
`evidence/e05-cross-layer-evidence/obligation-matrix.json`; its closed contract is
`evidence-obligation-matrix.schema.json`.

The matrix contains 32 obligations: eight each from E01, E02, E03 and E04. Every
row names its source obligation, evidence class, participating layers, semantic
oracle, exact test selector, evidence kind, result and gap state. Test and source
files are SHA-256 bound. The matrix's E01-E04 completion documents preserve
the original obligation wording; they are not current implementation
qualifications. A separate E05 successor must bind the current E02-E04
qualification records and this matrix before claiming current cross-layer
evidence.

## Evidence-class accounting

| Required class | Behavioral oracle |
| --- | --- |
| Non-collapse | Provider choice changes request identity without changing FormalClaim identity; proposition meaning does change claim identity; causal vocabulary and runtime stages remain distinct. |
| Semantic | Only exact, current, semantically comparable `pass` evidence can satisfy an obligation. No request, projection, join or observation grows authority. |
| Orthogonality | All 16 subsets of four runtime stages retain exactly their selected observations; absent stages remain explicit and no stage is inferred. |
| Property/oracle | The 2-provider × 8-causal-outcome product preserves one claim identity, two request identities and all eight causal results. Existing two-route E03 tests retain the complete 16-cell EVF matrix. |
| Mutation | Stale provider bytes, widened projected meaning, incomparable pass evidence, swapped runtime stages, altered receipt identity, ORODI control and cleanup residue reject at their owning boundary. |
| Determinism | Repeated E01 verification, E02 projection, E03 EVF joining and E04 runtime joining produce byte-identical composite results. |
| Currentness | Semantically changed outputs at every layer reject exact-currentness validation; stale or missing inputs fail before a qualifying result. |

## Coverage result

- E01 obligations: 8/8 behaviorally bound.
- E02 obligations: 8/8 behaviorally bound.
- E03 obligations: 8/8 behaviorally bound.
- E04 obligations: 8/8 behaviorally bound.
- Required evidence classes: 7/7 present.
- Representation-only substitutes: 0.
- Unexplained gaps: 0.
- Failed or skipped obligations: 0.

The matrix validator checks closed-schema conformance, exact source/test hashes,
source-obligation presence, exact test-selector presence, per-task counts, class
coverage and the prohibition on representation-only evidence. It also proves
that stale bindings, missing rows, representation-only substitutions and a
non-null gap cannot qualify.

## Validation boundary

The 2026-09-20 E05 qualification's 34-test combined run and 149-test
application regression are historical, not current-byte evidence. The current
matrix validator checks 32 inherited obligations and passes 2/2 after the
selected test hashes were refreshed; current cross-layer tests pass 7/7.
The post-TDE finalized-request and same-run stage-correlation additions are
checked by their E03/E04 scoped successor suites, not silently counted among
the original 32 obligations. A fresh broader application regression remains
outstanding.

## Claim ceiling

This matrix accounts for the original bounded E01–E04 obligation set against
current selected tests. Its currentness is bounded by those exact test and
source-obligation bytes; current implementation qualification also requires
the E02-E04 successors. It does not provide product-owner validation, prove production behavior, admit a
release, publish, deploy, operate production or grant authority. Product-owner
testing remains deferred until L4X.

## Open Questions

L3X owns bounded evidence closure after E05. P02 owns installed-package and
clean-consumer hostile evidence. L4X owns the deferred product-owner validation
boundary.
