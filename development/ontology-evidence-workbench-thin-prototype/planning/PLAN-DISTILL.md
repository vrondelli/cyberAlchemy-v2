# Plan Distill Validation

## Result

- Mode: Validate
- Target: first local browser-testable OEW Poker-Team witness
- Proposer: Invoke Plan author
- Balancer: bounded read-only helper `oewtp_plan_balancer`
- Review rounds: four
- Final verdict: pass
- Blockers: none
- Flags: none
- Mutation handoff: not authorized by this result

## Smallest coherent units

| Unit | Primary behavior | Independent acceptance | Verdict |
| --- | --- | --- | --- |
| SWU-OEWTP-001 | typed executable-loader admission | strict compile/tests, exact composed request probe, source manifests | pass |
| SWU-OEWTP-002 | retained immutable build producer | fresh Vite dist retained with path/tree digest/count/size | pass |
| SWU-OEWTP-003 | fail-closed exact evidence gateway | bootstrap/cookie/data-token positive contract plus full negative bank | pass |
| SWU-OEWTP-004 | real bounded browser acceptance | thirteen named assertions, exact environment/log/screenshot/teardown receipt | pass |
| TASK-OEWTP-VERIFY | read-only recomposition and claim audit | valid VERIFY exemption; pre-bound Invoke Refresh planning result/receipt | pass |

SWU-OEWTP-001 remains the narrowest useful first unit. The relative-base repair
lives in the same owned `loadOewBundle.ts` source/manifests as the measured type
repair and has no separately usable outcome: compilation without executable
data URLs and executable data URLs with stale admission both fail.

## Balancer conversation and repairs

### Round 1

The Balancer blocked on an ephemeral dist, a non-executable token bootstrap,
retry-unsafe generated/closeout paths, incomplete Playwright binding, two
missing browser assertions, and a mandatory verifier that contradicted the
approved fast lane.

Repairs retained the dist before scratch cleanup; split HTML bootstrap,
asset-cookie, and explicit data-token behavior; bound one concrete attempt ID
and exact outputs before mutation; resolved Chromium through the absolute
global Playwright API; added deep-link/keyboard assertions; and deferred the
independent immutable verifier to L2.

Receipt: [initial review](receipts/distill-balancer-initial.json).

### Round 2

The Balancer blocked because the plan did not bind the existing
OewApp-to-loader token handoff and W5 had no owner for its named result.

Repairs made the loader boundary an SWU-001 admission proof consumed read-only
by SWU-003 and assigned W5 exact pre-bound result/receipt paths under
`invoke:refresh:read-only-verification-close`.

Receipt: [round 2](receipts/distill-balancer-round-2.json).

### Round 3

The Balancer executed the exact current composition and found the real runtime
defect: `new URL("presentation-graph.json", "/oew-data/")` raises
`TypeError: Invalid URL` before fetch.

The repair contract now assigns same-origin relative-base resolution to the
already-owned `loadOewBundle.ts`, keeps OewApp read-only, and requires the exact
composed positive probe plus malformed/cross-origin zero-fetch negatives.

Receipt: [round 3](receipts/distill-balancer-round-3.json).

### Round 4

The Balancer found no blocker, flag, hidden glue, package-manifest leak, or new
runtime root. All previous repairs and the four-SWU recomposition passed.

Receipt: [final review](receipts/distill-balancer-final.json).

## Recomposition proof

```text
typed executable loader admission
  -> retained immutable Vite dist
  -> exact loopback gateway
  -> fresh gateway plus real Chromium Poker-Team journey
  -> read-only planning close
```

The output of each mutation unit is a pre-bound immutable input to its
successor. W5 writes planning evidence only. Independent immutable verification
remains a separately authorized L2 route.

## Technique trace

| Technique | Result |
| --- | --- |
| `scu_swu_reduction` | four mutation units; no task-shaped SWU |
| `recomposition_proof` | complete after composed URL repair |
| `validation_loop` | four Balancer rounds plus deterministic validators |
| `owner_boundary_check` | implementation, planning close, L2 verifier, and lifecycle owners remain distinct |
| `residue_ledger` | unexecuted runtime, historical lock staleness, accessibility matrix, and L2 verifier remain named |

## Claim ceiling and next route

This is a Define/Design/Plan validation pass, not a runtime pass. Future
executed evidence may prove one local automated Poker-Team journey only.

## Runtime-contract refresh revalidation

The original four-round review remains the semantic/atomicity source, but its
execution-contract conclusion was superseded when live Task Session required
split material/output admission and live Invoke required exact approval scope.
The shared runtime is now repaired and the refreshed planning bytes:

- bind `MUTATION-ADMISSION-CONTRACT.json`;
- prove all four disjoint material/output partitions exactly recompose their
  original write scopes;
- use the exact `invoke:refresh:apply-approved` closeout route and admitted
  delta vocabulary;
- contract the installed Refresh owner-receipt fields;
- retain the no-new-package and old-development read-only boundaries.

The deterministic refresh revalidation receipt is
`work-pack/session-evidence/GOAL-WP-OEWTP-001/20260729T155245Z-preflight-refresh/planning-refresh/plan-distill-revalidation.json`.
This replaces the original runtime-readiness conclusion without changing the
four SWUs or their semantic acceptance boundaries.

Next route: Task Session preflight for `SWU-OEWTP-001`. The selected SWU remains
unexecuted and `mutation_authorized=true`, subject to its exact per-attempt
material and admission receipts.
