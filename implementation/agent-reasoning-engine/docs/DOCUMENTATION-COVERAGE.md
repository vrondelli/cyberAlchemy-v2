# Documentation coverage

This map integrates the ARE manual by reader question. It also records documents
that should be created only when their underlying product boundary exists.

## Coverage matrix

| Reader question | Owning guide | Status |
| --- | --- | --- |
| What is ARE and what does it claim? | [Overview](OVERVIEW.md) | Covered |
| How do I run it for the first time? | [Getting started](GETTING-STARTED.md) | Covered |
| What terms and boundaries matter? | [Core concepts](CONCEPTS.md) and [Glossary](GLOSSARY.md) | Covered |
| What are the declared product capabilities? | [Capability guide](capabilities/README.md) | Covered |
| How do components fit together? | [Architecture](ARCHITECTURE.md) and [Components and integrations](COMPONENTS-AND-INTEGRATIONS.md) | Covered |
| How does a complete request or change flow work? | [End-to-end workflows](WORKFLOWS.md) | Covered |
| Which commands and routes exist? | [CLI and routing](CLI.md) | Covered |
| Which APIs, schemas, and records cross boundaries? | [API and data contracts](API-AND-DATA-CONTRACTS.md) and [generated API field reference](reference/API-FIELDS.md) | Candidate-internal closed inventory generated. Public surface unselected |
| How do I configure an instance? | [Configuration](CONFIGURATION.md) | Covered for Candidate 018 |
| How does another agent connect? | [Gateway and agents](GATEWAY-AND-AGENTS.md) | Covered for the process-adapter boundary |
| Which platforms, hosts, providers, and models are qualified? | [Compatibility and lifecycle](COMPATIBILITY-AND-LIFECYCLE.md) | Covered with explicit limitations |
| What is stored, retained, revised, or deleted? | [Privacy and retention](PRIVACY-AND-RETENTION.md) | Covered for current mechanisms. Deployment policy unresolved |
| How do state, conversation, and learning work? | [State, learning, and conversation](STATE-LEARNING-AND-CONVERSATION.md) | Covered |
| How is it operated, secured, and recovered? | [Operations and security](OPERATIONS-AND-SECURITY.md) | Covered for local candidate operation |
| What threats apply to the local package? | [Candidate 018 threat model](THREAT-MODEL.md) | Candidate-internal model complete. Risk acceptance and broader topologies unselected |
| How do I diagnose failures? | [Troubleshooting](TROUBLESHOOTING.md) | Covered |
| How is product and model quality measured? | [Evaluation and research](EVALUATION-AND-RESEARCH.md) and [Research program](RESEARCH-PROGRAM.md) | Covered |
| How is a candidate frozen and verified? | [Release and evidence](RELEASE-AND-EVIDENCE.md) | Covered |
| What can be deployed now? | [Deployment guide](DEPLOYMENT.md) | Tested local source-package procedure. No accepted production deployment |
| How is Candidate 018 upgraded? | [Migration and upgrade guide](MIGRATION-AND-UPGRADE.md) | No supported path until a successor pair passes |
| How are vulnerabilities reported? | [Security policy](SECURITY-POLICY.md) | Draft inactive. No public intake |
| What reliability targets and response procedures apply? | [Service-level objectives](SERVICE-LEVEL-OBJECTIVES.md) and [service runbook](SERVICE-RUNBOOK.md) | Not applicable until an operated service exists |
| What changed and what is this candidate? | [Changelog](../CHANGELOG.md) and [Candidate 018 release note](releases/0.10.0-self-contained-candidate.7.md) | Internal candidate history. No public release |
| Which compliance obligations apply? | [Compliance guide](COMPLIANCE.md) | Draft inactive. Applicability undecided |
| How do I change the product safely? | [Contributing](CONTRIBUTING.md) | Covered |
| Which writing and vocabulary rules apply? | [Writing style](WRITING-STYLE.md) | Covered and machine-checked |
| Which source wins when prose disagrees? | [Source-of-truth map](SOURCE-MAP.md) | Covered |

## Documentation layers

~~~mermaid
flowchart TD
    A[Manual: reader guidance] --> B[Source contracts and schemas]
    B --> C[Tests and immutable candidate evidence]
    C --> D[Owner decisions for approval and effects]
~~~

The manual explains supported behavior. Source contracts own exact behavior.
Tests and candidate records bound the evidence. None of those layers replaces
an owner decision where approval, publication, activation, deployment, or an
external effect is required.

## Release-readiness documents

| Document | Current lifecycle | Activation trigger |
| --- | --- | --- |
| [Deployment guide](DEPLOYMENT.md) | `READINESS_ONLY` | One exact deployment topology, reproducible artifact, operational profile, and completed drill |
| [Migration and upgrade guide](MIGRATION-AND-UPGRADE.md) | `NO_SUPPORTED_PATH` | A tested predecessor/successor pair, rollback, and backup/restore evidence |
| [Generated API field reference](reference/API-FIELDS.md) | `CANDIDATE_INTERNAL` | Owner-selected public surface, stability policy, and complete field annotations |
| [Security policy](SECURITY-POLICY.md) | `DRAFT_INACTIVE` | Named owner, supported-version scope, functioning private intake, and tabletop evidence |
| [Candidate 018 threat model](THREAT-MODEL.md) | `CANDIDATE_INTERNAL` | Owner review and accepted release scope. Successor model for any new topology |
| [Service-level objectives](SERVICE-LEVEL-OBJECTIVES.md) | `NOT_APPLICABLE` | Selected service, telemetry contract, measured baseline, and approved targets |
| [Service runbook](SERVICE-RUNBOOK.md) | `NOT_APPLICABLE` | Selected service, real resources and contacts, and passing game-day evidence |
| [Changelog](../CHANGELOG.md) and [Candidate 018 release note](releases/0.10.0-self-contained-candidate.7.md) | `CANDIDATE_INTERNAL` | Accepted release and selected versioning policy for public release wording |
| [Compliance guide](COMPLIANCE.md) | `DRAFT_INACTIVE` | Named jurisdiction, intended use, role/framework applicability, evidence map, and qualified review |

The documents exist so each missing boundary is visible without turning
speculative prose into an accidental product claim. Their lifecycle metadata
must remain inactive until the stated evidence and owner decisions exist.

## Maintenance rule

When the product boundary changes, update its owning source first. Then update
the smallest manual page that answers the affected reader question. Update this
coverage map and the documentation manifest. Run `node docs/verify-docs.mjs`. A changed
product closure may also require successor candidate evidence as described in
[Compatibility and lifecycle](COMPATIBILITY-AND-LIFECYCLE.md).

## Open Questions

- Should documentation coverage become a checked machine record that binds
  product components, capabilities, commands, and reader guides?
- Which inactive document will be triggered first by the next lifecycle
  decision?
