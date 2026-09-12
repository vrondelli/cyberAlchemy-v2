# Interaction prototype mapping

Status: candidate; authority effect: none. Questions: [REPORT.md](REPORT.md#open-questions).

| Construction stage | Local artifact / meaning |
|---|---|
| Definition | CONTRACT.md: physical location, semantic preference, raw memory, impulse, semantic velocity, candidate utility and observed quiescence |
| Product capability | Explain and reproduce how four preferences affect checked local actions |
| Business prototype | Simulation evaluator compares controlled fixtures/ablations; product owner reviews exact results; no economic value or learning gain presumed |
| Ontology scaffold | Actor has Memory; Profile parameterizes Dynamics; Dynamics ranks Intent; checked Reducer yields Event; Event contributes Impulse; Clock advances Memory; Trace explains decision |
| DomainSpec authored source | domainspec/project.json, feature.json and nodes/*.json; rule body binds exact profile and contract hashes |
| Compiled graph/system ontology | domainspec/generated/: deterministic installed minted-project-tools/v1 output and projection of its nodes/edges |
| Implementation | interaction_dynamics.py numeric primitives; interaction_world.py tick/policy adapter; prototype.py preserves legacy checks and memory default via hook |
| Evaluation | test_interaction_dynamics.py independent mathematical/behavioral oracles; run_interaction_experiments.py baseline, full, ablation and pure-mechanism cases |

The Entity/Rule compiler validates formations and emits a graph. It does not
compile Python policy code or prove mathematical semantics. Source-to-code
conformance is demonstrated only by the bounded tests and this mapping. No
canonical ontology runtime is queried or admitted. Exact definition dependency:
CAV2-D65 heading in authority/definitions/DEFINITIONS.md, recorded in domainspec
binding inputs; no ambient ontology selectors are prerequisites.
