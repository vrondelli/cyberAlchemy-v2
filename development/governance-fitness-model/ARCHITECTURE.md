---
title: Governance Model architecture
status: candidate-design-discovery
authority_effect: none
enforcement_effect: none
---

# Architecture

## Design intent

Keep governance vocabulary, evidence, ontology structure, and owner routing
available while no repository-owned governance result can block work, change a
command result, mutate lifecycle or authority, emit an owner request, or apply a
rule. Build the first rule-fitness model beside that posture control rather than
mixing the control plane into the ontology.

## 1. Context view

```text
                         external / non-repository boundaries
                    host safety · agent instructions · remote policy
                                      (unchanged)

work command -------------------------------------------------> work result
     |                                                             |
     | optional copy of observation                                |
     v                                                             v
repository posture resolver -> non-blocking observer -> local evidence
          observe_only             authority_effect none
                                             |
                                             v
                                  Governance Assessment
                                             |
                                   non-binding recommendation
                                             v
                                      responsible owner

product ontology <---- typed external bindings ---- governance ontology seed
      unchanged                                      candidate, private
```

The work command is not downstream of the observer. Observation cannot replace
or rewrite its exit status.

## 2. High-level structure view

| Unit | Responsibility | L0 posture |
| --- | --- | --- |
| `GovernancePostureManifest` | Declare repository-owned governance behavior once. | Proposed fixture only; not installed. |
| `PostureResolver` | Resolve `unconfigured` or `observe_only` without inferring enforcement. | Design only. |
| `NonBlockingObserverAdapter` | Convert findings into local evidence without controlling work. | Future isolated fixture. |
| `GovernanceAssessment` | Evaluate one source-owned Governance Rule against its evidence, policy, burden, and gaps. | First ontology vertical. |
| `ProductBindingView` | Point to existing product node IDs without adding external endpoints to the product registry. | Candidate relation view. |
| `AssessmentEvidenceStore` | Preserve append-only observations separately from ontology state. | Saturn-owned future boundary. |

Two units coordinate through evidence but do not share an aggregate:

```text
Posture control plane:   how repository-owned checks behave
Governance ontology:     what a rule means and how its fitness is assessed
```

## 3. Low-level component view

### Repository posture contract

```text
GovernancePosture
  posture: unconfigured | observe_only
  scope: repository-owned-governance-adapters
  finding_effect: record_only
  command_exit_effect: none
  lifecycle_effect: none
  authority_effect: none
  mutation_effect: none
  owner_request_effect: none
```

`enforce` is not an L0 enum value. Adding it requires a separate authority and
implementation project so an accidental configuration edit cannot activate
enforcement.

### Governance model

```text
GovernanceAxiom -> GovernanceInvariant -> GovernanceRule
GovernanceEvidence -> GovernanceAssessment -> GovernancePolicy recommendation
GovernanceDecision? -> GovernanceConstitution?
GovernanceDiscipline stewards evidence, assessment, and routing
GovernanceAuthority scopes every object and relation
ProductBinding[] points to exact product-ontology nodes
```

`GovernanceDecision` and `GovernanceConstitution` remain absent until a real
owner decision and exact adoption exist. An assessment cannot populate either.

## 4. Workflow process view

1. A person or tool performs ordinary repository work.
2. The product or development command finishes independently.
3. If an observe-only adapter is explicitly attached, it receives a copy of the
   bounded observation after the work result is known.
4. The adapter may emit local evidence. It may not alter the work exit code,
   mutate sources, create an owner request, or advance a lifecycle.
5. A Governance assessor may later combine observations with one rule's
   inherited justification, protection hypothesis, friction contract, and
   current evidence.
6. The assessor emits `not_evaluable` or a non-binding recommendation.
7. Only the source rule's responsible owner may decide to keep, harden,
   simplify, merge, prune, or defer it.
8. Saturn may own repeated observation and tuning later; the ontology does not.

## 5. Decision-flow view

```text
Is this a repository-owned governance adapter?
  no  -> outside this posture; do not claim deactivation
  yes -> posture configured?
           no  -> unconfigured; do not attach a blocking edge
           yes -> posture == observe_only
                    -> preserve work result
                    -> optionally record finding
                    -> prohibit mutation, request, authority and lifecycle effect

Governance evidence sufficient?
  no  -> not_evaluable + named evidence gaps
  yes -> recommendation only

Owner decision exists?
  no  -> no rule transition
  yes -> reference the separately owned decision; do not infer it
```

Any future request for enforcement exits this design and requires a new owner
decision, per-surface implementation plan, negative controls, and rollback.

## 6. Dependency and interface view

| Surface | Current relationship | Proposed observe-only relationship |
| --- | --- | --- |
| Root Make targets | Explicit, manually invoked checks | Remain callable; never auto-run from posture. |
| Root checked-in hook | Not active in this checkout | No change; a future installer must respect posture. |
| Root GitHub workflow | Runs drift and strict DomainSpec code-tag checks | A separate CI-owner change would make governance jobs advisory; not designed as silently inherited. |
| Arcanum/Task Session validators | On-demand lifecycle capabilities | Remain tools; no automatic invocation or authority from ontology. |
| DomainSpec and other Git roots | Independent hooks, scripts, CI, and authority | Require explicit local adapters or remain outside parent posture. |
| Agent instructions | Collaboration/runtime instructions | Not controlled by repository posture. |
| Remote branch protection | External platform state | Must be inspected and changed by its owner, if desired. |
| Product ontology | Closed business-domain package | Unchanged; governance owns external typed bindings. |
| Saturn | Future observation/tuning owner | Receives evidence only through a separately designed contract. |

## Significant behavior scenario

Stimulus: one bounded task encounters seven governance-refresh requests without
a semantic rule change.

Expected L0 interpretation:

1. each observation may be appended to an assessment evidence set;
2. unrelated file or product-node changes produce no rule lifecycle event;
3. a changed referenced product node makes only its binding non-current;
4. a changed observation produces a new assessment, not a new rule identity;
5. no finding blocks the task in `observe_only` posture;
6. the assessor may recommend simplifying the governance path;
7. no rule changes until its owner makes a separate decision.

This is a planned scenario. The seven-refresh report has not yet been
materialized as a measured corpus.

## Constraints

- No existing governance surface may be edited by this Design.
- No product ontology registry or schema changes in L0.
- No global repository digest may act as semantic or lifecycle identity.
- No direct adoption of conflicting DomainSpec v1 metric IDs or thresholds.
- No automatic pruning, promotion, acceptance, execution, publication, or
  deployment.
- No claim that repository posture overrides host safety, agent instructions,
  remote protection, or independent submodule policy.

## Open questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
