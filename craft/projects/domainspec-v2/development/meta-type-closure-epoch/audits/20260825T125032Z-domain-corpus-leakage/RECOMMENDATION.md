# Recommendation

## Recommended architecture

Keep generic targets free of system-owned cases. Place Financial Settlement and Shipment Priority descriptors, observations, expected outcomes, hostiles, and builders in a system-owned corpus package. Pass those cases into a realization composition adapter that joins one family evaluator with one language-native target. Providers execute that adapter and record evidence.

## Decision-gate effect

Do not select the current A/B/C options as written. They all assume that settlement construction belongs somewhere inside the generic target/helper/provider surface. In particular, current option B cannot be narrowed to system-owned corpus plus adapter composition without changing its ownership semantics.

Preserve the stable blocker identity `MTC-TARGET-FIREWALL-OWNERSHIP-001`, but supersede and reissue its request/options as a new revision. The recommended revised option is:

- **A2 — System-owned corpus + adapter composition:** target stays generic; corpus stays with the consuming system/example package; adapter owns the explicit join; provider only executes it.

Alternatives can cover a transitional corpus package or provider invocation shape, but none should make the target the owner of settlement fixtures.

## Bounded next route

Run `decision-gate` to invalidate/supersede the current option set and present revised ownership options. Only after explicit user selection should Invoke Plan derive exact transitive repair closure. The starting review denominator is 31 leakage-candidate target paths, five corpus-generic targets with unresolved inline evaluator ownership, eight direct cross-lane target paths, three missing Enum source declarations, and their selector-derived binding/provider/request/candidate/receipt fan-out.

No repair, Plan correction, candidate postimage, decision selection, or authority change is part of this audit.
