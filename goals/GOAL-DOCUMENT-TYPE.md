# Goal Document Type

Status: active private document contract; canonical-kind catalog remains candidate
Canonical kind: `goal`
Authority-kind rollup: `Spec`
Durability: perennial
Owner route: CyberAlchemy v2 product owner plus the named Goal owner

## Purpose

A Goal document preserves an eventual result across changing conversations,
plans, tasks, experiments, and implementations. It makes achievement testable
without pretending that progress is success.

## Carrier

A canonical Goal document is a JSON file whose name ends in `.goal.json` and
whose content validates against `schemas/goal-package.schema.json#/$defs/goal`.
The filename is the external carrier of the kind. The `canonical_kind: goal`
field mirrors that carrier for lookup; it cannot turn another file into a Goal.

## Required Meaning

Every Goal document states:

- stable Goal ID and title;
- exactly one Project reference;
- one concrete desired outcome;
- why the outcome matters;
- product-thesis or other purpose connections;
- included scope and explicit exclusions;
- one owner route;
- checkable success conditions;
- evidence needed for each condition;
- evidence already available;
- lifecycle and achievement state;
- revisions and a challenge route;
- effects the Goal does not authorize.

## Lifecycle

```text
draft -> active -> achieved
                -> abandoned
                -> superseded
```

An active Goal may be temporarily blocked and may have no deadline. `blocked`
is a work condition, not a Goal lifecycle state. `eventual-no-deadline` means
the Project remains committed to the outcome without inventing a date.

`achieved` is allowed only when every required success condition is `met`, each
condition cites adequate evidence, and the owner records the achievement.

## Relation To Intent, Plans, And Tasks

| Concept | Concrete job |
| --- | --- |
| Intent | Keeps the early purpose visible while the result may still be unclear. |
| Goal | States the future result and the evidence needed to judge it. |
| Project | Keeps related Goals, owners, evidence, and work under one stable identity. |
| Plan | Chooses a path toward a Goal. |
| Task or work pack | Performs one bounded part of a Plan. |
| Evidence | Supports or challenges a claim that a success condition was met. |

None of these objects silently changes another one.

## Example

“Work on PythonConstraint” is too weak. It does not say what result is wanted.

A Goal says:

> Produce one reproducible, evidence-bearing PythonConstraint experiment that
> maps the selected Vero task into DomainSpec-v2, runs the declared proof path,
> preserves exact inputs and results, and shows what this experiment does and
> does not support about the CyberAlchemy product thesis.

The Goal is not achieved because a repository was cloned or one check passed.
It is achieved only when every declared success condition has its required
evidence and the owner records that decision.

## Authority Boundary

The canonical kind is `goal`, with a Tier-2 rollup to `Spec`. This makes an
owner-promoted Goal eligible to carry specification authority for its own
outcome contract. It never grants authority to execute tasks, modify another
project, publish, deploy, spend money, contact an external party, or choose a
successor Goal.

## Challenge And Revision

Challenge a Goal when its outcome is ambiguous, its evidence cannot test the
claim, its Project link is wrong, its thesis link inflates product evidence, or
its scope hides important exclusions. Material meaning changes append a
revision entry. Replacing the desired outcome should normally supersede the old
Goal instead of rewriting its history.
