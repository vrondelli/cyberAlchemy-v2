---
tags: [discovery, framework-unification, schema-based-learning, category-theory, domainspec, cyberalchemy-v2]
node_type: discovery
is_session: false
layer: [architecture, application]
nature: conceptual
status: candidate
version: 0.1.0
last_updated: 2026-08-09
---

# Schema-Based Learning Crosswalk — DomainSpec and CyberAlchemy

## Status and evidence boundary

This is a **candidate architecture discovery**, not a promoted definition, implementation plan, or theorem. It compares the owned architecture in de los Riscos, Corbacho, and Arbib, [*Towards Schema-based Learning from a Category-Theoretic Perspective*](https://arxiv.org/html/2604.10589) (arXiv:2604.10589v1), with the DomainSpec/CyberAlchemy system.

The paper describes a structural program and explicitly leaves substantial schema, workflow, Mind, Body–Mind, and agent formalization unfinished. The mathematical correspondence was audited in the sibling workspace at `../domainspec-lean-formalization/research-ai/schema-based-learning-category-theory/research/findings.md`. That audit found useful architectural contact but no currently witnessed, definitionally sound formal deployment of the paper's distinctive hierarchy in the Lean repository.

## Discovery

The two programs address the same broad architectural fracture from different directions:

```text
Schema-Based Learning paper
schema syntax → implementation → probabilistic semantics → workflow → cognition

DomainSpec / CyberAlchemy
structured intent → artifact/capability → execution and evidence → governed correction
```

The resemblance is strong enough to sharpen boundaries and generate tests. It is not strong enough to identify the towers mathematically.

## Crosswalk

| Paper construct | DomainSpec/CyberAlchemy contact | What survives | What must not be claimed |
|---|---|---|---|
| Schema syntax | Structured intent, typed concepts, schemas, route and capability contracts | Both require manipulable structure independent of a concrete run | That current DomainSpec schemas form the paper's free multicategory |
| Implementation layer | Artifacts, capability materialization, executable routes | A specification must name how abstract structure becomes executable | That the paper's Grothendieck total category is already implemented here |
| Semantic interpretation | Runtime behavior, evidence, tests, telemetry, observed effects | Declared meaning and realized behavior must remain distinct | That an implementation automatically preserves semantic or instance fidelity |
| Schema workflows | Arcanum dispatch and capability composition | Sequential and parallel orchestration are real architectural concerns | That current dispatch composition is a duoidal category or acts on a typed `Mind` |
| Memory | Inventory, session memory, ontology evidence, read models | Storage must remain distinct from the capabilities that interpret and mutate it | That current memory surfaces instantiate the paper's presheaf and natural read/write package |
| Cognitive modules | Sigils, spells, skills, and bounded execution capabilities | Reusable operations should have typed inputs, outputs, success conditions, and observable execution | That operational capabilities are categorical cognitive modules |
| Mind / Body / agent / world | Internal governance, execution surfaces, external systems, and environment contact | The separation highlights boundaries between internal reasoning and external effects | That this repository has the paper's categorical Mind–Body coupling or agent hierarchy |

## What the paper contributes here

### 1. A three-boundary pressure test

For any schema-bearing adapter, ask separately:

1. What is the syntactic or declared structure?
2. How is it implemented or transported?
3. What observable semantics or evidence does it produce?

This is useful only as a pressure test until the fields and laws are exercised by a real adapter. **Collapse-test:** if an existing contract already exposes all three boundaries and independently checks round-trip loss, this adds documentation only.

### 2. A stricter memory/cognition separation

The paper's separation of structured memory from active cognitive modules reinforces the local rule that inventory, memory, and evidence are not authority and do not execute themselves. A concrete extension would require distinct typed read and write operations, schema-change behavior, and laws visible to a named consumer.

**Collapse-test:** if write is only identity or precomposition and no consumer can distinguish the proposed interface from the existing read seam, the contribution is zero.

### 3. Workflow specification versus execution

The paper distinguishes declarative workflow structure from Mind-level execution. This can sharpen the boundary between a dispatch specification and the capability/runtime that interprets it. It does not justify importing duoidal terminology into the current architecture.

**Collapse-test:** if the proposed correspondence has only one monoidal comparison and no second product, interchange coherence, or typed action, it reduces to existing monoidal vocabulary and contributes no new structure.

## What DomainSpec/CyberAlchemy adds

The local program has obligations that are central here and weak or absent in the paper:

- explicit authority and promotion boundaries;
- evidence that cannot silently become ontology or policy;
- lifecycle state and owner-gated mutation;
- observability and correction after execution;
- residue and drift as named failures between declared and realized layers;
- proof and counterexample discipline separating schema-level guarantees from instance-level fidelity.

The productive relationship is therefore not adoption of the paper's hierarchy wholesale. It is to use the hierarchy as an external architecture on which local authority, residue, evidence, and lifecycle discipline can be tested.

## Bounded next experiments

1. **Adapter witness:** select one existing schema-bearing adapter and write the three boundaries as typed fields plus at least one commuting or round-trip obligation. The experiment passes only if the contract changes or rejects a real adapter.
2. **Memory witness:** select one concrete knowledge store, implement a non-identity write beside its read operation, and state one law used by a named consumer.
3. **Workflow negative:** retain the current no-identification rule. Do not claim a duoidal workflow correspondence until a smallest two-product structure, interchange map, and typed action exist.

These are experiments and proof obligations, not roadmap commitments.

## Decision

Use the paper as **owned architectural precedent and a source of boundary tests**. Do not promote its vocabulary into canonical definitions and do not claim formal correspondence until a concrete witness survives the stated collapse-test.

## Connections

- [`../../../cyberAlchemy/agentic-system-deep-dive.md`](../../../cyberAlchemy/agentic-system-deep-dive.md) — local intent, execution, evidence, inventory, ontology, and promotion architecture.
- [`../CONCEPT-MAP.md`](../CONCEPT-MAP.md) — framework-unification ownership and boundary map.
- [`../../../ops/development/2026-06-21-paper-saturn-explainer/SATURN-LAYER-MAP.md`](../../../ops/development/2026-06-21-paper-saturn-explainer/SATURN-LAYER-MAP.md) — intent/reality layer separation and correction loop.
- `../domainspec-lean-formalization/research-ai/schema-based-learning-category-theory/research/findings.md` — sibling-workspace mathematical audit and final verdict matrix.
