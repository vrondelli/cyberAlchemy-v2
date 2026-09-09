# Constitution Import Manifest

Status: active import ledger
Owner: constitution-governance
Scan date: 2026-06-19

## Purpose

Stage constitution, axiom, quality-bar, and anti-pattern sources scattered
through `domainspec-core` before CyberAlchemy v2 decides which rules become
local constitutions.

## Result

- Import candidates: 106
- Auxiliary or excluded constitution templates: 3
- Promotion status: candidate only
- Canonical destination after promotion:
  [../../constitutions/](../../constitutions/)

## Import Candidates

```text
arcanum/arcana/constitution-governance/README.md
arcanum/arcana/constitution-governance/SKILL.md
arcanum/arcana/constitution-governance/development/ARTIFACT-CONSTITUTION-SPLIT-REPORT.md
arcanum/arcana/constitution-governance/development/ARTIFACT-METADATA-VALIDATION-ADAPTER.md
arcanum/arcana/constitution-governance/development/COMMAND-SURFACE-READINESS.md
arcanum/arcana/constitution-governance/development/DEFINE.md
arcanum/arcana/constitution-governance/development/DESIGN.md
arcanum/arcana/constitution-governance/development/IMPLEMENTATION-LAYERING.md
arcanum/arcana/constitution-governance/development/INVOKE-SCHEMA-CONSTITUTION-VALIDATION.md
arcanum/arcana/constitution-governance/development/LEGACY-SCHEMA-YML-MIGRATION-PLAN.md
arcanum/arcana/constitution-governance/development/WORK-PACK.md
arcanum/arcana/constitution-governance/development/examples/chart-rendering-composition-pack.md
arcanum/arcana/constitution-governance/development/handoffs/20260529T161446Z-artifact-metadata-validator/CONTEXT-PACK.md
arcanum/arcana/constitution-governance/development/handoffs/20260529T161446Z-artifact-metadata-validator/SESSION-HANDOFF.md
arcanum/arcana/constitution-governance/development/refinement-runs/20260527T000000Z-constitution-governance/GOAL-HANDOFF.md
arcanum/arcana/constitution-governance/development/refinement-runs/20260527T000000Z-constitution-governance/REFINE-SEED-PROPOSAL.md
arcanum/arcana/constitution-governance/development/refinement-runs/20260527T000000Z-constitution-governance/RESULT.md
arcanum/arcana/constitution-governance/development/refinement-runs/20260527T000000Z-constitution-governance/RUN-MANIFEST.md
arcanum/arcana/constitution-governance/development/task-session/20260608T085527Z-MARKDOWN-LINKING-VALIDATOR-CONTEXT.md
arcanum/arcana/constitution-governance/development/task-session/20260608T085527Z-MARKDOWN-LINKING-VALIDATOR-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/ALL-TASKS-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/ARTIFACT-METADATA-VALIDATION-ADAPTER-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/CG-002-CONTEXT.md
arcanum/arcana/constitution-governance/development/task-session/CG-002-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/CG-003-CONTEXT.md
arcanum/arcana/constitution-governance/development/task-session/CG-003-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/CG-004-CONTEXT.md
arcanum/arcana/constitution-governance/development/task-session/CG-004-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/CG-005-CONTEXT.md
arcanum/arcana/constitution-governance/development/task-session/CG-005-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/LEGACY-SCHEMA-YML-MIGRATION-CONTEXT.md
arcanum/arcana/constitution-governance/development/task-session/LEGACY-SCHEMA-YML-MIGRATION-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/SCHEMA-CONSTITUTION-RESULT.md
arcanum/arcana/constitution-governance/development/task-session/SCHEMA-MARKDOWN-BOUNDARY-CONTEXT.md
arcanum/arcana/constitution-governance/development/task-session/SCHEMA-MARKDOWN-BOUNDARY-RESULT.md
arcanum/arcana/x-ray/development/XRAY-VISUAL-LIBRARY-CONSTITUTION.md
arcanum/arcana/x-ray/development/constitution-pack.md
arcanum/disciplines/cards/artifact-constitution.md
arcanum/disciplines/cards/quality-bar.md
arcanum/framework/ANTI-PATTERNS.md
arcanum/framework/ARTIFACT-CONSTITUTION.md
arcanum/framework/ARTIFACT-METADATA-CONSTITUTION.md
arcanum/framework/GITIGNORE-CONSTITUTION.md
arcanum/framework/MARKDOWN-LINKING-CONSTITUTION.md
arcanum/framework/QUALITY-BAR.md
arcanum/framework/SCHEMA-CONSTITUTION.md
implementation/domainspec/AXIOMS.md
implementation/domainspec/CONSTITUTION.md
implementation/domainspec/implementation/app-frontend/domain_knowledge/axiom/creative-axioms.md
implementation/domainspec/implementation/app-frontend/domain_knowledge/constitution/creative-attribute-constitution.md
implementation/domainspec/implementation/app-frontend/domain_knowledge/constitution/creative-gene-orthogonality-constitution.md
implementation/domainspec/implementation/app-frontend/domain_knowledge/constitution/creative-removal-constitution.md
implementation/domainspec/implementation/app-frontend/domain_knowledge/constitution/winning-creative-constitution.md
implementation/domainspec/implementation/app-frontend/vault/ontology/ontology-axioms.md
implementation/domainspec/implementation/app-frontend/vault/ontology/ontology-constitution.md
implementation/domainspec/internal_tools/subagents-dispatch-hooks/constitution/robot-talks-constitution.md
implementation/domainspec/internal_tools/subagents-dispatch-hooks/constitution/subagents-strategy-constitution-proposal.md
implementation/domainspec/plan/governance/GOV-01-axioms-constitution-tags-execution.md
implementation/domainspec/research/subagents-strategy/2026-06-12-constitution-self-improvement/findings.md
implementation/domainspec/research/subagents-strategy/2026-06-12-constitution-self-improvement/research.md
implementation/domainspec/research/subagents-strategy/2026-06-12-constitution-v051-assessment/findings.md
implementation/domainspec/research/subagents-strategy/2026-06-12-constitution-v051-assessment/research.md
implementation/domainspec/research/subagents-strategy/2026-06-15-constitution-v053-consistency-review/anti-bias-preregistration.md
implementation/domainspec/research/subagents-strategy/2026-06-15-constitution-v053-consistency-review/attacks.md
implementation/domainspec/research/subagents-strategy/2026-06-15-constitution-v053-consistency-review/findings.md
implementation/domainspec/vault/axiom/category-theory-compilation-axiom.md
implementation/domainspec/vault/axiom/domainspec-axioms.md
implementation/domainspec/vault/axiom/frontend-axioms.md
implementation/domainspec/vault/axiom/ontology-axioms.md
implementation/domainspec/vault/axiom/system-axioms.md
implementation/domainspec/vault/constitution/commit-message-constitution.md
implementation/domainspec/vault/constitution/convicção-bet-ledger-constitution.md
implementation/domainspec/vault/constitution/cross-repo-canonicalization-protocol-constitution.md
implementation/domainspec/vault/constitution/development-practices-constitution.md
implementation/domainspec/vault/constitution/discovery-structure-constitution.md
implementation/domainspec/vault/constitution/domain-tagging-constitution.md
implementation/domainspec/vault/constitution/domainspec-subagents-strategy-constitution.md
implementation/domainspec/vault/constitution/domainspec-subagents-strategy-constitution.v0.4.0-draft.md
implementation/domainspec/vault/constitution/edge-acyclicity-constitution.md
implementation/domainspec/vault/constitution/event-system-constitution.md
implementation/domainspec/vault/constitution/folder-structure-constitution.md
implementation/domainspec/vault/constitution/frontend-constitution.md
implementation/domainspec/vault/constitution/frontmatter-ownership-constitution.md
implementation/domainspec/vault/constitution/governs-runtime-witness-constitution.md
implementation/domainspec/vault/constitution/ontology-constitution.md
implementation/domainspec/vault/constitution/research-constitution.md
implementation/domainspec/vault/constitution/robot-talks-constitution.md
implementation/domainspec/vault/constitution/schema-amendment-discipline-constitution.md
implementation/domainspec/vault/constitution/vault-folder-structure-constitution.md
implementation/domainspec/vault/discovery/domainspec-axioms/discovery.md
implementation/domainspec/vault/discovery/domainspec-axioms/research/domainspec-findings.md
implementation/domainspec/vault/discovery/domainspec-axioms/research/domainspec-research.md
implementation/domainspec/vault/discovery/subagents-strategy-refinement/research-promote/lenses/01-skill-and-constitution-read.md
implementation/domainspec/vault/discovery/subagents-strategy-refinement/research/lenses/01-skill-and-constitution-read.md
implementation/domainspec/vault/sessions/2026-05-05-1147-domainspec-axioms-foundation.md
implementation/domainspec/vault/sessions/2026-06-12-0132-constitution-v040-edits.md
implementation/domainspec/vault/sessions/2026-06-12-1335-subagents-dispatch-hardening-and-constitution-v051.md
implementation/domainspec/vault/sessions/2026-06-12-1413-constitution-v052-adversarial-assessment.md
implementation/domainspec/vault/sessions/2026-06-15-1554-constitution-v060-consistency-fix.md
internal_tools/subagents-dispatch-hooks/constitution/robot-talks-constitution.md
internal_tools/subagents-dispatch-hooks/constitution/specs-development-review-constitution.md
internal_tools/subagents-dispatch-hooks/constitution/subagents-strategy-constitution-proposal.md
projects/body-war/domainspec/CONSTITUTION.md
projects/ontologize/operational-ontology/decisions/disciplines-as-axiom.md
projects/whisky-doses/domainspec/CONSTITUTION.md
research/projects/domainspec/definitions/CONSTITUTION.md
```

## Auxiliary Or Excluded Constitution-Like Sources

```text
arcanum/arcana/constitution-governance/templates/composition-pack.md
arcanum/arcana/constitution-governance/templates/constitution.md
arcanum/arcana/constitution-governance/templates/validation-adapter.md
```

## Next Extraction Route

1. Classify candidates into active constitutions, axioms, constitution
   development evidence, research about constitutions, quality/anti-pattern
   framework rules, and domain-specific constitutions.
2. Compose a CyberAlchemy v2 constitution pack from the active candidates.
3. Preserve conflicts rather than smoothing them over.
4. Promote only rules that have scope, owner, examples, non-examples, and a
   validation mode.

## Open Questions

### OQ-1. Which source family owns the first promoted v2 constitution pack?

Context: Arcanum has public framework constitutions, while private DomainSpec
has a broad vault constitution library. Recommendation: start with public
Arcanum constitution rules plus private DomainSpec only as pattern evidence
until boundary review. Status: OPEN.

## Re-scan 2026-07-01 (dispatch `2026-07-01-arcanum-artifact-governance-import`)

The 2026-06-19 scan is **stale**. `arcanum/framework/` has since gained 7 docs not staged above —
`ARTIFACT-AUTHORING-MEMORY`, `CYBERALCHEMY-METHOD`, `DEVELOPMENT-TO-CANONICAL-PROMOTION`,
`EXPERIMENT-HARNESS-STANDARD`, `RECEIPT-ID-LEGEND-CONSTITUTION`, `SIGIL-DEVELOPMENT-WORKFLOW`,
`VALIDATION-EXPERIMENT-PROTOCOL` — and the **validator tooling** (`arcanum/tools/validate-artifact-constitution.sh`
+ `validate-artifact-metadata.py` + `check_markdown_links.sh`) was **never staged**. **Zero** of the
2026-06-19 candidates have been extracted into a cav2 local rule.

**Verdicts** (frozen partition: `../../../development/research/2026-07-01-arcanum-artifact-governance-import/findings.md`):

- **TIER-1 import — port to cav2 roots, real file-FORM enforcement:** `SCHEMA-CONSTITUTION`;
  `ARTIFACT-CONSTITUTION` (retention-class taxonomy only) + `GITIGNORE-CONSTITUTION`; the **validator tooling**
  (add as import candidates — port, do not copy; Arcanum-path-hardcoded).
- **TIER-2 prose-only — adopt-first:** `ARTIFACT-METADATA-CONSTITUTION` (needs a cav2 YAML-frontmatter
  decision-gate before it is enforcement, not prose); `MARKDOWN-LINKING` typed-edge-vocab residual (route to
  ontology / definitions-governance, likely not a constitution).
- **SKIP — already-owned (CAV2-C17 build-from-owned):** `DEVELOPMENT-TO-CANONICAL-PROMOTION` (CAV2-C3/C11/D48
  + promotion-policy); `MARKDOWN-LINKING` hygiene (CAV2-C1/C7/C8); `ARTIFACT-CONSTITUTION` promotion-rule (C11/C3).
- **SKIP — out-of-scope (capability-lifecycle, not artifact-IS):** `ANTI-PATTERNS`, `QUALITY-BAR`,
  `CYBERALCHEMY-METHOD`, `SIGIL-DEVELOPMENT-WORKFLOW`, `VALIDATION-EXPERIMENT-PROTOCOL`,
  `EXPERIMENT-HARNESS-STANDARD`, `ARTIFACT-AUTHORING-MEMORY`, `RECEIPT-ID-LEGEND-CONSTITUTION`.

Next: the Tier-1 import pack (`development/artifact-governance-import/`, invoke → task-session), gated by
CAV2-C11 import-before-promotion.
