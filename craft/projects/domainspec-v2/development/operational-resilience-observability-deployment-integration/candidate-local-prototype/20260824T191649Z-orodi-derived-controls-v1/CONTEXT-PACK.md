# Context Pack: ORODI Derived Foundational Controls

Run ID: `20260824T191649Z-orodi-derived-controls-v1`

Work Pack: `WP-ORODI-PROTOTYPE-002`

## Objective

Extend the repository-local ORODI prototype with pure, deterministic evaluators for C01, C05, C11, C12, C14, and C15. Derive those control states from the immutable binding and observations, compare them with the supplied control claims, and reject mismatches.

## Admitted sources

- `projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/invoke-design/20260824T165443Z-orodi-v1/ARCHITECTURE.md`
- `projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/invoke-design/20260824T165443Z-orodi-v1/PLANNED-WITNESSES.json`
- `projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/invoke-design/20260824T165443Z-orodi-v1/DECISIONS-RISKS.md`
- `projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/candidate-local-prototype/20260824T183645Z-orodi-generic-contracts-v1/WORK-PACK.md`
- `projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/candidate-local-prototype/20260824T183645Z-orodi-generic-contracts-v1/PROTOTYPE-VALIDATION-REPORT.md`
- `projects/domainspec-v2/impl/operational-resilience/contracts/operational-evidence.ts`
- `projects/domainspec-v2/impl/operational-resilience/src/validate-operational-evidence.ts`
- `projects/domainspec-v2/impl/operational-resilience/src/cli.ts`
- `projects/domainspec-v2/impl/operational-resilience/test/operational-evidence.test.ts`

## Baseline bindings

| Path | SHA-256 before WP2 |
| --- | --- |
| `contracts/operational-evidence.ts` | `80964cf2853488bad12e7410b4a76a3f627758790b531ca5fcd3067331f8a79f` |
| `src/validate-operational-evidence.ts` | `6f19cfeb486ab3cc0599c67faa5c0df0e0d2e252b1f0fc9c321781b01b5762f0` |
| `src/cli.ts` | `2fc6f44e94daec39e5a9c8f12a6a64b03a99fd1abb65dc3399a45f434f144fa2` |
| `test/operational-evidence.test.ts` | `6f8f684490bc7c36507e206ea44fc6e47be04c4c2c75554d333cf7ce0c11a9f7` |

## Semantic boundary

The evaluator may read only candidate-local JSON. It must not collect evidence, call a tool, choose a profile, actuate a canary, touch infrastructure, or deploy. Supplied control states are claims, not trusted inputs. The raw binding and observations are the derivation source.

## Claim ceiling

Evidence may establish only that the candidate-local evaluator discriminates the declared fixtures. It cannot establish live binding, production monitoring, load behavior, deployment correctness, release readiness, ontology/profile admission, or lifecycle synchronization.
