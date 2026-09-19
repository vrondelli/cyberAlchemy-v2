# Invoke Refresh — DomainSpec v2 stable-foundation two-lane proposal

## Outcome Brief

The 21 choices are now frozen as a durable planning decision, and the next
safe route is explicit. The remaining-meta-type Work Pack needs a semantic
refresh before its first unit can be selected, while the CLI foundation needs
its own Define, Design, and Plan lifecycle before implementation. This keeps
the work moving without treating prototypes, review acceptance, or an old
machine-valid entry as production proof.

- Objective: preserve the resolved stable-foundation choices and prepare the
  exact next planning route.
- Result: proposal authoring passes; the descriptive two-lane Dispatch Spec
  validates; all mutation and execution handoffs remain gated.
- Why it matters: we can continue the other meta types and build the stable CLI
  without mixing their owners, proof denominators, or lifecycle states.

## Boundary and Next Decision

- Changed: one accepted decision record and this proposal-only refresh package.
- Unchanged: all RMT plans and targets, implementation code, profiles, schemas,
  authority, Craft and Inventory state, Git, dispatch ledger, release,
  publication, deployment, and production state.
- Open questions: exact schema bytes, CLI architecture, SWU decomposition,
  dependency allowlist, benchmarks, support owners, and release evidence remain
  future Define/Design/Plan or execution work.
- User decision: whether to authorize **planning authoring only** for the two
  lanes described below. `confirmed` is not a valid subagent-dispatch response
  because the plan dispatch type is reserved.
- Next action: approve, revise, or decline the exact planning-authoring scope in
  `REFRESH-PATCH-PROPOSAL.md`; do not select `RMT-OP-001` yet.

## Technical Details

## Invoke Result

- Mode: `refresh`.
- Spell: `invoke`.
- Mutation mode: `proposal-only` by explicit N1 boundary.
- Phase status: `pass` — the requested proposal is complete.
- Handoff status: `gated`.
- Mutation ready: `false`.
- Context: `CONTEXT-PACK.md`; strict 7/7 obligation coverage from 14 exact
  source files.
- Patch proposal: `REFRESH-PATCH-PROPOSAL.md`.
- Dispatch: `REFRESH-DISPATCH.json`.
- Dispatch validation: `pass`; receipt
  `REFRESH-DISPATCH-VALIDATION.json`.
- Distill: `pass` for proposal shape; execution handoff blocked; artifact
  `DISTILL-VALIDATION.md`.
- Machine report: `refresh-report.json`.
- Applied target changes: none.
- Authority effect: none.

## Why the current RMT entry is no longer safe to select

`WP-RMT-002` is genuinely machine-valid and `selection-ready` under its current
plan digest. That proof is not being erased. The new S1 owner decision changes
the semantic denominator that `RMT-OP-001` must bind:

- state and durable outbox occurrence commit atomically;
- publication is later, idempotent, and at-least-once;
- ambiguous acknowledgement cannot roll back a durable fact;
- retry reuses one occurrence identity; and
- compensation is forward recovery.

The existing plan contains generic exactly-once and compensation hostiles but
does not bind this full rule or its cross-W3/W4 fault matrix. Therefore the old
entry remains historical structural evidence, but Implementation Readiness
must not select it until Lane A applies and validates a new exact plan digest.

## P1 trigger decision

P1 **holds**:

- Synthesis: the route combines accepted product/profile decisions, a frozen
  review, a current Work Pack, Craft state, and package/lock evidence.
- Context protection: raw review and implementation evidence are much larger
  than the parent should carry.
- Isolation: RMT semantic planning and CLI lifecycle planning have different
  owners and should be independently reviewable.
- Parallelism: Lane A and Lane B Define can be authored independently before a
  joined validation.

Despite P1, a governed multi-agent run is **blocked**. DomainSpec's
`dispatch_type: plan` is reserved, and N1 forbids spawning. The validated
Dispatch Spec is descriptive only.

## Lanes and roles

| Lane/group | Purpose | Descriptive role | Anti-bias axis | Dependency and output |
| --- | --- | --- | --- | --- |
| A — RMT refresh | Rebind the existing seven-meta-type plan to S1 and the complete fault matrix. | `rmt-refresh-author` | Reuse existing proof versus admit that changed semantics invalidate the old denominator. | Starts after context/route validation; produces an exact 22-target refresh proposal and later staged plan receipt. |
| B1 — CLI Define | Materialize SF-01..SF-21 as one CLI-specific spec/glossary baseline. | `cli-lifecycle-author` | Durable contract versus silently treating the review shortlist as authority. | May run alongside Lane A; produces Define receipt. |
| B2 — CLI Design | Produce six architecture views and deterministic Design selection. | same lifecycle role | Long-lived architecture versus premature task decomposition. | Sequential after B1; produces `design-validator-pass` or stops. |
| B3 — CLI Plan | Produce layering, task details, atomic SWUs, closeout contracts, validation, Distill, and execution entry. | same lifecycle role | Complete acceptance boundary versus one oversized “implement CLI” task. | Sequential after B2; produces Plan receipt but selects nothing. |
| Join — integration | Prove both plans share P2/C2/S1 and do not collapse authority or write ownership. | `integration-validator` | Convenient reuse versus independent authority and evidence. | Waits for Lane A and B3; returns pass/flag/block and no mutation. |

## Subagents

No subagent is authorized or assigned.

| Descriptive role | Agent identity | Angle | Expected output |
| --- | --- | --- | --- |
| `rmt-refresh-author` | none — blocked | Attack stale semantic bindings while preserving candidate-only authority and historical receipts. | Exact lane receipt, target inventory, changed-byte proposal, validator results, blockers. |
| `cli-lifecycle-author` | none — blocked | Convert resolved choices into Define/Design/Plan artifacts without inventing implementation readiness. | Separate Define, Design selection, Plan, Distill, and execution-entry receipts. |
| `integration-validator` | none — blocked | Try to falsify shared identity, owner separation, write-scope separation, and claim ceilings. | Read-only integration verdict with reroute to the owning lane. |

If future planning help is desired, the safe current fallback is inline parent
authoring or one explicitly bounded helper at a time. Two or more planning
agents require a live type owner. A later live `review` dispatch may inspect
already-authored plans after its own proposal, validation, two tension passes,
and confirmation.

## Dependency flow

```text
accepted decision + exact context
              |
      Dispatch Spec validation
              |
       +------+-----------------------+
       |                              |
Lane A: Invoke Refresh       Lane B: Invoke Define
       |                              |
       |                     Invoke Design + selection
       |                              |
       |                         Invoke Plan + Distill
       +---------------+--------------+
                       |
             read-only integration Distill
                       |
          separate planning-byte owner gate
                       |
        Implementation Readiness only later
```

- Sequential edges: Context → route validation; Define → Design → Plan;
  joined plans → integration → owner gate.
- Parallel edge: Lane A and Lane B Define may author independently.
- Feedback edges: none are authorized in this proposal. A failed lane returns
  to its owner and needs a revised exact proposal.
- Final approval edge: owner review of exact planning bytes; it is not
  implementation or release approval.

## Lane A proposed scope

Lane A names exactly 22 future planning targets, all under the existing
`09-invoke-plan/` root. The inventory covers the Work Pack, layering,
execution pack, Distill/transport/gap artifacts, SWU and hostile contracts,
write-scope baseline, validators, execution entry, the four S1-affected task
contracts, and three affected waves.

Required outcome:

- close observation representability separately from provider/database proof;
- bind the eight-boundary W3/W4 fault matrix;
- update all dependent hashes, receipts, hostiles, wave gates, and execution
  entry;
- keep `RMT-OP-001` as at most a future frontier, never a selected unit during
  refresh; and
- preserve `authority_effect: none` and all non-production ceilings.

The full exact list and acceptance rules are in
`REFRESH-PATCH-PROPOSAL.md#lane-a--refresh-wp-rmt-002`.

## Lane B proposed scope

Lane B creates a new candidate planning root:

`projects/domainspec-v2/development/first-production-release/stable-foundation-cli/`

It must not jump directly to implementation. The accepted choices first become
a CLI-specific Define/spec/glossary baseline. Design then closes exact scope,
six views, owners, dependencies, interfaces, risks, planned witnesses, and a
two-pass selection result. Only a `design-validator-pass` result may reach a
medium/high-complexity Plan with exact SWUs and a machine-valid execution
entry.

This does not “go back” on the choices. It materializes them once so workers do
not have to rediscover or reinterpret them later.

## Integration gate

The join must prove:

1. exact equality of the accepted decision digest and P2/C2/S1 meanings;
2. one owner-ratified profile and one independent causal denominator;
3. the CLI consumes conformance/profile receipts instead of defining them;
4. no overlapping implementation write scopes without one owner;
5. historical receipts remain immutable and version-addressable;
6. neither plan changes the Craft FPR block or claims product/release state; and
7. both plans retain their own Distill, validator, and execution-entry evidence.

## Inventory preflight

- Machine index: `.arcanum/inventory/index.json`.
- Lookup readiness: `ready`; source/projection conformance passes.
- Selected entries:
  - `domainspec-v2-expanded-production-frontiers-strategy-result-synthesis`;
  - `domainspec-v2-fpr02-integrated-consumer-proof-refresh`.
- Selected evidence: broad FPR route, 13/16 profile route, consumer-proof
  residue, and production-unauthorized ceiling.
- Excluded: broader unrelated DomainSpec entries, old BTE execution, UI,
  generated caches, and raw review returns.
- Gap: no direct current Inventory row for the August stable review,
  `WP-RMT-002`, durable outbox, or compiled JavaScript. Direct current files
  remain primary.
- Design consequence: retain the accepted broad project-root P2 target instead
  of the review's narrower feature-directory placeholder.
- Authority: Inventory grants none.

The post-result Inventory mutation is deferred because N1 did not authorize
`.arcanum/inventory/**` writes. This is visible residue, not hidden completion.

## Dispatch technique trace

| Technique | Route effect |
| --- | --- |
| `sequence` | Enforces Context → validation and Define → Design → Plan ordering. |
| `scu_swu_reduction` | Prevents Lane B from producing one task-shaped CLI unit and preserves Lane A's narrow admission frontier. |
| `recomposition_proof` | Requires both plans to join into one foundation without merging owners. |
| `validation_loop` | Dispatch, Design, Plan, Distill, execution-entry, and later staged-byte validators gate each edge. |
| `owner_boundary_check` / `authority_split_gate` | Keeps definition, profile, implementation, evidence, package, Inventory, Craft, and release authorities separate. |
| `handle_handoff` / `concrete_path_evidence` | Passes exact private paths, selectors, digests, and receipts instead of raw corpus copies. |
| `residue_ledger` | Preserves current Craft blockers, missing CLI artifacts, reserved plan dispatch type, and audit needs. |
| `execution_receipt_handoff` | Requires structured lane and integration receipts before any later execution owner. |
| `protected_context_flag` | Keeps internal-confidential DomainSpec material private and out of public Arcanum/external systems. |
| `observability_grouping` | Defines future route events while recording that N1 emits no external observability mutation. |

No cited technique is used as promotion or execution authority.

## Gate and ledger state

| Gate | State | Meaning |
| --- | --- | --- |
| Decision Gate | PASS | 21 planning branches accepted; implementation remains unaccepted. |
| Context Builder | PASS | 14 files, 7/7 obligations, strict proposal coverage. |
| Inventory lookup | PASS/ready | Two historical matches; current-review/Work-Pack gap recorded. |
| Distill | PASS for proposal | Two-lane route is the smallest coherent current unit; execution blocked. |
| Dispatch Spec | PASS | Descriptive route is schema/governance valid. |
| DomainSpec dispatch form | not run / ineligible | `dispatch_type: plan` is reserved; no schema-0.8.0 candidate sheet exists. |
| Check-tension | not run | No eligible dispatch sheet; no tension agents spawned. |
| Human dispatch confirmation | not requested | `confirmed` would not authorize this blocked plan dispatch. |
| Registration | none | Dispatch ledger unchanged. |
| Runtime closeout | n/a | Zero agents spawned; no runtime dispatch opened. |
| Craft FPR gate | block | Existing FPR/backend plan blocks and live blockers remain. |
| RMT execution | block pending refresh | Current entry is stale relative to S1; no unit selected. |
| CLI execution | block | Define, Design, Plan, Distill, and execution entry do not exist. |
| Release/production | unauthorized | No gate in this package can change that state. |

## Blockers by lifecycle scope

- Refresh authoring: 0.
- Apply authorization: 1 — separate planning-authoring approval absent.
- Target lifecycle:
  - exact S1 RMT plan refresh absent;
  - CLI Define/Design/Plan absent;
  - plan dispatch type reserved;
  - `BLK-DSV2-DRIFT-ENGINE` open;
  - `BLK-DSV2-L2-ATTESTATION` open.
- Audit: future changed planning bytes need independent review and owner
  acceptance.

These downstream blockers gate handoff but do not lower the completeness of
this proposal-only Refresh artifact.

## Exact N1 changed-byte inventory

Only these new planning artifacts are in N1 scope:

1. `projects/domainspec-v2/development/first-production-release/decisions/2026-08-16-first-stable-foundation-candidate.md`
2. `CONTEXT-PACK.md`
3. `DISTILL-VALIDATION.md`
4. `REFRESH-PATCH-PROPOSAL.md`
5. `REFRESH-DISPATCH.json`
6. `REFRESH-DISPATCH-VALIDATION.json`
7. `REFRESH-REPORT.md`
8. `refresh-report.json`

No existing artifact was edited.

## Next human action

Do not answer `confirmed`; there is no confirmation-ready subagent dispatch.

To continue, approve or revise this exact next scope:

> Approve planning authoring only: prepare Lane A's staged 22-path RMT plan
> refresh and Lane B's Define/Design/Plan artifacts under the named new root.
> Do not apply Lane A, execute any SWU, mutate product/profile/authority bytes,
> register a dispatch, spawn multiple agents, or perform Git/release work.

That would authorize planning artifacts only. A later exact-byte apply gate and
a still later Implementation Readiness selection remain separate.
