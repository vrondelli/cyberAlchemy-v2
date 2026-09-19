# DomainSpec Research Project

DomainSpec is the core evidence program that validates whether typed domain modeling plus deterministic derivation and governance signals can produce reproducible software engineering outcomes.

This project is self-contained under `research/projects/domainspec` and follows canonical-only paths.

## What This Project Is About

DomainSpec answers the central framework claims [C1](claims/CLAIMS.md), [C2](claims/CLAIMS.md), [C3](claims/CLAIMS.md), and [C4](claims/CLAIMS.md) through controlled experiments [E1](experiments/E1-derivation-determinism/protocol.md), [E2](experiments/E2-derivation-vs-manual/protocol.md), [E3](experiments/E3-mutation-testing/protocol.md), [E4](experiments/E4-governance-attenuation-curve/protocol.md), [E5](experiments/E5-observer-executor-separation/protocol.md), [E6](experiments/E6-vocabulary-sufficiency/protocol.md), [E7](experiments/E7-signal-emission-rate/protocol.md), [E8](experiments/E8-meta-health-convergence/protocol.md), [E9](experiments/E9-cross-feature-composition/protocol.md), [E10](experiments/E10-developer-productivity/protocol.md), and [E11](experiments/E11-technique-specialization/protocol.md), append-only run data, and claim-level traceability into the paper.

The program focuses on:

- deterministic derivation and test obligations
- governance attenuation and intervention effectiveness
- vocabulary sufficiency across multiple domains
- signal-driven meta-governance convergence

## Current Snapshot (2026-04-22)

- Status: active, evidence-building
- Version: 0.1.0
- Owner: mars-research-scientist
- Latest run state: [E6](experiments/E6-vocabulary-sufficiency/protocol.md) and [E9](experiments/E9-cross-feature-composition/protocol.md) completed and analyzed; remaining experiments pending

## Completeness Dashboard

### Weighted Completeness

- Structural completeness (40% weight): 100%
- Empirical completeness (40% weight): 45%
- Publication completeness (20% weight): 40%
- Overall weighted completeness: 66%

Scoring note:
- Structural = required project contract and canonical governance artifacts present.
- Empirical = sources, inventory, data capture, integrity checks, analysis outputs, evidence updates.
- Publication = paper-facing synthesis and retrospective artifacts.

### Artifact Lane Status

| Lane | Expected Outcome | Current State | Status |
|---|---|---|---|
| Project contract | PROJECT, claims, dependencies, registry, telemetry schema | Present | complete |
| Governance definitions | canonical definitions source, experiment index, methodology profile, definitions index, protocol checklist, and constitution | Present | complete |
| Execution evidence | experiment specs, live data files, analysis outputs | [E6](experiments/E6-vocabulary-sufficiency/protocol.md) and [E9](experiments/E9-cross-feature-composition/protocol.md) have data/results; most experiments still pending | in progress |
| Source and inventory | source selection, reference ledger, and inventory coverage for active experiments | Source catalog and inventory entries exist, but not complete for all scheduled runs | in progress |
| Claim adjudication | claim-level status updates from experiment evidence | Evidence matrix established; [C2](claims/CLAIMS.md) partially supported; [C1](claims/CLAIMS.md)/[C3](claims/CLAIMS.md)/[C4](claims/CLAIMS.md) still insufficient | in progress |
| Publication | paper updates and retrospective outputs | Paper exists but evidence integration remains partial | in progress |
| Exports | reusable published claim/method artifacts | Claims and methods exports published | complete |

## Experiment Progress

- Total indexed experiments: 11
- Completed with analysis: 2 ([E6](experiments/E6-vocabulary-sufficiency/protocol.md), [E9](experiments/E9-cross-feature-composition/protocol.md))
- Planned or not started: 9 ([E1](experiments/E1-derivation-determinism/protocol.md), [E2](experiments/E2-derivation-vs-manual/protocol.md), [E3](experiments/E3-mutation-testing/protocol.md), [E4](experiments/E4-governance-attenuation-curve/protocol.md), [E5](experiments/E5-observer-executor-separation/protocol.md), [E7](experiments/E7-signal-emission-rate/protocol.md), [E8](experiments/E8-meta-health-convergence/protocol.md), [E10](experiments/E10-developer-productivity/protocol.md), [E11](experiments/E11-technique-specialization/protocol.md))

High-signal completed work:
- [E6](experiments/E6-vocabulary-sufficiency/protocol.md): vocabulary sufficiency across 18 domains with high coverage
- [E9](experiments/E9-cross-feature-composition/protocol.md): cross-feature composition stress test with explicit ontology extension proposals

## What Is Missing Right Now

1. Execute [E1](experiments/E1-derivation-determinism/protocol.md), [E2](experiments/E2-derivation-vs-manual/protocol.md), and [E3](experiments/E3-mutation-testing/protocol.md) to directly strengthen deterministic derivation evidence for [C2](claims/CLAIMS.md).
2. Execute [E4](experiments/E4-governance-attenuation-curve/protocol.md), [E5](experiments/E5-observer-executor-separation/protocol.md), [E7](experiments/E7-signal-emission-rate/protocol.md), and [E8](experiments/E8-meta-health-convergence/protocol.md) to establish strong evidence for [C1](claims/CLAIMS.md), [C3](claims/CLAIMS.md), and [C4](claims/CLAIMS.md).
3. Run [E10](experiments/E10-developer-productivity/protocol.md) to establish productivity evidence currently listed as missing in threats/future work.
4. Execute [E11](experiments/E11-technique-specialization/protocol.md) to test specialization necessity, trade-offs, and reproducibility after E9.
5. Standardize per-experiment source and inventory artifacts for every pending run, not only [E6](experiments/E6-vocabulary-sufficiency/protocol.md)/[E9](experiments/E9-cross-feature-composition/protocol.md).
6. Integrate completed evidence deltas into the paper narrative and claim-strength framing.
7. Resolve temporary waiver pins in `sources/REFERENCE-WAIVERS.md` and, when needed, split clustered authority inventory entries into per-source deep extracts.

## Claim Coverage Summary

Current claim snapshot (`claims/CLAIMS.md`):

- [C2](claims/CLAIMS.md): partially supported (backed by [E6](experiments/E6-vocabulary-sufficiency/protocol.md) and [E9](experiments/E9-cross-feature-composition/protocol.md), with [E11](experiments/E11-technique-specialization/protocol.md) planned)
- [C1](claims/CLAIMS.md): insufficient evidence
- [C3](claims/CLAIMS.md): insufficient evidence
- [C4](claims/CLAIMS.md): insufficient evidence

Interpretation:
- DomainSpec has a solid structural and analytical base.
- Empirical closure still depends on finishing the remaining high-priority experiments.

## Canonical File Map

- Project manifest: `PROJECT.yaml`
- Constitution: `definitions/CONSTITUTION.md`
- Canonical definitions source: `definitions/DEFINITIONS.md`
- Methodology profile: `definitions/METHODOLOGY-PROFILE.md`
- Definitions index: `definitions/DEFINITIONS-INDEX.md`
- Protocol checklist: `protocols/DOMAINSPEC-PROTOCOL-CHECKLIST.md`
- Experiment index: `experiments/EXPERIMENTS.md`
- Claims: `claims/CLAIMS.md`
- Dependencies: `deps/DEPENDENCIES.yaml`
- Artifact index: `registry/ARTIFACT-INDEX.md`
- Traceability matrix: `registry/TRACEABILITY-MATRIX.md`
- Paper: `papers/domainspec-paper.md`
- Reference ledger: `sources/REFERENCE-LEDGER.md`
- Evidence matrix: `results/DOMAINSPEC-EVIDENCE-STATUS.md`
- Experiment context bundles: `experiments/*/context.md`
- Evidence outputs: `experiments/*/results/*.md` and `experiments/*/data/*.jsonl`

Paper/definitions authority model:

1. `definitions/DEFINITIONS.md` is normative for definition semantics.
2. `definitions/DEFINITIONS-INDEX.md` is lookup and traceability index.
3. `papers/domainspec-paper.md` is a condensed narrative synthesis of canonical definitions and evidence.

## Dependency Policy

All upstream dependencies must be declared in `deps/DEPENDENCIES.yaml`.
Cross-project consumption is allowed only through declared dependency contracts and published exports.
