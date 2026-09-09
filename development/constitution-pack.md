# CyberAlchemy v2 Constitution Pack

Status: candidate
Mode: compose
Target: `cyberAlchemy-v2` starter project
Created: 2026-06-19

## Constitution Sources Inspected

| Source | Role |
| --- | --- |
| [../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md](../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md) | Project-local structure and authority rules. |
| [../../.agents/skills/constitution-governance/SKILL.md](../../.agents/skills/constitution-governance/SKILL.md) | Composition and validation process. |
| [../../.agents/skills/definitions-governance/SKILL.md](../../.agents/skills/definitions-governance/SKILL.md) | Definition authority boundary. |
| [../../arcanum/arcana/discipline-governance/SKILL.md](../../arcanum/arcana/discipline-governance/SKILL.md) | Discipline routing and hardening boundary. |
| [../../projects/framework-unification/SCOPE.md](../../projects/framework-unification/SCOPE.md) | Open Questions and honesty boundary precedent. |
| [../../.arcanum/inventory/index.md](../../.arcanum/inventory/index.md) | Candidate inventory structure and gaps. |
| [../authority/imports/definitions/MANIFEST.md](../authority/imports/definitions/MANIFEST.md) | Staged definition-like import candidates. |
| [../authority/imports/constitutions/MANIFEST.md](../authority/imports/constitutions/MANIFEST.md) | Staged constitution and axiom import candidates. |

## Selected Rules

| Priority | Rule | Source |
| --- | --- | --- |
| 1 | Source-ledgered consolidation | CAV2-C1 |
| 2 | Authority layer separation | CAV2-C2 |
| 3 | Inventory and ontology non-promotion | CAV2-C4 |
| 4 | Public/private boundary | CAV2-C5 |
| 5 | Generated projection traceability | CAV2-C6 |
| 6 | Navigable work surface | CAV2-C7 |
| 7 | Open Questions as residue | CAV2-C8 |
| 8 | Validation before implementation | CAV2-C9 |
| 9 | Standalone extraction gate | CAV2-C10 |
| 10 | Import before promotion | CAV2-C11 |

## Precedence

1. Narrow project-local constitution rules apply first.
2. Definition authority rules decide term meanings.
3. Discipline cards name recurring practices and hardening routes.
4. Inventory and ontology evidence can inform context, but not override local
   authority.
5. Parent submodule and public/private rules still apply to the private umbrella.

## Conflicts

None observed in the starter set.

Potential conflict preserved: the repository wants to become a stable
standalone surface, but several source cohorts are private. This does not block
local project start, but it blocks public extraction until boundary review.

## Validators To Run

| Validator | Status |
| --- | --- |
| Markdown local link check over `cyberAlchemy-v2/**` | pass, 2026-06-19 |
| Constitution review against CAV2-C1 through CAV2-C11 | applied by this pack |
| Definitions index sync | applied |
| Definition and constitution import manifests | applied |
| Public/private scrub | deferred until public derivative or extraction |
| Deterministic constitution validator | future |

## Result

Status: flag.

The starter project satisfies the selected rules at review level. It is flagged
because deterministic validation is limited to local link/index checks and because
standalone extraction still requires owner decision.

## Next Route

Use decision-gate for extraction/public-boundary choices, or task-session for a
bounded next artifact such as an architecture map, source ingest run, or public
safe project brief.
