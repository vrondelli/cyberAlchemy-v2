# Decision Gate Resolution — adopt current DomainSpec fixture

## Result

- Target: `SWU-IOLM-00C-UI-A4` replay dependency chain
- Result: `PASS`
- Decision resolved: `1/1`
- Selected option: `rebind-to-current-domainspec-fixture`
- Source of decision: operator reply `1`
- Timestamp: `2026-07-22`
- Decision blockers remaining: none

## Rationale

Preserve the current DomainSpec-v2 regenerated outputs and do not discard their
coordinated uncommitted changes. IOLM must rebind its pinned A1 boundary to a
stable current fixture set, regenerate/revalidate A2, revalidate A3, and only
then attempt a new A4 Firefox replay.

This selection does not weaken the pinned boundary: A1 must still validate exact
bytes and values before serving anything. It changes which owner-approved
fixture generation is pinned.

## Live evidence at resolution

The fixture was regenerated again after the original A4 block. The current trio
was stable across two consecutive reads before this resolution was recorded:

- graph: `7847c665e029354f55836a5bb89059260e72bb0e6cc480822cd4013b9860a71c`
- source manifest: `83ff1235d3a44e595d4c3dfe912deae4e190af15c14aa225a7f0416ef9e0b243`
- build receipt: `d2b150018055c98545d0b17b517baef37459d98d4f7db38714340857525c9644`

Because these bytes changed during the decision window, the next owner must
re-read and bind their hashes immediately before A1 mutation. Any further drift
blocks again rather than silently changing the selected source.

## Downstream route

The next bounded owner route is `invoke:refresh:apply-approved` to reopen the
existing A1 → A2 → A3 validation chain for the current fixture generation. The
operator's option-1 selection authorizes this exact planning direction, but this
Decision Gate does not execute that owner route or recursively start Task Session.

No DomainSpec fixture or IOLM implementation file was changed by Decision Gate.
