# Invoke Refresh report: TDE controller compatibility proposal

## Result

Proposal authoring passed. `dsv2-tde-multiformalism-profile-epoch@3` is staged only under `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal/staging/`; the canonical target was not created. The exact proposal has 84 material postimages and four derived readiness postimages.

WPRA returns `pass / PLAN_SEMANTIC_READY` with zero findings. Invoke readiness returns `pass / PLAN_IMPLEMENTATION_READY`. The installed chain controller clears the formerly failing `MANIFEST_SHAPE_INVALID` gate and returns `EPOCH_APPROVAL_INVALID`, correctly preserving the missing real @3 chain-approval boundary.

## Exact bindings

- Source Plan acceptance: `cdf5ebe1169d26ff22387a853a0affa6e5e810a2dc9a7aaf0cf1e95fa8227fca`.
- Source candidate manifest: `731bf19e4de3c1dbd2535d6fc0df5c7d6796ce7bdaf3e3ae1067c46f2f805667`.
- Source material digest: `b1e5819b5b22ff7917114e1d9dd7a72b92b4c16ee2575f76a641af0442f58a30`.
- Source semantic digest: `e60a5879755443ddbd678f93606e188abf15eda56962e4f0b3119aeb93d0f987`.
- Proposed inventory digest: `2c5ff4649c862c7381b2c615582bd4c9faa92eb8925974b259b2fcdee28cace6`.
- Proposed material digest: `20af93c91d53e9f9c2985b01cf09ba75c628aaa13fdaa27f03fcb5807142f8bf`.
- Proposed canonical semantic digest: `f7c734669d7ff7d6d877d1bbeeced64c24cfb7757e540fc5fc5264e38a0d8750`.
- Proposed audit projection digest: `313cdaee0be89e6764a31651a48afccf416edc4e6d07678879a34ef7cc28b2ff`.
- Proposed plan epoch: `epoch-89354d693a77fa320aeb4448`.

## Authority and blockers

`phaseStatus` is pass because the exact proposal is complete. `mutationReady` is false, `handoffStatus` is gated, and `appliedChanges` is empty. Remaining blockers are typed separately: explicit apply authorization; canonical target lifecycle plus exact owner acceptance; real WPRA selection and chain approval; and Victor's later pre-merge review.

The next route is `invoke:refresh:apply-approved` only after Rondelli explicitly authorizes this exact target inventory. Any changed target byte invalidates these proposal digests and requires a fresh candidate and renewed acceptance request.
