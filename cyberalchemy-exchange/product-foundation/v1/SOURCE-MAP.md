# Exchange source map and consolidation findings

Status: source-inspected candidate, 2026-09-13. Owner: Exchange product owner.
Exact hashes and selectors: [sources.json](sources.json). File discovery: [inventory.json](inventory.json).

## Coverage

The scan covered repository entry documents and Exchange/KEP/inference/host source families,
plus bounded content searches in `implementation/` and `development/`. It discovered
1,632 source/document paths in the selected families and pinned 82 selected evidence files after the offering clarification.
This is a navigable inventory, not a claim that every discovered file was read.
Dependencies, build outputs, credentials, runtime data and archives were excluded.
The later offering clarification additionally inspected only the owner-named sibling
`../CyberAlchemy-lab/README.md`; no other sibling content was scanned. No external
service was contacted.

## Ownership and disposition

| Location | Disposition |
| --- | --- |
| `cyberalchemy-exchange/` | Existing product root and purchase implementation |
| `cyberalchemy-exchange/knowledge-exchange-protocol/` | Internal protocol; preserve owned meanings, decisions and current runtime paths |
| `define/reviews/cyberalchemy-exchange/` | Selected product decisions and superseded history; link instead of duplicating authority |
| Alch `extensions/inference-router-v1/` | Exchange inference product work currently nested beneath compiler experiments |
| Alch host/controller/lifecycle extension families | Existing host capabilities to include in Exchange; extraction requires a dependency-aware successor |
| `tools/inference-reference` | Existing operator entrypoint to include in the Exchange distribution design |
| Auth Foundation references in inference security | Shared identity/authorization dependency; sibling implementation was not re-audited |
| `development/robot-world-kep/` | Related local consumer/fixture, explicitly not real KEP integration |
| `development/research/2026-06-24-knowledge-market-product-idea/` | Historical research, not selected Exchange economics |
| `implementation/domainspec-v2/` | Shared compiler/validation substrate; name matches do not make it Exchange-owned |
| Telegraph adapter | Superseded compatibility experiment; retain reference evidence |

ARE additionally has a [source-boundary map](ARE-SOURCE-BOUNDARY.md) covering its
product/development/runtime roots and the ten roots declared by its candidate profile.

## Gaps and conflicting statements

1. The project index resolves Exchange to KEP. Product navigation needs a distinct Exchange entry while preserving the KEP identity. No index digest was refreshed here.
2. The early inference PLAN says planning-only while later product receipts record local tests and a real-engine smoke. Use exact successor evidence for maturity.
3. Local-pattern README disclaims real-engine compatibility; the later live result establishes two short requests only. Neither establishes current availability or performance.
4. KEP retains legacy source paths and historical admission records. The relocation report documents prior validation drift; this consolidation does not repair it.
5. The host is part of Exchange by current user direction, but the controllers still have Alch ownership and names in their source records. This is a product boundary decision, not a completed extraction.
6. Inference, host and purchase have separate identity/store/runtime compositions. A single ontology graph does not make a unified service exist.
7. The host is more than an inference proxy: it already has revision builds, activation, events, migrations and lifecycle control.

## Selected evidence

| Ref | Source | Role |
| --- | --- | --- |
| S001 | [cyberalchemy-exchange/README.md](../../README.md) | existing evidence |
| S002 | [define/reviews/cyberalchemy-exchange/INTAKE.md](../../../define/reviews/cyberalchemy-exchange/INTAKE.md) | existing evidence |
| S003 | [define/reviews/cyberalchemy-exchange/intake.json](../../../define/reviews/cyberalchemy-exchange/intake.json) | existing evidence |
| S004 | [define/reviews/cyberalchemy-exchange/DECRYPTION-SETTLEMENT-DESIGN.md](../../../define/reviews/cyberalchemy-exchange/DECRYPTION-SETTLEMENT-DESIGN.md) | existing evidence |
| S005 | [cyberalchemy-exchange/RELOCATION.md](../../RELOCATION.md) | existing evidence |
| S006 | [cyberalchemy-exchange/knowledge-exchange-protocol/authority/definitions/DEFINITIONS.md](../../knowledge-exchange-protocol/authority/definitions/DEFINITIONS.md) | existing evidence |
| S007 | [cyberalchemy-exchange/knowledge-exchange-protocol/business-ontology.json](../../knowledge-exchange-protocol/business-ontology.json) | existing evidence |
| S008 | [cyberalchemy-exchange/knowledge-exchange-protocol/product-thesis.record.json](../../knowledge-exchange-protocol/product-thesis.record.json) | existing evidence |
| S009 | [cyberalchemy-exchange/knowledge-exchange-protocol/white-paper/v1/README.md](../../knowledge-exchange-protocol/white-paper/v1/README.md) | existing evidence |
| S010 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/discovery/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/discovery/README.md) | existing evidence |
| S011 | [cyberalchemy-exchange/capabilities/project-purchase/v1/README.md](../../capabilities/project-purchase/v1/README.md) | existing evidence |
| S012 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-service-client-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-service-client-v1/README.md) | existing evidence |
| S013 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-control-plane-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-control-plane-v1/README.md) | existing evidence |
| S014 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/async-control-plane-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/async-control-plane-v1/README.md) | existing evidence |
| S015 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-corrections-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-corrections-v1/README.md) | existing evidence |
| S016 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md) | existing evidence |
| S017 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/product-test.json](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/product-test.json) | existing evidence |
| S018 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/execution.json](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/execution.json) | existing evidence |
| S019 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/compatible-upgrades-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/compatible-upgrades-v1/README.md) | existing evidence |
| S020 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/state-migrations-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/state-migrations-v1/README.md) | existing evidence |
| S021 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/README.md) | existing evidence |
| S022 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/PROTOCOL.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/PROTOCOL.md) | existing evidence |
| S023 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/RESULT.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/RESULT.md) | existing evidence |
| S024 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/LIVE-RESULT.json](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/LIVE-RESULT.json) | existing evidence |
| S025 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/stream/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/stream/README.md) | existing evidence |
| S026 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/invocation/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/invocation/README.md) | existing evidence |
| S027 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/README.md) | existing evidence |
| S028 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/VLLM-RESULT.json](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/VLLM-RESULT.json) | existing evidence |
| S029 | [tools/inference-reference](../../../tools/inference-reference) | existing evidence |
| S030 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/README.md) | existing evidence |
| S031 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/STRUCTURAL-MODEL-APPROVAL.json](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/STRUCTURAL-MODEL-APPROVAL.json) | existing evidence |
| S032 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/IMPLEMENTATION.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/IMPLEMENTATION.md) | existing evidence |
| S033 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable/README.md) | existing evidence |
| S034 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/renewal/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/renewal/README.md) | existing evidence |
| S035 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/ingress/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/ingress/README.md) | existing evidence |
| S036 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/custody/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/custody/README.md) | existing evidence |
| S037 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable-custody/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable-custody/README.md) | existing evidence |
| S038 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/reconciliation/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/reconciliation/README.md) | existing evidence |
| S039 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/provider-evidence/PLAN.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/provider-evidence/PLAN.md) | existing evidence |
| S040 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/protected-rehearsal/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/protected-rehearsal/README.md) | existing evidence |
| S041 | [cyberalchemy-exchange/knowledge-exchange-protocol/README.md](../../knowledge-exchange-protocol/README.md) | existing evidence |
| S042 | [cyberalchemy-exchange/knowledge-exchange-protocol/capabilities/solana-coownership/README.md](../../knowledge-exchange-protocol/capabilities/solana-coownership/README.md) | existing evidence |
| S043 | [cyberalchemy-exchange/knowledge-exchange-protocol/capabilities/durable-storage/README.md](../../knowledge-exchange-protocol/capabilities/durable-storage/README.md) | existing evidence |
| S044 | [cyberalchemy-exchange/knowledge-exchange-protocol/capabilities/durable-storage/runtime/README.md](../../knowledge-exchange-protocol/capabilities/durable-storage/runtime/README.md) | existing evidence |
| S045 | [cyberalchemy-exchange/knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/README.md](../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/README.md) | existing evidence |
| S046 | [cyberalchemy-exchange/capabilities/project-purchase/v1/construction.json](../../capabilities/project-purchase/v1/construction.json) | existing evidence |
| S047 | [cyberalchemy-exchange/capabilities/project-purchase/v1/definition-pack.json](../../capabilities/project-purchase/v1/definition-pack.json) | existing evidence |
| S048 | [cyberalchemy-exchange/capabilities/project-purchase/v1/evidence/deployment-completion.json](../../capabilities/project-purchase/v1/evidence/deployment-completion.json) | existing evidence |
| S049 | [cyberalchemy-exchange/capabilities/project-purchase/v1/evidence/deployment-sbf-test-report.json](../../capabilities/project-purchase/v1/evidence/deployment-sbf-test-report.json) | existing evidence |
| S050 | [cyberalchemy-exchange/capabilities/project-purchase/v1/DEVNET-READINESS.md](../../capabilities/project-purchase/v1/DEVNET-READINESS.md) | existing evidence |
| S051 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/OPERATOR.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/OPERATOR.md) | existing evidence |
| S052 | [cyberalchemy-exchange/capabilities/project-purchase/v1/deployment/PLAN.md](../../capabilities/project-purchase/v1/deployment/PLAN.md) | existing evidence |
| S053 | [cyberalchemy-exchange/capabilities/project-purchase/v1/deployment/public.json](../../capabilities/project-purchase/v1/deployment/public.json) | existing evidence |
| S054 | [cyberalchemy-exchange/capabilities/project-purchase/v1/deployment/envelope.json](../../capabilities/project-purchase/v1/deployment/envelope.json) | existing evidence |
| S055 | [cyberalchemy-exchange/capabilities/project-purchase/v1/deployment/preflight.json](../../capabilities/project-purchase/v1/deployment/preflight.json) | existing evidence |
| S056 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/manifest.json](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/manifest.json) | existing evidence |
| S057 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/reuse/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/reuse/README.md) | existing evidence |
| S058 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/reuse/quote-service/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/reuse/quote-service/README.md) | existing evidence |
| S059 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/service-contracts-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/service-contracts-v1/README.md) | existing evidence |
| S060 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/business-ontology.json](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/business-ontology.json) | existing evidence |
| S061 | [cyberalchemy-exchange/capabilities/project-purchase/v1/build.ts](../../capabilities/project-purchase/v1/build.ts) | existing evidence |
| S062 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/telegraph-inference-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/telegraph-inference-v1/README.md) | existing evidence |
| S063 | [development/robot-world-kep/README.md](../../../development/robot-world-kep/README.md) | existing evidence |
| S064 | [development/research/2026-06-24-knowledge-market-product-idea/research.md](../../../development/research/2026-06-24-knowledge-market-product-idea/research.md) | existing evidence |
| S065 | [agent-routing/project-index.json](../../../agent-routing/project-index.json) | existing evidence |
| S066 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-host-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-host-v1/README.md) | host predecessor/shared substrate |
| S067 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-host-events-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-host-events-v1/README.md) | host predecessor/shared substrate |
| S068 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/serverless-function-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/serverless-function-v1/README.md) | host predecessor/shared substrate |
| S069 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/rust-function-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/rust-function-v1/README.md) | host predecessor/shared substrate |
| S070 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-runtime-cli-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-runtime-cli-v1/README.md) | host predecessor/shared substrate |
| S071 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/event-execution-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/event-execution-v1/README.md) | host predecessor/shared substrate |
| S072 | [language/capabilities/alchlang/plans/general-compiler-v1/extensions/event-bindings-v1/README.md](../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/event-bindings-v1/README.md) | host predecessor/shared substrate |
| S073 | [../CyberAlchemy-lab/README.md](../../../../CyberAlchemy-lab/README.md) | selected offering identity or host evidence |
| S074 | [agent-reasoning-engine/README.md](../../../agent-reasoning-engine/README.md) | selected offering identity or host evidence |
| S075 | [implementation/agent-reasoning-engine/README.md](../../../implementation/agent-reasoning-engine/README.md) | selected offering identity or host evidence |
| S076 | [product/craft/README.md](../../../product/craft/README.md) | selected offering identity or host evidence |
| S077 | [language/capabilities/alchlang/profile.json](../../../language/capabilities/alchlang/profile.json) | selected offering identity or host evidence |
| S078 | [development/agent-reasoning-engine/README.md](../../../development/agent-reasoning-engine/README.md) | ARE product/runtime/dispersed-source boundary |
| S079 | [agent-reasoning-engine/product.json](../../../agent-reasoning-engine/product.json) | ARE product/runtime/dispersed-source boundary |
| S080 | [implementation/agent-reasoning-engine/product.json](../../../implementation/agent-reasoning-engine/product.json) | ARE product/runtime/dispersed-source boundary |
| S081 | [implementation/agent-reasoning-engine/package.json](../../../implementation/agent-reasoning-engine/package.json) | ARE product/runtime/dispersed-source boundary |
| S082 | [implementation/agent-reasoning-engine/packages/evolution-runtime/README.md](../../../implementation/agent-reasoning-engine/packages/evolution-runtime/README.md) | Candidate improvement-loop boundary; not verified edition closure |

## Open Questions

[OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) owns product decisions. The inventory coverage limit remains explicit; archives and sibling sources can be separately scoped if they are needed for a specific capability.
