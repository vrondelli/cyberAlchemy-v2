---
artifact_id: UIP-IMPLEMENTATION-LAYERING-v1
status: approved-plan
authority: development-only
---

# Implementation Layering

| Layer | Decision question | SWUs | Exit evidence | Deferred |
| --- | --- | --- | --- | --- |
| L0 Contract | Can all required concepts be represented without forcing all of them into DS-D1 nodes? | UIP-001 | exact census, closed representation validation, typed residue | formation implementation |
| L1 Mechanical | Do the contracts construct positives and reject meaningful negatives using synthetic calibration? | UIP-002..003 | schema parity, nonempty rules, six fixture classes per concept | engine integration and empirical breadth |
| L2 Integration | Can the profile use the existing compiler and produce a deterministic traversable graph? | UIP-004..005 | compiled Create Player graph, per-node sources, machine/Markdown equality, stable digest | canonical admission |
| L3 Handoff | Is the result complete enough for owners to decide exact DS-D1/DS-D8/profile changes? | UIP-006..007 | complete packet and integrated audit with zero canonical writes | owner decision and real-corpus confidence |

## Promotion Logic

```text
required concept registry
  -> formation + synthetic calibration
  -> graph compilation + traversal
  -> authority packet + audit
  -> separate definitions/relationship/profile owner decision
```

Layer promotion uses mechanical evidence from the preceding layer. Empirical
confidence is orthogonal: it may be appended at any later time but cannot block
movement from L0 through L3.

## Smallest Coherent Unit

`SWU-UIP-001` is the smallest coherent start. It freezes the concept census and
representation algebra together. Splitting them would allow implementation to
create schemas before deciding whether a concept is a node, alias, role,
projection, relationship, or split.

## Deferrals

- Canonical activation and release-profile admission remain external owner work.
- Corpus B and independent reviewer collection remain confidence work.
- `FPR-02U` is independent of the backend-only `FPR-02B` release lane. Neither
  lane's incompleteness changes the other's readiness; a future UI-inclusive
  release still requires a separate owner decision.
