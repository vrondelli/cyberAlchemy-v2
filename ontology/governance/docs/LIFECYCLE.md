# Governance Lifecycles

Status: perennial candidate. No authority or enforcement effect.
Owners: CyberAlchemy v2 governance-model owner and future governance enforcement runtime owner.

In plain terms: this is a long-lived lifecycle proposal. Describing a state or
transition does not perform it.

## Purpose

Lifecycle is one supporting concern inside the wider Governance product. It
keeps governance assets, rules, evidence, decisions, references, authority,
and execution from being mistaken for one another. It does not define the
product, and it is not a mandatory episode sequence for every governance act.

Several independent lifecycle axes exist. Collapsing them produced the hash
and refresh complexity that motivated part of this module's design.

This document separates:

- module asset maturity;
- rule semantic identity and rule lifecycle;
- assessment lifecycle;
- reference currentness;
- authority validity; and
- future runtime execution.

## Module Asset Lifecycle

The Governance module consists of its registries, schemas, documents,
validators, and receipts. Its candidate asset lifecycle is:

```text
source evidence selected
  -> candidate module authored
  -> candidate module validated
  -> owner review pending
  -> canonical admission separately decided
  -> runtime contract separately designed and accepted
  -> extraction or release separately decided
```

The current package is a validated candidate. Validation does not admit the
perennial documents as canonical artifacts and does not authorize runtime work.

## Governance Rule Lifecycle

A source owner may define a rule lifecycle suitable for that rule class. The
candidate cross-context minimum is:

```text
proposed -> assessed -> owner decision -> adopted for exact scope -> retired or superseded
```

These names are not one universal canonical state machine. In particular,
“active” remains product language until an exact activation contract is owned.

A semantic rule version changes when the rule's statement or applicability
changes. A new observation, README edit, package digest, or unrelated source
change does not create a semantic rule version.

## Assessment Lifecycle

One Governance Assessment may move through:

```text
created
  -> rule and policy references selected
  -> evidence and observations selected
  -> required inputs checked
  -> calculated
  -> evaluable or not_evaluable
  -> recommendation absent or recorded
  -> handed to decision owner
  -> closed or superseded
```

An assessment can correctly stop at `not_evaluable`. It does not have to invent
evidence or force a recommendation.

Closing an assessment does not close the source rule lifecycle.

## Reference Currentness

Currentness answers whether a selected reference still resolves to the claimed
record or selector. It is not semantic identity, lifecycle state, authority,
or adoption.

If a selected source record changes, the affected binding may become
`non_current`. Unrelated source changes should leave the binding current.

Historical assessments retain the evidence references they actually used.
Currentness changes do not rewrite that history.

## Hash Boundary

Hashes may support two bounded purposes:

- **import provenance** — identify the source snapshot used when the package
  was materialized; and
- **validation snapshot** — identify the exact package files covered by one
  receipt.

Neither purpose creates a lifecycle clock. The validators therefore check live
meaning at selected records and selectors instead of comparing unrelated
whole-file or whole-repository hashes.

A changed package digest may require a new validation receipt. It does not by
itself require a new rule version, owner decision, adoption, authority envelope,
or work-session refresh.

## Stop Conditions

Lifecycle movement stops for an owner decision when:

- the rule statement or applicability would change;
- harm, risk, or invariant basis is absent and assessment is not evaluable;
- a recommendation would modify a real rule or policy;
- Constitution membership or scope would change;
- authority holder, effect, conditions, or validity is disputed;
- an enforcement binding would be attached;
- a product or runtime contract would be accepted;
- private material would be extracted or published; or
- an external, destructive, release, or deployment effect is proposed.

Stopping preserves the current state. It does not imply rejection.

## Example

Example only: no real rule lifecycle changes.

A rule has semantic version `v3`. A referenced README changes outside the
selector used by its assessment. The package validation digest may change if
that README is package material, but the rule stays `v3`, the binding stays
current, and no owner decision is reopened.

If the rule statement changes, the source owner creates a new semantic version.
Old assessments remain historical evidence for `v3`.

## Claim Ceiling

These lifecycle descriptions do not define a canonical universal state
machine, move any real artifact, reopen or close a work session, prove runtime
implementation, accept an owner decision, activate a rule, or authorize an
effect.
