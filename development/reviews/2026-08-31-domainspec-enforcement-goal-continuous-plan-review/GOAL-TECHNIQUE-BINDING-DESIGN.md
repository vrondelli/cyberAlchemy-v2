# Public Goal Technique Behind the Private Craft Carrier — Design Candidate

Date: 2026-09-01  
Work item: `ARC-SWU-03`  
Parent graph node: `CGC-G20`  
Selected route: `CA2-ROUTE-PLAN`  
Authority effect: `none`

## Decision in one sentence

Treat the public Arcanum `goal` spell as a replaceable, read-only frontier-observation technique behind a private Craft Product Capability and capability-local business ontology; never let its public fixture vocabulary, projected snapshot, approval token, staged delta, or generated host skill become the private Project, Goal, work graph, route decision, owner decision, or source ledger.

This is a planning candidate. It is not a Product Capability adoption, ontology admission, implementation binding, or runtime switch.

## Product purpose

The proposed private Product Capability is `CA2-CAP-COORDINATE-GOVERNED-GOAL-FRONTIER`. Its stable outcome is to let the Craft Project owner and repository agents keep one exact, dependency-aware, evidence-bounded Goal frontier current while preserving owner continuity and concentrating human gates at consequential transitions.

That outcome belongs to the Craft Product only if its Product owner accepts it. The candidate currently realizes these selected product commitments:

- CyberAlchemy Product Thesis `## Thesis`;
- `## First-Order Product Principles`, specifically Human agency, Bounded and visible authority, Evidence continuity, Owner continuity, and Honest incompleteness;
- Craft Product Thesis `## Thesis`;
- `CAV2-D20` Craft Method, which requires an owner-controlled chain, typed residue, source-of-truth state, and owner continuation;
- `CAV2-D59` Goal and `CAV2-D60` Project, which keep the durable outcome and its coordination carrier distinct;
- `CAV2-D65`, which keeps successor stages blocked or `not_evaluable` when predecessors are missing;
- `CAV2-D67`, which separates a Product Capability outcome from every tool or realization.

## Private carrier state

The intended private carrier is not yet registered:

- Project: `CA2-PROJECT-CRAFT`, lifecycle `proposed`;
- intended continuous Goal: `CA2-GOAL-CRAFT-GOVERNED-CONSTRUCTION`, planning candidate only;
- currently registered Project Goal ref: `CA2-GOAL-CRAFT-PRODUCT-FEATURE-FOUNDATION`, a different draft Goal with a narrower outcome;
- Project `construction_binding_refs`: empty;
- Goals validator: `BLOCK`, with nine source-digest drifts plus two inherited-contract epoch mismatches;
- Craft validator: `BLOCK`, with three source-digest drifts;
- Goals ConstructionBinding registry count: zero.

The Product Feature Goal must not be substituted for the continuous governed-construction Goal. Registration remains a W0 owner-gated successor-epoch task.

The Goal candidate previously named three Product Thesis headings that no longer exist. This round corrected the planning candidate to the current `## First-Order Product Principles` section and its exact item labels. That correction changes only candidate planning bytes; it is not an owner adoption decision.

## Public technique state

The canonical public technique is `arcanum/spells/goal/README.md`. The generated Codex surface points to that source and is semantically equal after removing one generator-added leading blank line, but it is not byte-equal to the README body.

The executable `runtime/goal_loop.py` explicitly calls itself a read-only skeleton. Its command-line entry point reads one fixture and writes only a frontier snapshot and loop result to a caller-selected output directory. Other module functions can synthesize fixture dispatch routes, receipts, staged deltas, approval boundaries, gap proposals, and telemetry, but the command-line entry point does not run Task Session, apply Craft, mutate a source ledger, or promote a batch.

Current in-memory fixture checks pass for the public package. That evidence proves only the public fixture behavior and schema shapes; it is self-owned evidence, not independent private conformance.

## Material incompatibility with the private frontier

Projecting the current 24-node private work graph through `run_goal_loop` preserves the node count and returns `STOP/t3-node`, but each output node retains only:

- `node_id`;
- `kind`;
- `status`;
- `summary`.

It drops:

- dependency edges;
- the explicit private risk tier;
- owner route;
- CyberAlchemy-v2 route;
- closure evidence;
- blocked effects;
- D65 stage semantics.

Therefore the public snapshot cannot determine dependency readiness, owner eligibility, route admission, gate closure, or D65 successor state. It is an advisory projection, not the authoritative frontier.

The public helper functions also contain intentionally generic defaults such as `task-session`, `arcana/craft`, `craft-after-approval`, and a batch token checked primarily by batch ID. Those defaults are suitable for public fixtures but cannot authorize a private dispatch, ledger apply, Goal registration, or promotion.

## Candidate private boundary

The future private coordinator should own an immutable `Authoritative Goal Bundle` containing:

1. exact Project bytes and Project ID;
2. exact registered Goal bytes and Goal ID;
3. exact work-graph bytes, node identities, dependencies, owner routes, CA2 routes, risk tiers, gates, and claim ceilings;
4. selected Product Thesis and definition selector digests;
5. current owner decisions and their immutable candidate digests;
6. the private decision profile, if any, kept outside public artifacts;
7. the selected public-technique version and exact implementation digests.

The coordinator may construct a run-local public-safe projection and call only the permitted public technique operations. It must then join the advisory result back to the unchanged private bundle and emit a private receipt that proves which information was projected, dropped, or rejected.

### Initially permitted operations

- read-only source binding check;
- public-safe frontier-shape projection;
- advisory risk signal;
- advisory gap deduplication;
- schema validation of public outputs;
- run-local telemetry candidate with no Product or authority claim.

### Initially forbidden operations

- selecting the authoritative next node;
- declaring dependency readiness;
- choosing or changing a CA2 route;
- dispatching a helper;
- treating a synthetic execution receipt as real execution evidence;
- treating a public staged delta as a Craft or Goals ledger proposal;
- accepting a public approval token as a CyberAlchemy owner decision;
- applying a delta, changing a Project/Goal, or registering achievement;
- persisting private prose or filled profiles under `arcanum/`;
- publication, release, deployment, or external effect.

## Product Capability candidate

`goal-frontier-product-capability.candidate.json` uses the current closed `CAV2-D67` Product Capability shape. It keeps five owner lanes distinct:

1. Craft Product owner — stable product outcome;
2. definitions-governance — definition-pack shape;
3. Craft Project and Goals owners — private carrier/runtime contract;
4. Arcanum spellcraft owner — public realization contract;
5. selected Goal work owner — suitability for one next use.

The lifecycle axes say `candidate`, `bounded-planning-evidence`, and `inactive-awaiting-owner-review`. Schema validity cannot change those postures.

## Capability-local business ontology candidate

`goal-frontier-business-ontology.candidate.json` distinguishes:

- Craft Product;
- Craft Project;
- governed-construction Goal;
- governed frontier Product Capability;
- Product and Project owners;
- repository agent;
- Authoritative Goal Bundle;
- Frontier Proposal;
- Owner Decision;
- public Goal technique;
- exact input/output contracts, context policies, realization candidate, obligations, and residue.

Every relation is `proposed-owner-review`. The file has internal endpoint closure, but no current generic business-ontology schema or owner decision admits it.

## D65 state

| Stage | State | Evidence or blocker |
|---|---|---|
| canonical definitions | `partial-active-local-terms-open` | CAV2-D20/D59/D60/D65/D67 are active; `Authoritative Goal Bundle`, `Frontier Proposal`, and `Public Technique Binding` remain local candidate terms requiring definitions-owner review. |
| Product Capability | `candidate-not-adopted` | Closed-shape candidate exists; product outcome and Product ownership are not decided. |
| capability-local business ontology | `candidate-not-admitted` | Endpoint-closed candidate exists; relation semantics and ownership are not admitted. |
| DomainSpec v2 authored source | `not_evaluable` | No admitted profile or authored package exists for this capability. |
| deterministic compiled graph | `not_evaluable` | No source/compiler predecessor. |
| system ontology | `not_evaluable` | No deterministic compiled graph or admission. |
| exact implementation binding | `not_evaluable` | This document is a prebinding design, not a ConstructionBinding. |
| static conformance | `not_evaluable` | Public fixtures do not cover the private capability contract. |
| runtime evidence | `not_evaluable` | No private shadow run with exact bundle and independent consumer. |
| runtime enforcement | `not_evaluable` | Requires separate owner adoption and later governed Rust enforcement prerequisites. |

## Migration sequence

1. **P0 — W0 carrier repair:** freeze owner-confirmed source epochs, create successor Goals contract evidence, validate Goals, review the corrected Goal digest, and add bidirectional Project/Goal refs only after owner approval.
2. **P1 — definitions and Product Capability:** decide the three local terms, Product ownership, capability outcome, contracts, policies, and owner routes.
3. **P2 — business ontology:** review relation semantics, admit the capability-local ontology, and preserve explicit residue.
4. **P3 — DomainSpec construction:** author the exact DomainSpec v2 source and deterministically compile graph/system ontology.
5. **P4 — private shadow adapter:** implement projection and join in a private package; allow only read-only operations and reject information-loss elevation.
6. **P5 — exact binding and independent conformance:** bind all predecessor and implementation digests; run positive, negative, mutation, determinism, and independent-consumer checks.
7. **P6 — adoption:** separately decide whether the private capability may use this public version in live planning. Promotion/apply remains outside the initial binding.

## Conformance obligations

Positive tests must prove exact carrier binding, dependency closure, selector closure, all private node fields retained in the private receipt, public-safe projection, schema-valid advisory output, deterministic semantic join, no writes under public source, and zero ledger/Project/Goal mutation.

Negative tests must reject a missing or wrong Project; substitution of the Product Feature Goal; unregistered intended Goal; stale thesis selector; source digest drift; changed dependency edge; dropped owner/CA2 route elevated to authority; unknown risk; public default owner; public approval token; synthetic execution receipt; public staged delta; output under `arcanum/`; filled private profile copied public; public README/runtime/schema drift; generated mirror semantic drift; and any attempt to claim registration, adoption, conformance, achievement, publication, or deployment.

Two clean runs over identical private bundle bytes must produce the same semantic receipt. Observation time may differ only as an explicitly non-semantic field. The authoritative bundle digest, selected node, dependency proof, owner route, gate state, and claim ceiling must be identical.

## Open owner decisions

- Does `CA2-CAP-COORDINATE-GOVERNED-GOAL-FRONTIER` belong to the Craft Product with this exact outcome and scope?
- Are the three local candidate terms new canonical definitions, specializations, or ontology-local terms?
- Are the proposed business relations acceptable, and which owner controls each?
- Which DomainSpec v2 profile and compiler epoch may author this capability?
- Is the public spell retained only for advisory observation, or should a private implementation replace it before any live use?
- Who owns independent conformance, and what exact shadow run is sufficient for an adoption decision?

## Claim ceiling

This design establishes a bounded candidate Product Capability, business ontology, and public-technique prebinding. It corrects stale candidate selectors and proves the current public projection loses private authority-bearing fields. It does not repair Goals, register the continuous Goal, adopt the Product Capability, admit the ontology or DomainSpec source, create a ConstructionBinding, implement the adapter, authorize public technique use, mutate any ledger, prove conformance or achievement, publish, release, deploy, or create an external effect.
