---
node_type: implementation-layering
is_session: false
status: candidate
boundary: INTERNAL - planning evidence only
created: 2026-06-30
authored_by: invoke (mode=plan)
target: ontology folder consolidation
---

# Ontology Folder Consolidation - Implementation Layering

This document defines the progressive implementation model for carrying out the
ontology-folder recommendation without erasing useful witness evidence or
letting ontology become the owner of definitions, specs, schemas, or promotion.

## Context

- Target: CyberAlchemy v2 ontology folder consolidation.
- Current state: brownfield, with CAV2 ontology package and older
  `projects/ontology` materialization design both present.
- Primary operator: future agents and owner-reviewers navigating authority
  surfaces.
- Primary constraint: authority boundaries and public/private safety.
- Source references: `CONTEXT-PACK.md`.

## Layering Method

- Minimum proof: prove that the repository can keep the folders separate while
  making the current authority role obvious.
- Decision-first: each layer answers one question before pulling in more scope.
- Progressive hardening: every later layer improves clarity, governance, or
  packageability without invalidating the earlier boundary.
- Non-regression: definitions stay meaning owners; ontology stays candidate
  model/projection owner; specs stay gated contracts.

## Layer Boundary Heuristic

Layer value = decision unlocked + operator-visible clarity + authority risk
reduced.

Layer cost = edit scope + review burden + coordination burden.

Stop a layer when the next unit of work adds less value to the current decision
than starting the next decision layer.

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | User/Operator Outcome | Risk Reduced | Main Cost Drivers | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (POC) | After this layer, we know whether the two ontology folders can coexist without competing authority claims. | Status bridge for `projects/ontology` plus CAV2 artifact-tree reference. | A future agent sees which folder is current package vs witness/incubator. | False collapse and duplicate-authority risk. | Two small doc edits and path review. | Continue when CAV2 package points at `projects/ontology` as witness evidence only. |
| L1 | After this layer, we know whether useful `projects/ontology` concepts can be harvested into CAV2 without copying old authority posture. | Source-surface crosswalk and package source-contract update. | Reusable materialization concepts become findable from CAV2 package docs. | Evidence loss and stale-folder drift. | Crosswalk writing and link validation. | Harden when harvested rows cite source paths and forbidden readings. |
| L2 | After this layer, we know whether challenge-contract semantics and schema field placement have an owner-approved reconciliation path. | Decision/definition reconciliation note before NODE-MODEL mutation. | The `challenge_contract` field stays useful without conflicting confidence-axis meanings. | Schema drift and definition override risk. | Decision-gate and definitions-governance review. | Mutate schema docs only after the owner gate resolves canonical confidence wording. |
| L3 | After this layer, we know whether project-local instantiations and specs can use the base model without reopening base authority. | DomainSpec v2 instantiation guidance and spec-target rule. | Future project ontology entries have a pattern without becoming base CAV2 ontology. | Project-local authority laundering and raw-spec promotion. | Project-local documentation and optional inventory refresh. | Package or pilot after one domain-local example remains candidate-only and source-backed. |

## Capability Progression

| Area | L0 Proof | L1 Hardening | L2 Governance | L3 Packaging |
| --- | --- | --- | --- | --- |
| Folder roles | Mark `projects/ontology` as witness/incubator. | Add CAV2 crosswalk from witness surface to package concepts. | Add owner-gated challenge-contract reconciliation. | Add project-local instantiation guidance. |
| Authority boundaries | State non-collapse rule in visible docs. | Record forbidden readings per source surface. | Route semantic/schema changes through definitions and decision-gate. | Keep specs as promoted contract targets only. |
| Validation | Link/path review. | Cross-reference review. | Decision-gate/definitions receipt. | Inventory/index refresh if new evidence is added. |

## Layer Definitions

| Layer | Objective | Builds On | Included Scope | Explicitly Deferred | Exit Evidence | Value/Cost Notes |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | Establish visible non-collapse boundary. | none | `projects/ontology/README.md`, CAV2 `ARTIFACT-TREE.md` row or note. | Crosswalk, challenge schema reconciliation, project instantiation. | Reviewable diff and links. | Smallest edit that changes operator behavior. |
| L1 | Harvest without authority drift. | L0 | CAV2 source-surface crosswalk and package source-contract note. | Definition/schema amendments. | Crosswalk rows map source role, allowed reading, forbidden reading. | Worth doing after L0 because it makes preservation explicit. |
| L2 | Reconcile challenge contract. | L1 | Decision/definitions note and gated NODE-MODEL follow-up. | Actual schema mutation until owner decision. | Decision-gate or definitions-governance receipt. | Higher coordination cost; only justified after package roles are stable. |
| L3 | Show safe instantiation. | L2 | DomainSpec v2 local ontology/example guidance and spec boundary note. | Promoted DomainSpec ontology entries. | One candidate example remains tied to owner route. | Useful once base model no longer has competing folder ambiguity. |

## Implementation Wave Backbone

| Wave | Target Layer | Goal | Key Artifacts | Verification |
| --- | --- | --- | --- | --- |
| W0 | L0 | Folder role bridge. | `projects/ontology/README.md`, `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md`. | `git diff --check`; link/path review. |
| W1 | L1 | Harvest/crosswalk CAV2 package links. | `cyberAlchemy-v2/ontology/SOURCE-SURFACE-CROSSWALK.md`, `PACKAGE-MODEL.md`. | Crosswalk review against source refs. |
| W2 | L2 | Challenge-contract reconciliation route. | decision/definition review note; later `NODE-MODEL.md` patch if approved. | Decision-gate/definitions receipt; no schema mutation before receipt. |
| W3 | L3 | Domain-local instantiation pattern. | DomainSpec v2 candidate guidance; optional inventory refresh. | Candidate-only review; inventory validation if refreshed. |

## Non-Regression Guardrails

- `CAV2-D40` remains the meaning owner for challenge contract.
- `cyberAlchemy-v2/ontology/` models authority but does not decide authority.
- `projects/ontology/` is not deleted in L0 or L1; it is marked as witness
  evidence until an owner explicitly retires or migrates it.
- `cyberAlchemy-v2/specs/` receives only owner-gated promoted contracts.
- Public `arcanum/` is not touched by this private-parent plan.

## Recommended Next Layer

- Next layer: L0.
- Key decision unlocked: whether visible status boundaries remove the need for
  folder collapse.
- Major deferred scope: challenge-contract schema reconciliation and project
  instantiation examples.
