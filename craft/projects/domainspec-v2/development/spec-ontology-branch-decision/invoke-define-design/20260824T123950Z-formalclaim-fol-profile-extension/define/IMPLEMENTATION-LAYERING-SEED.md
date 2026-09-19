# Implementation Layering Seed — FormalClaim FOL Profile Extension

This is a design seed, not an implementation plan.

| Layer | Decision unlocked | Minimum future evidence | Explicitly deferred |
| --- | --- | --- | --- |
| L0 | Whether the two contracts preserve meaning/assessment non-collapse on exact fixtures. | schema candidates, positive and negative fixture contracts, independent validator result | canonical ontology mutation, TDE/EVF wiring |
| L1 | Whether TDE can consume only admitted projections and preserve typed `needs_formal` reasons. | deterministic classification fixtures and source-digest preservation checks | full solver route and proof integration |
| L2 | Whether EVF and provider receipts fail closed across profile, version, timeout, unknown, and staleness boundaries. | pinned provider fixtures and receipt-chain validation | general FOL solver claims |
| L3 | Whether multiple profiles/providers can evolve without changing source meaning. | compatibility and supersession evidence across separately admitted profiles | release, publication, production |

After L0, we would know whether the two-contract boundary is structurally
non-collapsing. No layer is admitted or authorized by this seed.
