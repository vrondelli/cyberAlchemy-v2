---
module: evolvable-validation-framework
version: current
status: canonical-explainer
updatedAt: 2026-08-24
docType: canonical-overview
authorityScope: explanation-and-navigation
---

# Evolvable Validation Framework (EVF)

## In One Sentence

EVF turns a DomainSpec claim into a traceable chain of obligations, executable
checks, negative cases, observed results, and digest-bound receipts so the
system can evolve without letting its claims grow faster than its evidence.

## Why EVF Exists

A specification can say what should be true, and a test can say what happened
once. Neither fact alone explains:

- which specification statement produced the test;
- which formal obligation the implementation must satisfy;
- which code was actually checked;
- which deliberately broken cases were rejected;
- whether the result can be replayed from the same inputs;
- what changed after the result was issued; or
- how much confidence the result honestly supports.

EVF connects those pieces. Its core rule is:

```text
claim <= proof
```

Here, `proof` means the exact evidence declared by a receipt. Depending on the
lane, that evidence may be an executable test, mutation result, bounded model,
formal theorem, runtime observation, or a typed combination of them. EVF does
not treat these different evidence kinds as interchangeable.

## Where EVF Sits

- **DomainSpec v2 owns the meaning being validated.** It supplies typed
  concepts, relationships, constraints, specifications, and implementation
  obligations.
- **EVF owns the evidence chain around that meaning.** It derives or records an
  obligation, binds it to an implementation, evaluates it, and issues a bounded
  receipt.
- **CyberAlchemy v2 owns authority and promotion boundaries.** An EVF receipt
  may support a promotion decision, but it cannot promote itself.

EVF is private DomainSpec implementation and evidence work. It must not be
copied into public Arcanum capability surfaces as private product material.

## The Evidence Chain

```text
source claim
  -> normalized representation
  -> formal obligation
  -> implementation binding
  -> generated or selected check
  -> positive execution
  -> negative mutation execution
  -> evaluator verdict
  -> digest-bound receipt
  -> bounded claim
```

| Artifact | Plain-language question |
| --- | --- |
| Source claim | What did the specification actually say? |
| Normalized representation | What exact machine-readable meaning are we evaluating? |
| Formal obligation | What must be true for the claim to hold? |
| Binding | Which implementation elements are responsible for satisfying it? |
| Check | What executable or formal procedure evaluates the obligation? |
| Mutation | Does the procedure reject a deliberately incorrect variant? |
| Verdict | What did the evaluator observe? |
| Receipt | Which exact inputs and outputs support the result? |
| Claim ceiling | What may we say—and what may we not say—from this evidence? |

If a bound input changes, its digest changes. The earlier receipt remains valid
only for its original bytes and scope; it does not silently certify the new
state.

## Formal Obligations Are Inside EVF

A formal obligation is a first-class EVF artifact. It states what must be true,
independently of whether the evidence comes from a test, a bounded model, or a
theorem prover.

EVF may derive an obligation from a DomainSpec statement or record an explicitly
authored predicate. It must preserve the source and owner of that meaning. EVF
must not invent a missing semantic rule merely to make a validation executable.

Three evidence levels remain distinct:

1. **Obligation:** the condition that must hold.
2. **Validation evidence:** a test, model, or observation showing that the
   condition holds within a declared boundary.
3. **Formal proof:** a theorem showing the condition follows from explicit
   assumptions.

A passing test is not a theorem. A bounded Alloy result is not an unbounded
proof. A Lean theorem is not runtime conformance unless the theorem's model is
also bound to the executed implementation and current inputs.

## Relationships Are the First Proving Ground, Not the Whole Scope

The strongest current EVF evidence begins with graph composition, especially
one `Rule --[enforces]--> Operation` edge. Relationships were selected because
one edge crosses specification, obligation, binding, test, execution, mutation,
and receipt boundaries in a small but meaningful unit.

The same evidence pattern can apply to:

- node and field invariants;
- data constraints;
- preconditions and postconditions;
- temporal ordering;
- reachability, cycle, and closure properties;
- cross-feature consumer contracts;
- authorization and policy decisions;
- runtime conformance; and
- observability obligations.

Those broader uses are capability directions, not claims that every category is
already implemented or validated.

## Example Ladder

All three examples preserve the same invariant: EVF must bind one declared
claim to exact evidence and must state what that evidence does not prove.

### Low: One Rule And One Operation

**Observed EVF slice:** a key-and-door fixture contains an `enforces` relation
between an authored rule and an operation.

```text
OnlyKeyHolder --[enforces]--> OpenDoor
```

The obligation says that `OpenDoor` may succeed only when the bound rule holds.
EVF binds the source graph, obligation, rule, operation, test, evaluator, and
receipt. A positive case must pass and deliberately incorrect mutations must
fail.

**Demonstrates:** one relationship can traverse the whole evidence chain and
produce replayable positive and negative receipts.

**Does not prove:** that every relationship, every rule, or every application is
correct.

### Medium: Repeat The Method On Another Slice

**Added complexity:** a second admitted slice introduces another binding and an
independent denominator check while preserving the same evidence contract.

The current L1 evidence uses two distinct Financial Settlement slices on one
frozen graph and source digest. EVF compares their receipts and checks for hidden
skips, invented expected values, and digest drift.

**Demonstrates:** the L0 result was not merely a one-fixture trick; the method is
repeatable within the admitted L1 boundary.

**Does not prove:** full backend breadth, every node kind, every relationship,
or behavior outside the frozen source boundary.

### Complex: Evaluate A Graph Law Across Providers

**Added complexity:** provider-neutral facts, two evaluation technologies, a
join, an independent closure review, and explicitly deferred properties.

The current L2 slice evaluates one exact-instance reachability property from one
shared fact snapshot. Souffle and Alloy results are joined without inflating the
claim. The receipt preserves the selected property and records that cycle,
closure, additional properties, and unbounded solving remain outside scope.

An external consumer such as IOLM is a separate owner lane. It may consume the
exact EVF handle set and issue its own receipt, but EVF cannot author or
substitute that consumer evidence.

**Demonstrates:** one bounded graph property can be evaluated across independent
providers while preserving source identity and owner boundaries.

**Does not prove:** all graph laws, unbounded correctness, consumer integration,
release readiness, or production behavior.

## How EVF Evolves

| Layer | Question answered | Current evidence ceiling |
| --- | --- | --- |
| L0 | Can one composed edge yield a trustworthy executable receipt? | One candidate-local `enforces` slice. |
| L0C | Can a private consumer use the exact proof without semantic or authority drift? | Separate external owner receipt required. |
| L1 | Is the evidence path repeatable on another admitted slice? | Two frozen Financial Settlement slices. |
| L2 | Can one graph property be evaluated without collapsing into a local check? | Selected bounded reachability; cycle and closure deferred. |
| L3 | Is broad backend and consumer completeness credible? | Design-gated; exact denominator and independent consumer receipts required. |

After every layer, EVF retains the earlier receipts. A broader layer may add new
evidence, but it may not rewrite the boundary of an earlier result.

## What EVF Is Not

EVF is not:

- only a relationship validator;
- a general theorem prover;
- a replacement for unit, integration, or runtime tests;
- permission to invent missing formal semantics;
- automatic evidence that code in production matches a model;
- an authority, admission, promotion, deployment, or release mechanism; or
- a way to combine several narrow passes into one broad claim without a typed
  and non-inflating join.

## Current Maturity

The current evidence supports candidate-local L0 and L1 results and one selected
L2 reachability result. The independent L2 closure receipt is a `FLAG` with zero
blockers, not a release decision. L2 cycle and closure properties and the wider
L3 backend/consumer claim remain open or design-gated.

Recent runtime work repaired briefing and result fidelity in Dispatch Spec and
Orchestrate and received exact owner acceptance for its bounded 53-path
candidate. That makes the execution machinery more trustworthy; it does not
resolve the separate BTE, IOLM, canonical-apply, readiness, or release gates.

## Canonical Navigation

- [Complete user guide](COMPLETE-GUIDE.md) — concrete walkthroughs, result interpretation, troubleshooting, and extension rules.
- [Architecture](ARCHITECTURE.md) — stable components, contracts, flows, boundaries, runtime view, and evolution rules.
- [Implementation layering](IMPLEMENTATION-LAYERING.md) — L0 through L3 decision boundaries.
- [Work Pack](WORK-PACK.md) — tasks, evidence overlays, blockers, and owner handoffs.
- [DomainSpec v2](../../README.md) — implementation home and private boundary.
- [CyberAlchemy v2](../../../../cyberAlchemy-v2/README.md) — authority and promotion boundary.
- [Runtime owner acceptance receipt](dispatch-runs/20260823T140821Z-p0-owner-evidence-review/runtime-repair-candidate/OWNER-ACCEPTANCE-RECEIPT.json) — exact accepted runtime-repair scope and retained gates.

This README is the canonical entry point for explaining EVF. The linked
contracts, receipts, and owner decisions remain authoritative for their exact
technical claims and lifecycle states.
