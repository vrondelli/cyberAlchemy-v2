# DomainSpec Definitions Index

Purpose: index and trace paper-level concepts into reusable research IDs.

Canonical semantics source: `definitions/DEFINITIONS.md`.
This file is the lookup/traceability map, not the normative definition text.

## Core Contributions and Named Definitions Mapped From Paper

| Definition ID | Paper Anchor | Definition Summary | Canonical Artifact(s) | Practical Example |
|---|---|---|---|---|
| DS-C1 | Contribution C1 | Dual-track layered meta-architecture (business + operational). | `claims/CLAIMS.md`, `papers/domainspec-paper.md`, `registry/TRACEABILITY-MATRIX.md` | Claim C1 is evaluated through E4/E5/E7/E8 and updated in `results/DOMAINSPEC-EVIDENCE-STATUS.md`. |
| DS-C2 | Contribution C2 | Deterministic derivation from typed ontology. | `claims/CLAIMS.md`, `experiments/E1-derivation-determinism/protocol.md`, `experiments/E6-vocabulary-sufficiency/protocol.md`, `experiments/E9-cross-feature-composition/protocol.md` | E6 and E9 provide current evidence baseline for C2. |
| DS-C3 | Contribution C3 | Governance attenuation bounded by channel capacity and mitigated structurally. | `claims/CLAIMS.md`, `experiments/E4-governance-attenuation-curve/protocol.md`, `experiments/E5-observer-executor-separation/protocol.md`, `experiments/E7-signal-emission-rate/protocol.md` | E4 and E5 are designed as direct tests for attenuation curve + intervention effect. |
| DS-C4 | Contribution C4 | Meta-circular self-governance via signals, reflection, and tuning loops. | `claims/CLAIMS.md`, `experiments/E8-meta-health-convergence/protocol.md`, `telemetry/SIGNAL-SCHEMA.md` | E8 measures convergence of meta-health signals over time. |
| DS-D1 | Definition 1 | Meta-type system for concept classification. | `implementation/domainspec/TAXONOMY.md`, `papers/domainspec-paper.md` | E6 classifies domain concepts against meta-types and reports coverage. |
| DS-D2 | Definition 2 | Typed relationship system for valid concept edges. | `implementation/domainspec/RELATIONSHIPS.md`, `papers/domainspec-paper.md` | E9 tests whether cross-context edges fit current relationship types. |
| DS-D3 | Definition 3 | Concept graph model $G=(V,E,\tau,\lambda)$. | `experiments/*/protocol.md`, `papers/domainspec-paper.md` | E9 run-2-rerun builds cross-context graphs from 6 domains (94 edges). |
| DS-D4 | Definition 4 | Derivation function $T=f(G,\Delta)$. | `implementation/domainspec/TEST-PIPELINE.md`, `experiments/E1-derivation-determinism/protocol.md`, `papers/domainspec-paper.md` | E1 checks run-to-run determinism for fixed feature specs. |
| DS-D5 | Section 3.1.1 (Definition L-A/L-B) | Layer-set and dual-track projection: $\mathcal{L}$ with $\mathcal{L}_B$ and $\mathcal{L}_O$ sharing $L0$-$L2$. | `papers/domainspec-paper.md`, `implementation/domainspec/ARCHITECTURE.md`, `claims/CLAIMS.md` | C1 traceability audits can classify evidence by layer and track without ad hoc interpretation. |
| DS-D6 | Section 3.1.1 (Definition L-C) | Layer-7 orchestration contract: $L_{7B}=(S,H)$ and $L_{7O}=(\Sigma,\Theta,\Pi)$ with stage-to-tuning coupling. | `papers/domainspec-paper.md`, `implementation/domainspec/TUNING-LOOP.md`, `telemetry/SIGNAL-SCHEMA.md` | E7 and E8 can be interpreted as L7O evidence while E1-E6 map to L7B stage evidence. |
| DS-D7 | Section 4.2 (Definition E-A) | Edge-family taxonomy partition $\mathcal{R}=\mathcal{R}_B\uplus\mathcal{R}_U\uplus\mathcal{R}_X$ (composition extensions tracked separately). | `implementation/domainspec/RELATIONSHIPS.md`, `papers/domainspec-paper.md`, `experiments/E9-cross-feature-composition/protocol.md` | E6/E9 edge audits can report strain per family instead of mixing all relationships. |
| DS-D8 | Section 4.2 (Definition E-B) | Edge-signature operator $\sigma$ and typed-edge validity rule for instance-level checks. | `papers/domainspec-paper.md`, `implementation/domainspec/RELATIONSHIPS.md`, `experiments/E6-vocabulary-sufficiency/protocol.md` | Relationship rows are machine-checkable by source/target signature rather than narrative mapping. |
| DS-D9 | Section 6.1 (Definition 5) | Governance attenuation function $A(k)=1-\phi(k)$ with critical regime $k^*$. | `papers/domainspec-paper.md`, `experiments/E4-governance-attenuation-curve/protocol.md`, `experiments/E5-observer-executor-separation/protocol.md`, `experiments/E7-signal-emission-rate/protocol.md` | E4/E5/E7 share a common attenuation target variable set instead of incompatible proxies. |
| DS-D10 | E6/E9 protocol status taxonomy | Coverage-status vocabulary: concept (`covered`, `strained`, `uncovered`) and edge (`works`, `strained`, `broken`) classes. | `experiments/E6-vocabulary-sufficiency/protocol.md`, `experiments/E9-cross-feature-composition/protocol.md`, `experiments/E9-cross-feature-composition/results/E9-run2-rerun-results.md` | Cross-experiment synthesis can aggregate stress outcomes without reinterpreting labels. |
| DS-P1 | Property 1 | Type safety of relationship instances. | `implementation/domainspec/RELATIONSHIPS.md`, `experiments/E6-vocabulary-sufficiency/protocol.md` | E6 strained/uncovered relationship analysis highlights type-signature pressure points. |
| DS-P2 | Property 2 | Backend/UI partition disjointness. | `implementation/domainspec/TAXONOMY.md`, `papers/domainspec-paper.md` | UI and backend classifications remain split across taxonomy groups. |
| DS-P3 | Property 3 | Cross-layer bridging direction (UI -> backend). | `implementation/domainspec/RELATIONSHIPS.md`, `papers/domainspec-paper.md` | UI cross-layer edges (`fetches`, `mutates`, etc.) are directional in relationship signatures. |
| DS-COR-1 | Corollary 1 | Critical governance layer count $k^*$ where adding layers decreases effective governance capacity ($\partial C/\partial k < 0$ for $k > k^*$). | `papers/domainspec-paper.md`, `experiments/E4-governance-attenuation-curve/protocol.md`, `experiments/E5-observer-executor-separation/protocol.md` | E4 estimates attenuation shape and compares fitted behavior with the theoretical $k^* \approx 6$-$7$ range. |

## Formal Constructs and Equations Anchored in Paper

| Definition ID | Paper Anchor | Formal Construct | Canonical Artifact(s) | Practical Example |
|---|---|---|---|---|
| DS-F1 | Section 3.2 | Governance derivation chain $L4 \xrightarrow{justifies} L3 \xrightarrow{implemented\ by} L6$. | `implementation/domainspec/AXIOMS.md`, `implementation/domainspec/CONSTITUTION.md`, `implementation/domainspec/docs/shared/governance-baseline.md` | Alignment/audit gates can be traced to constitution rules and then to axioms before approval decisions. |
| DS-F2 | Section 5.1 | Test derivation function $T=f(G,\Delta)=\bigcup_{i=1}^{|\Delta|}\delta_i(G)$. | `implementation/domainspec/TEST-PIPELINE.md`, `experiments/E1-derivation-determinism/protocol.md` | E1 checks that fixed $G$ and fixed $\Delta$ yield stable test obligations across repeated runs. |
| DS-F3 | Section 5.3 | Test-cardinality equations ($|T|$ exact and lower-bound forms). | `implementation/domainspec/TEST-PIPELINE.md`, `experiments/E2-derivation-vs-manual/protocol.md`, `experiments/E3-mutation-testing/protocol.md` | E2/E3 use obligation counts as baseline for coverage and fault-detection interpretation. |
| DS-F4 | Section 5.4 | Observability derivation cardinality $|O|=\sum_{j=1}^{16}|o_j(G)|$. | `implementation/domainspec/OBSERVABILITY.md`, `implementation/domainspec/TEST-PIPELINE.md`, `experiments/E7-signal-emission-rate/protocol.md` | E7 evaluates whether emitted production signals match expected derived metric obligations. |
| DS-F5 | Section 6.3 | Channel-capacity governance model $C=B\cdot\log_2(1+S/N)$. | `papers/domainspec-paper.md`, `experiments/E4-governance-attenuation-curve/protocol.md` | E4 links observed compliance decay to a signal/noise interpretation instead of ad hoc failure causes. |
| DS-F6 | Section 7.4 | Closed-loop tuning cycle (pipeline -> signals -> thresholds -> proposals -> skill/agent updates). | `implementation/domainspec/TUNING-LOOP.md`, `implementation/domainspec/docs/telemetry/SIGNAL-SCHEMA.md`, `experiments/E8-meta-health-convergence/protocol.md` | E8 measures whether loop outputs reduce orphan and governance-friction indicators over time. |
| DS-F7 | Section 9.2 | Cross-feature composition algebra $G_{A\oplus B}=(V_A\cup V_B, E_A\cup E_B\cup E_{AB}, \tau_A\cup \tau_B, \lambda_A\cup \lambda_B\cup \lambda_{AB})$. | `experiments/E9-cross-feature-composition/protocol.md`, `experiments/E9-cross-feature-composition/results/E9-run2-rerun-results.md` | E9 evaluates practical pressure points before introducing stronger composition operators. |

## Method Definitions Used By Research Execution

| Definition ID | Definition Summary | Canonical Artifact(s) | Practical Example |
|---|---|---|---|
| DS-M1 | Tiered analysis policy (foundation vs full). | `definitions/METHODOLOGY-PROFILE.md` | E11 is explicitly marked full tier with dual-rater adjudication. |
| DS-M2 | Claim evidence vocabulary and status transitions. | `claims/CLAIMS.md`, `results/DOMAINSPEC-EVIDENCE-STATUS.md` | C2 is currently `partially supported`; C1/C3/C4 remain `insufficient evidence`. |
| DS-M3 | Protocol quality gate criteria. | `protocols/DOMAINSPEC-PROTOCOL-CHECKLIST.md` | G1 blocks when methodology linkage or measurable criteria are missing. |
| DS-M4 | Reproducibility metadata contract for experiment rows. | `definitions/METHODOLOGY-PROFILE.md`, `experiments/EXPERIMENTS.md` | A run row is invalid when required metadata fields (`experiment_id`, `run_id`, `timestamp`, `model`, `operator`) are missing. |
| DS-M5 | Validity threat quartet (internal/external/construct/conclusion). | `definitions/METHODOLOGY-PROFILE.md`, `templates/EXPERIMENT-RESULTS-TEMPLATE.md` | Claim upgrades are blocked when critical validity threats are undocumented. |
| DS-M6 | Signal envelope and required signal type vocabulary. | `telemetry/SIGNAL-SCHEMA.md` | Every blocked gate emits a remediation signal and evidence-update signals must reference claim + artifact. |
| DS-M7 | Protocol definition-anchor requirement. | `protocols/DOMAINSPEC-PROTOCOL-CHECKLIST.md` | Protocol review now requires explicit definition anchors from this index. |
| DS-M8 | Context bundle minimum structure for execution readiness. | `experiments/*/context.md`, `experiments/E11-technique-specialization/context.md` | Context bundles map claim target, source-role matrix, terminology map, metrics, and conflict log before execution. |
| DS-M9 | Reference authority levels and promotion states (`primary`, `supporting`, `fallback`; `operationalized`, `waived`, `pending normalization`). | `sources/REFERENCE-LEDGER.md` | Governance-theory references used for C3 are treated as primary authority for E4/E5 decisions. |
| DS-M10 | Claim acceptance threshold semantics and disconfirmation rules. | `claims/CLAIMS.md` | C3 requires attenuation baseline plus intervention recovery without dropping coverage. |
| DS-M11 | Evidence strength vocabulary and update policy semantics. | `results/DOMAINSPEC-EVIDENCE-STATUS.md` | Any downgrade must cite conflicting experiment evidence explicitly. |
| DS-M12 | Emission-rate metric definition for governance attenuation telemetry. | `experiments/E7-signal-emission-rate/protocol.md`, `telemetry/SIGNAL-SCHEMA.md` | Emission rate is computed as `actual_signal_count / expected_signal_count`. |
| DS-M13 | Technique/specialization decision validity and promotion-readiness predicate. | `definitions/DEFINITIONS.md`, `experiments/E11-technique-specialization/protocol.md`, `experiments/E11-technique-specialization/README.md` | E11 uses reproducibility and adjudication thresholds to decide whether ontology-change review is eligible. |

## Drift Notes (Paper vs Evolving Framework)

| Drift ID | Observation | Current Handling |
|---|---|---|
| DS-DRIFT-001 | Paper text references 24 meta-types and 26 relationships in the initial baseline. | Composition extension evidence (E9 + follow-up changes) is tracked in project artifacts; claim updates should cite run-scoped results and framework version. |
| DS-DRIFT-002 | Many theory references are present in paper but not normalized into source catalog/inventory artifacts. | Track in `sources/REFERENCE-LEDGER.md` and promote authoritative references into source catalog + inventory as needed by active experiments. |

## Optional Definition Candidates (Promote When Reused)

| Candidate ID | Candidate Definition | Why It Helps | Promotion Trigger | Candidate Anchor(s) |
|---|---|---|---|---|
| DS-OPT-1 | Signal taxonomy (`economy`, `quality`, `governance`, `pattern`, `operations`) and envelope contract terms. | Keeps signal semantics out of per-experiment prose and standardizes telemetry interpretation. | Promote when >= 2 new experiments add custom signal interpretations. | `telemetry/SIGNAL-SCHEMA.md`, `papers/domainspec-paper.md` §7.2 |
| DS-OPT-2 | Verdict taxonomy (`PASS`, `FLAG`, `BLOCK`, `PARTIAL`) with mandatory remediation semantics. | Avoids ambiguous audit language across alignment and evidence reports. | Promote when verdict disagreements appear across >= 2 audits. | `papers/domainspec-paper.md` §8.4, `implementation/domainspec/docs/shared/governance-baseline.md` |
| DS-OPT-3 | Composition-pattern taxonomy (P1-P6) from E9 rerun. | Stabilizes cross-feature composition reporting and avoids ad hoc pattern naming. | Promote when E9 follow-up or E11 uses pattern-level adjudication. | `experiments/E9-cross-feature-composition/results/E9-run2-rerun-results.md` |
| DS-OPT-4 | Meta-health metric semantics for M-001..M-006 (including computation windows). | Makes C4 convergence judgments reproducible across runs. | Promote before E8 claim-strength upgrade attempts. | `implementation/domainspec/ADLC-ALIGNMENT.md`, `papers/domainspec-paper.md` §3.4 |
| DS-OPT-5 | Traceability completeness ratio formal definition and denominator policy. | Prevents C1 acceptance-rule drift caused by inconsistent artifact counting. | Promote when C1 transitions from insufficient to partial/strong evidence. | `claims/CLAIMS.md`, `registry/TRACEABILITY-MATRIX.md` |
| DS-OPT-6 | Derivation-obligation unit normalization (test obligation vs metric obligation vs evidence obligation). | Aligns counting logic across E1/E2/E7 and paper tables. | Promote when obligation counts diverge between reports. | `papers/domainspec-paper.md` §5, `results/DOMAINSPEC-EVIDENCE-STATUS.md` |
| DS-OPT-7 | Technique/Specialization as canonical meta-types with typed relationship signatures. | Elevates stable specialization decisions from experiment method into ontology primitives. | Promote after DS-M13 passes in one strict-reliability replication (no adjudication override) plus one cross-experiment reuse wave, then issue promotion D4 packet. | `experiments/E11-technique-specialization/README.md`, `experiments/E11-technique-specialization/results/E11-D4-decision-packet-2026-04-25.md` |

## Usage Rules

1. Every protocol must reference at least one Definition ID (or formal-construct ID) relevant to its claim.
2. Every claim update must cite both experiment evidence and the affected Definition IDs.
3. New paper terms must be added here before being used as protocol-level requirements.
4. New governance or telemetry terms are gate-critical only after a Definition ID is assigned in this index.
5. Protocols discussing layers, taxonomy partitions, or edge stress must anchor DS-D5 through DS-D10 explicitly.
6. Optional candidates become mandatory only after an explicit promotion to a DS-D*, DS-F*, DS-P*, or DS-M* ID.
