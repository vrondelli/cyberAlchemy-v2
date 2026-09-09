---
title: TDE to EVF Evidence Flow Implementation Layering
status: planning-candidate
updatedAt: 2026-09-04
owner: CyberAlchemy v2 product owner
scope: system
authority_effect: none
---

# TDE to EVF Evidence Flow Implementation Layering

This plan grows one ownership-correct TDE-to-EVF proof into a reusable evidence
framework. It does not approve the product, admit a provider, authorize
implementation, or grant publication, release, deployment, or operational
authority.

## Context

- Target: TDE-neutral obligation derivation followed by EVF-owned provider
  selection, execution, evidence normalization, and bounded joining.
- Current state: L0, L1, and L2 are implemented construction candidates. One stable
  TDE-neutral graph-law obligation is consumed independently by EVF-owned
  Souffle 2.5 and Alloy 6.2.0 routes. Both exact local runtimes currently report
  no counterexample, producing `SUPPORTED_BOUNDED` for that obligation only.
  L2 additionally proves that all 14 declared degraded-evidence controls remain
  typed non-pass and that the positive and identical-replay controls are stable.
- Primary user: a developer or reviewer who needs to know exactly which claim
  was checked, which tool checked it, and what the result is allowed to support.
- Primary constraint: provider-specific evidence must not leak into TDE's
  provider-neutral ownership boundary, and no bounded result may be inflated
  into general correctness or authority.
- Current validation limitation: the TDE package has no local `node_modules`,
  so its current typecheck and test suite are `not_evaluable`, not failed.

## Layering Method

- Each layer answers one decision question.
- Later layers add one bounded improvement while preserving earlier guarantees.
- Verification happens in every layer.
- Evidence types are alternatives selected by the obligation; they are not a
  ladder where Lean, TLA+, Alloy, or runtime tests automatically outrank one
  another.
- Promotion means only that construction may proceed to the next layer. It does
  not mean product approval or operational admission.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Visible outcome | Main risk reduced | Promotion decision |
| --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether one TDE-neutral obligation can be consumed by one EVF-owned provider and produce a bounded result. | One current graph-law obligation, one Souffle route, one EVF join receipt. | A reviewer can trace claim to exact input, tool run, raw evidence, and bounded result. | TDE/EVF ownership and handoff may be wrong. | Continue, pivot the boundary, or stop. |
| L1 | After this layer, we know whether the same obligation can be checked repeatably through independent provider routes without voting. | Add an Alloy route beside Souffle, rerun both, and join typed outcomes. | Agreement, disagreement, missing evidence, and unresolved evidence remain visible. | One provider or adapter may hide a translation error. | Harden, narrow to one route, or stop. |
| L2 | After this layer, we know whether the flow fails safely under stale, malformed, missing, timed-out, or contradictory evidence. | Currentness checks, negative controls, replay, mutation tests, limits, and typed non-pass outcomes. | Operators receive a causal non-pass instead of a false success. | Evidence drift and degraded execution may be mistaken for proof. | Expand evidence families, remediate, or stop. |
| L3 | After this layer, we know whether EVF can select the right provider family for different obligation kinds without changing TDE's neutral contract. | One bounded example for each justified route: executable runtime, SMT, theorem, and temporal only where a real obligation exists. | The user sees why a tool was chosen and what its result means. | Tool availability may drive semantics or create a fake universal stack. | Package the proven route set, defer unsupported routes, or stop. |
| L4 | After this layer, we know whether the proven flow can be reused by another product slice without weakening provenance or claim ceilings. | Versioned contracts, adapter interface, conformance fixtures, migration guide, and a second independently bound obligation. | Another product slice can adopt the mechanism without copying hidden assumptions. | A one-off prototype may be mistaken for a reusable product capability. | Prepare a product candidate for review or return to construction. |

## Capability Progression

| Capability | L0 | L1 | L2 | L3 | L4 |
| --- | --- | --- | --- | --- | --- |
| TDE output | One neutral obligation and exact fact manifest. | Stable IDs and byte-repeatable regeneration. | Stale and malformed inputs fail closed. | Same neutral contract supports distinct route kinds. | Versioned reusable obligation contract. |
| EVF routing | One explicit Souffle selection. | Independent Souffle and Alloy selections. | Unsupported, unavailable, and timeout routes remain typed non-pass. | Route by obligation kind: runtime, solver, theorem, relational, temporal. | Published candidate adapter contract inside the private product boundary. |
| Evidence join | One bounded provider result. | Non-voting two-provider join. | Freshness, replay, disagreement, and negative controls. | Route-specific joins preserve different result semantics. | Cross-product conformance fixtures and migration checks. |
| Claim ceiling | Exact closed-world Datalog result only. | Exact Datalog and bounded Alloy results only. | No degraded result can become success. | Runtime, SMT, Lean, and TLC claims remain distinct. | Reuse does not broaden any claim. |

## L0 - Ownership-Correct Minimum Proof

### Goal

Prove the smallest complete flow:

```text
exact FormalClaim and capability assessment
  -> TDE neutral obligation plus fact manifest
  -> EVF Souffle adapter
  -> exact Souffle invocation
  -> raw Violation.csv and process receipt
  -> EVF bounded join
```

### Included scope

- Select one existing graph-law property and bind its exact current source bytes.
- Give TDE ownership of the neutral obligation ID, normalized subject, expected
  relation or oracle requirement, provenance, residue, and claim ceiling.
- Give EVF ownership of the Souffle translation, runtime binding, invocation,
  raw output, normalization, and join.
- Rebind the experimental code away from the absent historical work-pack and
  evidence tree.
- Run one positive case and one deliberate violation case.

### Explicitly deferred

- Alloy, SMT, TLA+/TLC, Lean, Python, Rust, scale, packaging, and product approval.
- General provider discovery or automatic selection.
- Publication, release, deployment, and production correspondence.

### Exit evidence

- The neutral obligation contains no provider-specific source or command.
- The EVF adapter deterministically creates the exact Souffle input.
- The provider receipt binds runtime, command, environment, inputs, raw output,
  timestamps, limits, and normalized result.
- The positive and negative cases produce their expected bounded outcomes.
- Repeating the derivation over unchanged bytes reproduces the same identities.

### Promotion decision

- Continue when the entire trace is current, replayable, and ownership-correct.
- Pivot when the obligation cannot express the selected graph law without
  provider-specific meaning.
- Stop when the source meaning or expected relation is ambiguous.

## L1 - Independent Relational Corroboration

### Improvement over L0

- Add an EVF-owned Alloy exact-instance translation for the same obligation.
- Execute Alloy 6.2 with its exact bounded scope and solver configuration.
- Join Souffle and Alloy results without majority voting.
- Preserve the L0 neutral obligation unchanged.

### Exit evidence

- Both adapters consume the same immutable obligation identity.
- Translation receipts show no omitted or invented facts.
- Repeated runs are semantically and byte stable where promised.
- Agreement is reported as two bounded observations, not a proof of unbounded
  correctness.
- Disagreement, missing evidence, and `unknown` remain typed non-pass outcomes.

## L2 - Reliability and Governance Hardening

### Improvement over L1

- Add digest-currentness checks at every bound reference.
- Add malformed-output, timeout, output-limit, runtime-drift, stale-input,
  provider-disagreement, and missing-evidence controls.
- Replay provider receipts and mutation-test adapters and joins.
- Preserve raw provider output beside normalized evidence.
- Make collect-all preacceptance non-effectful; dependent checks become
  `not_evaluable` with causal blockers.

### Exit evidence

- Every declared negative control is observed and produces the specified
  non-pass outcome.
- No standalone `all_current` flag can override a stale bound reference.
- One successful provider cannot convert another unresolved provider into
  success.
- Validation produces no acceptance, admission, release, or authority effect.

## L3 - Evidence-Family Expansion

### Improvement over L2

Add a provider family only when a current obligation requires its semantics:

| Obligation kind | TDE responsibility | EVF provider route | Result ceiling |
| --- | --- | --- | --- |
| Executable bounded behavior | Derive neutral cases and exact runtime binding requirements. | Vitest or another explicitly bound runtime runner. | Observed behavior for exact cases and environment only. |
| Solver-oriented logical question | Carry exact formula and preservation handles. | SMT provider. | `sat`, `unsat`, or `unknown` under the exact theory and limits only. |
| Mathematical theorem | Carry the exact FormalClaim handle; no ordinary TDE test rendering. | Lean theorem-provider route. | Checked proposition in the exact Lean environment only. |
| Bounded relational structure | Carry neutral relation and scope requirements. | Alloy provider. | Instance or no counterexample inside the exact scope only. |
| Closed-world graph derivation | Carry neutral facts and expected relation. | Souffle provider. | Exact derived tuple set only. |
| Temporal state behavior | Carry exact temporal obligation and preservation handles. | TLA+/TLC provider, implemented only when a real temporal case exists. | Bounded model exploration under the exact configuration only. |

### Exit evidence

- Each added route has one real obligation, adapter tests, negative controls,
  provider receipt, join behavior, and plain-language result semantics.
- Tool choice follows the obligation kind, not tool availability.
- Lean, TLA+, Alloy, Souffle, SMT, and runtime tests never become a mandatory
  combined stack.
- Unsupported families remain explicitly unsupported rather than simulated.

## L4 - Reuse and Product-Candidate Packaging

### Improvement over L3

- Extract versioned neutral-obligation and EVF-adapter interfaces.
- Add contract fixtures that every provider adapter must pass.
- Bind a second independently owned product obligation without copying the
  first obligation's assumptions.
- Add compatibility, migration, operator, and reviewer documentation.
- Assemble one exact testable product candidate and its current product-test
  evidence for separate owner review under D65.

### Exit evidence

- Two independently bound obligations use the same contracts successfully.
- Provider adapters pass the same conformance and degraded-mode fixture set.
- Earlier obligation identities, raw evidence reachability, and claim ceilings
  remain intact.
- The exact product-candidate digest and current test evidence are frozen for a
  separate product-approval decision.

## Implementation Wave Backbone

| Wave | Layer | Product-construction work | Verification | Explicit stop |
| --- | --- | --- | --- | --- |
| W0 | L0 | Separate neutral TDE output from the EVF Souffle adapter and rebind one current obligation. | Positive, deliberate-violation, replay, and exact-reference checks. | Ambiguous meaning, missing selected source, or provider-specific meaning required inside TDE. |
| W1 | L1 | Add the EVF Alloy adapter and non-voting dual-provider join. | Translation preservation, independent receipts, agreement and disagreement tests. | Scope cannot be made exact or translations do not preserve the same obligation. |
| W2 | L2 | Add degraded-mode, freshness, mutation, and replay hardening. | Complete negative-control matrix and collect-all preacceptance. | Any degraded state can still produce success. |
| W3 | L3 | Add only evidence families demanded by real obligations. | One current vertical and negative controls per added family. | A route lacks distinct semantics, an exact provider, or a real obligation. |
| W4 | L4 | Package versioned contracts and bind a second product slice. | Cross-slice conformance, migration, and product-test suite. | Reuse broadens claims or hides product-specific meaning. |

## Construction and Operational-Support Separation

### Product construction frontier

- Completed construction candidates: L0 binds one TDE-neutral graph-law
  obligation to an EVF-owned Souffle route; L1 preserves that obligation and
  adds an independent Alloy route plus a non-voting join; L2 adds collect-all
  currentness, integrity, freshness, raw-output, degraded-mode, replay, and
  mutation controls.
- Current frontier: L3 evidence-family expansion.
- Runnable construction work: select one current obligation whose semantics
  genuinely require a provider family not already covered by Souffle or Alloy,
  then implement one bounded vertical for that obligation.
- Causal construction blocker: no such L3 obligation has yet been selected.
  Tool availability alone cannot authorize or justify a new route.

### Operational support residue

| Task | Owner | Affected stage | Does it block L0? |
| --- | --- | --- | --- |
| Preserve the exact local Souffle 2.5, Alloy 6.2.0, and Temurin Java 17 bindings; detect hash or version drift before execution. | Development environment owner. | L0/L1 provider execution. | Resolved locally for the current construction run; the runtimes are not operationally admitted. |
| Restore or install the declared Node/pnpm dependency environment. | Development environment owner. | Product-test execution. | Blocks current TypeScript validation, not boundary design. |
| Reconcile stale TDE guides with the current Alloy/Souffle code and this boundary. | Documentation owner with TDE/EVF reviewers. | Reviewer comprehension. | No, unless the guide is selected as an implementation input. |
| Preserve the requested `.agents/skills/task-session/` deletion as separate dirty-worktree residue. | Repository owner. | No D65 product stage. | No. |
| Register or admit a construction plan. | CyberAlchemy v2 Goals owner. | Construction binding. | Currently blocked; does not erase runnable prototype work. |
| Commit, publish, release, or deploy. | Separate publication or operational owner. | Post-approval operational lane. | Deferred and unauthorized. |

## Non-Regression Guardrails

- TDE never selects a provider or embeds provider-specific source in the neutral
  obligation.
- EVF never changes the business meaning or the FormalClaim.
- Every result remains bound to exact current inputs, runtime, environment,
  limits, raw output, and result semantics.
- `unknown`, timeout, malformed, stale, missing, unsupported, and contradictory
  evidence remain non-pass.
- Later layers do not broaden earlier claim ceilings.
- Product-test success does not itself grant product approval, admission,
  activation, publication, release, deployment, or external-effect authority.

## Recommended Next Layer

Prepare L3 only after selecting a real current obligation that needs a distinct
evidence family. L2 now shows that stale, malformed, missing, timed-out,
oversized, drifted, replayed, tampered, unresolved, or contradictory evidence
cannot become success across the current Souffle and Alloy vertical.

The most important deferred scope is TLA+/TLC. It should be implemented only
after a real temporal obligation exists; its absence does not block the current
graph-law vertical or L2 hardening.

## Current L0/L1/L2 Binding

- Obligation: `tde.obligation.2c8aedf57e0e34f0de55d023b6dee07ce48d37d4c833503530d9592e8fcbe77b`.
- Souffle: exact version 2.5 executable, hash-bound; C preprocessing is disabled
  because EVF generates a closed query with no includes or macros.
- Alloy: exact version 6.2.0 distribution, hash-bound, executed with SAT4J.
- Java: exact Temurin 17.0.19+10 executable, hash-bound for the Alloy route.
- Current joined result: `SUPPORTED_BOUNDED`; both providers report no
  counterexample under the declared facts, translations, scopes, and limits.
- L2 positive control: `SUPPORTED_BOUNDED` from the current exact provider
  receipts after source, identity, translation, runtime, raw-output, freshness,
  comparability, and claim-ceiling checks.
- L2 matrix: 16 of 16 entries pass: one current positive control, one identical
  replay control, and 14 degraded-evidence controls covering missing evidence,
  timeout, malformed output, tamper, forged-current stale evidence, runtime drift,
  cross-obligation replay, malformed raw output, output limits, disagreement,
  unresolved evidence, adapter mutation, selected-source drift, and identical
  replay.
- Authority: local construction evidence only; no product approval, runtime
  admission, publication, release, deployment, or operational authority.
