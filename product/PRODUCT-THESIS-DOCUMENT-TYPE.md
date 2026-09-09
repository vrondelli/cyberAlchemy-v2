# Product Thesis Document Type

Status: active private document contract; canonical-kind catalog remains candidate
Canonical kind: `product-thesis`
Authority-kind rollup: `Spec`
Durability: perennial
Owner route: CyberAlchemy v2 product owner

## Purpose

A Product Thesis document preserves the durable proposition that guides product
work while Projects, Goals, Research, Experiments, designs, and implementations
change. It states why the product should exist, how it intends to create value,
which principles it must protect, and what evidence could require revision.

## Carrier And Machine Record

The canonical carrier is `PRODUCT-THESIS.md`. Its header names
`Canonical kind: product-thesis`, a stable Thesis ID, `CAV2-D63`, commitment
state, visibility, owner, and authority effect. The sibling
`product-thesis.record.json` is the machine-readable projection. The carrier and
record must agree on identity, commitment state, owner, principles, and claim
ceiling.

## Required Meaning

- stable Thesis ID and Product reference;
- participants and problem;
- value proposition and value mechanism;
- first-order principles;
- intended outcomes;
- product and authority boundaries;
- hypotheses that remain unproved;
- evidence and counterevidence routes;
- explicit revision criteria;
- owner, commitment state, revision history, and challenge route.

## Commitment And Evidence

```text
committed thesis principles != implemented product
implemented realization      != successful outcome
one successful experiment    != proof of the whole thesis
```

Evidence tests realizations and bounded outcome claims. Counterevidence can
require the realization or thesis to be revised. Evidence does not silently
rewrite first-order commitments; revision is an explicit owner action.

## Lifecycle

```text
draft -> committed -> revised -> retired | superseded
```

The thesis commitment lifecycle is separate from the artifact authority state.
A thesis can be `committed` as product direction while its artifact remains a
candidate Spec with `authority_effect: none`.

## Example

CyberAlchemy commits to an ergonomic, governed human-machine work loop. The
PythonConstraint Project tests one bounded realization. A successful future run
could support that realization; it could not prove the entire thesis, customer
demand, economic value, or product-market fit.

## Authority Boundary

A Product Thesis guides product work. It does not authorize implementation,
Experiments, publication, deployment, external effects, budgets, or successor
Projects. Those require their own owner routes and accepted envelopes.
