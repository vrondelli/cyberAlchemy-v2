# Plan Distill Validation

Date: 2026-07-28
Mode: Distill Standard
Role path: local Balancer-led critique with Proposer reconciliation; no
subagent dispatch was authorized
Verdict: pass
Evidence emission: Invoke child signal required at closeout

## Objective and Output

- Objective: reduce the blocker-prone L1 component graph to the clearest
  dependency-closed path to a working UI.
- Output: one explicit first-working-version target, one coherent source unit,
  and independent build/browser verification units.
- Optimization target: shortest reversible path to browser-visible evidence
  without weakening exact-source semantics or evidence ceilings.

## Balancer Review

### Objection 1 — A vertical UI source unit might be task-shaped

Category: first-unit narrowness.

Trust rail, inspector, view parity, navigation, Poker tour, and responsive
composition share one exact store, entrypoint, package registry, and user
journey. Their focused runners remain separate falsifiers inside the same
source unit.

Reconciliation: pass. Treat 008F as one vertical product behavior, not six
independently deployable products.

### Objection 2 — The four-unit frontier could be collapsed further

Category: independent acceptance.

Source semantics, immutable clean build, browser evidence production, and
independent receipt verification have different owners and falsifiers.

Reconciliation: pass. Keep 013B, 014, and 014V separate from 008F.

### Objection 3 — Package scripts can point to files that do not exist yet

Category: premature complexity.

The existing registry already names the intended commands. The previous
preflight blocked because command existence was confused with entrypoint
ownership.

Reconciliation: pass after adding a frontier validator: every command must
exist now, and every referenced entrypoint must either exist or be in that
same SWU's exact target inventory.

### Objection 4 — Another package manifest could make execution easier

Category: task-shaped SWU risk.

The implementation already has the required scripts and exactly one package
root. Adding nested manifests would create competing command authorities.

Reconciliation: pass. No active SWU owns `package.json`.

### Objection 5 — Refresh could imply implementation consent

Category: external-effect boundary.

Invoke may author the graph and recommend 008F. It cannot transfer an earlier
selection across a materially different frontier.

Reconciliation: pass with
`G-OEW-L1-FIRST-WORKING-VERSION-SELECTION` open and selected SWU null.

### Objection 6 — A browser pass could be mistaken for product readiness

Category: evidence ceiling.

014/014V can prove only automated local acceptance over the pinned build.
Manual UX, multi-user operation, publication, authority, release, and
production remain outside the first working version.

Reconciliation: pass.

## SWU Atomicity Result

- Remaining L1 SWU count: 4
- Coherent source units: 1 (`SWU-OEW-008F`)
- Independent closure units: 3
- Missing target inventories: 0
- Missing validation commands: 0
- Active target overlap: 0
- Package roots: 1
- Package mutations: 0
- Command-entrypoint closure: pass

## Recomposition Proof

```text
006P verified L1 toolchain
  + 007 exact UI store
  -> 008F complete Poker evidence-review source
  -> 013B immutable final build + independent build verification
  -> 014 automated browser/accessibility receipt
  -> 014V independent acceptance verification
```

Each step consumes a named predecessor receipt. The completed foundation
remains valid if the user chooses to stop. L2 remains separately gated.

## Hidden Gap Review

| Gap | Acceptance critical now? | Owner/path |
| --- | --- | --- |
| UI source and runner files are absent | yes for 008F | same-SWU target ownership plus focused validation |
| final build bytes are absent | yes for 013B | fresh materializer plus distinct verifier |
| browser evidence is absent | yes for 014 | owned browser producer and teardown |
| independent browser acceptance is absent | yes for 014V | distinct verifier process |
| manual UX or screen-reader evidence | no for automated first version | separate named human owner |
| L2 provider/private scope | no | G-OEW-L2-SCOPE |

No hidden acceptance-critical Plan gap remains.

## Deferred Complexity

- whole-repository analysis;
- automatic evidence-code inference;
- cross-run or collaborative server state;
- automatic upstream pin updates;
- IOLM/Craft/authority integration;
- public release and production.

## Premortem

Likely failure: a visually polished generalized edge is mistaken for exact
source semantics.

Guardrail: source admission precedes mapping; exact sidecar mapping is blocking;
inspector displays exact relation and loss; three-view parity and Poker
acceptance verify it; receipts retain `authority_effect:none`.

## Frame Expiry

Re-run Define/Design/Plan if the candidate run version changes, authority effect
changes, upstream exposes a materially different extension/data contract, the
delivery scope includes IOLM/public release, or multi-user state becomes
required.

## Navigation Guide

After explicit option A selection, start only at `SWU-OEW-008F`. Use
`work-pack/swu-manifest.json` for machine routing and the parent task for
implementation detail. Stop after each Task Session receipt.

## Telemetry

The parent Invoke closeout must emit exactly one linked Distill child signal.
Observability never changes the artifact verdict or authorizes implementation.

## Next Route

Resolve `G-OEW-L1-FIRST-WORKING-VERSION-SELECTION`. Option A selects 008F;
option D stops with the completed foundation.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
