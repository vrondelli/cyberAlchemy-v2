# Context

Status: active canonical definition with candidate ontology and instances
Visibility: private
Package owner: CyberAlchemy v2 product owner
Authority effect: none

Context is the first-class CyberAlchemy frame that connects one Product, an
optional Project, an optional Goal, intended consumers, purpose, subjects, and
source policies. Its canonical meaning is `CAV2-D66`.

```text
Context -> Product                     exactly one
Context -> Project                     zero or one
Context -> Goal                        zero or one
Context -> DDD Bounded Context         zero or more
Context -> intended consumer           one or more
```

Context identity remains stable while source epochs, requests, Views, sessions,
and interface presentations change. A material change to Product, Project,
Goal, or purpose requires a successor Context.

This business package keeps Context distinct from a DDD Bounded Context. A Bounded
Context says where one domain model and Language are consistent. A CyberAlchemy
Context says which Product, work identity, purpose, consumer, subjects, and
source policies frame one use. It contains no resolver operation, request,
runtime View, adapter, CLI, or transport. Those belong to Registry Context.

## First Instances

[`contexts/define-shared-meaning.context.json`](contexts/define-shared-meaning.context.json)
connects the CyberAlchemy Product, Define Project, Define first-class ownership
Goal, Governance Bounded Context, and Define shared-meaning consumer. It is
draft because its Project and Goal have not crossed their own lifecycle gates.

[`contexts/registry-context-first-vertical.context.json`](contexts/registry-context-first-vertical.context.json)
connects the CyberAlchemy Product, Registry Context Project, its first proof
Goal, Governance Bounded Context, and Registry Context resolver consumer. This
is the Project's own Context for building Registry Context; it is not a View
that Registry Context later resolves for another consumer.

## Validate

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/context/scripts/validate.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/context/tests/test_negative_mutations.py
```

Write a content-addressed receipt only after a PASS:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/context/scripts/validate.py --write-receipt
```

## Claim Ceiling

This package establishes a private business-domain ontology and candidate
Context instances under the canonical `CAV2-D66` meaning. It does not accept a
Context View, define a resolver contract, prove correct consumer use, redefine
Bounded Context, implement a runtime, change Product, Project, or Goal lifecycle,
or authorize publication, release, deployment, or external effects.
