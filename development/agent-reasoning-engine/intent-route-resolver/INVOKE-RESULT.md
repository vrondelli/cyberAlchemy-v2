# Invoke result — Intent Route Resolver

## Outcome

Define, Design, and Plan pass for a private Agent Reasoning Engine child
capability. The selected architecture is a pure advisory resolver:

```text
typed IntentRecord + frozen CapabilityRouteCatalogSnapshot
  -> candidate | ambiguous | no-match | invalid
```

The design-selection validator passed at fixed point. Dispatch Spec passed
after live-schema repair. Distill passed after an independent Balancer accepted
all five SWUs and revalidated four bounded contract repairs.

## Critical boundary

The L0 runtime does not honestly solve arbitrary natural-language routing by
itself. Augmentor captures ordinary language and presents a typed projection;
the resolver deterministically reasons over that projection. ResonantOS owns
the later immutable route decision, approval, execution request, and runtime
truth.

This avoids creating a second router/scheduler while still giving Augmentor a
small reusable answer surface.

## Artifacts

- [Define specification](define/SPEC.md)
- [Design architecture](design/ARCHITECTURE.md)
- [Implementation layering](planning/IMPLEMENTATION-LAYERING.md)
- [Work-pack](planning/WORK-PACK.md)
- [Selected first task](planning/work-pack/tasks/TASK-IRR-CONTRACT-001.md)
- [Dispatch validation](planning/DISPATCH-VALIDATION.md)
- [Distill validation](planning/DISTILL-VALIDATION.md)

## Handoff

- Selected unit: `SWU-IRR-001`
- Mutation performed: none
- Implementation authorized by this run: no
- Structural handoff readiness: pass
- Next route: an explicit Task Session request for only SWU-IRR-001
- Product/browser route: preserved for L2 under the ResonantOS UX/product owner;
  no browser claim exists yet

Open questions are owned in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
