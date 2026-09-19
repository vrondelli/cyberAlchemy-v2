# TASK-UIR-ADJUDICATION

## SWU-UIR-008 - Formation Dossier

Inputs: immutable handles from 004-007. Evaluate the eight hard conjuncts in
declared order, preserving `pass`, `fail`, `missing`, `disputed`, and
`pending-owner`. Any non-pass yields `DEFER`, except a finitely closed all-zero
witness set may yield `DOSSIER-ZEROED`. Test every single-conjunct removal,
label/criterion erasure, shared-hygiene witness, and owner-pending state. Write
only dossier contracts/fixtures/results. Done: deterministic state with no score
and no authority claim.

## SWU-UIR-009 - Orchestration Index

Inputs: 001 and immutable records from 004-008. Append generation entries,
predecessor, invalidation reason, inputs, handles, and mechanical replay status.
Reject missing handles, predecessor forks without explicit branch identity,
timestamp-sensitive digests, and in-place updates. Replay producers and dossier
from frozen inputs; human owner outcomes remain versioned inputs. Write only
index/replay contracts, fixtures, results, and tooling. Done: identical replay
or explained invalidation while all prior generations remain available.
