---
title: Intent Route Resolver specification
status: candidate
invoke_mode: define
authority_effect: none
---

# Intent Route Resolver specification

## Objective

Make one small, deterministic, non-authorizing front-door relation available
as a standalone adapter that the Agent Reasoning Engine and other agentic
runtimes can embed:

```text
RoutableIntentEnvelope + CapabilityRouteCatalogSnapshot
  -> RouteDisposition
```

The relation must preserve raw intent, expose ambiguity, and never convert
similarity, ranking, or one eligible candidate into execution permission.

## Expected end state

At the end of the bounded implementation path:

1. a private, dependency-free ESM package accepts a versioned JSON
   `RouteRequest`;
2. it validates a frozen owner-supplied catalog;
3. it returns byte-stable `candidate`, `ambiguous`, `no-match`, or `invalid`
   dispositions for literal fixtures;
4. any agentic runtime can integrate through a generic JSON port and a
   runtime-owned projection adapter without importing private engine types;
5. an explicit selected-local mapper preserves compatibility with the current
   Agent Reasoning Engine intent record;
6. Augmentor can later project that result and ask the returned clarification
   without owning route truth;
7. ResonantOS can later persist an immutable host `RouteDecision`, collect any
   required approval, and invoke the retained execution owner; and
8. Dispatch Spec, Continuation Router, Orchestrate, and the semantic evaluator
   retain their existing responsibilities.

This Define/Design/Plan run stops before item 1 is implemented.

## Scope

In scope:

- a JSON-only `RoutableIntentEnvelope@1` that preserves raw intent or its
  opaque source reference, projection identity, typed discriminator posture,
  and constraints;
- a generic JSON request/response port;
- an explicit selected-local compatibility mapper;
- a distinct frozen `CapabilityRouteCatalogSnapshot`;
- deterministic eligibility, dominance, ambiguity, no-match, and invalid
  behavior;
- an immutable advisory receipt with input digests and reasons;
- a consumer contract for Augmentor and a host boundary for ResonantOS;
- literal positive and negative fixtures, a zero-permission add-on manifest,
  and Node/Chromium conformance;
- a layered implementation work-pack.

Out of scope:

- route execution, scheduling, approval, mutation, promotion, or effect;
- terminal-receipt continuation;
- multi-step dispatch validation;
- semantic-rule evaluation;
- natural-language model quality claims;
- live capability discovery, persistence, network transport, product browser
  UI, or ResonantOS mutation in L0;
- public Arcanum changes.

## Source and ownership boundaries

| Neighbor | Owns | Resolver must not duplicate |
|---|---|---|
| Intent Projector | preserved raw intent and typed field posture | inventing declared facts or revision authority |
| semantic-judgment evaluator | finite semantic applicability and reduction | semantic outcome algebra |
| Dispatch Spec | validation of an already-proposed multi-step route | raw-intent capability selection |
| Continuation Router | next route from a terminal capability receipt | front-door intent routing |
| Orchestrate | approved dispatch execution, joins, gates, closeout | scheduling or execution |
| Augmentor | conversational capture, correction, display, clarification | route decision, run truth, or approval authority |
| ResonantOS host | immutable route decision, approval, owner invocation, persisted runtime truth | reasoning-engine semantic ownership |

## Input contract

`RouteRequest@1` is a JSON-only value and contains:

```yaml
schema_version: intent-route.request@1
request_id: string
intent:
  schema_version: routable-intent@1
  source_schema: string
  source_digest: sha256
  raw_intent: string | {ref: string}
  discriminators:
    <catalog-owned-key>:
      posture: declared | inferred | unresolved
      value: JSON value | null
      evidence_refs: [string]
      inference_note: string | null
  constraints: [string]
catalog_snapshot: CapabilityRouteCatalogSnapshot@1
```

The contract rejects non-JSON values including `undefined`, `BigInt`, `Date`,
`Map`, functions, symbols, cyclic objects, and host/runtime objects. A
`SelectedLocalIntentMapper@1` maps the existing private
`intent-record.selected-local@1` shape into this generic envelope using an
owner-supplied mapping profile. Missing mappings stay `unresolved`.

`CapabilityRouteCatalogSnapshot@1` contains a version, owner reference,
effective-state marker, content digest, and a finite list of route entries.
Each entry contains:

- stable `route_id` and `capability_ref`;
- supported mode;
- required discriminator predicates;
- explicit exclusions;
- required input names;
- optional acyclic `dominates` route IDs;
- owner and contract references; and
- forbidden effect classes.

The L0 resolver does not scan installed skills or call a model. A later
owner-owned adapter may compile this snapshot from admitted registries.

`IntentRouteRuntimePort@1` accepts UTF-8 JSON text and returns UTF-8 JSON text.
Caller-controlled parse, version, or shape failures return typed invalid
responses rather than escaping as uncaught exceptions. The port is an embedded
library interface, not a daemon or transport protocol.

`IntentRoutePortResponse@1` is the exact wire envelope:

```yaml
protocol_version: intent-route.runtime-port@1
request_id: string | null
disposition: RouteDisposition@1 | null
transport_diagnostic:
  subject: transport | request
  reason_codes:
    - port.invalid-json
    - port.unsupported-request-version
    - port.invalid-request
  details: [string]
```

Exactly one of `disposition` or `transport_diagnostic` is non-null. A response
is canonicalized with the same UTF-8/JCS/SHA-256 profile as resolver receipts.
Caller-controlled input never produces an internal-error detail or stack trace.

## Output algebra

Every `RouteDisposition@1` contains request and catalog digests,
`authority_effect: none`, reason codes, and a complete evaluated-route trace.

| Kind | Required condition | Required payload |
|---|---|---|
| `candidate` | exactly one eligible, non-dominated route remains and no missing discriminator can change eligibility | one route candidate, match reasons, missing non-blocking inputs |
| `ambiguous` | multiple non-dominated routes remain, or missing discriminators could change eligibility | complete candidate set, ambiguity reasons, material missing discriminators, one clarification question |
| `no-match` | request is valid, material discriminators are resolved, and no route is eligible | rejection reasons by route and catalog owner route |
| `invalid` | request/catalog shape, version, digest, owner, or dominance graph is invalid | invalid subject, reason codes, zero candidates |

## Deterministic resolution rules

1. Reject unknown request or catalog versions.
2. Verify the catalog digest, owner reference, unique route IDs, referenced
   dominance IDs, and an acyclic dominance graph.
3. Preserve the raw intent and field postures; never default `unresolved`.
4. Evaluate explicit exclusions before required predicates.
5. Mark a route eligible only when every required predicate is satisfied.
6. If an unresolved discriminator could make any otherwise viable route
   eligible, return `ambiguous`.
7. Remove an eligible route only when another eligible route explicitly and
   transitively dominates it in the frozen catalog.
8. Return `candidate` only for one remaining route, `ambiguous` for more than
   one, and `no-match` for none.
9. Generate the clarification from the smallest sorted set of differing
   material discriminator keys; do not use a confidence score.
10. Canonicalize the receipt for byte-stable fixture comparison.

## Functional requirements

| ID | Requirement |
|---|---|
| IRR-F01 | Preserve the exact raw intent and selected-local field posture. |
| IRR-F02 | Reject invalid request/catalog versions, digests, ownership, IDs, or dominance cycles. |
| IRR-F03 | Evaluate exclusions and required predicates deterministically. |
| IRR-F04 | Return a complete advisory candidate set with evidence-backed reason codes. |
| IRR-F05 | Return ambiguity when missing information can change eligibility. |
| IRR-F06 | Return exactly one deterministic clarification question for ambiguity. |
| IRR-F07 | Return no-match without inventing a fallback capability. |
| IRR-F08 | Emit a canonical, digest-bound receipt with `authority_effect: none`. |
| IRR-F09 | Make zero model, network, filesystem-discovery, dispatch, or effect calls in L0. |
| IRR-F10 | Accept and return JSON through a runtime-neutral port with typed transport failures. |
| IRR-F11 | Map selected-local intent only through an explicit digest-bound compatibility profile. |
| IRR-F12 | Declare an add-on surface with zero required permissions and no host-runtime dependency. |

## Non-functional requirements

| ID | Requirement |
|---|---|
| IRR-N01 | Same canonical input bytes produce byte-identical output bytes. |
| IRR-N02 | Catalog entry order does not change the disposition or receipt ordering. |
| IRR-N03 | Removing evidence or resolving a field back to `unresolved` cannot improve a disposition from ambiguous/no-match to candidate. |
| IRR-N04 | All public functions are pure except an explicit fixture runner that writes only its selected output directory. |
| IRR-N05 | Unknowns and invalid states fail closed and remain visible. |
| IRR-N06 | Exported core, JSON port, and mapper import no Node, DOM, filesystem, network, or agent-runtime modules. |
| IRR-N07 | Canonical UTF-8 bytes and SHA-256 hex digests match in Node and Chromium for the conformance vectors. |

## Augmentor and host sequence

```text
ordinary-language turn
  -> Augmentor captures raw text and a typed projection candidate
  -> host freezes an admitted capability-route catalog snapshot
  -> Intent Route Resolver returns RouteDisposition
  -> Augmentor displays candidate(s) or asks the exact clarification
  -> user edits, declines, clarifies, or approves
  -> ResonantOS persists an immutable RouteDecision
  -> retained owner validates/executes through its own gate
  -> owner receipt is projected back to Augmentor
```

An approved multi-step route may next go to Dispatch Spec and Orchestrate. A
terminal capability receipt may next go to Continuation Router. Neither route
is owned by this resolver.

## Acceptance criteria

| ID | Criterion | Planned evidence |
|---|---|---|
| IRR-A01 | One eligible route returns `candidate` and zero effects. | positive literal fixture |
| IRR-A02 | Two non-dominated routes return `ambiguous` with one stable question. | overlap fixture |
| IRR-A03 | Missing material discriminator returns `ambiguous`, never guessed candidate. | missing-field fixture |
| IRR-A04 | Known unsupported intent returns `no-match`. | unsupported fixture |
| IRR-A05 | Digest mismatch, duplicate ID, and dominance cycle return `invalid`. | negative catalog fixtures |
| IRR-A06 | Catalog order permutation returns identical canonical bytes. | metamorphic fixture |
| IRR-A07 | The package performs no external/model/dispatch calls. | dependency inspection and test doubles |
| IRR-A08 | Augmentor/ResonantOS contract preserves projection, decision, approval, and execution owners. | contract review |
| IRR-A09 | Generic JSON request/response returns identical typed outcomes in Node and Chromium. | portable conformance fixtures and real browser witness |
| IRR-A10 | Selected-local mapping preserves raw intent, posture, evidence, source digest, and unresolved missing mappings. | mapper fixtures |
| IRR-A11 | Exported dependency graph is runtime-neutral and the add-on manifest requests no permissions. | static import and manifest audit |

## Open residue

- The universal fitness of `intent-record.selected-local@1` is not assumed; it
  is one compatibility profile.
- The production owner and compiler for a live capability-route catalog remain
  a ResonantOS/Arcanum integration decision.
- Natural-language projection quality is outside L0 and requires a separately
  owned evaluation corpus before any quality claim.
- Browser conformance proves the standalone package executes in the tested
  Chromium runtime. It does not prove Augmentor or ResonantOS product
  acceptance.

## Gate result

Status: **pass for Design**. The child capability is bounded, source contracts
are available, and no blocker decision is required. Implementation remains
unauthorized.

Open questions and owner routes are consolidated in
[../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
