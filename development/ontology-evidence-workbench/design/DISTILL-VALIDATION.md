# Design Distill Validation

Mode: Standard
Budget: one proposal track, local Proposer/Balancer role simulation, two rounds
Assumption: the user did not select a Distill budget, so Standard was used
Verdict: pass

## Objective and Output

- Intent: design a trustworthy, compelling interface over the candidate graph
  using Understand-Anything.
- Target context: one private local product feature and one proven Poker
  walkthrough.
- Output: architecture, interface concept, UX contract, and planned witnesses.
- Optimization goal: smallest design unit that proves useful integration
  without semantic collapse.

## Round 1

**Proposer claim:** project the candidate bundle directly into the native UA
knowledge graph and use the upstream viewer unchanged.

**Evidence/assumption:** UA already renders claims/sources and contradiction
edges; an unchanged viewer minimizes integration cost.

**Balancer objection — meaning loss:** UA lacks exact `derives-from` and
candidate `specializes` semantics. A direct mapping would make generalized
layout edges look like source relations.

**Reconciliation — revise:** retain a native-compatible presentation graph but
require a lossless evidence sidecar and exact relation inspector.

## Round 2

**Proposer claim:** include the full custom workbench, optional code analysis,
responsive UI, guided tours, accessibility, and upgrade automation in the first
unit.

**Evidence/assumption:** these capabilities form the desired product.

**Balancer objection — premature scale / bundled acceptance:** those concerns
have independent falsifiers. The first proof only needs one verified bundle,
deterministic adapter, sidecar, and unmodified viewer.

**Reconciliation — accept split:** L0 proves the integration seam; L1 owns the
trust-aware UI; L2 owns code context; L3 owns hardening and pilot evidence.

## Smallest Coherent Unit

One verified Poker bundle projected deterministically into a pinned, unmodified
UA viewer plus a lossless evidence sidecar and explicit candidate/authority
ceiling.

It closes because it has:

- named source input and independent admission gate;
- deterministic projection outputs;
- usable interactive viewer;
- exact source-relation recovery;
- positive and negative acceptance;
- no hidden write/promotion behavior.

Removing the sidecar loses semantics. Removing the viewer no longer proves the
integration. Adding custom UI, code analysis, or scale before this proof bundles
independent decisions.

## Recomposition

L0 adapter outputs and source handles become L1 workbench inputs. L1 shared
selection and exact evidence components accept an optional L2 code lane without
changing evidence digests. L3 hardens the same contracts and packages the
viewer.

## Technique Trace

| Technique | Result |
| --- | --- |
| abstraction-level guard | feature remained a private UI product unit |
| recomposition proof | L0 → L1 → L2 → L3 is explicit |
| evolution profile | upstream drift and optional code scope justify lock/adapter seams |
| frame-expiry note | invalid if UA exposes a stable extension API with lossless custom relations |
| cognitive-load check | trust rail and equivalent views reduce graph-only overload |
| requisite-variety check | source/presentation/code/authority states remain distinct |
| boundary-object check | evidence sidecar is the reviewer/adapter/UI boundary object |
| concept-vs-knowledge | upstream behavior is source-backed; future UX success is unproven |
| premortem | likely failure is a beautiful graph that hides generalized semantics |
| navigable-result check | Plan begins with source admission, then adapter, then viewer |

## Deferred Complexity

- full repository analysis;
- cross-run/diff scale;
- shared IOLM runtime;
- multi-user/server deployment;
- automatic evidence-code inference;
- public packaging.

## Tension Ledger

- Resolved: native viewer reuse vs exact semantic preservation → sidecar.
- Resolved: visual ambition vs first proof → L1 follows narrow L0.
- Stable open: overlay patch vs future upstream extension API → immutable patch
  boundary, revisit only on upstream change.
- Stable open: named human manual acceptance → L3 owner.

## Premortem Guardrail

Failure: reviewers trust a generalized edge because it looks native. Guardrail:
exact relation and mapping-loss badge are mandatory in every inspector, and
mapping totality is a blocking validator.

## Frame Expiry

Re-run Design if the candidate bundle schema changes, authority effect becomes
anything but `none`, Understand-Anything's pin/schema/extension API changes, or
IOLM integration becomes an approved delivery requirement.

## Evidence Emission

Not configured for this Design child run. The Design verdict is artifact-based;
missing telemetry does not change it.

## Next Route

Invoke Plan.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
