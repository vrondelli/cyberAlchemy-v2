# DomainSpec Traceability Matrix

| Claim | Experiments | Data Artifacts | Result Artifacts | Evidence Matrix | Paper Section |
|---|---|---|---|---|---|
| C1 | E4, E5, E7, E8, E11 (secondary) | experiments/E4-governance-attenuation-curve/data/*.jsonl; experiments/E5-observer-executor-separation/data/*.jsonl; experiments/E7-signal-emission-rate/data/*.jsonl; experiments/E8-meta-health-convergence/data/*.jsonl; experiments/E11-technique-specialization/data/*.jsonl | experiments/E4-governance-attenuation-curve/results/*.md; experiments/E5-observer-executor-separation/results/*.md; experiments/E7-signal-emission-rate/results/*.md; experiments/E8-meta-health-convergence/results/*.md; experiments/E11-technique-specialization/results/*.md | results/DOMAINSPEC-EVIDENCE-STATUS.md | papers/domainspec-paper.md §3, §6, §7 |
| C2 | E1, E2, E3, E6, E9, E11 | experiments/E1-derivation-determinism/data/*.jsonl; experiments/E2-derivation-vs-manual/data/*.jsonl; experiments/E3-mutation-testing/data/*.jsonl; experiments/E6-vocabulary-sufficiency/data/*.jsonl; experiments/E9-cross-feature-composition/data/*.jsonl; experiments/E11-technique-specialization/data/*.jsonl | experiments/E1-derivation-determinism/results/*.md; experiments/E2-derivation-vs-manual/results/*.md; experiments/E3-mutation-testing/results/*.md; experiments/E6-vocabulary-sufficiency/results/*.md; experiments/E9-cross-feature-composition/results/*.md; experiments/E11-technique-specialization/results/*.md | results/DOMAINSPEC-EVIDENCE-STATUS.md | papers/domainspec-paper.md §5, §9 |
| C3 | E4, E5, E7 | experiments/E4-governance-attenuation-curve/data/*.jsonl; experiments/E5-observer-executor-separation/data/*.jsonl; experiments/E7-signal-emission-rate/data/*.jsonl | experiments/E4-governance-attenuation-curve/results/*.md; experiments/E5-observer-executor-separation/results/*.md; experiments/E7-signal-emission-rate/results/*.md | results/DOMAINSPEC-EVIDENCE-STATUS.md | papers/domainspec-paper.md §6 |
| C4 | E7, E8 | experiments/E7-signal-emission-rate/data/*.jsonl; experiments/E8-meta-health-convergence/data/*.jsonl | experiments/E7-signal-emission-rate/results/*.md; experiments/E8-meta-health-convergence/results/*.md | results/DOMAINSPEC-EVIDENCE-STATUS.md | papers/domainspec-paper.md §7 |

## Knowledge-Stack Support Artifacts

- Canonical definitions: `definitions/DEFINITIONS.md`
- Definitions index: `definitions/DEFINITIONS-INDEX.md`
- References: `sources/REFERENCE-LEDGER.md`
- Authority source extension: `sources/AUTHORITY-SOURCES-2026-04-26.md`
- Waivers: `sources/REFERENCE-WAIVERS.md`
- Context bundles: `experiments/*/context.md`
- Normalization execution report: `results/KNOWLEDGE-STACK-REORGANIZATION-EXECUTION-2026-04-26.md`
