# Define Context

## Context-builder contract

Mode: standard. Strictness: strict. This is a dry-run, repository-local context selection; it does not persist a runtime pack and does not confer authority.

| Obligation | Selected evidence | Constraint carried into the package |
| --- | --- | --- |
| umbrella intent and vocabulary | `SPEC.md`, `GLOSSARY.md` | APE coordinates architecture-property evidence; it does not own canonical meaning, profile admission, or promotion |
| architecture and execution history | `architecture-bundle.md`, `HISTORICAL-EVIDENCE-MAP.md` | preserve earlier results while superseding only the continuation order |
| canonical meta-type identity and relations | `../definitions/meta-types/meta-types.yml`, `../definitions/relationships/relationships.yml` | DS-D1 and DS-D8 remain the source contracts |
| candidate implementation ontology | `../implementation-conformance/ontology-experiment/{ontology.json,RUNTIME-PROFILE.md,PROPERTY-EVALUATION-MODEL.md,TRACEABILITY-AND-DRIFT.md}` | ontology records properties and evidence requirements with `authority_effect: none` |
| active-type lifecycle template | `../meta-type-complete-implementation/{ARCHITECTURE.md,WORK-PACK.md}` | existing canonical types use a realization cycle; new semantic identities use the full formation cycle |
| proof provider boundary | `../first-production-release/backend-type-test-engine-completeness/DESIGN.md`, its `refreshes/2026-08-04-l0-red-fixture-payload-scope/INDEPENDENT-OWNER-ATTEMPT.md` | BTE can evaluate supported scenarios but cannot decide semantics or profile policy |
| three-language enforcement evidence | `../research/2026-07-30-implementation-structure-enforcement/findings.md` | portable semantics precede profile-local syntax and native adapters |

Selected sources: 14. The context stays within the Standard ceiling. No private prose is copied into public Arcanum artifacts.

## Inventory preflight

`.arcanum/inventory/index.json` validated with `lookup_readiness=ready`. The selected entry was `domainspec-v2-implementation-structure-enforcement-research-result-synthesis`. Inventory was used only for discovery; every load-bearing claim is bound to a direct source above.

## Decisions extracted from the approved intent

- Refresh the existing APE package as the umbrella instead of creating a competing package.
- Model implementation realization and architecture properties in the non-authoritative ontology before language code.
- Keep BTE as a replaceable proof-engine provider.
- Prove one active meta-type, Enum, from simplest to harder: ontology closure, TypeScript, Python/Rust, parity, then scaling.
- Do not select or execute an SWU during Invoke authoring.

## Structured interview disposition

Questions asked in this authoring pass: 0. The user explicitly approved the proposed restructure and progression. The exact Enum representation remains a deliberate architecture-profile decision in `SWU-APE-ENUM-TS-001`, not an ambiguity to resolve during Invoke.
