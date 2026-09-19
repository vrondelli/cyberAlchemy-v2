# DomainSpec Canonical Definitions

Purpose: authoritative source of DomainSpec research definitions.

This document is the normative definition contract for the DomainSpec evidence program. The paper is a condensed synthesis of these definitions plus experimental evidence.

## Authority and Precedence

1. `definitions/DEFINITIONS.md` is the canonical definition source.
2. `definitions/DEFINITIONS-INDEX.md` is the lookup/index layer that maps IDs to artifacts and examples.
3. `papers/domainspec-paper.md` is a narrative condensation for publication and discussion.

When wording differs across artifacts, this document is authoritative for definition semantics.

> **Open-core split (2026-06-14).** The DomainSpec **wedge** vocabulary — `DS-D1`, `DS-D2`,
> `DS-D3`, `DS-D7`, `DS-D8`, `DS-D10`, `DS-P1`, `DS-P2`, `DS-P3` — is now **canonical in public
> `arcanum/definitions/DEFINITIONS.md`**. For those IDs, arcanum is authoritative and this file
> defers to it (the entries below are retained as a local mirror pending de-duplication).
> This document remains canonical only for the **private moat cluster** (`DS-C3`, `DS-D9`,
> `DS-COR-1`, `DS-F1`, `DS-F5`, `DS-F6`, `DS-M13`) and the **ambiguous cluster** held private by
> default (`DS-D4`, `DS-D5`, `DS-D6`, pending decoupling review). Moat definitions must not be
> published.

## Definition Families

- `DS-C*`: contribution-level definitions
- `DS-D*`: core architecture and ontology definitions
- `DS-P*`: structural properties
- `DS-COR-*`: corollaries
- `DS-F*`: formal constructs and equations
- `DS-M*`: research methodology and execution definitions

Interpretation rule: each DS-* section includes an inline `Intuition` note as non-normative guidance colocated with the formal definition.

## Contribution-Level Definitions

### DS-C1: Meta-Architecture Contribution

DomainSpec defines a dual-track L0-L7 architecture where domain semantics, governance, and execution evidence are structurally traceable.

Intuition: the framework keeps business meaning and operational evidence on coordinated tracks so decisions and outcomes can be traced across layers.

### DS-C2: Deterministic Derivation Contribution

Given fixed concept graph and fixed derivation rules, test and metric obligations are deterministic and reproducible.

Intuition: same modeled feature plus same rules must yield the same derived obligations every time.

### DS-C3: Governance Attenuation Contribution

Governance fidelity attenuates as governance density rises unless structural interventions are applied.

Intuition: adding governance controls helps only up to a point; beyond that, coordination overhead can reduce effective fidelity.

### DS-C4: Meta-Circular Self-Governance Contribution

Governance is itself governed through signal, threshold, and tuning-loop contracts.

Intuition: the governance system is monitored and tuned by explicit feedback, not treated as static.

## Core Architecture and Ontology Definitions

### DS-D1: Meta-Type System

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-d1-meta-type-system). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

### DS-D2: Typed Relationship System

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-d2-typed-relationship-system). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

### DS-D3: Concept Graph

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-d3-concept-graph). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

### DS-D4: Derivation Function

Test obligations are:

$$
T = f(G, \Delta) = \bigcup_{i=1}^{|\Delta|} \delta_i(G)
$$

where $\Delta$ is the derivation-rule set.

Intuition: derivation is a deterministic union of rule outputs over the same graph.

### DS-D5: Layer Set and Dual-Track Projection

Layer universe:

$$
\mathcal{L} = \{L_0, L_1, L_2, L_3, L_4, L_5, L_6, L_7\}
$$

Business projection:

$$
\mathcal{L}_B = \{L_0, L_1, L_2, L_{3B}, L_{4B}, L_5, L_{6B}, L_{7B}\}
$$

Operational projection:

$$
\mathcal{L}_O = \{L_0, L_1, L_2, L_{3O}, L_{4O}, L_5, L_{6O}, L_{7O}\}
$$

Shared layers are $L_0$-$L_2$.

Intuition: there is one layer universe viewed through two projections, sharing foundations and diverging where business and operational concerns differ.

### DS-D6: Layer-7 Orchestration Contract

Let:

- $S = \{s_1, ..., s_9\}$ be business stages
- $H \subseteq S \times S$ be stage handoffs
- $\Sigma$ be emitted signals
- $\Theta$ be threshold predicates
- $\Pi$ be tuning proposals/actions

Then:

$$
L_{7B} = (S, H), \quad L_{7O} = (\Sigma, \Theta, \Pi)
$$

with coupling:

$$
s_9 \Rightarrow \Sigma \xrightarrow{\Theta} \Pi \xrightarrow{apply} updates(S,H)
$$

Intuition: stage completion emits signals, thresholds evaluate them, and resulting proposals feed updates back into execution flow.

### DS-D7: Edge-Family Partition

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-d7-edge-family-partition). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

### DS-D8: Edge-Signature Operator

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-d8-edge-signature-operator). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

### DS-D9: Governance Attenuation Function

Let $\phi(k)$ be observed per-rule governance fidelity with $k$ active governance constraints. Attenuation is:

$$
A(k) = 1 - \phi(k)
$$

Critical regime is defined by:

$$
\frac{\partial \phi}{\partial k} < 0 \quad \text{for} \quad k > k^*
$$

Intuition: attenuation measures lost fidelity; beyond the critical density $k^*$, adding constraints degrades governance performance.

### DS-D10: Coverage-Status Taxonomy

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-d10-coverage-status-taxonomy). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

## Structural Properties and Corollary

### DS-P1: Type Safety Property

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-p1-type-safety-property). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

### DS-P2: Backend/UI Partition Property

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-p2-backendui-partition-property). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

### DS-P3: Cross-Layer Direction Property

> Canonical in [arcanum/definitions/DEFINITIONS.md](../../../../arcanum/definitions/DEFINITIONS.md#ds-p3-cross-layer-direction-property). Non-normative pointer (wedge de-duplicated 2026-06-14); arcanum is authoritative.

### DS-COR-1: Critical Layer Corollary

There exists a critical governance density $k^*$ such that adding constraints beyond $k^*$ reduces effective governance fidelity.

Intuition: governance intervention has diminishing returns and can become counterproductive past a threshold.

## Formal Constructs

### DS-F1: Governance Derivation Chain

$$
L4 \xrightarrow{justifies} L3 \xrightarrow{implemented\ by} L6
$$

Intuition: policy intent must trace through design justification into implementation obligations.

### DS-F2: Deterministic Derivation Construct

$$
T = f(G, \Delta)
$$

Intuition: the derivation output is a deterministic function of model and rules.

### DS-F3: Test Cardinality Construct

$$
|T| = \sum_{i=1}^{20} |\delta_i(G)|
$$

Intuition: total test obligations are the summed contributions of all test-derivation rule families.

### DS-F4: Observability Cardinality Construct

$$
|O| = \sum_{j=1}^{16} |o_j(G)|
$$

Intuition: total observability obligations are the summed contributions of all observability rule families.

### DS-F5: Channel-Capacity Governance Model

$$
C = B \cdot \log_2\left(1 + \frac{S}{N}\right)
$$

Intuition: governance capacity improves with bandwidth and signal quality and deteriorates with noise.

### DS-F6: Closed-Loop Tuning Construct

$$
Pipeline \rightarrow Signals \rightarrow Thresholds \rightarrow Proposals \rightarrow Updates
$$

Intuition: the system is modeled as a feedback control loop, not a one-pass process.

### DS-F7: Cross-Feature Composition Algebra

$$
G_{A \oplus B} = (V_A \cup V_B, E_A \cup E_B \cup E_{AB}, \tau_A \cup \tau_B, \lambda_A \cup \lambda_B \cup \lambda_{AB})
$$

Intuition: composing features means unioning their graphs and explicitly adding emergent cross-feature edges.

## Method and Execution Definitions

### DS-M1: Tier Policy

Two analysis tiers are valid: `foundation` and `full`.

Intuition: tiering controls rigor and cost while preserving a bounded set of valid execution modes.

### DS-M2: Claim Evidence Vocabulary

Evidence strength and status values are constrained by claim/evidence contracts.

Intuition: claim adjudication uses controlled vocabulary so evidence decisions remain comparable.

### DS-M3: Protocol Quality Gate

Protocols must pass checklist criteria before execution.

Intuition: no run should start with an ambiguous or unmeasurable protocol.

### DS-M4: Reproducibility Metadata Contract

Each run row must include canonical metadata fields.

Intuition: mandatory metadata makes runs auditable and reproducible across sessions and operators.

### DS-M5: Validity Threat Quartet

Internal, external, construct, and conclusion threats are mandatory analysis dimensions.

Intuition: all four threat classes are required to prevent selective validity reporting.

### DS-M6: Signal Envelope Vocabulary

Signals must conform to schema-defined types and required envelope fields.

Intuition: a uniform signal envelope enables reliable downstream aggregation and comparison.

### DS-M7: Definition Anchor Requirement

Protocols must list definition IDs used as authority.

Intuition: protocols must explicitly cite the canonical terms they depend on.

### DS-M8: Context Bundle Minimum Contract

Context bundles must include claim scope, source-role matrix, terminology map, metric map, conflict log, and follow-ups.

Intuition: this minimum bundle prevents hidden assumptions and preserves decision traceability.

### DS-M9: Reference Authority Taxonomy

Authority levels and normalization states:

- levels: `primary`, `supporting`, `fallback`
- states: `operationalized`, `waived`, `pending normalization`

Intuition: every source is classified by trust level and operational readiness before use in evidence flows.

### DS-M10: Claim Acceptance and Disconfirmation Semantics

Claim updates require explicit acceptance-rule evaluation and explicit disconfirming criteria checks.

Intuition: claim updates must test both support and falsification conditions, not only positive evidence.

### DS-M11: Evidence Update Semantics

Upgrades and downgrades must cite concrete experimental evidence.

Intuition: evidence-state changes must be justified by specific observed results.

### DS-M12: Emission-Rate Definition

$$
EmissionRate = \frac{actual\_signal\_count}{expected\_signal\_count}
$$

Intuition: this ratio indicates instrumentation completeness; values near 1 mean expected signals are being emitted.

### DS-M13: Technique-Specialization Decision Validity

Let a decision input be:

$$
x = (symptom\_profile, context, constraints)
$$

and the decision function be:

$$
d(x) = (technique\_family^*, specialization^*, tradeoff\_vector, confidence)
$$

A run is validity-passing when:

$$
Validity_{TS} = 1 \iff
PrecisionF1 \ge 0.75 \land
ApplicabilityRate \ge 0.80 \land
AmbiguityRate \le 0.15 \land
TradeoffCompleteness \ge 0.85
$$

A run is promotion-ready for ontology-change review when:

$$
PromotionReady_{TS} = 1 \iff
Validity_{TS} = 1 \land
G1 = pass \land G2 = pass \land G3 = pass \land G4 = pass \land
AdjudicationClosure = 1 \land ConfirmingRerun = 1
$$

**Crosswalk to E11 protocol success criteria.** The four validity thresholds are operationalized in the E11 protocol under different names; the mapping is:

| DS-M13 threshold | E11 protocol criterion |
| --- | --- |
| `PrecisionF1 ≥ 0.75` | SC-TS-5 |
| `ApplicabilityRate ≥ 0.80` | SC-TS-1 |
| `AmbiguityRate ≤ 0.15` | dual-rater disagreement ≤ 15% (catalog promotion rule) |
| `TradeoffCompleteness ≥ 0.85` | SC-TS-2 |

Cite this crosswalk when traceably mapping E11 results to DS-M13 validity.

Intuition: technique/specialization outcomes become candidates for canonical meta-model promotion only after decision-quality thresholds and full governance closure both pass.

## Usage Rules

1. Reference definitions by ID (`DS-*`) in protocols, claims, and evidence updates.
2. Use `DEFINITIONS-INDEX.md` for discovery, and this file for authoritative semantics.
3. If paper wording conflicts with this file, update paper or annotate drift; do not silently reinterpret definitions.
4. Any new gate-critical term must be added here before becoming normative in protocols.
