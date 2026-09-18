# Source-of-truth map

Use this table when prose and machine records appear to disagree.

| Concern | Owning source |
| --- | --- |
| Product version, components, integrations, entrypoints | [`../product.json`](../product.json) |
| Package API entrypoints and record contracts | [API and data contracts](API-AND-DATA-CONTRACTS.md) |
| Runtime and host compatibility posture | [Compatibility and lifecycle](COMPATIBILITY-AND-LIFECYCLE.md) |
| Current gateway storage and retention defaults | [`../packages/codex-app-server-wrapper/profiles/repository-v1.json`](../packages/codex-app-server-wrapper/profiles/repository-v1.json) |
| Declared Product Capability list | [`../../../agent-reasoning-engine/product.json`](../../../agent-reasoning-engine/product.json) |
| Reason-and-context capability contract | [`../../../agent-reasoning-engine/product-capability.json`](../../../agent-reasoning-engine/product-capability.json) |
| Interaction-context capability contract | [`../../../agent-reasoning-engine/capabilities/interaction-context/product-capability.json`](../../../agent-reasoning-engine/capabilities/interaction-context/product-capability.json) |
| Executable command dispatch | [`../bin/are.mjs`](../bin/are.mjs) |
| Product closure construction | [`../src/product.mjs`](../src/product.mjs) |
| Candidate inspection and evidence paths | [`../src/product-candidate.mjs`](../src/product-candidate.mjs) |
| Test ownership and plan digest | [`../src/product-test-plan.mjs`](../src/product-test-plan.mjs) |
| Isolated execution | [`../src/product-isolation.mjs`](../src/product-isolation.mjs) |
| Release gates | [`../scripts/verify-release.mjs`](../scripts/verify-release.mjs) |
| Current Candidate 018 closure | [`../evidence/product-candidate.018.json`](../evidence/product-candidate.018.json) |
| Current Candidate 018 test results | [`../evidence/product-test-receipt.018.json`](../evidence/product-test-receipt.018.json) |
| Current failure-learning canary | [`../evidence/failure-learning-canary.018.json`](../evidence/failure-learning-canary.018.json) |
| Repository route registry | [`../../../agent-routing/routes.json`](../../../agent-routing/routes.json) |
| Decision CLI schema | [`../../../agent-routing/capabilities/are-cli/request.schema.json`](../../../agent-routing/capabilities/are-cli/request.schema.json) |
| Stable project definitions | [`../../../authority/definitions/DEFINITIONS.md`](../../../authority/definitions/DEFINITIONS.md) |
| Enduring research objective | [`../../../agent-reasoning-engine/LIGHTHOUSE.md`](../../../agent-reasoning-engine/LIGHTHOUSE.md) |
| Research method, benchmark map, and explanatory roadmap | [Research program](RESEARCH-PROGRAM.md) |
| ContextBench protocol | [`../../../agent-reasoning-engine/research/contextbench-v1/PROTOCOL-v1.md`](../../../agent-reasoning-engine/research/contextbench-v1/PROTOCOL-v1.md) |
| ContextBench full acceptance | [acceptance.json](../../../agent-reasoning-engine/research/contextbench-v1/acceptance.json) |
| Active 10K research decision | [Round 59 reviewed decision](../../../agent-reasoning-engine/research/contextbench-v1/larger-window-v1/round59-reviewed-decision.json) |
| GLM completion roadmap | [GLM finish plan](../GLM-FINISH-PLAN.md) |
| Current product completeness findings | [`../PRODUCT-COMPLETENESS-AUDIT.md`](../PRODUCT-COMPLETENESS-AUDIT.md) |
| Release procedure | [`../RELEASE.md`](../RELEASE.md) |
| Selected version, supported-surface, tag, changelog and deprecation policy | [`release-policy.json`](release-policy.json) and its [`release-policy-receipt.json`](release-policy-receipt.json) |
| Commercial license direction supplied by Keld | [Keld license and payment research](../../../keld-project/docs/LICENSE-PAYMENT-RESEARCH.md), digest-bound by [`release-policy.json`](release-policy.json) |
| Commercial license requirements, Candidate 018 inventory, resolved owner decisions, and qualified-review gates | [`license-requirements.json`](license-requirements.json) and its [`license-requirements-receipt.json`](license-requirements-receipt.json) |
| Commercial identity, owners, contacts, markets, use scope, and license direction | [`release-owner-decisions.json`](release-owner-decisions.json) and its [`release-owner-decisions-receipt.json`](release-owner-decisions-receipt.json) |
| Candidate 018 file-level source-family, embedded-rights-marker, and provenance-review inventory | [`source-rights-inventory.json`](source-rights-inventory.json) and its [`source-rights-inventory-receipt.json`](source-rights-inventory-receipt.json) |
| Documentation lifecycle and claim vocabulary | [Documentation contract](DOCUMENTATION-CONTRACT.md) |
| Complete DR-task status, evidence, blockers and owner gates | [`release-readiness.json`](release-readiness.json) and its [`release-readiness-receipt.json`](release-readiness-receipt.json) |
| Deployment readiness and missing evidence | [Deployment guide](DEPLOYMENT.md) |
| Upgrade compatibility and path status | [Migration and upgrade guide](MIGRATION-AND-UPGRADE.md) |
| Current compatibility identities and reader/writer boundaries | [`compatibility-matrix.json`](compatibility-matrix.json) and its [`compatibility-matrix-receipt.json`](compatibility-matrix-receipt.json) |
| Closed generated package/schema inventory | [Generated API field reference](reference/API-FIELDS.md), [`api-surface.json`](reference/api-surface.json), and [`api-field-annotations.json`](reference/api-field-annotations.json) |
| Vulnerability-policy activation status | [Security policy](SECURITY-POLICY.md) |
| Candidate 018 local-package threats and residue | [Candidate 018 threat model](THREAT-MODEL.md) |
| Service SLI/SLO activation status | [Service-level objectives](SERVICE-LEVEL-OBJECTIVES.md) |
| Operational procedure activation status | [Service runbook](SERVICE-RUNBOOK.md) |
| Immutable candidate history | [Changelog](../CHANGELOG.md) |
| Generated candidate identity and closure deltas | [`candidate-history.json`](releases/candidate-history.json) |
| Candidate 013 standalone-artifact recoverability | [`candidate-013-artifact-preflight.json`](releases/candidate-013-artifact-preflight.json) and its [`recovery sources`](releases/candidate-013-recovery-sources.json) |
| Candidate 018 source-package lifecycle | [`0.10.0-self-contained-candidate.7-lifecycle-receipt.json`](releases/0.10.0-self-contained-candidate.7-lifecycle-receipt.json) |
| Source-archive signing and verification mechanism | [`sign-source-distribution.mjs`](../../../development/agent-reasoning-engine/planning/documentation-readiness/sign-source-distribution.mjs) and its [tests](../../../development/agent-reasoning-engine/planning/documentation-readiness/sign-source-distribution.test.mjs) |
| Candidate 018 reader-facing evidence summary | [Candidate 018 release note](releases/0.10.0-self-contained-candidate.7.md) |
| Compliance applicability and evidence status | [Compliance guide](COMPLIANCE.md) |
| Manual coverage and lifecycle triggers | [Documentation coverage](DOCUMENTATION-COVERAGE.md) |

Generated runtime mirrors and narrative documents are evidence or projections.
They do not silently redefine their owning source.

## Open Questions

- Should the source map be generated from product and routing profiles while
  preserving the explanatory concern labels?
