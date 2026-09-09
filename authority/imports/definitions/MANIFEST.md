# Definition Import Manifest

Status: active import ledger
Owner: definitions-governance
Scan date: 2026-06-19

## Purpose

Stage every non-generated definition-like source found in the current
`domainspec-core` checkout so CyberAlchemy v2 can promote terms deliberately
instead of starting with a tiny new vocabulary.

## Scan Scope

Included source families:

- `arcanum/`
- `implementation/`
- `cyberAlchemy/`
- `projects/`
- `research/`
- `docs/`
- `development/`
- `ops/`
- `domainspec-formalization/`
- `domainspec-lean-formalization/`
- `validation/`
- `internal_tools/`

Excluded source families:

- `cyberAlchemy-v2/` itself,
- generated output packages under `output/`,
- cleanup backups and generated command mirrors,
- templates, fixtures, expected outputs, and glossary consistency reports.

## Result

- Import candidates: 149
- Auxiliary or excluded definition-like sources: 28
- Promotion status: candidate only
- Canonical destination after promotion:
  [../../definitions/DEFINITIONS.md](../../definitions/DEFINITIONS.md)

## Import Candidates

```text
arcanum/arcana/definitions-governance/README.md
arcanum/arcana/definitions-governance/SKILL.md
arcanum/arcana/definitions-governance/development/definition-voices-audit/AUDIT-REPORT.md
arcanum/arcana/definitions-governance/development/definition-voices-audit/IMPLEMENTATION-LAYERING.md
arcanum/arcana/definitions-governance/development/definition-voices-audit/INVOKE-PLAN.md
arcanum/arcana/definitions-governance/development/definition-voices-audit/PLAN-TRANSPORT.md
arcanum/arcana/definitions-governance/development/definition-voices-audit/WORK-PACK.md
arcanum/arcana/definitions-governance/development/definition-voices-audit/task-session-20260619T170113Z/CONTEXT-PACK.md
arcanum/arcana/definitions-governance/development/definition-voices-audit/task-session-20260619T170113Z/TASK-SESSION-REPORT.md
arcanum/arcana/definitions-governance/development/reflection-report-20260619-definition-voices.md
arcanum/arcana/distill/development/GLOSSARY.md
arcanum/arcana/integration-spec/development/refinement-runs/20260616T144535Z-integration-spec-refine/stages/subagent-receipts/taxonomy-standards-mapper.md
arcanum/arcana/inventory/development/GLOSSARY.md
arcanum/benchmark/development/refinement-runs/20260527T093001Z-benchmark/invoke-define/glossary.md
arcanum/definitions/DEFINITION-DRIFT-AUDIT.md
arcanum/definitions/DEFINITIONS-INDEX.md
arcanum/definitions/DEFINITIONS.md
arcanum/definitions/RELATIONSHIPS.md
arcanum/definitions/TAXONOMY.md
arcanum/development/cyberalchemy-ontology-lifecycle/DEFINITIONS-GLOSSARY.md
arcanum/development/user-guide/packages/guide/GLOSSARY.md
arcanum/development/user-guide/packages/translate/GLOSSARY.md
arcanum/development/user-guide/packages/user-ledger/GLOSSARY.md
arcanum/disciplines/cards/definition-governance.md
arcanum/extraction-research/definitions-governance.md
arcanum/formulae/dispatch-spec/development/GLOSSARY.md
arcanum/projects/ui-prototyping-studio/glossary.md
arcanum/research/autobayes/DEFINITIONS.md
arcanum/research/autobayes/GLOSSARY.md
arcanum/research/mogt-agentic-conversation/definitions/DEFINITIONS-INDEX.md
arcanum/research/mogt-agentic-conversation/definitions/DEFINITIONS.md
arcanum/research/mogt-agentic-conversation/definitions/INITIAL-DEFINITIONS.md
arcanum/research/monoidal-categories-multicategories/DEFINITIONS.md
arcanum/research/monoidal-categories-multicategories/GLOSSARY.md
arcanum/research/shared-notation-glossary.md
arcanum/research/triton-top2-backward-kernel/definitions.md
arcanum/research/triton-top2-backward-kernel/glossary.md
arcanum/spells/necronomicon/development/GLOSSARY.md
arcanum/spells/observed-invocation-loop/development/GLOSSARY.md
arcanum/spells/whisper/development/refinement-runs/20260526T204134Z-language-ai-substack/GLOSSARY.md
development/deterministic-test-derivation-engine/GLOSSARY.md
docs/glossary.md
domainspec-formalization/GLOSSARY.md
implementation/domainspec/RELATIONSHIPS.md
implementation/domainspec/TAXONOMY.md
implementation/domainspec/docs/features/goldenquill-promotion-governance/glossary.md
implementation/domainspec/docs/glossary.md
implementation/domainspec/docs/interviews/agent-execution-orchestrator/INITIAL-DEFINITIONS.md
implementation/domainspec/docs/shared/relationship-adoption-rollout-plan.md
implementation/domainspec/domain_knowledge/lean-code-validator/discovery/INITIAL-DEFINITIONS.md
implementation/domainspec/implementation/app-frontend/docs/glossary.md
implementation/domainspec/internal_tools/graph_retrieval/features/two-layer-retrieval/spec/glossary.md
implementation/domainspec/internal_tools/vault_common/features/spec/glossary.md
implementation/domainspec/internal_tools/vault_ctl/features/spec/glossary.md
implementation/domainspec/starter/glossary.md
implementation/mars/definitions/DEFINITIONS-INDEX.md
implementation/mars/definitions/DEFINITIONS.md
implementation/mars/definitions/EXPERIMENT-BUNDLE-CONTRACT.md
implementation/mars/definitions/INVENTORY-LIBRARY-CONTRACT.md
implementation/mars/definitions/INVENTORY-READINESS-GATE.md
implementation/mars/definitions/MARS-PIPELINE.md
implementation/mars/definitions/METHODOLOGY-PROFILE-CONTRACT.md
implementation/mars/definitions/MULTI-SOURCE-CONTEXT-PATTERN.md
implementation/mars/definitions/PAPER-DERIVATION-RULES.md
implementation/mars/definitions/README.md
implementation/mars/definitions/RESEARCH-KNOWLEDGE-STACK-CONTRACT.md
implementation/mars/definitions/RESEARCH-RELATIONSHIPS.md
implementation/mars/definitions/RESEARCH-TAXONOMY.md
ops/development/keystone-lift/GLOSSARY.md
projects/body-war/docs/INITIAL-DEFINITIONS.md
projects/body-war/docs/glossary.md
projects/body-war/domainspec/RELATIONSHIPS.md
projects/body-war/domainspec/TAXONOMY.md
projects/domainspec-v2/research/alloy-tla-modeling/DEFINITIONS.md
projects/domainspec-v2/research/alloy-tla-modeling/GLOSSARY.md
projects/domainspec-v2/research/dcb-saga-correctness/TAXONOMY-EDGE-FRAME.md
projects/domainspec-v2/research/intent-tags/development/GLOSSARY.md
projects/equalizator/docs/INITIAL-DEFINITIONS.md
projects/goldenquill/docs/features/goldenquill-promotion-governance/glossary.md
projects/ontologize/DEFINITIONS.md
projects/ontologize/GLOSSARY.md
projects/ontologize/definitions/DEFINITION-DRIFT-AUDIT.md
projects/ontologize/definitions/DEFINITIONS-INDEX.md
projects/ontologize/definitions/DEFINITIONS.md
projects/ontologize/development/view-triad-method/GLOSSARY.md
projects/ontologize/operational-ontology/DEFINITIONS.md
projects/poker-agent-arena/GLOSSARY.md
projects/pos-multilevel/docs/INITIAL-DEFINITIONS.md
projects/pos-multilevel/docs/glossary.md
projects/sonar-loop/docs/features/sonar-loop/glossary.md
projects/ui-prototyping-studio/glossary.md
projects/ui-prototyping-studio/provenance/legacy-domainspec-spec/glossary.md
projects/whisky-doses/docs/INITIAL-DEFINITIONS.md
projects/whisky-doses/docs/features/bottle-listing-and-dose-allocation/glossary.md
projects/whisky-doses/docs/features/buyer-registry/glossary.md
projects/whisky-doses/docs/features/dose-payment-tracking/glossary.md
projects/whisky-doses/docs/features/freight-and-shipment-batching/glossary.md
projects/whisky-doses/docs/features/payment-link-and-reminder-messaging/glossary.md
projects/whisky-doses/domainspec/RELATIONSHIPS.md
projects/whisky-doses/domainspec/TAXONOMY.md
research/agentic-music-studio/definitions.md
research/agentic-music-studio/glossary.md
research/claude-shannon-secrecy-systems/DEFINITIONS.md
research/claude-shannon-secrecy-systems/GLOSSARY.md
research/claude-shannon-secrecy-systems/definition-cards/confusion-diffusion.md
research/claude-shannon-secrecy-systems/definition-cards/equivocation.md
research/claude-shannon-secrecy-systems/definition-cards/perfect-secrecy.md
research/claude-shannon-secrecy-systems/definition-cards/unicity-distance.md
research/jusbrasil-call/towers/feijo-moreira-entailment-summ/definitions.md
research/jusbrasil-call/towers/feijo-moreira-entailment-summ/glossary.md
research/jusbrasil-call/towers/jua-benchmark/definitions.md
research/jusbrasil-call/towers/jua-benchmark/glossary.md
research/jusbrasil-call/towers/juru-legal-llm/definitions.md
research/jusbrasil-call/towers/juru-legal-llm/glossary.md
research/jusbrasil-call/towers/magesh-hallucination-free/definitions.md
research/jusbrasil-call/towers/magesh-hallucination-free/glossary.md
research/jusbrasil-call/towers/menezes-neto-outcome-prediction/definitions.md
research/jusbrasil-call/towers/menezes-neto-outcome-prediction/glossary.md
research/jusbrasil-call/towers/multi-lexsum/definitions.md
research/jusbrasil-call/towers/multi-lexsum/glossary.md
research/jusbrasil-call/towers/robertalexpt/definitions.md
research/jusbrasil-call/towers/robertalexpt/glossary.md
research/jusbrasil-call/towers/ulysseslegalner-br/definitions.md
research/jusbrasil-call/towers/ulysseslegalner-br/glossary.md
research/lesswrong-rationality/definitions.md
research/lesswrong-rationality/glossary.md
research/projects/domainspec/definitions/CONSTITUTION.md
research/projects/domainspec/definitions/DEFINITIONS-INDEX.md
research/projects/domainspec/definitions/DEFINITIONS.md
research/projects/domainspec/definitions/METHODOLOGY-PROFILE.md
research/projects/mars/definitions/DEFINITIONS-INDEX.md
research/projects/mars/definitions/DEFINITIONS.md
research/projects/mars/definitions/EXPERIMENT-BUNDLE-CONTRACT.md
research/projects/mars/definitions/INVENTORY-LIBRARY-CONTRACT.md
research/projects/mars/definitions/INVENTORY-READINESS-GATE.md
research/projects/mars/definitions/MARS-PIPELINE.md
research/projects/mars/definitions/METHODOLOGY-PROFILE-CONTRACT.md
research/projects/mars/definitions/MULTI-SOURCE-CONTEXT-PATTERN.md
research/projects/mars/definitions/PAPER-DERIVATION-RULES.md
research/projects/mars/definitions/README.md
research/projects/mars/definitions/RESEARCH-KNOWLEDGE-STACK-CONTRACT.md
research/projects/mars/definitions/RESEARCH-RELATIONSHIPS.md
research/projects/mars/definitions/RESEARCH-TAXONOMY.md
research/ternary-models/DEFINITIONS.md
research/ternary-models/GLOSSARY.md
research/tower-system-taxonomy/witness-unit/GLOSSARY.md
research/triton-top2-backward-kernel/definitions.md
research/triton-top2-backward-kernel/glossary.md
validation/poker-team/docs/glossary.md
```

## Auxiliary Or Excluded Definition-Like Sources

These are useful evidence for format, drift, or examples, but should not become
definition import candidates without a separate reason.

```text
arcanum/arcana/architecture-pattern-inventory/templates/architecture-package/pattern-library/relationships/README.md
arcanum/arcana/architecture-pattern-inventory/templates/architecture-package/pattern-library/relationships/relationship-card.md
arcanum/arcana/craft/development/invoke-runs/20260615T123257Z-craft-index-improvements/GLOSSARY-CONSISTENCY.md
arcanum/arcana/craft/development/invoke-runs/20260615T152120Z-craft-row-update-planner-architecture/GLOSSARY-CONSISTENCY.md
arcanum/arcana/craft/development/invoke-runs/20260615T161047Z-craft-canonical-schema-stack/GLOSSARY-CONSISTENCY.md
arcanum/arcana/craft/development/refinement-runs/20260614T200439Z-craft-feature-readiness-indexes/GLOSSARY-CONSISTENCY.md
arcanum/arcana/craft/development/refinement-runs/20260615T121512Z-craft-ledger-csv-json-indexes/GLOSSARY-CONSISTENCY.md
arcanum/arcana/inventory/development/GLOSSARY-CONSISTENCY.md
arcanum/arcana/inventory/development/GLOSSARY.candidates.md
arcanum/arcana/research-tower/templates/definition-card.md
arcanum/arcana/research-tower/templates/glossary-entry.md
arcanum/benchmark/GLOSSARY-CONSISTENCY.md
arcanum/formulae/dispatch-spec/development/GLOSSARY-CONSISTENCY.md
arcanum/framework/runtime/development/fixtures/invoke-design-artifacts/target/development/GLOSSARY-CONSISTENCY.md
arcanum/spells/invoke/templates/module-formulae/glossary-ontology.md
arcanum/spells/necronomicon/development/GLOSSARY-CONSISTENCY.md
implementation/domainspec/templates/glossary.md
implementation/domainspec/templates/initial-definitions.md
implementation/mars/templates/definitions-index-template.md
implementation/mars/templates/initial-definitions-template.md
projects/body-war/docs/features/parque-taquaral-online-mvp/GLOSSARY-CONSISTENCY.md
projects/body-war/domainspec/templates/glossary.md
projects/body-war/domainspec/templates/initial-definitions.md
projects/ontology/GLOSSARY-CONSISTENCY.md
projects/whisky-doses/domainspec/templates/glossary.md
projects/whisky-doses/domainspec/templates/initial-definitions.md
research/projects/mars/templates/definitions-index-template.md
research/projects/mars/templates/initial-definitions-template.md
```

## Next Extraction Route

1. Cluster the 149 candidates by source family and term type.
2. Extract stable term IDs where present.
3. Detect duplicate terms across Arcanum, DomainSpec, MARS, Ontologize,
   CyberAlchemy, project glossaries, and research towers.
4. Promote only terms needed by CyberAlchemy v2 into
   [../../definitions/DEFINITIONS.md](../../definitions/DEFINITIONS.md), with
   scientific/formal, plain-language, and domain-context voices.

## Open Questions

### OQ-1. Which definitions are source-of-truth versus research-local?

Context: the manifest includes active canonical files, local glossaries,
research definitions, and project feature glossaries. Recommendation: classify
authority posture before copying content into CyberAlchemy v2 definitions.
Status: OPEN.
