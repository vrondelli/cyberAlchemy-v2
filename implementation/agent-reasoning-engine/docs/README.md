# Agent Reasoning Engine manual

This manual explains the supported private ARE stability candidate. Start with
the path that matches your work:

| Reader | Reading path |
| --- | --- |
| New user | [Overview](OVERVIEW.md) → [Getting started](GETTING-STARTED.md) → [End-to-end workflows](WORKFLOWS.md) → [CLI](CLI.md) |
| Product or capability owner | [Capability guide](capabilities/README.md) → [Documentation coverage](DOCUMENTATION-COVERAGE.md) → [Compatibility and lifecycle](COMPATIBILITY-AND-LIFECYCLE.md) |
| Agent integrator | [Architecture](ARCHITECTURE.md) → [API and data contracts](API-AND-DATA-CONTRACTS.md) → [Gateway and agents](GATEWAY-AND-AGENTS.md) |
| Operator | [Deployment readiness](DEPLOYMENT.md) → [Configuration](CONFIGURATION.md) → [Privacy and retention](PRIVACY-AND-RETENTION.md) → [Operations and security](OPERATIONS-AND-SECURITY.md) → [Service runbook](SERVICE-RUNBOOK.md) → [Troubleshooting](TROUBLESHOOTING.md) |
| Contributor | [Architecture](ARCHITECTURE.md) → [API and data contracts](API-AND-DATA-CONTRACTS.md) → [Contributing](CONTRIBUTING.md) → [Source map](SOURCE-MAP.md) |
| Release reviewer | [RC1 Candidate 020 note](releases/0.10.0-rc.1.md) → [rights/license handoff](releases/0.10.0-rc.1-rights-license-review-handoff.md) → [Candidate 018 release note](releases/0.10.0-self-contained-candidate.7.md) → [Changelog](../CHANGELOG.md) → [Migration and upgrade](MIGRATION-AND-UPGRADE.md) → [Release and evidence](RELEASE-AND-EVIDENCE.md) |
| Security, reliability, or compliance reviewer | [Security policy status](SECURITY-POLICY.md) → [Service-level objectives](SERVICE-LEVEL-OBJECTIVES.md) → [Compliance guide](COMPLIANCE.md) |
| Researcher or reviewer | [Research program](RESEARCH-PROGRAM.md) → [Evaluation and research](EVALUATION-AND-RESEARCH.md) → [Release and evidence](RELEASE-AND-EVIDENCE.md) → [Source map](SOURCE-MAP.md) |
| Documentation maintainer | [Documentation contract](DOCUMENTATION-CONTRACT.md) → [Writing style](WRITING-STYLE.md) → [Documentation coverage](DOCUMENTATION-COVERAGE.md) → [Source map](SOURCE-MAP.md) → [Contributing](CONTRIBUTING.md) |

The manual preserves `0.10.0-rc.1` / `ARE-PRODUCT-CANDIDATE-020` as frozen
history while documenting the later unfrozen working prototype. It also
preserves version `0.10.0-self-contained-candidate.7`, frozen as
`ARE-PRODUCT-CANDIDATE-018`, as its historical baseline. Prose is explanatory. The linked source contracts
and evidence own exact behavior and claims.

## Manual contents

1. [Overview](OVERVIEW.md)
2. [Getting started](GETTING-STARTED.md)
3. [Core concepts](CONCEPTS.md)
4. [Capability guide](capabilities/README.md)
5. [Reason and manage context](capabilities/REASON-AND-MANAGE-CONTEXT.md)
6. [Manage interaction context](capabilities/MANAGE-INTERACTION-CONTEXT.md)
7. [End-to-end workflows](WORKFLOWS.md)
8. [Architecture](ARCHITECTURE.md)
9. [Components and integrations](COMPONENTS-AND-INTEGRATIONS.md)
10. [API and data contracts](API-AND-DATA-CONTRACTS.md)
11. [CLI and routing](CLI.md)
12. [Configuration](CONFIGURATION.md)
13. [Gateway and agent integration](GATEWAY-AND-AGENTS.md)
14. [Compatibility and lifecycle](COMPATIBILITY-AND-LIFECYCLE.md)
15. [State, learning, and conversation](STATE-LEARNING-AND-CONVERSATION.md)
16. [Privacy and retention](PRIVACY-AND-RETENTION.md)
17. [Operations and security](OPERATIONS-AND-SECURITY.md)
18. [Candidate 018 threat model](THREAT-MODEL.md)
19. [Troubleshooting](TROUBLESHOOTING.md)
20. [Evaluation and research](EVALUATION-AND-RESEARCH.md)
21. [Research program, benchmarks, and roadmap](RESEARCH-PROGRAM.md)
22. [Release and evidence](RELEASE-AND-EVIDENCE.md)
23. [Documentation contract](DOCUMENTATION-CONTRACT.md)
24. [Writing style](WRITING-STYLE.md)
25. [Deployment readiness](DEPLOYMENT.md)
26. [Migration and upgrade](MIGRATION-AND-UPGRADE.md)
27. [Generated API field reference](reference/API-FIELDS.md)
28. [Security policy status](SECURITY-POLICY.md)
29. [Service-level objectives](SERVICE-LEVEL-OBJECTIVES.md)
30. [Service runbook](SERVICE-RUNBOOK.md)
31. [Changelog](../CHANGELOG.md)
32. [RC1 preparation note](releases/0.10.0-rc.1.md)
33. [Candidate 018 release note](releases/0.10.0-self-contained-candidate.7.md)
33. [Historical Candidate 017 release note](releases/0.10.0-self-contained-candidate.6.md)
34. [Historical Candidate 015 release note](releases/0.10.0-self-contained-candidate.4.md)
35. [Historical Candidate 013 release note](releases/0.10.0-signed-envelope-candidate.2.md)
36. [Compliance guide](COMPLIANCE.md)
37. [Contributing](CONTRIBUTING.md)
38. [Glossary](GLOSSARY.md)
39. [Source-of-truth map](SOURCE-MAP.md)
40. [Documentation coverage](DOCUMENTATION-COVERAGE.md)

Run the documentation integrity check from the ARE implementation directory:

```sh
node docs/generate-api-reference.mjs --check
node docs/verify-compatibility-matrix.mjs --check
node docs/verify-license-requirements.mjs --check
node docs/verify-release-owner-decisions.mjs --check
node docs/generate-source-rights-inventory.mjs --check
node docs/verify-release-policy.mjs --check
node docs/verify-release-readiness.mjs --check
node docs/lint-writing-style.mjs --check-review
node docs/verify-docs.mjs
node docs/verify-release-manifest.mjs
```

The documentation release candidate is bound by
[`release-manifest.json`](release-manifest.json) and its
[`release-receipt.json`](release-receipt.json). The receipt covers the manual
bytes and documentation checks. It does not extend the frozen product closure.

## Documentation boundaries

- Product behavior comes from `product.json`, implementation contracts, and
  Candidate 018 evidence.
- Authority and routing come from repository authority and routing packages.
- ContextBench and model-fitting results remain research evidence.
- This manual grants no product approval, publication, deployment, or effect
  authority.

## Open Questions

- Which renderer, search index, and version selector should be used if the
  manual is later published?
- Which deferred guide in the documentation coverage map will be triggered by
  the next product lifecycle decision?
