# Runtime Context Pack — FormalClaim FOL Profile Extension

Status: strict coverage pass
Mode: standard, strict, runtime handoff
Candidate: `dsv2-formalclaim-fol-profile-extension@1`
Run: `20260824T123950Z-formalclaim-fol-profile-extension`
Authority: private run-local Define and Design evidence only

## Objective

Define and design a successor addition to the existing DomainSpec-v2
`formal-claims-specification` branch. The addition lets a `FormalClaim` state
standard many-sorted first-order logic with equality while keeping executable
test derivation, solver admission, solver execution, proof, and lifecycle
decisions separately owned.

## Fixed Boundary

- The selected architecture remains one connected logical ontology with
  separately owned `business-meaning`, `formal-claims-specification`,
  `proof-bridge`, and `system-evidence` branches.
- Frozen package `dsv2-spec-ontology-contract-hardening@4` is predecessor
  context only. This run neither calls itself @5 nor edits, supersedes, or
  reuses @4 acceptance.
- Rondelli's OAR-03 response accepts only the exact @4 formal-claim owner slice
  and remains verification-pending. It is not acceptance of this successor.
- This run creates no Plan, Work Pack, SWU, implementation, migration, owner
  response, verifier receipt, execution, promotion, publication, release, or
  deployment effect.

## Obligation Matrix

| ID | Obligation | Evidence selectors | Resolution |
| --- | --- | --- | --- |
| O01 | Preserve the selected one-graph, owned-branch architecture. | Craft `CTX-DSV2-SPEC-ONTOLOGY`; candidate contracts `logical_model`, `branches` | covered |
| O02 | Put expressive FOL meaning under `formal-claims-owner`. | candidate contracts `owner_roles`, `FormalClaim`; OAR-03 `decision_scope` | covered, successor admission still pending |
| O03 | Separate authored meaning from derived capability/profile assessment. | candidate contracts branch non-collapse; dispatch boundary `b-semantic-execution-split` | covered by two-contract design |
| O04 | Keep TDE deterministic and preserve `needs_formal`. | TDE `CTX-TDE-SMTFOL`, `DEF-TDE-NEEDS-FORMAL-001`; SMT/FOL distilled `needs_formal rule` | covered |
| O05 | Keep EVF evidence and SMT provider execution separate and fail closed. | EVF strategy result; QF profile; runtime admission; distilled bridge decisions | covered |
| O06 | Define exact FOL expressiveness and exclusions. | DS-SFOL `#bounded-fol`; distilled decidability map; FOL complement `Row 2` | covered with explicit source-versus-execution split |
| O07 | Explain representative in-profile and out-of-profile examples. | user/role briefing; QF profile scope; FOL complement acyclicity witness | resolved by four named examples |
| O08 | Preserve owner, authority, claim, and lifecycle ceilings. | @4 package manifest; OAR-03; dispatch guardrails | covered |
| O09 | Produce closed six-view Design selection evidence. | Invoke Design contract and role briefing done criteria | covered procedurally by installed extractor and validator |
| O10 | Preserve exact source bytes and write only run-local outputs. | dispatch helper write boundary; role briefing write policy | covered; verified at closeout |

Coverage: 10/10 obligations covered or explicitly resolved. No contradiction
remains that requires a user question.

## Selected Evidence

1. `DISPATCH.json` — objective, sequence, gates, write boundary, and claim ceiling.
2. `ROLE-BRIEFING.json` — exact source list, design precision, done criteria, and receipt shape.
3. `projects/domainspec-v2/.craft/ledger.yml` — `CTX-DSV2-SPEC-ONTOLOGY`, architecture decision, and active verifier-admission blocker.
4. Frozen @4 `owner-admission/PACKAGE-MANIFEST.json` — package identity, verification-pending state, invalidation rule, and claim ceiling.
5. Frozen @4 `OAR-03.owner-response.json` — exact formal-claims owner scope and verification-pending limitation.
6. Prior `design/CANDIDATE-CONTRACTS.json` — branch ownership, `FormalClaim`, `formalizes`, `ProofObligation`, and `derived_from` contracts.
7. `research/smt-fol-test-derivation/DISTILLED-KNOWLEDGE.md` — decidability fence, mandatory `needs_formal`, and unknown/timeout boundary.
8. TDE `.craft/ledger.yml` — TDE owns decidability classification; operational solver integration belongs to EVF.
9. EVF `smt-runtime-admission.v1.json` — pinned Z3 runtime admission is candidate-local and has no query-result or release effect.
10. EVF `smt-qf-profile.v1.json` — current solver profile is QF_LIA and excludes quantifiers, functions, collections, and full FOL.
11. DS-SFOL `ARCHITECTURE-AND-DESIGN.html#bounded-fol` — existing executable profile is deliberately finite and not full FOL.
12. Inventory spec-ontology synthesis — one authored source set and one normalized graph, with no duplicate truth or admission effect.
13. Inventory EVF synthesis — structural, FOL, bounded-model, and proof lanes remain distinct.
14. Inventory FOL complement synthesis — cross-rule FOL value and the separate transitive-closure limitation.

## Architecture Guidance

Treat the addition as one coherent design unit with two separately owned
contracts:

1. `FormalClaimSourcePayload/v1` records authored meaning. It may use variables,
   constants, total function symbols, predicates, equality, Boolean connectives,
   and arbitrarily nested first-order `forall` and `exists`, with exact theory,
   domain, equality, and unique-name assumptions.
2. `FormalClaimCapabilityAssessment/v1` records an immutable downstream
   classification and optional executable projection. It never becomes claim
   meaning and cannot make a wider statement than the source.

## Constraints And Non-goals

- No higher-order quantification, temporal operators, fixed points, or native
  transitive closure in the source FOL profile.
- No general validity/satisfiability termination, completeness, solver support,
  proof, discharge, or production-correctness promise.
- TDE consumes only a declared executable projection; it never infers one from
  an expressive source formula.
- EVF routes optional evidence. The SMT provider executes a pinned admitted
  profile. `unsupported`, `unknown`, `timeout`, incomplete, stale, or wider-than-source
  results never pass.
- Derived decidability or provider evidence is not part of authored claim meaning.

## Write Scope And Validation Surface

Writes are limited to this run's `context/`, `define/`, `design/`, `validation/`,
`RESULT.md`, and `HELPER-RECEIPT.json`. Validation must include Inventory lookup
readiness, JSON/schema checks, source hashes, source preservation, exact
allowlist, regular-file/no-symlink checks, Markdown trailing whitespace,
Design scope extraction, two immutable selection executions, fixed-point
equality, planned-witness ceilings, and authority-claim checks.

## Gaps And Next Owner

- Successor owner and verifier admission remains absent.
- No future Plan evidence exists; every planned witness is unimplemented and
  unexecuted.
- The next route after parent review is a separately authorized exact-byte
  successor owner/verifier admission decision, not implementation.

## Fallback Exploration Rule

Search only a listed source directory when a declared obligation becomes
uncovered. Record the extra source and reason before using it. No fallback was
needed in this run.

## Context Pack Summary

- Files selected: 14
- Snippets selected: 24 selector summaries
- Obligation coverage: 100 percent
- Handoff pack: runtime
- Strict coverage: pass
- Blockers: 0 for Define/Design authoring; successor admission remains a later domain gate
