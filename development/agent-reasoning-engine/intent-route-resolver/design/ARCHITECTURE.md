---
title: Intent Route Resolver architecture
status: candidate
invoke_mode: design
authority_effect: none
---

# Intent Route Resolver architecture

## Architecture intent

Provide one standalone, deterministic, non-authorizing intent-to-route adapter
that the Agent Reasoning Engine or another agentic runtime can embed without
creating another dispatcher, scheduler, host route authority, or semantic
evaluator.

## Closed scope

- System of interest: `intent-route-resolver`
- `DesignScopeManifest`: `DESIGN-SCOPE-MANIFEST.json`
- `DesignDenominatorReceipt`: `DESIGN-DENOMINATOR-RECEIPT.json`
- `DesignSelectionResult`: `DESIGN-SELECTION-RESULT.json`
- Design evidence state: only `design-validator-pass` may unlock Plan

## View 1 — context

```text
operator / caller
       |
       v
arbitrary agentic runtime
       |
       +-- runtime-owned projection + frozen catalog
       v
RoutableIntentEnvelope -> JSON Runtime Port -> Intent Route Resolver
                                                   |
                                           RouteDisposition
                                                   v
runtime-owned display / clarification / decision / approval / execution
```

The resolver owns only the disposition relation and its receipt. The embedding
runtime owns projection, decisions, approval, and execution. Augmentor and
ResonantOS are one future consumer profile; existing Arcanum capabilities retain
validation and execution.

## View 2 — high-level structure

```text
JSON Runtime Port
        |
RouteRequest Validator
        |
Catalog Snapshot Validator
        |
Intent/Discriminator Normalizer
        |
Eligibility Evaluator
        |
Dominance Reducer
        |
Disposition Classifier
        |
Clarification Builder
        |
Canonical Receipt Assembler
```

All exported resolver components are pure. They receive complete values in
memory and make no discovery, model, network, filesystem, persistence,
dispatch, or effect call. The separately invoked L0 witness harness may write
only its caller-selected output directory; it is not part of the resolver API
and its write inventory is evidence about the run, not resolver behavior.
The selected-local mapper is a compatibility edge, not a prerequisite of the
core resolver.

## View 3 — low-level components

| Component | Input | Output | Fail-closed responsibility |
|---|---|---|---|
| JSON Runtime Port | untrusted UTF-8 JSON text | canonical UTF-8 JSON response | return typed parse/version/shape diagnostics without leaking caller-controlled exceptions |
| Request Validator | untrusted `RouteRequest@1` value | validated request or invalid diagnostic | reject unknown versions and malformed postures |
| Selected-local Mapper | selected-local record plus mapping profile | generic routable intent plus mapping receipt | preserve posture/evidence and leave absent mappings unresolved |
| Catalog Validator | untrusted snapshot | frozen validated catalog | reject digest mismatch, missing owner, duplicate IDs, unknown dominance refs, and cycles |
| Normalizer | validated request/catalog | canonical sorted internal values | preserve raw intent; never default unresolved fields |
| Eligibility Evaluator | normalized discriminators and route entries | eligible, conditionally viable, rejected route traces | exclusions precede required predicates |
| Dominance Reducer | eligible routes and explicit dominance graph | non-dominated candidate set | use only owner-declared acyclic edges; no score |
| Disposition Classifier | candidate set, conditional routes, missing discriminators | disposition kind and reason codes | missing material information returns ambiguity |
| Clarification Builder | ambiguous candidate traces | one stable question and discriminator IDs | question is derived from sorted material differences |
| Receipt Assembler | input digests and full trace | canonical `RouteDisposition@1` bytes | cannot change the disposition or grant authority |

Detailed fields are in [COMPONENT-CONTRACTS.md](COMPONENT-CONTRACTS.md).

## View 4 — workflow process

1. Accept one complete in-memory request.
2. Validate request schema/version, JSON-only values, and discriminator posture.
3. Validate catalog schema/version/digest/owner/identity/dominance graph.
4. Canonically sort routes, predicates, exclusions, inputs, and edges.
5. Evaluate every route: exclusions, satisfied requirements, unresolved
   material requirements, and rejection reasons.
6. Reduce eligible routes through explicit dominance only.
7. Classify:
   - invalid contract -> `invalid`;
   - material unresolved discriminator -> `ambiguous`;
   - more than one non-dominated eligible route -> `ambiguous`;
   - one non-dominated eligible route -> `candidate`;
   - zero eligible routes -> `no-match`.
8. For ambiguity, derive exactly one clarification from the smallest sorted
   differing material discriminator set.
9. Assemble canonical bytes and digest.
10. Return without dispatch, persistence, or effect.

## View 5 — decision flow

```text
request valid? ----- no ----> invalid(request)
     |
    yes
     v
catalog valid? ----- no ----> invalid(catalog)
     |
    yes
     v
material discriminator unresolved and outcome-sensitive?
     | yes
     +-----------------------> ambiguous(missing discriminator)
     |
    no
     v
eligible non-dominated count
     0 ----------------------> no-match
     1 ----------------------> candidate
     2+ ---------------------> ambiguous(overlap)
```

No confidence threshold participates. A candidate is advisory even when unique.

## View 6 — dependency and interface boundaries

| Dependency/peer | Contract consumed or produced | Boundary |
|---|---|---|
| arbitrary agentic runtime | JSON input plus runtime-owned projection function | no runtime SDK import, discovery, decision, approval, or execution |
| Agent Reasoning Engine intent model | `IntentRecord selected-local@1` | accepted only by the explicit mapper; not promoted |
| host catalog adapter | `CapabilityRouteCatalogSnapshot@1` | owner-supplied frozen input; L0 does not discover |
| Augmentor adapter | request projection and disposition projection | no route decision, approval, or execution authority |
| ResonantOS host | later immutable `RouteDecision` | outside resolver package and outside L0 |
| Dispatch Spec | proposed multi-step composition | only after a host/user selection; resolver never validates composition |
| Orchestrate | validated approved dispatch | executor; resolver never calls it |
| Continuation Router | terminal capability receipt | disjoint input domain |
| semantic evaluator | `ProblemFrame`-based semantic judgment | separate outcome algebra and package |

Unknown versions, stale digests, and cross-contract substitution are rejected.
The exported dependency graph uses no Node, DOM, filesystem, network, or host
runtime imports. Canonical JSON and SHA-256 are environment-free code checked
against Node and Chromium conformance vectors.

## Significant behavior scenario

| Stimulus | Preconditions | Ordered response | Failure/recovery | Observable evidence | Acceptance owner |
|---|---|---|---|---|---|
| typed intent could match `invoke:define` or `scope-interview` because scope detail is unresolved | valid request and frozen two-route catalog | validate; retain both conditional candidates; derive `scope_known`; return `ambiguous` with one clarification | bad catalog returns `invalid`; no retry or execution | canonical disposition fixture and byte digest | Agent Reasoning Engine implementation owner |

## Concern-to-view trace

| Concern | Primary class | Disposition | Owner | Views/extensions | Evidence |
|---|---|---|---|---|---|
| non-authorizing output | authority | required | reasoning-engine design owner | Views 1, 5; `AUTHORITY-TRUST.md` | `define/SPEC.md#source-and-ownership-boundaries` |
| terminal disposition algebra | state-event | required | reasoning-engine workflow owner | Views 4, 5; `STATE-EVENT.md` | `define/SPEC.md#output-algebra` |
| Augmentor/host and intent compatibility | integration | required | interface owner | Views 1, 6; `INTEGRATION-VERSIONING.md` | `define/SPEC.md#augmentor-and-host-sequence` |
| deterministic witness contracts | validation | required | plan/work-pack owner | scenario; `VALIDATION-CONTRACTS.md` | `define/SPEC.md#acceptance-criteria` |

Exact normalized concerns and owners are machine-recorded in
`DESIGN-SELECTION-RESULT.json`.

## Planned witness contracts

| Fixture | Claim | Polarity | Expected result | Phase |
|---|---|---|---|---|
| IRR-W01 | IRR-A01 | positive | unique candidate, no authority | implementation |
| IRR-W02 | IRR-A02 | negative | ambiguous, stable question | implementation |
| IRR-W03 | IRR-A05 | negative | invalid catalog, zero candidates | implementation |
| IRR-W04 | IRR-A06 | metamorphic | order-invariant canonical bytes | validation |
| IRR-W05 | IRR-A09 | negative/metamorphic | typed JSON-port failures and Node/Chromium byte parity | validation |
| IRR-W06 | IRR-A10 | positive/negative | selected-local posture preserved and missing selector unresolved | implementation |
| IRR-W07 | IRR-A11 | static | zero environment/runtime imports and zero permissions | validation |
| IRR-W08 | IRR-A09 | cross-runtime | browser main thread and worker pass the same vectors | validation |

These are planned witness contracts, not executed Plan evidence.

## Constraints

| Constraint | Source | Impact |
|---|---|---|
| existing `IntentRecord` remains candidate and private | engine intent contract | no canonical/public schema claim |
| no second router or scheduler | Augmentor owner-preserving research | resolver returns disposition only |
| L0 has no model or discovery call | selected spec | typed projection and frozen catalog are inputs |
| no implementation in Invoke | Invoke lifecycle | Plan hands off one SWU only |

## Decision log

| ID | Status | Decision | Alternatives | Criteria | Trade-off | Revisit trigger |
|---|---|---|---|---|---|---|
| IRR-D01 | accepted-local | name the capability Resolver, not Router | global router; Augmentor router | avoid duplicate execution authority | product language needs explanation | if host owner adopts a canonical neutral term |
| IRR-D02 | accepted-local | use typed projection plus deterministic catalog predicates | direct LLM routing; embedding similarity | replayability and honest ambiguity | projection quality is external | after a governed quality corpus and owner decision |
| IRR-D03 | accepted-local | explicit dominance graph, otherwise ambiguity | numeric scores or implicit priority | no score-only selection | catalog authoring is stricter | if admitted policy defines another deterministic precedence |
| IRR-D04 | accepted-local | distinct `CapabilityRouteCatalogSnapshot` | reuse semantic `RuleCatalogManifest` | prevent capability/semantic rule collapse | one more local type | if an upstream owner defines a shared super-contract |
| IRR-D05 | accepted-local | L0 includes the pure library, generic JSON port, compatibility mapper, and Node/Chromium conformance | host/product adapter now; Node-only witness | prove the standalone seam before consumer integration | broader L0 fixture surface, still no product acceptance | after portable L0 receipt and host-owned plan |

## Risks

| Risk | Mitigation | Owner |
|---|---|---|
| typed projection silently invents user intent | field posture, raw-intent preservation, ambiguity on material unresolved values | Intent Projector owner |
| catalog becomes an ungoverned capability registry | require owner, digest, version, and later admitted compiler | host/catalog owner |
| unique candidate is treated as permission | `authority_effect: none`; separate host decision and approval | ResonantOS host owner |
| L0 fixtures overstate natural-language quality | no quality claim; later evaluated corpus | evaluation owner |
| overlaps with current ACI-conformance plan | child package and separate work-pack; no parent plan mutation | reasoning-engine plan owner |

## Design transport and gate

- Six views: complete.
- Required extensions: authority/trust, state/event, integration/versioning,
  validation contracts.
- Glossary consistency: [GLOSSARY-CONSISTENCY.md](GLOSSARY-CONSISTENCY.md).
- Distill: [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md).
- Gate: **pass only when** `DESIGN-SELECTION-RESULT.json` returns
  `design-validator-pass`.
- Next route: Invoke Plan for this child package only.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
