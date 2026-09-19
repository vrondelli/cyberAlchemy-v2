# Bolina and DomainSpec Formal-Modeling Research Proposal

Status: confirmation-ready; unregistered; not executed

## P1 Trigger Decision

This request qualifies for a governed research dispatch. It needs three independent evidence domains—Bolina's current implementation and specification, primary Alloy/TLA+ semantics, and DomainSpec's existing validation and receipt architecture—plus adversarial review of non-vacuity and proof claims. Parallel context isolation and an evidence-closure synthesis are material to the answer.

## Intended Result

Determine what Bolina is, how its capability/grant path works in the exact checkout at commit `d9cff4ef37603e2725f737af48d92fbaefb46ecf`, what `SPEC.md` section 11.4 requires for BE-GRANT-01/-03/-04/-06, how the newly supplied model-checking brief agrees or conflicts with current source, and the smallest honest DomainSpec pipeline for deriving, checking, and receipting Alloy and TLA+ models.

The research must distinguish protocol intent, observed implementation, tests, formal abstraction, bounded solver evidence, implementation conformance, and security review. A finite Alloy or TLC run may find a counterexample or report no counterexample within its declared bounds; it is not universal proof, implementation equivalence, or a security claim.

## Lanes, Groups, And Subagents

- Explorers run in parallel:
  - `van Lamsweerde, Axel` reconstructs Bolina's architecture, grant state machine, invariants, implementation, tests, crash/restart behavior, and a line-by-line concordance for the supplied brief from the exact checkout.
  - `Turing, Alan` uses primary Alloy and TLA+/PlusCal/TLC sources to classify each invariant, split model-level BE-GRANT-03 from code-level conformance, specify crash-storage assumptions, compare the tools, and state bounded-evidence limits.
  - `Spivak, David` maps conflicting source claims and Bolina clauses into a candidate DomainSpec chain: `SourceBinding -> SourceDiscrepancy -> Constraint -> Obligation -> ModelProjection -> ModelCheckCase -> SolverRun -> ImplementationBinding/ConformanceCase -> ReceiptEnvelope -> drift/replay gate`.
- `Wiener, Norbert` synthesizes the three returns into one exact-bound architecture, property map, pilot, owner map, and evidence-closure matrix.
- Reviewers run in parallel:
  - `Rittel, Horst` checks precedent and prevents duplicate owners or solver semantics.
  - `Popper, Karl` attacks vacuity with a known-good trace and discriminating bad fixtures.
  - `Quine, Willard Van Orman` prevents collapse among specification, checking, proof, conformance, authority, and security.
- `Noether, Emmy` writes only `findings.md` from evidence-closed returns.
- `Bourbaki, Nicolas` audits the findings against the frozen goal and claim ceiling.
- The parent remains the final approver.

## Dependency Flow

`explorers -> synthesizer -> reviewers -> evidence closure -> writer -> auditor -> parent`

One bounded synthesizer/explorer missing-evidence loop and one bounded auditor/writer repair loop are available. The dispatch loop ceiling is two. No research agent may mutate Bolina, DomainSpec owner surfaces, Arcanum, Inventory, ontology, definitions, Git, or external systems; the writer alone may create `findings.md` in this working folder.

## Inventory Preflight

The repository Inventory machine index validated as lookup-ready. It selected the evolvable-validation-framework result, the Alloy/TLA modeling tower, the DomainSpec language type-enforcement result, the composability proof guide, and the current formalization boundary. Those sources support a candidate split in which structural checks remain schema/table-walk checks, Alloy supplies bounded relational counterexamples, and TLA+/TLC supplies finite temporal traces.

The preflight also found important residue: Bolina has no local Inventory; its exact repository is therefore direct source evidence. DomainSpec has candidate `Constraint`, `Obligation`, `TestCase`, adapter, and `ReceiptEnvelope` concepts, but no validated end-to-end Bolina extractor/model/evaluator/receipt chain. No Alloy or TLA+ model exists in the Bolina checkout. These are research inputs, not established integration capability.

## Supplied Brief Intake

The supplied brief is now bound as candidate input at SHA-256 `3c4c5d7018d98c546649ee1b6bf82dc8aa0bf57c0c45687e9b36b89d4ded931f`. It is valuable because it identifies the coupled durable-ledger and memory-only intent machines, names load-bearing ordering and crash semantics, and records the empirically confirmed pre-fix D-063 prune defect.

It is not accepted as ground truth. Initial comparison found three material contradictions that the research must resolve rather than inherit:

- its state diagram omits `APPROVED`, `EXECUTED`, and `EXECUTION_FAILED` from the normative SPEC machine;
- it says BE-GRANT-03 is outside the model even though §11.4 expressly names it—so the model-level no-bypass transition and Zig CFG/call-graph conformance must be separate obligations;
- it says orphan recovery is exactly-once, while current tests explicitly permit at-least-once re-emission until the published tombstone lands.

The bounded preflight helper also found a separate current-code issue the brief misses: `verifyGrantThen` invokes the effect, `dispatchGrant` writes the published tombstone, and only then `beginExecuting` transitions the intent. That observed order does not directly refine the SPEC's `APPROVED -> EXECUTING -> terminal` order. The research must surface this as a Bolina-owner conformance question; it cannot silently repair it in the formal model.

Its phrases “all interleavings,” “proved,” and “crash-safe by construction” also require finite bounds, filesystem assumptions, an abstraction-adequacy check, and a separate implementation-conformance bridge before they can support a claim.

## Gates And Ledger State

- Dispatch sheet schema `0.8.0`: `PASS`.
- Exact sheet SHA-256: `9daa5c3691ef2e067927075f383713fef564e8f3b4cb7a2ac71dd6a5c47e551c`.
- Material strategy SHA-256: `202f79e5649b1c759e7bf81387ab140c44215acf8dfb54800bfed15061f55bb4`.
- Dispatch Spec validation: `PASS`; authorization remains `requires_user_permission`.
- Independent tension gate: `PASS + PASS` against the exact sheet digest, with no apontamentos.
- Human confirmation: pending.
- Dispatch registration: not run; ledger unchanged.
- Research execution: not run; all nine proposed research agents remain unlaunched.
- Inventory revision 2: staged and `dry-run-ready`; projection apply remains pending this human confirmation.

The two fresh tension agents were closed-input pre-confirmation gate infrastructure, not research dispatch participants. They supersede the earlier handles invalidated by the supplied-brief revision. The bounded preflight helper is also closed and will be recorded as one helper rather than a dispatch participant.

## Expected Deliverable And Claim Ceiling

The terminal deliverable is an audited private `findings.md` containing a plain-language Bolina explanation, a supplied-brief concordance/correction matrix, current-state matrix, BE-GRANT state/action and property mapping, an Alloy-versus-TLA+ recommendation, the candidate DomainSpec owner/artifact/dependency/gate map, a minimum non-vacuous pilot, negative fixtures including the pre-fix D-063 prune crash, orphan publish-before-tombstone crash, and current effect-before-EXECUTING ordering, reproducibility and drift requirements, phased next gates, and explicit gaps.

Research findings, generated models, solver output, receipts, and Inventory remain non-authority. This dispatch cannot promote DomainSpec types, alter Bolina, claim a proof was executed, establish implementation conformance or security, publish Arcanum material, or authorize implementation.

## Next Human Action

Reply exactly `confirmed` to accept the staged Inventory revision, authorize its two-projection apply, and authorize registration and execution of this frozen material strategy. Any requested material revision will be revalidated and re-tensioned before a new confirmation request. Discussion alone is not confirmation.
