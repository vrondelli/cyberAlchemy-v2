# DomainSpec v2 Architecture Pattern Library

Status: **observed and migration-selective**
Authority effect: **none**

This library names recurring architecture already visible in the current source. Each card distinguishes
observed evidence from the remaining enforcement gap. Supporting dependency, testing, and observability
rules live in the [pattern-library package](pattern-library/ARCHITECTURE-FOUNDATIONS.md).

## DSP-P01 — Typed Intent Graph

**Problem:** prose-only requirements lose identity and relationships before implementation.
**Structure:** canonical definitions and ontology nodes express typed concepts, formation criteria, and
explicit edges.
**Observed:** definitions, ontology nodes/relations, and the current implemented meta-type projection.
**Migration rule:** canonical vocabulary and graph bytes migrate together; development proposals do not
silently extend them.
**Gap:** late relationship-constraint continuations still need terminal review and real-run evidence.

## DSP-P02 — Immutable Implemented Baseline

**Problem:** a generator cannot prove what it selected if the available implementations drift during a
run.
**Structure:** a content-addressed baseline freezes canonical files, realization identities, profiles,
and validation bindings.
**Observed:** the admitted current implementation and CLI baseline artifacts.
**Migration rule:** copy the admitted working baseline and validate its exact source closure; do not mint a
new number merely because the project moved.
**Gap:** the successor needs an in-place revalidation receipt, not a reconstructed product.

## DSP-P03 — Exact Realization Selection

**Problem:** a meta-type name alone does not determine a concrete architecture.
**Structure:** instance intent selects one admitted realization identity and profile; unknown, ambiguous,
or incompatible selections fail closed.
**Observed:** three-profile realization registries, provider selectors, and baseline identities.
**Migration rule:** selection identity must appear in the target manifest and later conformance receipt.
**Gap:** the generic target-project CLI path is not yet terminal.

## DSP-P04 — Deterministic Target Materialization

**Problem:** generated code is unauditable when ambient state or discovery changes output.
**Structure:** decode typed intent, resolve a locked component closure, plan an exact write set, materialize
atomically, and emit content digests.
**Observed:** factory planning/locking, prototype realization compiler, and CLI planning slices.
**Migration rule:** no PATH, HOME, network, or implicit project discovery in acceptance-critical generation.
**Gap:** multi-project package materialization and collision/rollback coverage remain open.

## DSP-P05 — Independent Conformance Observation

**Problem:** a generator checking its own output can repeat the same defect.
**Structure:** separately registered providers inspect locked target bytes and emit normalized semantic
receipts at bounded claim ceilings.
**Observed:** the architecture-conformance factory, TypeScript/Python/Rust providers, hostile cases,
replay, reproduction, and receipt verification.
**Migration rule:** generator and observer identities remain separate even when packaged together.
**Gap:** one generic generated target has not yet crossed generation through independent observation.

## DSP-P06 — Explicit Relationship Proof Obligations

**Problem:** individually valid types can compose into an invalid architecture.
**Structure:** relationships carry source/target types, multiplicity, direction, and property-specific proof
obligations.
**Observed:** relationship signatures, BMC-REL decisions, relation providers, and joined parity checks.
**Migration rule:** relationship semantics migrate with definitions and provider tests, never as an
unbound matrix.
**Gap:** current relationship closure still lacks its final independent real-run and graph-review chain.

## DSP-P07 — Operation Effect Envelope

**Problem:** an operation may mutate or emit beyond its declared architectural contract.
**Structure:** declared reads, writes, and effects form an envelope; guards run before mutation; state and
outbox commit atomically; failures follow explicit continuations; undeclared effects reject the run.
**Observed:** Operation profile verification, W3 effects/connections providers, and infrastructure-binding
ontology.
**Migration rule:** generated operations must carry their envelope into code, manifest, and observation.
**Gap:** generic target-project emission and port-specific runtime witnesses are not terminal.

## DSP-P08 — Workflow Durable Recovery

**Problem:** a multi-step workflow can fail after durable effects and require safe continuation.
**Structure:** Recovery Intent records required recovery; Claim establishes one worker's right to act;
Lease bounds that right; replay protection and compensation evidence prevent duplicate or hidden recovery.
**Observed:** admitted durable-compensation definitions, durable-recovery architecture, Workflow providers,
and three-language recovery evidence.
**Migration rule:** preserve the vocabulary, system ontology, interface contracts, and profile evidence as
one dependency-closed set.
**Gap:** live integration bindings remain owner-deferred in the ORODI/SICL continuations.

## DSP-P09 — Evidence Is Not Authority

**Problem:** a passing validator can be mistaken for permission to promote or ship.
**Structure:** technical receipts preserve inputs, outcomes, residue, and claim ceilings; separate owner
decisions admit or reject the result.
**Observed:** authority decisions, baseline receipts, factory receipts, and blocked owner-gate packages.
**Migration rule:** evidence and owner decisions retain distinct artifact identities.
**Gap:** several blocked lanes have passing technical readiness but missing owner or independent-review gates.

## DSP-P10 — Development Evidence Lifecycle

**Problem:** a large development tree mixes active work, terminal prototypes, superseded candidates, and
research.
**Structure:** every immediate development directory receives an evidence-backed lifecycle status and
migration disposition.
**Observed:** the [53-directory evidence index](DEVELOPMENT-DIRECTORIES.md) and
[migration matrix](MIGRATION-MATRIX.md).
**Migration rule:** completed means bounded outcome, not live implementation; superseded and historical
packages remain provenance, not active runtime.
**Gap:** exact copy targets and successor layout remain the next planning slice.
