---
title: Intent Route Resolver development package
status: candidate-plan
authority_effect: none
---

# Intent Route Resolver

This package defines, designs, and plans one subordinate slice of the private
Agent Reasoning Engine: a small runtime that turns a preserved, typed intent
projection plus a frozen capability-route catalog into an advisory route
disposition.

The resolver returns one of:

- `candidate`: exactly one route is eligible;
- `ambiguous`: the valid input lacks a discriminator or multiple routes remain
  eligible;
- `no-match`: the valid, sufficiently discriminated intent has no eligible
  route; or
- `invalid`: the request or catalog fails its version, shape, digest, or
  ownership contract.

It never dispatches, schedules, approves, mutates, or promotes. Augmentor may
capture and display the result; the ResonantOS host owns any immutable route
decision, approval, execution request, and runtime truth.

## Navigation

- [Authoring context](CONTEXT-SELECTION.md)
- [Define specification](define/SPEC.md)
- [Design architecture](design/ARCHITECTURE.md)
- [Implementation layering](planning/IMPLEMENTATION-LAYERING.md)
- [Executable work-pack](planning/WORK-PACK.md)

No implementation is authorized or supplied by this authoring package.

Open questions are owned in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
