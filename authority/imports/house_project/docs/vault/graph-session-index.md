---
tags: [vault, ontology, agents]
node_type: conceptual
is_session: false
layer: ontology
nature: reference
status: active
version: 0.1.0
last_updated: 2026-03-31
---

# Session → Node Index

> Inverted index: for each referenced node, which sessions point to it and how.
> Use this to find provenance without opening individual session files.
> All session paths use the slug (filename without `.md`).


## Vault Nodes

| Target | Edge Type | Sessions |
|--------|-----------|---------|
| `agent-navigation.md` | `contextualizes` | `2026-03-08-0000-clarifying-antigravity-features` |
| `agent-navigation.md` | `updates` | `2026-03-19-1553-agent-workflows-as-hints` |
| `agent-navigation.md` | `validates` | `2026-03-19-1630-chronological-conversation-renaming` |
| `axiom/ontology-axioms.md` | `contextualizes` | `2026-03-19-1727-ontology-explorer-gravity-physics` |
| `axiom/ontology-axioms.md` | `derives-from` | `2026-03-17-2009-formalizing-ontology-axioms` |
| `axiom/ontology-axioms.md` | `updates` | `2026-03-17-2018-graph-health-kpis` |
| `axiom/ontology-axioms.md` | `validates` | `2026-03-24-1655-library-science-ontology-governance`, `2026-03-18-1242-ontology-premises-commit`, `2026-03-19-1146-vault-tagging-audit`, `2026-03-19-1256-ontology-label-system-refinement`, `2026-03-20-0219-ontology-assessment-and-roadmap` |
| `axiom/system-axioms.md` | `derives-from` | `2026-03-27-1800-document-pipeline-events-planning` |
| `axiom/system-axioms.md` | `updates` | `2026-03-10-0000-vault-organization` |
| `backlog/backlog.md` | `contextualizes` | `2026-03-17-2007-ontology-pre-mortem-risks` |
| `backlog/backlog.md` | `updates` | `2026-03-17-2009-formalizing-ontology-axioms`, `2026-03-18-1242-ontology-premises-commit` |
| `conceptual/epistemic-principles.md` | `implements` | `2026-03-19-2134-agent-event-system-design` |
| `conceptual/event-system-foundations.md` | `updates` | `2026-03-10-0000-vault-organization` |
| `conceptual/mission.md` | `contextualizes` | `2026-03-24-2054-newspaper-discovery`, `2026-03-27-1901-agent-infra-audit-token-efficiency` |
| `confidence-levels.md` | `contextualizes` | `2026-03-17-1403-ontology-architecture-design`, `2026-03-17-1639-ontology-classification-refinement`, `2026-03-17-2009-formalizing-ontology-axioms` |
| `constitution/development-practices-constitution.md` | `derives-from` | `2026-03-08-0000-implementing-contrato-count`, `2026-03-09-0000-refactoring-domains-spec`, `2026-03-10-0000-testing-frontend-e2e`, `2026-03-08-0000-fixing-test-failures` |
| `constitution/development-practices-constitution.md` | `validates` | `2026-03-31-1409-cloud-run-jobs-bulk-import-investigation`, `2026-03-09-0000-auditing-domains-codebase`, `2026-03-08-0000-fixing-plan-inconsistencies`, `2026-03-08-0000-updating-phase6-plan`, `2026-03-08-0000-moving-filters-to-domain`, `2026-03-08-0000-refining-override-ux`, `2026-03-24-1122-traverse-identify-orchestrator-refactor`, `2026-03-08-0000-running-all-tests`, `2026-03-09-0000-writing-missing-tests`, `2026-03-20-0210-gcp-migration-settings-test-audit` |
| `constitution/event-system-constitution.md` | `amends` | `2026-03-27-1103-event-log-entities-pipeline-events`, `2026-03-27-1700-document-pipeline-events-implementation` |
| `constitution/event-system-constitution.md` | `contextualizes` | `2026-03-30-1600-eventlogentities-domain-enum-fix-preimpl` |
| `constitution/event-system-constitution.md` | `derives-from` | `2026-03-08-0000-frontend-permission-logic`, `2026-03-08-0000-updating-filter-events-docs` |
| `constitution/event-system-constitution.md` | `questions` | `2026-03-27-1545-document-pipeline-events-spec-review` |
| `constitution/event-system-constitution.md` | `updates` | `2026-03-12-0000-event-log-entities-refactor`, `2026-03-13-1030-column-schema-v5-design` |
| `constitution/event-system-constitution.md` | `validates` | `2026-03-27-1500-document-pipeline-events-review`, `2026-03-08-0000-reviewing-filter-override-plan`, `2026-03-08-0000-fixing-plan-inconsistencies`, `2026-03-08-0000-refining-phase5-plan`, `2026-03-08-0000-updating-phase6-plan`, `2026-03-27-1800-document-pipeline-events-planning`, `2026-03-08-0000-fixing-constitution-violations`, `2026-03-08-0000-investigating-event-logging`, `2026-03-08-0000-refining-override-ux` |
| `constitution/folder-structure-constitution.md` | `contextualizes` | `2026-03-16-0000-import-hoisting-refactor` |
| `constitution/folder-structure-constitution.md` | `derives-from` | `2026-03-09-0000-reviewing-domain-refactor-doc`, `2026-03-09-0000-refactoring-domains-spec` |
| `constitution/folder-structure-constitution.md` | `validates` | `2026-03-31-1409-cloud-run-jobs-bulk-import-investigation`, `2026-03-08-0000-reviewing-filter-override-plan`, `2026-03-09-0000-auditing-domains-codebase`, `2026-03-09-0000-auditing-domains-refactor`, `2026-03-08-0000-fixing-plan-inconsistencies`, `2026-03-08-0000-fixing-constitution-violations`, `2026-03-08-0000-moving-filters-to-domain`, `2026-03-08-0000-refining-override-ux`, `2026-03-09-0000-writing-missing-tests` |
| `conversations/audit/2026-03-19-1940-gcp-migration-gap-analysis.md` | `validates` | `2026-03-19-1717-hardening-gcp-infrastructure-plan` |
| `conversations/audit/2026-03-19-2031-infrastructure-plan-agent-audit.md` | `refines` | `2026-03-19-2034-agent-duo-infrastructure-plan-audit-deep-dive` |
| `conversations/audit/2026-03-19-2251-gcp-migration-plan-audit-fix.md` | `updates` | `2026-03-20-1026-gcp-infra-deep-audit-loop` |
| `conversations/audit/2026-03-19-2311-migration-plan-assessment.md` | `updates` | `2026-03-20-1026-gcp-infra-deep-audit-loop` |
| `conversations/conceptual/2026-03-19-1727-ontology-explorer-gravity-physics.md` | `updates` | `2026-03-19-2121-ontology-visualization-ui-enhancements` |
| `conversations/constitution/2026-03-16-0000-import-hoisting-refactor.md` | `validates` | `2026-03-16-1043-invalid-structure-processing-and-docs` |
| `conversations/implementation-plan/2026-03-17-0130-complementary-table-detailed-implementation-plan.md` | `derives-from` | `2026-03-17-1020-registry-renames` |
| `conversations/implementation-plan/2026-03-17-0130-complementary-table-detailed-implementation-plan.md` | `updates` | `2026-03-17-1601-test-coverage-and-contract-builder-fix` |
| `conversations/implementation-plan/2026-03-17-0154-complementary-table-plan-review.md` | `contextualizes` | `2026-03-17-0933-registry-fixes-cadastros-refactor` |
| `conversations/implementation-plan/2026-03-17-0155-complementary-table-test-plan.md` | `contextualizes` | `2026-03-17-1353-csv-separator-autodetect` |
| `conversations/implementation-plan/2026-03-19-1716-gcp-migration-plan-update.md` | `updates` | `2026-03-19-1717-hardening-gcp-infrastructure-plan` |
| `conversations/implementation-plan/2026-03-19-1717-hardening-gcp-infrastructure-plan.md` | `validates` | `2026-03-20-1026-gcp-infra-deep-audit-loop` |
| `conversations/spec/2026-03-12-0000-event-log-entities-refactor.md` | `updates` | `2026-03-23-2000-event-log-entities-abstraction` |
| `conversations/spec/2026-03-15-1549-tiered-identification-spec-fix.md` | `refines` | `2026-03-15-1601-tiered-identification-spec-fix-2` |
| `conversations/spec/2026-03-15-1641-tiered-identification-ocr-extraction.md` | `updates` | `2026-03-16-0000-document-extraction-debugging`, `2026-03-16-1043-invalid-structure-processing-and-docs` |
| `conversations/spec/2026-03-16-0000-refine-template-matching.md` | `validates` | `2026-03-16-0000-document-extraction-debugging` |
| `conversations/spec/2026-03-17-0904-extra-cols-architecture.md` | `contextualizes` | `2026-03-17-0933-registry-fixes-cadastros-refactor` |
| `conversations/spec/2026-03-17-0904-extra-cols-architecture.md` | `refines` | `2026-03-17-0934-extra-cols-migration-fix` |
| `conversations/spec/2026-03-17-0904-extra-cols-architecture.md` | `updates` | `2026-03-17-1330-schema-fix-extra-cols` |
| `conversations/spec/2026-03-17-0933-registry-fixes-cadastros-refactor.md` | `updates` | `2026-03-17-1142-emissor-models-refactor` |
| `conversations/spec/2026-03-17-1020-registry-renames.md` | `updates` | `2026-03-17-1142-emissor-models-refactor` |
| `conversations/spec/2026-03-17-1142-emissor-models-refactor.md` | `contextualizes` | `2026-03-17-1529-fixing-upload-schema-e2e-tests` |
| `conversations/spec/2026-03-17-1218-complementary-table-tests-and-validation.md` | `contextualizes` | `2026-03-17-1529-fixing-upload-schema-e2e-tests` |
| `conversations/spec/2026-03-17-1218-complementary-table-tests-and-validation.md` | `derives-from` | `2026-03-17-1601-test-coverage-and-contract-builder-fix` |
| `conversations/spec/2026-03-17-1353-csv-separator-autodetect.md` | `derives-from` | `2026-03-17-1408-csv-column-derivation-fix` |
| `conversations/spec/2026-03-17-1353-csv-separator-autodetect.md` | `updates` | `2026-03-17-1529-fixing-upload-schema-e2e-tests` |
| `conversations/spec/2026-03-17-1529-fixing-upload-schema-e2e-tests.md` | `derives-from` | `2026-03-17-1601-test-coverage-and-contract-builder-fix` |
| `conversations/spec/2026-03-18-1634-comprovante-emprestimo-extraction.md` | `contextualizes` | `2026-03-18-1634-comprovante-emprestimo-extraction` |
| `conversations/spec/2026-03-18-1830-kittype-template-registration.md` | `updates` | `2026-03-18-1950-kittype-or-logic-and-ui-marker` |
| `conversations/spec/2026-03-18-2031-cross-check-implementation.md` | `updates` | `2026-03-18-2109-frontend-field-mapping-ui` |
| `conversations/spec/2026-03-19-1958-ontology-explorer-ux-enhancements.md` | `updates` | `2026-03-19-2121-ontology-visualization-ui-enhancements` |
| `conversations/spec/2026-03-20-0100-spacetime-grid-fullscreen.md` | `validates` | `2026-03-19-2121-ontology-visualization-ui-enhancements` |
| `conversations/spec/2026-03-23-1430-ccb-extraction-alignment.md` | `continues` | `2026-03-23-1516-ccb-extraction-fallback-cascade` |
| `conversations/test/2026-03-18-2001-test-coverage-kit-liquidacao.md` | `contextualizes` | `2026-03-18-2353-csv-encoding-fix` |
| `conversations/test/2026-03-20-0210-gcp-migration-settings-test-audit.md` | `validates` | `2026-03-20-1026-gcp-infra-deep-audit-loop` |
| `conversations/test/2026-03-24-0028-ccb-pipeline-test-implementation.md` | `derives-from` | `2026-03-24-0033-ccb-pipeline-test-audit-implementation` |
| `dictionary-business.md` | `contextualizes` | `2026-03-27-1901-agent-infra-audit-token-efficiency` |
| `dictionary-business.md` | `updates` | `2026-03-17-1403-ontology-architecture-design` |
| `discovery/informational-gravity-discovery.md` | `derives-from` | `2026-03-19-1510-agent-informational-gravity-and-context-routing` |
| `discovery/informational-gravity-discovery.md` | `validates` | `2026-03-19-1553-agent-workflows-as-hints` |
| `ontology-architecture-draft.md` | `contextualizes` | `2026-03-17-2007-ontology-pre-mortem-risks`, `2026-03-17-1504-ontology-foundations-refinement`, `2026-03-17-1639-ontology-classification-refinement` |
| `ontology-architecture-draft.md` | `derives-from` | `2026-03-19-2134-agent-event-system-design` |
| `ontology-architecture-draft.md` | `refines` | `2026-03-20-0219-ontology-assessment-and-roadmap` |
| `ontology-constitution.md` | `contextualizes` | `2026-03-24-1655-library-science-ontology-governance`, `2026-03-17-2007-ontology-pre-mortem-risks`, `2026-03-17-2009-formalizing-ontology-axioms`, `2026-03-18-1242-ontology-premises-commit`, `2026-03-19-1700-expected-importance-workflow-extension` |
| `ontology-constitution.md` | `derives-from` | `2026-03-24-2054-newspaper-discovery`, `2026-03-24-2244-business-philosopher-creation`, `2026-03-19-1639-vault-tagging-audit-and-node-type-test` |
| `ontology-constitution.md` | `refines` | `2026-03-17-1639-ontology-classification-refinement` |
| `ontology-constitution.md` | `updates` | `2026-03-17-1403-ontology-architecture-design` |
| `ontology-constitution.md` | `validates` | `2026-03-20-0219-ontology-assessment-and-roadmap` |
| `ontology-conventions.md` | `contextualizes` | `2026-03-17-2007-ontology-pre-mortem-risks`, `2026-03-19-1727-ontology-explorer-gravity-physics`, `2026-03-19-2134-agent-event-system-design`, `2026-03-19-1700-expected-importance-workflow-extension` |
| `ontology-conventions.md` | `derives-from` | `2026-03-24-1155-ontology-visualization-vault-restructure-fix`, `2026-03-18-2338-ontology-explorer-discovery`, `2026-03-19-1146-vault-tagging-audit`, `2026-03-18-1235-extra-cols-rework-seed-and-cleanup`, `2026-03-19-1630-chronological-conversation-renaming` |
| `ontology-conventions.md` | `implements` | `2026-03-24-2244-business-philosopher-creation`, `2026-03-20-1456-enforce-md-tagging` |
| `ontology-conventions.md` | `questions` | `2026-03-18-2341-agent-workflow-formalization`, `2026-03-20-0219-ontology-assessment-and-roadmap` |
| `ontology-conventions.md` | `updates` | `2026-03-10-0000-vault-organization`, `2026-03-17-1639-ontology-classification-refinement`, `2026-03-17-2009-formalizing-ontology-axioms`, `2026-03-19-1256-ontology-label-system-refinement`, `2026-03-19-1639-vault-tagging-audit-and-node-type-test`, `2026-03-19-1958-ontology-explorer-ux-enhancements` |
| `premise/ontology-premises.md` | `derives-from` | `2026-03-18-1242-ontology-premises-commit` |
| `premise/ontology-premises.md` | `updates` | `2026-03-19-1256-ontology-label-system-refinement` |
| `premise/system-premises.md` | `derives-from` | `2026-03-08-0000-refining-phase5-plan`, `2026-03-27-1800-document-pipeline-events-planning` |
| `premise/system-premises.md` | `updates` | `2026-03-10-0000-vault-organization` |

## Spec Nodes (under /specs/)

| Target | Edge Type | Sessions |
|--------|-----------|---------|
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `contextualizes` | `2026-03-13-0000-ccb-tables-column-refactor-review` |
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `derives-from` | `2026-03-18-2017-documents-table-cross-check`, `2026-03-18-2031-cross-check-implementation` |
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `implements` | `2026-03-12-0000-ccb-business-rules-documentation` |
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `updates` | `2026-03-13-0000-ccb-business-rules-refactor-consolidation`, `2026-03-14-0000-parallel-upload-spec-review`, `2026-03-12-0000-ccb-business-rules-refinement`, `2026-03-12-0000-ccb-model-review`, `2026-03-12-1632-perceptual-hashing-template-matching`, `2026-03-13-1030-column-schema-v5-design`, `2026-03-15-0254-text-based-template-matching` |
| `specs/002-ccb-validation-workflow/business-rules.md` | `contextualizes` | `2026-03-15-0000-critical-field-spec-review`, `2026-03-23-1922-ccb-refactor-audit-reason-semantics`, `2026-03-23-1239-failed-folder-unique-constraint-bug` |
| `specs/002-ccb-validation-workflow/business-rules.md` | `implements` | `2026-03-15-0254-text-based-template-matching`, `2026-03-23-1430-ccb-extraction-alignment`, `2026-03-23-1516-ccb-extraction-fallback-cascade` |
| `specs/002-ccb-validation-workflow/business-rules.md` | `updates` | `2026-03-15-1641-tiered-identification-ocr-extraction`, `2026-03-15-1704-tiered-identification`, `2026-03-16-0000-refine-template-matching`, `2026-03-16-1043-invalid-structure-processing-and-docs`, `2026-03-18-1634-comprovante-emprestimo-extraction`, `2026-03-23-1428-ccb-identification-fix` |
| `specs/002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md` | `implements` | `2026-03-13-0000-ccb-business-rules-refactor-consolidation` |
| `specs/002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md` | `updates` | `2026-03-13-0000-ccb-column-refactor-spec-review`, `2026-03-13-0000-ccb-implementation-spec-review`, `2026-03-13-0000-ccb-tables-column-refactor-review`, `2026-03-13-1030-column-schema-v5-design`, `2026-03-13-1433-upfront-document-version-creation`, `2026-03-13-0000-ccb-v5-full-test-suite-fix`, `2026-03-13-0000-ccb-v5-schema-test-migration` |
| `specs/002-ccb-validation-workflow/ccb-business-rules.md` | `contextualizes` | `2026-03-13-0000-ccb-business-rules-refactor-consolidation`, `2026-03-13-0000-ccb-implementation-spec-review` |
| `specs/002-ccb-validation-workflow/ccb-business-rules.md` | `implements` | `2026-03-12-0000-ccb-business-rules-documentation` |
| `specs/002-ccb-validation-workflow/ccb-business-rules.md` | `updates` | `2026-03-13-0000-ccb-column-refactor-spec-review`, `2026-03-12-0000-ccb-business-rules-refinement` |
| `specs/002-ccb-validation-workflow/ccb-code-alignement-refactor-implementation.md` | `implements` | `2026-03-12-0000-ccb-business-rules-refinement` |
| `specs/002-ccb-validation-workflow/ccb-code-alignement-refactor-implementation.md` | `supersedes` | `2026-03-13-0000-ccb-business-rules-refactor-consolidation` |
| `specs/002-ccb-validation-workflow/ccb-critical-field-check-implementation.md` | `contextualizes` | `2026-03-15-0000-phase3-completion-and-fixes`, `2026-03-16-0000-ccb-kit-type-refactor` |
| `specs/002-ccb-validation-workflow/ccb-critical-field-check-implementation.md` | `implements` | `2026-03-14-1416-ccb-refactor-phases-update` |
| `specs/002-ccb-validation-workflow/ccb-critical-field-check-implementation.md` | `updates` | `2026-03-15-0000-critical-field-spec-review`, `2026-03-14-0000-fixing-critical-field-check-spec` |
| `specs/002-ccb-validation-workflow/ccb-documents-check-logic-implementation.md` | `contextualizes` | `2026-03-15-0000-writing-missing-tests-multi-doc-type` |
| `specs/002-ccb-validation-workflow/ccb-entities.md` | `contextualizes` | `2026-03-12-0000-ccb-model-review` |
| `specs/002-ccb-validation-workflow/ccb-entities.md` | `implements` | `2026-03-12-0000-ccb-business-rules-documentation` |
| `specs/002-ccb-validation-workflow/ccb-entities.md` | `updates` | `2026-03-13-0000-ccb-column-refactor-spec-review`, `2026-03-13-0000-ccb-tables-column-refactor-review` |
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `implements` | `2026-03-23-1604-unified-critical-field-validation`, `2026-03-23-2328-ccb-pipeline-god-function-decomposition` |
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `validates` | `2026-03-23-1922-ccb-refactor-audit-reason-semantics`, `2026-03-24-0015-ccb-step-function-tests`, `2026-03-24-0028-ccb-pipeline-test-implementation`, `2026-03-24-0033-ccb-pipeline-test-audit-implementation` |
| `specs/002-ccb-validation-workflow/ccb-implementation-phases.md` | `contextualizes` | `2026-03-12-0000-ccb-model-review` |
| `specs/002-ccb-validation-workflow/ccb-parallel-documents-upload-implementation.md` | `contextualizes` | `2026-03-14-1416-ccb-refactor-phases-update` |
| `specs/002-ccb-validation-workflow/ccb-parallel-documents-upload-implementation.md` | `implements` | `2026-03-14-1413-parallel-upload-implementation`, `2026-03-24-1122-traverse-identify-orchestrator-refactor` |
| `specs/002-ccb-validation-workflow/ccb-parallel-documents-upload-implementation.md` | `updates` | `2026-03-14-0000-parallel-upload-spec-review` |
| `specs/002-ccb-validation-workflow/ccb-phase1-implementation.md` | `contextualizes` | `2026-03-16-0000-test-suite-stabilization-and-rollback` |
| `specs/002-ccb-validation-workflow/ccb-phase2-implementation.md` | `updates` | `2026-03-11-0000-phase1-phase2-implementation` |
| `specs/002-ccb-validation-workflow/ccb-phase6-implementation.md` | `updates` | `2026-03-12-0000-ccb-business-rules-documentation` |
| `specs/002-ccb-validation-workflow/ccb-refactor-phases.md` | `contextualizes` | `2026-03-14-0000-fixing-critical-field-check-spec` |
| `specs/002-ccb-validation-workflow/ccb-refactor-phases.md` | `updates` | `2026-03-14-1416-ccb-refactor-phases-update`, `2026-03-15-0000-phase3-completion-and-fixes` |
| `specs/002-ccb-validation-workflow/ccb-rules-alignment-refactor-implementation.md` | `supersedes` | `2026-03-13-0000-ccb-business-rules-refactor-consolidation` |
| `specs/002-ccb-validation-workflow/ccb-spec-v1.md` | `questions` | `2026-03-20-0031-template-matching-coverage-gap` |
| `specs/002-ccb-validation-workflow/ccb-spec-v1.md` | `updates` | `2026-03-18-2035-document-folder-renaming` |
| `specs/002-ccb-validation-workflow/ccb-spec-v1.md` | `validates` | `2026-03-18-2122-field-mapping-test-gaps` |
| `specs/002-ccb-validation-workflow/ccb-tables-column-refactor.md` | `contextualizes` | `2026-03-13-0000-ccb-implementation-spec-review`, `2026-03-13-0000-ccb-v5-schema-test-migration` |
| `specs/002-ccb-validation-workflow/ccb-tables-column-refactor.md` | `updates` | `2026-03-13-0000-ccb-column-refactor-spec-review`, `2026-03-13-0000-ccb-tables-column-refactor-review`, `2026-03-13-0000-ccb-v5-full-test-suite-fix` |
| `specs/002-ccb-validation-workflow/ccb-tiered-identification-implementation.md` | `implements` | `2026-03-15-1641-tiered-identification-ocr-extraction`, `2026-03-15-1704-tiered-identification` |
| `specs/002-ccb-validation-workflow/ccb-tiered-identification-implementation.md` | `updates` | `2026-03-15-1610-tiered-identification-spec-audit`, `2026-03-15-1601-tiered-identification-spec-fix-2` |
| `specs/002-ccb-validation-workflow/cloud-vision-migration-discovery.md` | `contextualizes` | `2026-03-19-1735-infrastructure-vision-api-worker-scaling` |
| `specs/002-ccb-validation-workflow/cloud-vision-migration-discovery.md` | `derives-from` | `2026-03-19-1733-identificacao-extraction-ocr-discovery` |
| `specs/002-ccb-validation-workflow/cloud-vision-migration-discovery.md` | `refines` | `2026-03-19-1810-cloud-vision-ocr-migration-implementation` |
| `specs/002-ccb-validation-workflow/cloud-vision-migration-implementation.md` | `implements` | `2026-03-19-1810-cloud-vision-ocr-migration-implementation` |
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `resolves` | `2026-03-24-1420-document-merge-implementation-fix` |
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `validates` | `2026-03-24-1612-merge-pipeline-test-audit` |
| `specs/002-ccb-validation-workflow/documents-table-check.md` | `implements` | `2026-03-18-2031-cross-check-implementation` |
| `specs/002-ccb-validation-workflow/documents-table-check.md` | `refines` | `2026-03-18-2109-frontend-field-mapping-ui` |
| `specs/002-ccb-validation-workflow/documents-table-check.md` | `validates` | `2026-03-18-2036-cross-check-test-coverage`, `2026-03-18-2122-field-mapping-test-gaps` |
| `specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md` | `derives-from` | `2026-03-24-1502-ccb-validation-migration-phase1-plan` |
| `specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md` | `implements` | `2026-03-24-2106-ccb-pipeline-migration-execution` |
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `resolves` | `2026-03-24-1502-ccb-validation-migration-phase1-plan`, `2026-03-24-2106-ccb-pipeline-migration-execution` |
| `specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md` | `contextualizes` | `2026-03-21-1139-pipeline-upload-texto-extraction` |
| `specs/002-ccb-validation-workflow/gemini-holerite-rj-extraction-plan.md` | `derives-from` | `2026-03-23-1410-holerite-rj-extraction` |
| `specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md` | `refines` | `2026-03-23-1200-gemini-extraction-robustness` |
| `specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md` | `derives-from` | `2026-03-19-1408-rg-extraction-quality-gates-e-identificacao-discovery` |
| `specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md` | `refines` | `2026-03-19-1444-identificacao-doc-type-tech-debt` |
| `specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md` | `updates` | `2026-03-19-1459-identificacao-doc-type-refinement` |
| `specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md` | `validates` | `2026-03-19-1451-rg-extraction-review`, `2026-03-19-1532-rg-document-extraction-evaluation`, `2026-03-19-1552-rg-extraction-test-gap-analysis` |
| `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` | `validates` | `2026-03-21-1255-test-audit-kit-matching-empresa-fallback` |
| `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` | `contextualizes` | `2026-03-18-2017-documents-table-cross-check` |
| `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` | `implements` | `2026-03-16-0000-ccb-kit-type-refactor` |
| `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` | `updates` | `2026-03-16-0000-kittype-template-plan-tests-added`, `2026-03-16-0000-kittype-template-spec-update`, `2026-03-16-0000-kittype-templates-or-logic`, `2026-03-16-1358-kittype-template-validation`, `2026-03-18-1830-kittype-template-registration`, `2026-03-18-1950-kittype-or-logic-and-ui-marker` |
| `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` | `validates` | `2026-03-18-1856-kittype-template-test-coverage`, `2026-03-18-2001-test-coverage-kit-liquidacao` |
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `contradicts` | `2026-03-19-1451-rg-extraction-review` |
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `implements` | `2026-03-19-1733-identificacao-extraction-ocr-discovery` |
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `updates` | `2026-03-19-1532-rg-document-extraction-evaluation`, `2026-03-19-1408-rg-extraction-quality-gates-e-identificacao-discovery`, `2026-03-19-1459-identificacao-doc-type-refinement`, `2026-03-19-1810-cloud-vision-ocr-migration-implementation`, `2026-03-19-1538-rg-document-extraction-verification-plan`, `2026-03-19-1552-rg-extraction-test-gap-analysis`, `2026-03-19-1600-test-failures-analysis` |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `derives-from` | `2026-03-21-1718-ccb-fallback-extractor-rebuild` |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `implements` | `2026-03-23-1410-holerite-rj-extraction` |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `updates` | `2026-03-23-1428-ccb-identification-fix`, `2026-03-23-1516-ccb-extraction-fallback-cascade`, `2026-03-23-1604-unified-critical-field-validation` |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `validates` | `2026-03-21-1812-test-audit-empresa-keywords-sanitize` |
| `specs/002-ccb-validation-workflow/system-fragilities.md` | `contextualizes` | `2026-03-20-0031-template-matching-coverage-gap`, `2026-03-21-1812-test-audit-empresa-keywords-sanitize` |
| `specs/002-ccb-validation-workflow/system-fragilities.md` | `derives-from` | `2026-03-19-1444-identificacao-doc-type-tech-debt` |
| `specs/002-ccb-validation-workflow/template-matching-coverage-discovery.md` | `implements` | `2026-03-20-0031-template-matching-coverage-gap` |
| `specs/002-ccb-validation-workflow/tiered-identification-implementation.md` | `updates` | `2026-03-15-1549-tiered-identification-spec-fix` |
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `contextualizes` | `2026-03-23-1200-gemini-extraction-robustness` |
| `specs/003-complementary-table/implementation-plan.md` | `validates` | `2026-03-18-1247-test-coverage-complementary-table` |
| `specs/003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md` | `contextualizes` | `2026-03-17-0122-complementary-table-main-table-definition` |
| `specs/003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md` | `updates` | `2026-03-17-0121-complementary-table-plan-review-update`, `2026-03-17-0130-complementary-table-detailed-implementation-plan`, `2026-03-17-0154-complementary-table-plan-review`, `2026-03-17-0155-complementary-table-test-plan`, `2026-03-17-0904-extra-cols-architecture`, `2026-03-17-0934-extra-cols-migration-fix`, `2026-03-17-0939-extra-cols-architecture-pivot`, `2026-03-17-1218-complementary-table-tests-and-validation` |
| `specs/003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md` | `contextualizes` | `2026-03-17-0933-registry-fixes-cadastros-refactor` |
| `specs/003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md` | `contradicts` | `2026-03-17-0154-complementary-table-plan-review` |
| `specs/003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md` | `implements` | `2026-03-17-0130-complementary-table-detailed-implementation-plan` |
| `specs/003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md` | `updates` | `2026-03-17-0121-complementary-table-plan-review-update`, `2026-03-17-0122-complementary-table-main-table-definition`, `2026-03-17-0904-extra-cols-architecture`, `2026-03-17-0934-extra-cols-migration-fix` |
| `specs/003-remessa-upload-with-events/pipeline/implementation-plan-sprint-2-tables.md` | `contextualizes` | `2026-03-18-1930-liquidacao-column-mapping` |
| `specs/003-remessa-upload-with-events/spec-complementary-table-registration.md` | `validates` | `2026-03-17-0106-complementary-table-spec-review` |
| `specs/event_system/implementation-plan-entity-event-catalog-alignment.md` | `validates` | `2026-03-30-1600-eventlogentities-domain-enum-fix-preimpl` |
| `specs/newspaper/docs/newspaper-communication-protocol.md` | `refines` | `2026-03-25-0338-info-exchange-condensation-law` |
| `specs/newspaper/orchestrator/manifesto.md` | `refines` | `2026-03-25-0338-info-exchange-condensation-law` |
| `specs/ontology/discovery-context-delegation.md` | `contextualizes` | `2026-03-27-1901-agent-infra-audit-token-efficiency` |

## Code Files

| Target | Edge Type | Sessions |
|--------|-----------|---------|
| `aquisicao/0014_phase1_new_models_fk_gcs.py` | `implements` | `2026-03-11-0000-phase1-phase2-implementation` |
| `aquisicao/0021_rename_extracted_id_titulo_documentsfolderresult_contrato_extracted_id_and_more.py` | `implements` | `2026-03-13-0000-ccb-v5-schema-test-migration` |
| `aquisicao/0021_rename_extracted_id_titulo_documentsfolderresult_contrato_extracted_id_and_more.py` | `updates` | `2026-03-13-0000-ccb-v5-full-test-suite-fix` |
| `aquisicao/0026_documentversion_matched_template.py` | `implements` | `2026-03-15-0000-phase3-completion-and-fixes` |
| `aquisicao/0029_alter_complementarytablecolumnconfig_unique_together_and_more.py` | `updates` | `2026-03-17-0934-extra-cols-migration-fix` |
| `aquisicao/domain/checklist_status.py` | `updates` | `2026-03-13-0000-ccb-v5-full-test-suite-fix` |
| `aquisicao/domain/template_matching_config.py` | `updates` | `2026-03-15-0254-text-based-template-matching` |
| `aquisicao/interfaces/urls.py` | `updates` | `2026-03-11-0000-phase1-phase2-implementation`, `2026-03-14-0000-document-preview-and-batch-fixes` |
| `aquisicao/interfaces/views.py` | `updates` | `2026-03-11-0000-phase1-phase2-implementation`, `2026-03-14-0000-document-preview-and-batch-fixes`, `2026-03-16-1158-frontend-polling-fix-and-live-progress` |
| `aquisicao/repositories/models.py` | `contextualizes` | `2026-03-13-0000-ccb-implementation-spec-review`, `2026-03-14-0000-parallel-upload-spec-review`, `2026-03-15-0000-critical-field-spec-review`, `2026-03-16-0000-ccb-kit-type-refactor` |
| `aquisicao/repositories/models.py` | `refines` | `2026-03-17-0130-complementary-table-detailed-implementation-plan` |
| `aquisicao/repositories/models.py` | `updates` | `2026-03-11-0000-phase1-phase2-implementation`, `2026-03-13-1433-upfront-document-version-creation`, `2026-03-14-1413-parallel-upload-implementation`, `2026-03-15-0000-phase3-completion-and-fixes`, `2026-03-15-1641-tiered-identification-ocr-extraction`, `2026-03-16-1158-frontend-polling-fix-and-live-progress`, `2026-03-17-0904-extra-cols-architecture`, `2026-03-18-1705-drop-id-titulo` |
| `aquisicao/services/ocr_service.py` | `contextualizes` | `2026-03-13-0000-ccb-implementation-spec-review`, `2026-03-12-0000-ccb-business-rules-documentation` |
| `aquisicao/services/ocr_service.py` | `updates` | `2026-03-15-1641-tiered-identification-ocr-extraction`, `2026-03-15-1704-tiered-identification`, `2026-03-12-1637-fix-test-skips-and-warnings` |
| `aquisicao/tasks/bulk_import_tasks.py` | `contextualizes` | `2026-03-14-0000-parallel-upload-spec-review` |
| `aquisicao/tasks/bulk_import_tasks.py` | `updates` | `2026-03-14-1413-parallel-upload-implementation`, `2026-03-14-1517-cross-batch-dedup-fix` |
| `aquisicao/tests/test_bulk_import.py` | `contextualizes` | `2026-03-12-0000-ccb-business-rules-refinement` |
| `aquisicao/tests/test_bulk_import.py` | `updates` | `2026-03-15-0000-phase3-completion-and-fixes`, `2026-03-16-1158-frontend-polling-fix-and-live-progress`, `2026-03-13-0000-ccb-v5-full-test-suite-fix`, `2026-03-13-0000-ccb-v5-schema-test-migration` |
| `aquisicao/tests/test_checklist.py` | `updates` | `2026-03-13-0000-ccb-v5-full-test-suite-fix` |
| `aquisicao/tests/test_document_models.py` | `updates` | `2026-03-11-0000-phase1-phase2-implementation`, `2026-03-13-0000-ccb-v5-full-test-suite-fix`, `2026-03-13-0000-ccb-v5-schema-test-migration` |
| `aquisicao/tests/test_document_template.py` | `updates` | `2026-03-15-0000-writing-missing-tests-multi-doc-type` |
| `aquisicao/tests/test_kit_management.py` | `updates` | `2026-03-11-0000-phase1-phase2-implementation` |
| `aquisicao/tests/test_ocr.py` | `updates` | `2026-03-12-0000-event-log-entities-refactor`, `2026-03-14-1517-cross-batch-dedup-fix`, `2026-03-13-0000-ccb-v5-full-test-suite-fix`, `2026-03-13-0000-ccb-v5-schema-test-migration`, `2026-03-15-0000-writing-missing-tests-multi-doc-type` |
| `aquisicao/tests/test_parallel_bulk_import.py` | `implements` | `2026-03-14-1413-parallel-upload-implementation` |
| `aquisicao/tests/test_parallel_bulk_import.py` | `updates` | `2026-03-14-1517-cross-batch-dedup-fix`, `2026-03-16-1158-frontend-polling-fix-and-live-progress`, `2026-03-15-0000-writing-missing-tests-multi-doc-type` |
| `aquisicao/tests/test_registry_management.py` | `implements` | `2026-03-11-0000-phase1-phase2-implementation` |
| `aquisicao/tests/test_registry_management.py` | `updates` | `2026-03-13-0000-ccb-v5-full-test-suite-fix` |
| `aquisicao/use_cases/approve_remessa.py` | `refines` | `2026-03-17-0130-complementary-table-detailed-implementation-plan` |
| `aquisicao/use_cases/get_checklist.py` | `updates` | `2026-03-13-0000-ccb-v5-full-test-suite-fix` |
| `aquisicao/use_cases/manage_bancarizador.py` | `implements` | `2026-03-11-0000-phase1-phase2-implementation` |
| `aquisicao/use_cases/manage_document_template.py` | `updates` | `2026-03-15-0000-phase3-completion-and-fixes`, `2026-03-15-0254-text-based-template-matching` |
| `aquisicao/use_cases/manage_kit_type.py` | `updates` | `2026-03-11-0000-phase1-phase2-implementation` |
| `aquisicao/use_cases/manage_tipo_produto.py` | `implements` | `2026-03-11-0000-phase1-phase2-implementation` |
| `aquisicao/use_cases/process_bulk_import.py` | `contextualizes` | `2026-03-13-0000-ccb-implementation-spec-review`, `2026-03-14-0000-parallel-upload-spec-review`, `2026-03-15-0000-critical-field-spec-review`, `2026-03-12-0000-ccb-business-rules-refinement` |
| `aquisicao/use_cases/process_bulk_import.py` | `updates` | `2026-03-12-0000-event-log-entities-refactor`, `2026-03-14-0000-document-preview-and-batch-fixes`, `2026-03-14-1413-parallel-upload-implementation`, `2026-03-14-1517-cross-batch-dedup-fix`, `2026-03-15-0000-phase3-completion-and-fixes`, `2026-03-15-0254-text-based-template-matching`, `2026-03-15-1704-tiered-identification`, `2026-03-16-1158-frontend-polling-fix-and-live-progress` |
| `aquisicao/use_cases/run_ocr.py` | `contextualizes` | `2026-03-13-0000-ccb-implementation-spec-review`, `2026-03-15-0000-critical-field-spec-review`, `2026-03-12-0000-ccb-business-rules-documentation`, `2026-03-12-0000-ccb-business-rules-refinement` |
| `aquisicao/use_cases/run_ocr.py` | `updates` | `2026-03-12-0000-event-log-entities-refactor`, `2026-03-15-0000-phase3-completion-and-fixes`, `2026-03-12-1637-fix-test-skips-and-warnings` |
| `compute_distance_matrices.py` | `updates` | `2026-03-15-1641-tiered-identification-ocr-extraction` |
| `database/models.py` | `updates` | `2026-03-12-0000-event-log-entities-refactor` |
| `domains/aquisicao/domain/kit_matching.py` | `validates` | `2026-03-21-1255-test-audit-kit-matching-empresa-fallback` |
| `domains/aquisicao/domain/universal_extraction.py` | `contextualizes` | `2026-03-21-1740-ccb-extraction-config-map` |
| `domains/aquisicao/repositories/admin.py` | `updates` | `2026-03-15-0329-non-ccb-status-and-stream-id-cleanup` |
| `domains/aquisicao/repositories/models.py` | `updates` | `2026-03-15-0329-non-ccb-status-and-stream-id-cleanup` |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `updates` | `2026-03-15-0329-non-ccb-status-and-stream-id-cleanup` |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `validates` | `2026-03-24-1120-test-audit-traverse-decomposition` |
| `domains/aquisicao/use_cases/run_ocr.py` | `updates` | `2026-03-15-0329-non-ccb-status-and-stream-id-cleanup` |
| `gcp-infrastructure-migration.tf](file:///Users/victorboscaro/house_project/refactors/infrastructure/gcp-infrastructure-migration.tf` | `refines` | `2026-03-19-1717-hardening-gcp-infrastructure-plan` |
| `infrastructure/gcp-infrastructure-migration.tf` | `updates` | `2026-03-19-1921-infrastructure-migration-audit`, `2026-03-19-2151-gcp-migration-audit-fix-pass`, `2026-03-19-1716-gcp-migration-plan-update` |
| `infrastructure_database/0034_bulk_upload_event_types.py` | `implements` | `2026-03-11-0000-phase1-phase2-implementation` |
| `infrastructure_database/0036_eventlogentities_remove_fk.py` | `implements` | `2026-03-12-0000-event-log-entities-refactor` |
| `infrastructure_database/0037_remove_eventlogentities_event_log_entities_unique_event_entity_and_more.py` | `updates` | `2026-03-13-0000-ccb-v5-schema-test-migration` |
| `liquidacao/repositories/models.py` | `updates` | `2026-03-17-0904-extra-cols-architecture` |
| `messaging/event_catalog.py` | `updates` | `2026-03-11-0000-phase1-phase2-implementation`, `2026-03-17-0904-extra-cols-architecture` |
| `migrations/aquisicao/0013_kittype_aquisicaomanual_bancarizador_and_more.py` | `updates` | `2026-03-15-0329-non-ccb-status-and-stream-id-cleanup` |
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `updates` | `2026-03-19-1638-gcp-migration-gap-analysis` |
| `remessa/remessa_fields.py` | `updates` | `2026-03-18-1705-drop-id-titulo` |
| `src/pages/Cadastros.jsx` | `updates` | `2026-03-17-0904-extra-cols-architecture`, `2026-03-17-0934-extra-cols-migration-fix` |
| `src/pages/Contratos.jsx` | `updates` | `2026-03-14-0000-document-preview-and-batch-fixes`, `2026-03-15-0000-phase3-completion-and-fixes`, `2026-03-16-1158-frontend-polling-fix-and-live-progress` |
| `storage/minio_client.py` | `updates` | `2026-03-14-1413-parallel-upload-implementation` |
| `tests/test_event_log_service.py` | `updates` | `2026-03-17-0904-extra-cols-architecture` |
| `tests/test_sprint2_models.py` | `updates` | `2026-03-12-0000-event-log-entities-refactor` |
| `update_averbacao_config.py` | `implements` | `2026-03-15-1641-tiered-identification-ocr-extraction` |
