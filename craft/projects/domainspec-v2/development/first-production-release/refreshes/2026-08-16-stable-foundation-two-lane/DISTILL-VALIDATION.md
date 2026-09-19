# Distill Validation — stable-foundation two-lane refresh

Status: PASS for proposal shape; execution handoff blocked<br>
Mode: Standard<br>
Role path: local Proposer/Balancer simulation; N1 forbids spawning<br>
Rounds: 2 of 2<br>

## Distill Result

- Target context: preserve the accepted DomainSpec v2 product/profile
  boundaries while making the next stable-foundation planning move small,
  durable, and navigable.
- Objective and output artifact: select the smallest coherent planning route
  that reconciles the new S1 runtime decision with `WP-RMT-002` and creates a
  governed CLI foundation lifecycle; output is a proposal-only Invoke Refresh
  package and validated Dispatch Spec.
- Mode and budget: Standard; one proposal track, two recursive rounds, one
  reconciliation pass.
- Proposal tracks: one track with distinct RMT-refresh and CLI-lifecycle
  branches.
- Verdict: pass for proposal authoring; no mutation-capable route follows.

## Role conversation trace

### Round 1

**Proposer claim:** create one combined stable-foundation Work Pack containing
the remaining meta types, CLI packaging, schemas, build, security, resources,
compatibility, rollback, and retention.

**Evidence/assumption:** the 21 choices describe one eventual stable
foundation and share the P2/C2 proof denominator.

**Balancer objection — owner-boundary and cognitive-load:** a combined Work
Pack would mix an existing candidate implementation lifecycle with a new
product-interface lifecycle. It would hide that `WP-RMT-002` has a valid but
semantically stale execution entry, while the CLI has no approved Define or
Design baseline at all.

**Reconciliation:** revise to two planning lanes joined by one integration
gate. Lane A uses Invoke Refresh on the existing Work Pack. Lane B materializes
the accepted choices through Invoke Define, Design, and Plan. Neither lane
executes product work.

### Round 2

**Proposer claim:** reduce Lane A to a patch of `TASK-RMT-OP.md`, and reduce
Lane B directly to a package/build task.

**Evidence/assumption:** Operation is the only current frontier, and build
authority is the largest visible CLI defect.

**Balancer objection — hidden-glue and recomposition:** S1 crosses Operation,
Event, State Machine, Workflow, their W3/W4 joins, hostiles, wave order, plan
digests, and execution entry. A one-file patch would leave contradictory proof
denominators. The CLI choices also couple profile/root resolution, two closed
schemas, stream/exit behavior, packaging, compatibility, security, resources,
rollback, and retention; a build-only task cannot recompose into the selected
stable object.

**Reconciliation:** keep Lane A as one atomic plan-refresh package over the
exact named plan target inventory. Keep Lane B as one authoring lifecycle,
then require its eventual Plan to decompose implementation into independently
reviewable SWUs. Stop before authoring those SWUs under N1.

## Current smallest coherent unit

The smallest coherent current unit is the two-lane **planning refresh package**:

1. one exact refresh proposal for the S1-affected RMT plan bytes; and
2. one Define-to-Design-to-Plan authoring route for the CLI foundation;
3. one integration gate proving shared P2/C2 identity and non-collapse of
   authority.

Removing either lane loses part of the owner's target. Merging them hides
different lifecycle states and owners. Splitting Lane A below its cross-W3/W4
contract leaves contradictory semantics; splitting Lane B before Define and
Design invents implementation tasks without an approved architecture.

## Concept layer map

```text
accepted DomainSpec v2 product program
  -> selected pre-production stable foundation
     -> planning refresh package
        |- Lane A: existing RMT Work Pack semantic refresh
        `- Lane B: CLI Define -> Design -> Plan
             -> later plan-level SWUs
                -> later Task Session execution, one selected SWU at a time
```

## Technique trace

| Technique | Activation | Result |
| --- | --- | --- |
| abstraction-level guard | Review, decision, plan, and implementation evidence were being discussed together. | Kept N1 at decision plus plan-authoring route; no product task was selected. |
| recomposition proof | Two lanes must still serve one foundation. | Integration gate binds one P2 profile, C2 denominator, S1 semantic contract, and authority map. |
| evolution profile | The system must support future formats, patches, and additional implementation evidence. | Preserved versioned schemas, N-1 read overlap, immutable receipts, and patch/supersession boundaries without adding a plugin platform. |
| frame-expiry note | A new profile topology or durable-fact rule would invalidate the split. | Reopen on P2/C2/S1 change or an attempt to call the foundation the accepted `0.1.0` product. |
| navigable result check | The user needs a safe next action. | Route names exact lanes, gates, outputs, and a separate next approval. |
| cognitive-load check | 21 decisions plus seven meta types exceed one Work Pack's clear ownership. | Two lanes retained. |
| requisite-variety check | Runtime semantics and CLI lifecycle have different failure modes. | Each has its own validators; integration checks only shared contracts. |
| boundary-object check | P2/C2/S1 must be shared without duplicated authority. | The decision record and exact handles are shared; generated views remain non-authority. |
| premortem | Long-lived stability work is vulnerable to premature “ready” labels. | The proposal explicitly blocks RMT selection and CLI Plan handoff until fresh validators and owner gates pass. |
| set-based tournament | Not activated. | One selected target and an exact two-lane tension made competing architecture tracks unnecessary under N1. |

## Closure and recomposition proof

- Responsibility closes: this package owns planning reconciliation only.
- Inputs close: 21 decisions, prior product/profile authority, current RMT plan,
  review findings, Craft gate, and package/lock state are exact and selected.
- Outputs close: decision record, context pack, refresh report, patch proposal,
  Dispatch Spec, Dispatch validation, and this Distill result.
- No hidden glue: Lane B cannot reach Plan before Define and Design selection;
  Lane A cannot reach selection before a refreshed execution-entry projection.
- Recomposition: both lane receipts join on the same decision digest and must
  agree on P2, C2, S1, package/profile ownership, and claim ceilings.

## Evolution profile and deferred complexity

Expected evolution includes patch releases, receipt/diagnostic schema changes,
larger accepted corpora, additional conformance evidence, and later production
integration. The smallest extension boundaries are versioned schemas, explicit
profile IDs, an immutable release manifest, and one Work Pack per lifecycle.

Deferred because no current tension requires it: public registry distribution,
hosted service, plugin API, dynamic package-manager selection, multiple
platforms, central telemetry, automatic release rollback, and general
distributed exactly-once delivery.

## Tension ledger

- Resolved: “all meta types have prototypes” does not mean current admission or
  production proof; the RMT lane continues but refreshes its denominator.
- Resolved: stable CLI foundation and broad P2/C2 proof can share a target
  without combining their Work Packs.
- Resolved: review acceptance is evidence-quality acceptance, not product-byte
  acceptance.
- Stable disagreement: parallel agents would fit the lane shape, but the
  DomainSpec `plan` dispatch type is reserved. The route remains descriptive
  and inline until a live owner route exists.

## Premortem

Most likely failure: an actor sees the old machine-valid `selection-ready`
entry or the word “stable” and begins implementation or release work before
the new semantic plan and CLI lifecycle are admitted.

Guardrails: exact claim ceilings in every artifact; no selected SWU; no
registered dispatch; proposal-only mutation mode; explicit current-entry stale
warning; owner gate after both planning lanes; fresh execution-entry and
Design/Plan validators required.

## Frame-expiry note

Re-run Distill if P2, C2, S1, the private CLI delivery surface, external Node
runtime, npm/lock authority, project-root topology, or the decision to keep the
foundation subordinate to `0.1.0` changes. Also rerun if Lane A and Lane B
acquire overlapping product write scopes.

## Navigation guide

Start with `REFRESH-REPORT.md`, inspect the exact proposed changes in
`REFRESH-PATCH-PROPOSAL.md`, then validate the route in
`REFRESH-DISPATCH.json`. The next owner action is to approve or reject planning
authoring only. Do not run Implementation Readiness or Task Session from this
package.

- Evidence emission: not required; no accepted runtime-event ledger is an N1
  input.
- Telemetry: not recorded because N1's exact write boundary excludes the
  observability tree; this does not change the verdict.
- Next route: separately authorized inline Invoke Refresh and Invoke
  Define/Design/Plan authoring; implementation remains deferred.
