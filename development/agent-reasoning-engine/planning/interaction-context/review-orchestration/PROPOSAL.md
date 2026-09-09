---
title: ARE interaction learning review through the successor orchestrator
proposal_id: ARE-INTERACTION-REVIEW-ORCHESTRATION-001
status: proposed-not-ready-for-dispatch
route_id: CA2-ROUTE-DELEGATE
work_lane: operational-support
affected_product_stage: ARE interaction-learning implementation-plan review
authority_effect: none
---

# Review the ARE plan through the successor orchestrator

## Outcome

Use the named `subagent-strategy` review method to produce verified change
requests for ARE's Interaction Learning Loop plan. Execute its admitted review
graph through the existing successor orchestrator, retaining the orchestrator's
scheduler, worker fencing, and AcceptedHistory. Do not create a second scheduler.

**The proposal API works; faithful review execution is not ready.** A local,
model-disabled probe obtained a native proposal, but it was the fixed research
demo, not the requested review. It created no run. The missing work is a review
adapter and an applicable skill runtime binding, not an ARE implementation fix.

This document is an ungated planning proposal, not the executable strategy
sheet. No review finding, reviewer consensus, confirmation, or registration is
claimed. The skill requires readiness and two independent tension checks before
we can ask the user to confirm the actual dispatch.

## Exact target and boundaries

- Target: [Interaction Learning Loop plan](../PLAN.md), revision 2,
  `ARE-INTERACTION-LEARNING-001`.
- Target bytes: 63,018; SHA-256
  `beb56657f2af30d230ea78268efe1fc7bf6bd6b63ab88affdf0408d76dc23d5b`.
- Requested executor:
  `/home/vrondelli/projects/cyberalchemy-successor/cyberAlchemy-v2/work-orchestration-implementation`.
- Strategy owner:
  `/home/vrondelli/projects/domainspec-core/.agents/skills/subagent-strategy/SKILL.md`.
- Review semantics:
  `/home/vrondelli/projects/domainspec-core/implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/review/SKILL.md`.
- Every attacker reads the complete target. Additional runtime claims need an
  explicit, frozen supporting-source manifest before dispatch. A source not in
  that manifest is a declared evidence gap, not permission for repository-wide
  discovery. This first review can identify missing evidence in the plan without
  claiming to have audited all current ARE runtime code.
- Read-only targets. Outputs are review records only. No implementation, serving
  changes, credentials, publication, public/private transfer, or product approval.
- Ontology selection: no ontology records are used as premises or admission
  inputs in this integration probe. The target's declared ontology ID is
  descriptive; the current Python ontology runtime is not a prerequisite.
- The existing dirty orchestrator source and untracked ARE plan remain owner
  work. Their observed hashes were unchanged after the probe.

## Review strategy

Trigger: parallel independent attack lenses plus synthesis and independent
verification are useful for this large, cross-component implementation plan.
Partition by lens, not by target files.

| Logical participant | Skill role | Whole-plan attack or responsibility |
| --- | --- | --- |
| Loop attacker | explorer | Interpretation, feedback attribution, causal continuation, lesson application, currentness, and ownership: can the proposed loop actually close? |
| Evidence attacker | explorer | Baseline/treatment isolation, leakage, outcome validity, no-gain triggers, latency and call budgets: could the benchmark claim improvement without improvement? |
| Control attacker | explorer | User inspection/control, scope, privacy, restart/replay, stopping and safe degradation: can learning survive real operation without exceeding permission? |
| Synthesizer | writer | Deduplicate and rank quoted findings while preserving disagreements and evidence gaps. |
| Verifier | skeptic | Attempt to refute every finding against the literal target and selected supporting sources; drop refuted findings. |
| Coverage auditor | auditor | Check all promised lenses and sources were covered; flag unsupported zero-findings returns and any refuted finding that survived. |

These are logical roles, not invented agent-pool identities. Allocate six
eligible, unique working identities from the applicable pool at readiness.
The synthesizer and verifier each retain their identity for their second turn.
The parent is final approver of the review deliverable, not of the ARE product.

### Bounded graph

```text
freeze full target + selected evidence + exact review strategy
                         |
          +--------------+--------------+
          |              |              |
       loop attack   evidence attack   control attack
          +--------------+--------------+
                         |
                      synthesis
                         |
                      verification
                         |
          +--------------+----------------+
          |                               |
     no objections                 repairable objections
          |                               |
          |                      synthesis repair (once)
          |                               |
          |                       reverify revised findings
          +--------------+----------------+
                         |
                  coverage audit
                         |
             parent joins + final findings + close record
```

Unroll the possible repair and reverification into an eight-stage DAG: three
attack stages, synthesis, verification, optional repair, optional reverification,
and coverage. Stage count is not participant count. Skip optional stages only
from typed handoff evidence, not from file existence or a generic successful
worker exit. Unresolved objections after reverification are reported as unresolved;
there is no automatic third round. Coverage cannot introduce unverified findings.

Bounds: three concurrent working participants; at most eight working-agent
model calls, plus two separate preconfirmation tension checks; one repair pass;
proposed 15-minute execution deadline. No model planning call is required to
import a human-visible strategy. Token/cost ceilings and provider selection must
be supplied by the applicable executor binding before readiness. Do not silently
substitute the web runtime's current one-hour deadline or a different provider.

No attacker confrontation sub-loop is proposed for this first review:
`robot_talks: false`. Independent attacks plus verifier challenge keep the call
budget bounded. Preserve verbatim initial returns, repair turns, and verification
returns so the final synthesis cannot conceal disagreement.

Predicted pairwise disagreements, to be copied into the exact strategy sheet:

1. Loop versus evidence: a structurally closed learning cycle can still produce
   confounded or circular improvement evidence.
2. Loop versus control: fast reuse can conflict with scope expiry, correction
   attribution, and crash-safe currentness.
3. Evidence versus control: stronger repeated live experiments can conflict with
   privacy, cost, and bounded operational exposure.

Done means cited, verified change requests, not implementation. Each surviving
finding contains file/line, literal evidence, originating attack reference,
severity (CRITICAL/MAJOR/MINOR), and a proposed fix. KEEP/FIX is per artifact:
FIX requires a surviving CRITICAL or MAJOR. All-zero attacks trigger an explicit
coverage warning, not an automatic cleanliness claim.

Future run outputs: `attacks.md` (verbatim returns), `findings.md` (verified
prioritized change requests and unresolved evidence), and the configured paired
dispatch/close ledger receipts. These files are not fabricated by this proposal.

## Compatibility results

Current source:
[orchestrator_web.rs](/home/vrondelli/projects/cyberalchemy-successor/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/bin/orchestrator_web.rs).
Observed SHA-256:
`241c4fe653eea098b7c3ff960588c5de1f469d78085bca9c376b62bb131d9053`.

| Requirement | Observed behavior | Consequence |
| --- | --- | --- |
| Import the selected review strategy | POST accepts only title, question, mode; an extra strategy field returned HTTP 409, CONTROL_BODY_FIELDS_INVALID | Add typed review-strategy import; do not regenerate a different strategy from a short question. |
| Deliver the full source | Question is capped at 4,000 bytes; the 63,018-byte target returned HTTP 409, CONTROL_QUESTION_INVALID | Add a digest-bound source packet; a local pathname in a remote model prompt is not source delivery. |
| Preserve review semantics | Demo returned six fixed research stages; proposal_graph hard-codes work_kind research | Preserve review kind, roles, per-lane lenses, topology, and output/handoff contracts. |
| Execute through Codex when selected | mode codex returned HTTP 409, CONTROL_MODE_INVALID; current live web mode is the direct Luna provider | Bind an actual supported executor; do not treat a model name as Codex app-server integration. |
| Preserve verifier independence | Web personas are assigned by generic role; repeated auditor roles share a fixed persona | Preserve admitted participant identity and capability eligibility separately from stage labels/personas. |
| Bound zig-zag and final verification | Web compiler emits ordinary root/all dependencies and a 3,600-second deadline | Add typed handoff/skip/repair semantics and explicit budget preservation; never publish repaired findings without reverification. |
| Honor the named skill lifecycle | No verified successor binding for its exact-sheet readiness, tension, registration and closeout contract | Define the adapter binding before confirmation or dispatch. |
| Use existing durable orchestration | Package exposes graph compilation and durable worker/history machinery | Reuse these owners; this probe did not re-prove their crash/recovery behavior. |

The core private profile at
`implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/domainspec-subagents-strategy/runtime-profile.json`
declares material-projection confirmation and durable source lifecycle. The
named generic skill requires exact temporary-sheet confirmation and registrar
consumption. These are incompatible lifecycle choices, not a stale digest that
can be repaired by rehashing. No successor form version has yet been selected.

The native proposal's `ready_for_approval` status means its own demo proposal
compiled. It does not establish skill readiness, independent tension checks,
approved fan-out, or full-plan delivery.

Probe: fresh loopback instance, missing provider key/worker paths by design,
no approval endpoint calls. Health and state returned HTTP 200. Proposal creation
returned HTTP 200. Before and after: zero runs, zero active workers, zero worker
assignments. The isolated process has been stopped; port 18743 is closed.

Tests: two proposal/approval-boundary tests and one malformed-provider-strategy
repair test passed; zero failures or ignored tests. These were three selected
tests, not the full suite. The offline web binary build passed.
See [orchestrator-probe.json](orchestrator-probe.json).

## Implementation sequence for the adapter

This is proposed work, not work performed by this review-planning request.
Keep implementation in the private successor package. No changes to public
Arcanum are required to carry private ARE sources.

```text
R0: bind skill lifecycle + exact source/output contract
       |
       +--> R1: review import + source packets -----+
       |                                           |
       +--> R2: executor/identity mapping ----------+--> R3: handoffs + lifecycle join
                                                       |
                                                  R4: offline canary
                                                       |
                                                  R5: ready review sheet
                                                       |
                                            independent tension PASS/PASS
                                                       |
                                              user confirms actual sheet
                                                       |
                                            register -> run -> verify close
```

- **R0 — Bind the consumer contract.** Add a successor-local runtime binding for
  the named skill: form owner, read-only validator, agent pool, final approver,
  temporary sheet root, deterministic registrar, paired closeout, evidence
  destinations, and native execution entry. Preserve exact-sheet semantics.
  Do not use the incompatible core private profile as an implicit fallback.
  Native AcceptedHistory remains execution truth; the skill ledger records the
  strategy lifecycle, not a competing worker scheduler.
- **R1 — Import without semantic loss.** Extend the proposal boundary to accept
  a validated review strategy and an allowlisted source manifest. Materialize
  exact full source bytes into immutable packets before any reviewer call.
  Preserve identities, hash, byte count, lenses, budgets and review type.
  Reject changed/missing sources, truncation, path traversal, unknown fields and
  silent topology rewriting. Treat source text as data, never control input.
- **R2 — Bind the executor.** Make the existing worker contract resolve an
  explicitly selected, available executor with participant eligibility and
  session continuity. For native Codex, use a supported host operation or
  app-server adapter under the orchestrator's existing worker protocol; do not
  introduce a nested model CLI fallback. Keep direct-provider mode separate.
  Missing native support remains visible rather than falling back to demo.
- **R3 — Join readiness, execution and closeout.** Compile the bounded review DAG,
  retaining logical participant identity across repair turns. Require typed
  upstream artifact readiness. Bind the unchanged confirmed sheet to registered
  native execution. Prevent unregistered dispatch, stale confirmation, duplicate
  execution and unpaired close records. Block final publication of findings
  until verification and coverage complete; incomplete review output may be
  reported explicitly as partial. Importing/proposing must never start work.
- **R4 — Prove it offline.** Fake workers exercise source fidelity, all lenses,
  dependency ordering, verifier refutation, one repair/reverification pass,
  zero-findings coverage, identity separation, timeout, failure propagation,
  stop/close behavior and restart/idempotent registration. Include changed-sheet
  rejection and atomic approval/registration recovery. Run the package tests and
  preserve the owner's dirty source changes; do not call demo output a review.
- **R5 — Materialize the actual review.** Recheck the target digest and selected
  sources; allocate participants and exact budgets. Draft the temporary strategy
  sheet under its bound root, validate it without registration, and run the two
  independent tension checks. Present the complete unchanged sheet for explicit
  user confirmation. Only then register, execute through the orchestrator, join
  every participant and record paired closeout.

Acceptance tests for R1-R4 must include positive preservation of the eight-stage
review graph and exact source bytes, not only rejection tests. The current HTTP
probe establishes the missing adapter surface, not a completed implementation.

## Construction frontier and operational support

| Lane | Runnable now / owner | Exact affected stage or causal dependency |
| --- | --- | --- |
| Product construction | ARE owner: review the existing definition/design plan and its loop/test contracts | Interaction-learning design frontier. No runtime construction authorized here. |
| Operational support | Parent: save strategy, Inventory packet and compatibility evidence | Review preparation; completed by this turn. |
| Operational support | Successor work-orchestration owner: R0-R4 adapter construction after scoped implementation approval | Exact prerequisite for executing this strategy through the requested orchestrator. |
| Operational support | Parent with executor owner: R5 readiness, tension and eventual dispatch | Depends on adapter, full sources and a ready executor; not on unrelated Inventory cleanup. |
| Deferred residue | Core Inventory owner: repair index source coverage; successor owner: optional Inventory setup | No ARE construction stage blocked. Historical discovery is diagnostic only. |
| Deferred residue | Runtime owner: wider deployment, live-provider configuration and independent durability assessment | No operational adoption or deployment is part of this request. |

Do not let Inventory cleanup, deployment preparation, or an absent provider block
independent read-only plan analysis. They do not prove the ARE plan defective.
The exact blocker here is faithful execution through the requested orchestrator.

## Inventory and skill lifecycle receipt

[Inventory packet](strategy-inventory-packet.json): core machine index parsed
with 346 entries, but validation returned lookup_readiness blocked (six source
coverage errors; 182 tag warnings). One historical integration result was selected
as an analogy and four matches excluded. Successor Inventory was unavailable at
the four checked paths. No repair, ingest, reindex or publication was performed.

Design consequence: preserve existing runtime ownership, side-effect-free
proposals, explicit execution entry, and honest unsupported/degraded states.
Current source and the HTTP probe support compatibility claims; the historical
Inventory entry does not.

- Strategy: proposed; formal sheet absent; successor runtime profile unbound.
- Confirmation readiness: not configured; local lifecycle incompatibility visible.
- Tension checks: not run; zero PASS claims.
- Human confirmation: not requested; zero requests and zero confirmations.
- Registration: unregistered; no ledger rows or consumed temporary records.
- Working agents: zero spawned, open, joined, failed, or closed.
- Native close proof: not applicable; no run was created.
- Usage telemetry: [usage-telemetry.json](usage-telemetry.json).
- Local reflection: three integration gaps justify adapter work; no automatic
  skill rewrite or inventory maintenance was performed.
- Native demo proposal retained only as scratch probe state, never as the
  executable strategy or a confirmed review sheet.

## Open Questions

1. Which successor-local form/registrar binding will preserve the named skill's
   exact-sheet contract? Resolve R0 before generating a confirmable sheet.
2. Which available executor should run the review? Prefer native Codex if its
   bridge is callable; direct-provider Luna is a distinct, explicit choice.
3. Which current ARE source files, if any, should join the full plan in the frozen
   corpus? Keep the first pass plan-only unless exact supporting files are selected.
4. What token/cost ceiling belongs to the selected executor? The proposed call,
   concurrency and time limits do not establish a monetary bound.

Next action: approve scoped implementation of R0-R4, then prepare the actual
review dispatch. Do not approve the probe's fixed research-demo proposal.
