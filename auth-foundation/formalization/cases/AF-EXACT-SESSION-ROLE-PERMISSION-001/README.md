# Exact session-role permission case

Status: **L0 meaning accepted — definition-bound FormalClaim draft**

This Auth Foundation-owned case asks one question:

> When may a server-recognized session authorize one exact permission?

The candidate answer is ALLOW exactly when the session and request are
admissible and at least one role active in the session grants a permission
whose resource, action, and scope exactly match the required permission. Every
other case is DENY.

Canonical artifacts are JSON. This Markdown file is only a human guide.

- [`BUSINESS-MEANING.accepted.json`](BUSINESS-MEANING.accepted.json) records the rule, examples,
  counterexamples, exclusions, and acceptance state.
- [`BUSINESS-MEANING.v2-definitions-candidate.json`](BUSINESS-MEANING.v2-definitions-candidate.json)
  copies those accepted business facts unchanged and attaches definitions for
  every critical object, relation, predicate, and decision value. Each
  definition points to the exact business facts and accepted interpretation
  entries it explains. Its formal voice is normative only inside this draft;
  its plain-language and Auth Foundation voices are explanatory.
- [`BUSINESS-MEANING.v2-definitions-accepted.json`](BUSINESS-MEANING.v2-definitions-accepted.json)
  is the lifecycle-only accepted postimage of that exact candidate. Its formal
  definition voices are now normative for this bounded business rule.
- [`INTERPRETATION-MODEL.accepted.json`](INTERPRETATION-MODEL.accepted.json) is
  the v1-bound accepted predecessor.
- [`INTERPRETATION-MODEL.v3-definitions-aligned-accepted.json`](INTERPRETATION-MODEL.v3-definitions-aligned-accepted.json)
  is the separately accepted predecessor interpretation aligned to v2 meaning.
  It defines types, predicates, equality, time, currentness, assumptions, and
  vacuity checks, but it is not a FormalClaim field.
- [`INTERPRETATION-MODEL.v4-evaluation-context-separated-candidate.json`](INTERPRETATION-MODEL.v4-evaluation-context-separated-candidate.json)
  corrects one lifecycle sentence: changing an InterpretationModel changes the
  EvaluationContext identity that selects it, never FormalClaim identity. It
  is a candidate and still needs owner review and acceptance.
- `BUSINESS-MEANING.json` and `INTERPRETATION-MODEL.json` preserve the exact
  reviewed preimages accepted by the immutable owner decision.
- [`IDENTITY-ALGORITHM.v2.json`](IDENTITY-ALGORITHM.v2.json) and
  [`CLAIM-IDENTITY-INPUTS.v2-definitions-bound.json`](CLAIM-IDENTITY-INPUTS.v2-definitions-bound.json)
  make the current claim identity reproducible without using an
  InterpretationModel as an identity input. The unversioned files preserve the
  predecessor algorithm and inputs.
- [`FORMAL-CLAIM-DEFINITION-BINDING.v1-candidate.json`](FORMAL-CLAIM-DEFINITION-BINDING.v1-candidate.json)
  declares 20 explicit `uses_definition` edges, exact definition pointers and
  digests, and the transitive definition closure. It contains no definition
  bodies and forbids name inference.
- [`FORMAL-CLAIM.v4-definitions-bound-candidate.json`](FORMAL-CLAIM.v4-definitions-bound-candidate.json)
  is the current draft. It binds accepted meaning, the definition graph, the
  FOL signature, and the proposition. It has no InterpretationModel field.
- [`FORMAL-CLAIM-CONSUMER-ENVELOPE.v1-derived.json`](FORMAL-CLAIM-CONSUMER-ENVELOPE.v1-derived.json)
  is the deterministic definition-complete consumer view. Its copied
  definitions are derived and non-authoritative; copied external references
  remain opaque traceability metadata and do not expand claim meaning.
- [`FORMAL-CLAIM.v3-candidate.json`](FORMAL-CLAIM.v3-candidate.json) is the
  non-adopted successor-shaped claim candidate still bound to superseded v1
  meaning. It is stale for v2 and must not be admitted.
- The current TDE v2 projection is intentionally absent. Its contract requires
  a separately admitted FormalClaim source; semantic acceptance alone does not
  authorize that projection.
- [`CASE-PACKAGE.json`](CASE-PACKAGE.json) records L0 state and residue.
- [`AUTHORING-TRACE.json`](AUTHORING-TRACE.json) records the bounded Invoke
  authoring route without claiming an admitted Invoke Define bundle.

The proposition uses `fol-core`. Its own formal signature closes the symbols
used by the proposition, but the profile has no provider execution route. No
obligations, proofs, tests, provider runs, or EVF joins are created here.

The v2 meaning supersedes v1. InterpretationModel v3 remains accepted
predecessor semantics, while its v4 lifecycle correction awaits owner
acceptance for later EvaluationContexts; neither is part of the v4 FormalClaim.
FormalClaim v3 remains predecessor evidence. The v4 draft and its definition
closure still require independent semantic review, followed by a separate
FormalClaim admission decision.

The role resolver and scope-evidence producer are assumptions at this layer.
Their runtime completeness must later become separate claims and evidence; this
policy claim must not be used to pretend those integrations are already safe.
