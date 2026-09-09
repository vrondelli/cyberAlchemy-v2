---
title: Governance Fitness Model design context
status: candidate-evidence
authority_effect: none
---

# Context Pack

## Obligations

| ID | Obligation | Coverage |
| --- | --- | --- |
| O1 | Author a Design bundle for the governance model. | This bundle; six views in `ARCHITECTURE.md`. |
| O2 | Apply no governance rule. | All outputs have `authority_effect: none`; no existing enforcement surface is edited. |
| O3 | Preserve governance structure while work continues without enforcement. | `OBSERVE-ONLY-POSTURE.md`. |
| O4 | Explain repository-wide deactivation honestly. | Enforcement-surface map distinguishes parent, submodules, CI, hooks, tools, and instructions. |
| O5 | Start the first ontology model without making it authority. | `ONTOLOGY-SEED.json`, ontology type `authority-governance`, candidate only. |
| O6 | Integrate with the product ontology without modifying its closed registries. | External typed bindings remain owned by the governance seed. |
| O7 | Prevent hash/currentness changes from driving lifecycle refresh. | Separate identity axes and targeted currentness policy in the ontology seed. |
| O8 | Protect current owner work. | New isolated directory only; no existing dirty file is a write target. |

## Selected evidence

| Source | Selector | Obligation |
| --- | --- | --- |
| `cyberAlchemy-v2/product/PRODUCT-THESIS.md` | `## Governance And Authority`; `## Product Ergonomics` | O3, O5, O6 |
| `cyberAlchemy-v2/product/OUTCOME-MODEL.md` | bounded authority/useful governance; candidate measurement questions | O5, O6, O7 |
| `cyberAlchemy-v2/ontology/product/profile.json` | package identity and blocked outputs | O6 |
| `cyberAlchemy-v2/ontology/product/nodes.json` | Governed Work Loop, Governance Serves The Work, Work Ergonomics, Work Continuity | O6 |
| `cyberAlchemy-v2/ontology/product/relations.json` | `requires` and `enables` semantics | O6 |
| `cyberAlchemy-v2/ontology/product/scripts/validate.py` | closed local endpoints and authority ceiling | O6 |
| `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md` | Authority Rule; Non-Collapse Rules; current review-first validation | O2, O5 |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` | CAV2-D34, D37, D41, D48, D49, D50, D53, D54, D58 | O2, O5 |
| `cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md` | admission and validation adapters | O2, O3 |
| `implementation/domainspec/AXIOMS.md` | A6 Governance Itself Needs A Feedback Budget | O5 |
| `implementation/domainspec/CONSTITUTION.md` | C10/C11 and rule-to-axiom/gate mapping | O5 |
| `implementation/domainspec/TUNING-LOOP.md` | friction precedents and metric collisions | O5, O7 |
| `projects/domainspec-v2/authority/AXIOMS.md` | A6 feedback loop routed to Saturn | O5 |
| `Makefile` | explicit publication and submodule checks | O3, O4 |
| `.githooks/pre-commit` | candidate root formatting hook | O3, O4 |
| `.github/workflows/drift-check.yml` | root CI drift and DomainSpec code-tag jobs | O3, O4 |
| `tools/check_github_drift.sh` | blocking root CI policy check | O3, O4 |
| `cyberAlchemy-v2/development/ontology-candidate-graph-prototype/design/ARCHITECTURE.md` | prior six-view, no-authority Design shape | O1, O2 |

## Current observations

- The worktree contains extensive unrelated owner changes. They are not part of
  this Design.
- The root repository's configured `core.hooksPath` points to `.git/hooks`, so
  the checked-in `.githooks/pre-commit` is not active in this checkout.
- Root Make governance-related checks are explicit commands, not an ambient
  repository-wide interceptor.
- Root CI contains a blocking drift job when the workflow runs. Whether it is a
  remotely required status check is external state and remains unknown.
- DomainSpec and other submodules are independent Git repositories. A parent
  posture cannot silently rewrite their hooks, CI, or local authority.
- Agent instructions and host safety boundaries are not repository runtime
  policy and cannot be deactivated by this product design.

## Evidence limits

Source digests are deliberately not turned into lifecycle identity here. The
sources are live and some are dirty; a later admitted Define/Design cycle must
select and bind its exact source epoch. The reported seven-refresh experience is
the design stimulus, not yet a durable measured incident record or calibrated
baseline.

## Context Builder result

- Mode: deep
- Strict obligation coverage: pass for discovery Design
- Runtime handoff: none
- Canonical promotion: none
- Open questions: [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md)
