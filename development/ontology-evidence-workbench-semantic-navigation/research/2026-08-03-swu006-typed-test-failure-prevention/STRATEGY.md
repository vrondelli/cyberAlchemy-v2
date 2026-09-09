# SWU006 Typed-Test Failure And Prevention Research Strategy

## Preliminary answer

The current evidence proves that the SWU006 generalized build reached the
focused typed-test gate and failed, but it does **not** prove which assertion,
type error, or file caused the failure. The builder reduced the command result
to `TYPED_TESTS_FAILED`, removed its temporary workspace, and emitted no
failure handle or typed-test receipt. Therefore the first reusable defect we
can already name is diagnostic retention; the candidate defect still requires
exact reconstruction.

This dispatch will determine how far the exact root cause can be recovered
without another network attempt, then distinguish a patch or test correction
from the reusable code, contract, and skill changes that would prevent the next
one-attempt failure from becoming opaque.

## P1 trigger

This is a governed `research` dispatch.

- **Synthesis:** the answer must join candidate patch/test evidence, builder
  command and cleanup behavior, Task Session and Refresh receipts, observer
  signals, and maintenance ownership.
- **Context protection:** the patch chain, seven typed files, fifteen tests,
  build code, receipts, and lifecycle contracts exceed useful parent context.
- **Isolation:** the exact cause must remain a hypothesis unless independently
  supported, while prevention must survive separate ownership and witness
  attacks.
- **Parallelism:** candidate reconstruction, diagnostic chronology, and formal
  owner-contract analysis are independent first-wave tasks.

## Lanes and subagents

### Group 1 — explorers, parallel

Anti-bias axis: composite methodology and source corpus.

| Agent | Role | Angle | Expected output |
| --- | --- | --- | --- |
| Hewitt, Carl | explorer | Candidate and typed-test reconstruction | Exact candidate/test contradictions, narrowest proved cause or ranked hypotheses, command path, selectors, and a no-network witness. |
| Beer, Stafford | explorer | Diagnostic-lifecycle chronology | Command-to-cleanup timeline, evidence-retention matrix, and first irreversible information-loss point. |
| van Lamsweerde, Axel | explorer | Prevention contract and owner allocation | Exact code/test/contract/skill change map, failure-evidence schema, fixtures, and security constraints. |

### Group 2 — synthesizer, sequential

Turing joins the three returns into an exact-binding diagnosis. It must keep
three categories separate: proved candidate cause, ranked hypotheses left by
missing diagnostics, and prevention that is valid regardless of the product
cause.

### Group 3 — skeptics, parallel after synthesis

Anti-bias axis: attack vector.

| Agent | Role | Gate | Expected output |
| --- | --- | --- | --- |
| Lakatos, Imre | skeptic | Precedent | Existing owner for every candidate; already-deployed/build-from-owned/precedent-clean classification; no new skill when an existing owner only lacks a branch or fixture. |
| Popper, Karl | skeptic | Non-vacuity | Deterministic no-network failing-test witness that retains actionable diagnostics while preserving bounded cleanup and no retry. |
| Quine, Willard Van Orman | skeptic | Definitional soundness | Non-collapse across product defect, test defect, failure evidence, blocker, authorization, observer, and maintenance states. |

### Groups 4 and 5 — writer, then auditor

Ahrens writes only `findings.md` after exact-binding evidence closure.
Brandenburg audits only that file and may request one bounded revision. The
parent remains final approver.

## Dependency flow

```text
explorers (parallel)
  -> synthesizer
     -> explorers feedback (missing exact evidence only, cap 1)
     <-> skeptics (zig-zag, cap 1)
        -> evidence closure
           -> writer
              -> auditor
                 -> writer revision (cap 1)
                    -> parent final approval
```

Feedback edges are repair routes only. They do not create an initial
dependency, authorize a build retry, or widen the consumed network exception.

## Evidence and scope contract

The dispatch uses `exact-binding`. Every load-bearing row must name an immutable
source identity, exact path plus function, test, hunk, JSON Pointer, command, or
receipt field; explorer-return reference; evidence scope; and observed,
executed, or unverified proof status.

Research agents are read-only and network-forbidden. They may not install
dependencies, invoke the generalized build, run browser acceptance, edit the
candidate or planning, mutate Arcanum/DomainSpec authority, touch Git, publish,
or deploy. The writer owns only `findings.md`; the parent strategist owns the
verbatim explorer transcript and normalized receipts.

## Inventory preflight

- Machine index: `.arcanum/inventory/index.json`
- Lookup readiness: `ready`
- Validation: pass, zero failures, 141 non-blocking uncontrolled-tag warnings
- Selected:
  - verified OEW runtime rebuild lessons;
  - audited Invoke one-shot workflow findings;
  - the current pre-Task-Session investigation partition as a strategy
    precedent only.
- Selected unindexed leads:
  - the terminal SWU006 receipt and observer run;
  - builder and builder tests;
  - binding006 and patch0004;
  - the live mutation-admission contract.
- Excluded:
  - a rejected OEW architecture/runtime audit as accepted evidence;
  - unrelated host thread-cap residue;
  - Body War visual-design entries that cannot identify the typed failure.
- Gaps:
  - the exact failing assertion and diagnostic were not retained;
  - the current incident is not indexed;
  - owner scope across builder, Task Session, observer, and maintenance remains
    unproved;
  - no current failure fixture proves bounded diagnostic preservation.

Design consequence: this is local exact reconstruction plus reusable failure-
evidence design, not another broad OEW architecture or UX survey. Inventory is
a discovery read model and grants no authority.

## Gate and ledger state

- Candidate form: schema `0.8.0`, without `evidence_binding`
- Confirmation readiness: pass under schema 0.8.0
- Admitted sheet SHA-256:
  `0eedc6bc6eca0933cea5ccce8c8aa7c5e55e0c15b6b8b6b22e96bc69ada18b9c`
- Material-strategy SHA-256:
  `6d8901e0bbbfcad24b65fd7877118bb045b071f7e1a995a8af9703c2b98fb431`
- Dispatch Spec: capability-bound route pass
- Check-tension: independent PASS/PASS on the admitted digest
- Human confirmation: pending
- Registration: none
- Research agents started: none
- Ledger mutation: none
- Closeout expectation after confirmation: one registration row and one close
  row, with every spawned agent joined and closed

## Claim ceiling

The result may establish an evidence-bound root cause, or an honest ranked
hypothesis set when the deleted diagnostics make exact recovery impossible. It
may recommend later owner-scoped code, test, planning, Task Session, observer,
or skill maintenance. It cannot retry the build, implement changes, pass the
typed suite, complete SWU006, select SWU007, promote ontology, publish, release,
deploy, or establish production readiness.

## Next human action

Reply exactly `confirmed` to authorize registration and research execution of
this admitted material strategy.
