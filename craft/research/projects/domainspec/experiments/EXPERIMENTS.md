# DomainSpec — Experiment Design & Data Collection Plan

This document indexes the experiments needed to strengthen the empirical evidence in the DomainSpec research paper. Each experiment maps to a specific paper claim, defines a protocol, expected data output, and success criteria.

Each experiment has its own bundle directory under this folder, with protocol, sources, run data, and results colocated.

Start here for navigation: [README.md](README.md).
Unresolved adjudication rollup: [OPEN-DECISIONS.md](OPEN-DECISIONS.md).

Migration status:

- Per-experiment bundle migration completed on 2026-04-22.
- Execution record: [`../../mars/runbooks/EXPERIMENT-BUNDLE-MIGRATION-PLAN.md`](../../mars/runbooks/EXPERIMENT-BUNDLE-MIGRATION-PLAN.md).

---

## Experiment Index

| ID  | Experiment                            | Paper Claim                               | Priority | Effort | Status       | File                                                 |
| --- | ------------------------------------- | ----------------------------------------- | -------- | ------ | ------------ | ---------------------------------------------------- |
| E1  | Derivation Determinism                | C2 — same spec → same tests               | P0       | Low    | not started  | [E1](E1-derivation-determinism/protocol.md)          |
| E2  | Derivation vs Manual Coverage         | C2 — derived tests ≥ manual tests         | P0       | Medium | not started  | [E2](E2-derivation-vs-manual/protocol.md)            |
| E3  | Mutation Testing Effectiveness        | C2 — derived tests catch real faults      | P0       | Medium | not started  | [E3](E3-mutation-testing/protocol.md)                |
| E4  | Governance Attenuation Curve          | C3 — fidelity decreases with layer count  | P0       | High   | not started  | [E4](E4-governance-attenuation-curve/protocol.md)    |
| E5  | Observer-Executor Separation Impact   | C3 — intervention restores fidelity       | P1       | Medium | not started  | [E5](E5-observer-executor-separation/protocol.md)    |
| E6  | Vocabulary Sufficiency Across Domains | C2 — 24 types cover business domains      | P1       | High   | ✅ completed + analyzed | [E6](E6-vocabulary-sufficiency/protocol.md)          |
| E7  | Signal Emission Rate Tracking         | C3/C4 — empirical attenuation measurement | P0       | Low    | not started  | [E7](E7-signal-emission-rate/protocol.md)            |
| E8  | Meta-Health Convergence               | C4 — M-001 orphan rate trends toward 0    | P1       | Low    | not started  | [E8](E8-meta-health-convergence/protocol.md)         |
| E9  | Cross-Feature Composition Stress      | §9.2 — composition gaps                   | P2       | High   | ✅ completed + analyzed (run-1 + run-2 + rerun) | [E9](E9-cross-feature-composition/protocol.md)       |
| E10 | Developer Productivity Comparison     | §9.4(d) — DomainSpec vs freeform          | P2       | High   | not started  | [E10](E10-developer-productivity/protocol.md)        |
| E11 | Technique/Specialization Applicability | C2/C1 — reproducible cross-context technique decisions | P0 | High | ✅ completed + analyzed (human-attested closure packet issued; claim-delta updated) | [E11](E11-technique-specialization/protocol.md) |

### Results & Data

- Results: `experiments/<experiment-key>/results/` — one or more run-scoped result files per completed experiment
- Raw data: `experiments/<experiment-key>/data/` — append-only JSONL files per experiment run

---

## Execution Rules

### Data Integrity

1. **Raw data only.** Store all experiment data as JSONL in each experiment bundle's `data/` directory. Never edit raw data after collection.
2. **Session isolation.** Each experiment run uses a fresh agent session with a documented system prompt. No session carries over from a previous run.
3. **Ground truth annotation.** For experiments requiring human judgment (E2, E4, E5), annotate with a structured rubric documented alongside the data.
4. **Reproducibility.** Record the exact model version, temperature, system prompt hash, and DomainSpec version for every run.

### Metadata per Run

Every experiment data point must include:

```json
{
  "experiment_id": "E1",
  "run_id": "uuid",
  "timestamp": "2026-04-20T...",
  "domainspec_version": "1.8.x",
  "model": "claude-sonnet-4-20250514",
  "model_temperature": 0,
  "system_prompt_hash": "sha256:...",
  "feature_id": "financial-settlement",
  "operator": "vrondelli"
}
```

### Execution Order

```
Phase 1 (immediate — can run on existing project):
  E1  Derivation Determinism          ~2 hours
  E7  Signal Emission Rate            ongoing (instrument now)
  E8  Meta-Health Convergence         ongoing (instrument now)

Phase 2 (requires test implementation):
  E3  Mutation Testing                ~4 hours (needs Stryker setup)
  E2  Derivation vs Manual Coverage   ~6 hours (needs human tester)

Phase 3 (requires intervention implementation):
  E5  Observer-Executor Separation    ~4 hours (needs observer agent)
  E4  Governance Attenuation Curve    ~8 hours (needs 50 pipeline runs)

Phase 4 (requires external work):
  E6  Vocabulary Sufficiency          ~12 hours  ✅ done
  E9  Cross-Feature Composition       ~4 hours   ✅ done (run-1 + run-2)
  E10 Developer Productivity          ~20 hours (needs external developers)

Phase 5 (composition extension):
  E11 Technique/Specialization Applicability ~16 hours (protocol ready, execution pending)
```

### Reporting

After each experiment completes, produce a summary in `experiments/<experiment-key>/results/<run-id>-results.md` with:

- Starting point template: `../templates/EXPERIMENT-RESULTS-TEMPLATE.md`

- Protocol deviations (what changed from this plan)
- Raw data location
- Summary statistics
- Visualizations (tables or ASCII charts)
- Conclusions and impact on paper claims
- Recommended paper revisions

---

## Traceability to Paper Sections

| Experiment | Paper Section                        | What it strengthens                       |
| ---------- | ------------------------------------ | ----------------------------------------- |
| E1         | §5.1 (Derivation Function)           | Proves determinism claim empirically      |
| E2         | §5.2–5.3 (Test Rules, Cardinality)   | Proves coverage superiority               |
| E3         | §9.5 (Threats — construct validity)  | Addresses mutation testing gap            |
| E4         | §6.3–6.4 (Channel Capacity, Bounds)  | Empirical validation of attenuation model |
| E5         | §6.6 (Structural Interventions)      | Proves intervention effectiveness         |
| E6         | §9.1 (Vocabulary Completeness)       | Addresses external validity threat        |
| E7         | §6.5 (Empirical Evidence)            | Longitudinal attenuation data             |
| E8         | §3.4 (Meta-Circular Self-Governance) | Proves convergence claim                  |
| E9         | §9.2 (Cross-Feature Composition)     | Advances future work into evidence        |
| E10        | §9.4(d) (Controlled Experiments)     | Developer productivity claim              |
| E11        | §9.2 + §5 boundary revision          | Tests specialization necessity, trade-offs, and reproducibility |
