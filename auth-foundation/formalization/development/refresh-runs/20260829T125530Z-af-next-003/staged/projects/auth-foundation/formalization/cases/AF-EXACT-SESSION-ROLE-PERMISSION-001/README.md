# Exact session-role permission case

Status: **L0 claim source candidate — FormalClaim admission required**

This Auth Foundation-owned case asks one question:

> When may a server-recognized session authorize one exact permission?

The candidate answer is ALLOW exactly when the session and request are
admissible and at least one role active in the session grants a permission
whose resource, action, and scope exactly match the required permission. Every
other case is DENY.

Canonical artifacts are JSON. This Markdown file is only a human guide.

- [`BUSINESS-MEANING.accepted.json`](BUSINESS-MEANING.accepted.json) records the rule, examples,
  counterexamples, exclusions, and acceptance state.
- [`INTERPRETATION-MODEL.accepted.json`](INTERPRETATION-MODEL.accepted.json) defines the types,
  predicates, equality, time, currentness, assumptions, and vacuity checks.
- `BUSINESS-MEANING.json` and `INTERPRETATION-MODEL.json` preserve the exact
  reviewed preimages accepted by the immutable owner decision.
- [`IDENTITY-ALGORITHM.json`](IDENTITY-ALGORITHM.json) and
  [`CLAIM-IDENTITY-INPUTS.json`](CLAIM-IDENTITY-INPUTS.json) make claim identity
  reproducible.
- [`FORMAL-CLAIM.v3-candidate.json`](FORMAL-CLAIM.v3-candidate.json) is the
  non-adopted successor-shaped claim candidate bound to the accepted semantics.
- The current TDE v2 projection is intentionally absent. Its contract requires
  a separately admitted FormalClaim source; semantic acceptance alone does not
  authorize that projection.
- [`CASE-PACKAGE.json`](CASE-PACKAGE.json) records L0 state and residue.
- [`AUTHORING-TRACE.json`](AUTHORING-TRACE.json) records the bounded Invoke
  authoring route without claiming an admitted Invoke Define bundle.

The proposition uses `fol-core`. That profile precisely records the rule under
this interpretation but has no provider execution route. No obligations,
proofs, tests, provider runs, or EVF joins are created here.

The role resolver and scope-evidence producer are assumptions at this layer.
Their runtime completeness must later become separate claims and evidence; this
policy claim must not be used to pretend those integrations are already safe.
