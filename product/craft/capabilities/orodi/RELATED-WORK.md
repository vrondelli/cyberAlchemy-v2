# Craft ORODI capability and related work

Status: navigation and planning. Authority effect: none.

ORODI belongs to `CA2-PRODUCT-CRAFT`, coordinated by `CA2-PROJECT-CRAFT` and
`CA2-GOAL-CRAFT-ORODI-INTEGRATION`. Reuse the six existing [Product Capability records](product-capabilities.json);
this register creates no duplicate capability identity and changes no adoption decision.

## Related work

Paths cover the listed package and its descendants. DomainSpec and Alch retain their
own semantic and implementation ownership; their rows identify dependencies and consumers.

| Work | Lane / stage | Owner | Next action |
| --- | --- | --- | --- |
| [definitions](../../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions) | product construction / definitions | Craft ORODI Business Ontology owner | Use the original definition pack and selected revisions; canonical CAV2-D83 through CAV2-D92 selectors are now reconciled and admitted within Craft ORODI. |
| [canonical-reconciliation](../../../../authority/definitions/decisions/orodi-operational-evidence-promotion) | operational support / definitions | CyberAlchemy v2 definitions-governance owner | Resolved through [semantic admission](definition-reconciliation/admission.json); historical omission cause remains unknown. |
| [ontology](../../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/ontology) | product construction / business, DomainSpec, and compiled-system prototypes | Craft ORODI Business Ontology owner and DomainSpec compiler owners | Retain existing graphs and decisions; recheck selected definition dependencies before asserting current conformance. |
| [successor](../../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/successor) | product construction / implementation prototype | DomainSpec operational-resilience implementation owner | Track the compatibility migration and language successor; historical candidate and decision bytes remain unchanged. |
| [evidence-runtime](../../../../../projects/domainspec-v2/impl/operational-resilience) | product construction / implementation and product tests | DomainSpec operational-resilience implementation owner | Existing evidence contracts, evaluators, runtime projections, canary and rollback sources; no fresh runtime validation claimed. |
| [operator-interface](../../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/operator-interface) | product construction / product and implementation prototypes | Craft ORODI operator-interface owner | Connect operator observations to evidence and keep observer actions separate from protected effects. |
| [alert-definition](../../../../define/candidates/orodi-alert-profile) | product construction / definitions | Craft ORODI Business Ontology owner | Existing alert-profile definition candidate. |
| [alert-implementation](../../../../../projects/domainspec-v2/impl/operational-resilience/orodi-alert-profile) | product construction / implementation and product tests | ORODI alert-profile implementation owner | Existing platform-neutral profile and Grafana renderer; preserve distinct no-data and error states. |
| [domainspec-message-bindings](../../../../../projects/domainspec-v2/impl/cli) | product construction / DomainSpec and implementation prototypes | DomainSpec language and compiler owners | Dependency: reuse system-integration message channels, transport bindings, delivery/failure policies, and runtime outbox/inbox contracts. DomainSpec retains ownership. |
| [alch-events](../../../../language/capabilities/alchlang/plans/general-compiler-v1) | product construction / definitions and implementation prototypes | Alch language and compiler owners | Prototype implemented in event-bindings-v1: declarative source, TS/Rust contracts, local fault harness and ORODI observations. Generated deployment and runtime admission remain deferred. |
| [local-commissioning](../../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/runtime-readiness) | operational support / runtime evidence | Separately authorized ORODI commissioning owner | Deferred: exact effect authorization and independent runtime, teardown, and zero-residual evidence. |
| [craft-coordination](../../../../goals/projects/craft) | operational support / no stage | Craft Project owner | Coordinate through existing CA2-GOAL-CRAFT-ORODI-INTEGRATION; navigation does not change goal or admission state. |

Machine-readable capability references: [related-work.json](related-work.json).

## Construction frontier

Runnable now: candidate Alch event/observation design and no-effect fixtures using
existing DomainSpec message bindings. Keep state-and-outbox commit, provider acceptance,
consumer receipt, consumer commit, and telemetry export distinct.

Canonical reconciliation is resolved as operational support for the definitions stage.
[Reconciliation](definition-reconciliation/README.md) restores ten source-derived
sections and binds their tested semantic admission inside Craft ORODI. Existing
ontology/profile consumers of historical whole-file hashes still require scoped
migration; this semantic repair does not assert their current conformance.

Commissioning is deferred operational support owned by the separately authorized
ORODI commissioning owner. Publication and deployment remain separately scoped effects.

## Open Questions

- What caused the historical omission? The source-derived repair is verified; the historical cause remains unknown.
- Which exact ORODI observation profile and correlation contract should generated Alch adapters target?

## Evidence boundary

This register links existing work and records the current source discrepancy. The linked reconciliation repairs definitions and records bounded semantic admission.
This navigation register does not refresh frozen digests, transfer ownership, implement event
integration, or establish product approval, runtime conformance, or effect authority.

## Alch event prototype

The [event-bindings-v1 prototype](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/event-bindings-v1/README.md) now contains
the declarative order module, generated DomainSpec contracts, and local fault tests.
This advances prototype construction; generated serverless execution and a Rust
durable event runtime remain future work.

## Generated event execution successor

[event-execution-v1](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/event-execution-v1/README.md) adds standalone Node/Rust
invocation handlers and cross-target durable transaction tests. It supersedes the
prior prototype limitation on generated local execution; cloud adapters, production
storage topology, and runtime admission remain separate work.

## Alch Host provisioning prototype

[alch-host-provisioning-v1](../../../../work-orchestration-implementation/extensions/alch-host-provisioning-v1/README.md)
adds a five-node RWO DAG, real Ansible configuration of a private temporary
target, independent configuration/storage checks, and single-host durable
accepted history with restart reconciliation. This is product construction
owned by Alch Host and RWO, with Craft ORODI as the future evidence consumer.
Typed ORODI projection and remote provisioning are not implemented here.
Cloud credentials, DNS/TLS, and host allocation remain deferred operational
support owned by the platform operator; they do not block local construction.

The [evidence adapter successor](../../../../work-orchestration-implementation/extensions/alch-host-evidence-v1/README.md)
now projects all five provisioning stages into the existing ORODI observation
schema after read-only history verification. It distinguishes failure from no
accepted result and preserves pending telemetry. This is a local workflow
evidence candidate, with no full product-control verdict or live readiness claim.

## Local Alch host integration

[local-host-v1](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-host-v1/README.md)
adds deployment authoring and a generated loopback host for the Rust producer.
The host reuses the RWO–Ansible provisioning package, checks operator-supplied
credentials, and retains SQLite state across restarts. Product construction is
owned by Alch compiler/host owners. Live ORODI service checks, event delivery and
public tenant isolation remain successor work; `/health` reports listening only.

The [local event and isolation successor](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-host-events-v1/README.md)
adds local outbox-to-consumer dispatch, crash recovery and explicit Bubblewrap
invocation isolation. DomainSpec retains delivery semantics; Craft ORODI remains
the evidence consumer. Public operation, aggregate tenant resource policy and a
live queue-health projection are separate successor work.

The [local Alch control-plane candidate](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-control-plane-v1/README.md) adds tenant/project upload, isolated builds and revision routing around the existing RWO/Ansible host. Its local product tests do not establish live ORODI evaluation or public-hosting readiness. Open questions and separate operational residue are recorded in that package.

The [asynchronous Alch build successor](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/async-control-plane-v1/README.md) adds bounded durable admission, tenant turns, background isolated compilation and queue recovery. Its local tests preserve the distinction between an accepted upload, a ready artifact and an explicitly selected route. Live ORODI queue observations remain successor work; open questions are recorded in the package.

The [compatible Alch upgrade candidate](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/compatible-upgrades-v1/README.md) binds function-owned state to an exact compiled contract, drains pending delivery before switching revisions, and restores selected hosts on restart. Local tests cover upgrade/rollback state and deduplication; general state migrations and independent live ORODI evaluation remain separate successors. Open questions and operational residue are in that package.

The [additive Alch state migration candidate](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/state-migrations-v1/README.md) uses a DomainSpec-generated default Mapping, snapshot rehearsal and separate storage generations to preserve order and delivery history during a bounded schema change. Source-bound receipts and local recovery tests remain product-test evidence; independent live ORODI evaluation is deferred. Definitions, the derived scaffold, construction DAG and operational residue are linked in that package.

The [ontology-derived Alch schema candidate](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/ontology-schema-v1/README.md) derives schemas and DomainSpec default mappers from typed host records. Prepared plans bind the previous revision, generation and route epoch, reducing manual migration fields while retaining source-bound evidence. Local recovery tests remain product-construction evidence; live ORODI evaluation is deferred.

- [Alch semantic corrections](../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-corrections-v1/README.md): successor command/state/event/projection semantics, DomainSpec mappings, local delivery and migration tests. Construction evidence only; independent live ORODI integration remains separate.
