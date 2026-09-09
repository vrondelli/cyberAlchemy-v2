# Invoke Refresh: OEW whole-package alignment

- Mode: `refresh`
- Activation: direct user, `apply-approved`
- Phase: **PASS**
- Applied target algebra: **13/13**
- Handoff: gated by the DOM compatibility Decision Gate
- Material package digest:
  `47b3f8482f974fd232cdc83b9331f269cda545606699a9908bb8a57c66f24ebb`

## Aligned state

- OEWFR SWUs 001–007 are now projected as `complete-candidate-local`, with no
  selected recovery SWU and explicit deferred governed reconciliation.
- The parent remains on selected SWU-OEWSN-006 at terminal
  `BLK-OEWSN-006-TYPED-TESTS-FAILED`; SWU007 remains unselected.
- The SWU006 fetch authorization is consistently `consumed-block`, one attempt
  used, with retry unauthorized.
- The parent manifest, admission contract and shared indexes now include the
  failure-only evidence output and current builder/test postimages.
- Historical SWU022/SWU006 receipts, binding006, patch0004 and the already
  aligned closeout inventory remain immutable.

## Validation

- Material-package validator and Refresh handoff: PASS.
- Staged/live parity: 13/13.
- Builder contracts: 25/25.
- JSON, all ten Markdown link surfaces and scoped whitespace: PASS.
- Protected closeout, binding006, patch0004, terminal receipt, builder and test
  identities: 6/6 unchanged.

## Decision route

Read-only feasibility evidence is in
[COMPATIBILITY-FEASIBILITY.md](COMPATIBILITY-FEASIBILITY.md). Decision Gate
prefiltered four structurally admissible choices and is waiting for the owner:

- `A-TEST-SIDE` — bounded Node fixture; keep Chromium as real DOM proof.
- `B-CONFIG-SIDE` — isolated pinned DOM environment plus separate dependency,
  lockfile and fetch gates.
- `C-DEFER` — keep SWU006 blocked.
- `D-STOP` — stop this branch.

The pending record is
[DOM-COMPATIBILITY-REPAIR.md](../../decisions/DOM-COMPATIBILITY-REPAIR.md).
No selection itself authorizes a binding rewrite, dependency fetch, retry,
build or browser run.

## Claim ceiling

This refresh aligns private planning projections to the candidate-local
recovery evidence. It does not prove DOM compatibility, SWU006 completion,
browser acceptance, release, deployment, production readiness or public
maintenance.

