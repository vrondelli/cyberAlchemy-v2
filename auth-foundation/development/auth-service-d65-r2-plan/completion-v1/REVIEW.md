# Auth completion review

The local Auth Service and socket-free Authorization API candidate passed its
complete 48-check service/API evidence join.

Candidate digest: `2e88296bf35469206e28be09f72235bf4fd2a9f947d80319e580a3f22daa9868`.

## Changes

- Added direct service regression coverage for transaction failure and write
  rejection, corrupt or expired evidence, missing revisions, duplicate scope
  evidence, and one decision-clock read per request.
- Added an API regression proving caller-owned authority fields are rejected
  before engine dispatch. The private service test hook now exposes the active
  transaction to fault-injection tests.
- Fixed the completion runner to read currentness from the independently
  verified embedded receipt and check the final verifier's digest, verdict,
  aggregate state, and complete stage list. Regression tests cover the reader.
- Selected a [compiler snapshot](compiler-snapshot/PROVENANCE.json) after
  concurrent DomainSpec edits invalidated live-input runs. Original compiler
  work remains separate. Graphs, ontology projections, and generated Rust were
  replayed against this snapshot.

## Current evidence

| Check | Result |
| --- | --- |
| Rust tests | 64 passed |
| Evidence-contract tests | 9 passed |
| Service/API completion obligations | 48 passed |
| Behavioral mutations | All 6 killed for the declared cause |
| Executable EVF | Passed; 13 stages independently verified |
| Lean EVF | Passed; 13 stages independently verified |
| Hostile-provider and profile controls | All 12 rejected their faults |

The executable EVF includes the six real behavioral mutations and a stale-input
control; the Lean route includes three proof checks and a wrong-domain mutation.
Negative profiles and their results are preserved under `evf/hostile/`.

Start with [PRODUCT-TEST-RESULT.json](PRODUCT-TEST-RESULT.json), which links the
exact [candidate](candidates/2e88296bf35469206e28be09f72235bf4fd2a9f947d80319e580a3f22daa9868/PRODUCT-CANDIDATE.json),
local validation, mutation observations, and both independent verifier results.
[README.md](README.md) gives the local reproduction command and tool setup.
[CONSTRUCTION-SELECTION-004.json](CONSTRUCTION-SELECTION-004.json) identifies
this successor selection. Earlier failed runs and selections are historical.

The formal claims cover the Auth policy and finite compiled Rust structural
correspondence. They do not establish universal compiler or runtime correctness.
The product boundary excludes credential verification, token issuance, a network
listener, deployment, and production load qualification.

## Open Questions

- Does the Auth product owner approve, reject, or defer this exact candidate?
  [PLAN-DAG.md H0](../PLAN-DAG.md) owns this decision. Evidence establishes review
  eligibility; no human approval has been recorded.
- Any future listener activation, client identity/TLS, migration provisioning,
  publication, or deployment requires its own operational scope and owner.
