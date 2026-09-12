# Auth Foundation transfer assessment

Status: selected L3 replacement; awaiting separately routed fresh replay.
Authority effect: planning selection only.

## Recommendation

The product owner selected replacement of the unavailable financial-settlement
target in nodes K-L-M with the
digest-bound Auth Foundation authorization candidate, while retaining the
financial work as deferred evidence. This removes the factual causes of B-003
and B-005: Auth Foundation has an attributable product-owner approval and an
accessible Rust implementation. The selection opens plan node K but is not
sibling implementation authority and does not authorize changes in
`../domainspec-core`.

## Property

The bounded product property is exact, fail-closed authorization. The service
returns `ALLOW` only when the request and trusted inputs are admissible, the
session and authentication evidence are current, the resolved role set is
complete and active, and an exact role grant matches the required permission
and trusted scope. Every other evaluated condition returns `DENY`.

The implementation boundary is one in-process SQLite-backed Auth Service and
its socket-free Authorization API. It excludes credential verification, token
issuance, listener activation, TLS/client identity, production-load fitness,
publication and deployment.

## Existing evidence

The sibling completion package binds candidate
`2e88296bf35469206e28be09f72235bf4fd2a9f947d80319e580a3f22daa9868`
to eight implementation stages from generated policy runtime through API. Its
recorded evidence reports:

- 64 Rust tests and 9 evidence-contract tests passing;
- all 48 service/API obligations passing;
- six cause-specific behavioral mutants killed, each with two neutral runs;
- executable and Lean EVF routes passing all 13 stages;
- twelve hostile profile/provider controls rejecting their injected faults;
- an explicit product-owner approval of the exact tested candidate, with no
  operational authority.

The behavioral mutants exercise split database snapshots, caller-controlled
authority fields, relaxed evidence currentness, missing authorization revision,
duplicate scope evidence and premature transaction end. The hostile controls
exercise stale inputs, denominator drift, empty observations, unordered
lineage, malformed or crashed providers, caller-supplied pass results and a
surviving mutant.

## Fit to the repair-assurance objective

| Objective step | Auth Foundation evidence | Assessment |
| --- | --- | --- |
| Define a property | Exact authorization policy, semantic sources, three Lean obligations and 48 product checks | Strong |
| Find a counterexample | Six cause-specific implementation mutants and twelve hostile evidence controls | Strong for calibrated counterexamples |
| Explain the defect | Each mutant names its target, expected cause, oracle test and failure marker | Strong for injected defects |
| Construct a repair | The completed implementation kills every mutant; the completion runner also records a concrete verification-reader repair | Partial as a historical repair case because pre-repair product bytes are not preserved as a first-class candidate |
| Verify within bounds | Digest-bound candidate, tests, mutations, two EVF routes, independent verifier receipts and explicit exclusions | Strong at recording time; fresh replay requires re-freezing current host tools |

Auth Foundation can therefore serve as the L3 transfer and calibration target.
It cannot by itself support the stronger claim that the workflow discovered and
repaired an unseeded customer defect. That claim needs a preserved failing real
candidate, a separately authorized repair, and a passing repaired candidate.

## Currentness and provenance

The completion directory and three bound implementation changes are currently
untracked or modified in the sibling checkout. The package is internally
digest-bound, and its implementation hashes match the current files inspected,
but Git does not provide a committed provenance boundary for it. The approval
still points to the current test-result and review bytes.

Two bound host tools have drifted since the recorded run: `/usr/bin/python3.14`
and `/usr/bin/unshare`. A fresh replay must freeze their current identities or
select replacements and produce a new candidate/evidence epoch. Historical
`passed` receipts must not be presented as current replay results.

## Proposed DAG substitution

1. K-AUTH: record the owner decision to use Auth Foundation as the L3 target
   and freeze the exact property, candidate lineage, exclusions and claim
   ceiling.
2. L-AUTH: in a separately routed sibling implementation scope, freeze current
   sources and tools; replay the 48 obligations, six behavioral mutants,
   twelve hostile controls and both EVF routes; preserve any actual failure as
   a counterexample before repair.
3. M-AUTH: assign a fresh independent technical reviewer to reproduce the
   frozen result and measure reusable-core versus Auth-specific adapter effort.
4. Continue to N only if author and reviewer agree and the evidence explicitly
   distinguishes seeded mutant detection from any real defect repair.

## Open Questions

- Should the first fresh Auth run evaluate the existing approved candidate as
  a replay, or deliberately begin from a preserved pre-repair candidate if one
  can be recovered without synthesizing history?

## Selection provenance

On 2026-09-12 the product owner answered `yes select it` to the explicit choice
of Auth Foundation as the replacement L3 target. This is a planning selection;
it grants no admission, sibling mutation, execution, publication or deployment
authority.
