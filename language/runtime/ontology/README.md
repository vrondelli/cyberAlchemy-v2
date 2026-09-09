# CyberAlchemy Language Runtime Product Ontology

Status: private candidate business-system bridge

Package owner: CyberAlchemy v2 Language Project owner

System-design owner: unresolved; candidate route is CyberAlchemy v2 Language
Runtime owner

Authority effect: none

Implementation state: not implemented

## Why This Ontology Exists

The Language Project already explains why bounded meaning, owner routes,
evidence, and unresolved questions must stay connected. The product journeys
also require one interactive Define wizard whose current question survives
restart and appears with the same identity in CLI and chat.

This ontology connects those business requirements to a smallest proposed
runtime shape. It now also carries package-local candidate definitions for that
shape. Those definitions are not CyberAlchemy v2 canonical definitions, and
the ontology does not pretend that the runtime exists.

The business branch also makes the agent consultation boundary explicit. The
Governance Language is resolved through exact meaning, realization,
relationship, and authority bindings into one source-digest-bound Language
Context View. Define consumes that view and applies usable bindings or exposes
a visible gap. The view does not grant meaning ownership, select an open
DomainSpec realization, accept a definition, or create authority. Its JSON
request/view contracts and system resolver remain open design work.

## Product Shape

```text
Language Project ---- pursues ----> Ubiquitous Language Goal
       |
       +---- owns business meaning and practice

Define Shared Meaning <---- proposed_realization_of ---- Language Runtime
       |                                                   |
       +---- produces ----> Definition Pack                +-- coordinates --> Language Session
       +---- requires ----> Coverage Rule                  +-- composed_of --> Resumable Session Kernel
       +---- requires ----> Context Rule                   +-- composed_of --> CLI Adapter
                                                           +-- composed_of --> Chat View
Language Session                                           +-- specified_by -> Runtime Contract Candidate
       +---- has_state ----> Session State                 `-- composed_of --> Artifact Emitter
                                  |                                             |
                                  +-- contains --> Question Record               +-- emits --> Artifact Preview
                                  `-- contains --> Answer Record                 `-- projects_candidate_of --> Definition Pack

Session State + Session Command ---> Resumable Session Kernel ---> next State + Question View

CLI Adapter ---- renders ----> the same Question View <---- renders ---- Chat Adapter
                                      |
                                      `---- projects ----> one Question Record
```

## Load-Bearing Distinctions

- The Language Runtime is a proposed system component, not Define, the Language
  Project, or an accepted Runtime Contract.
- A Language Session owns resumable identity and lifecycle. Session State is a
  value inside it; the Session Store is the persistence boundary.
- Language Question and Language Answer are business meanings. Question Record
  and Answer Record are system representations traced to those meanings.
- CLI and chat render the same Question Record. They do not own separate copies
  of question truth. More precisely, both render the same transport-neutral
  Question View, which projects one Question Record.
- The Resumable Language Session Kernel is Layer 0, not the whole runtime. Its
  first frame is one process, one writer, pure transition logic, and atomic
  whole-snapshot JSON replacement. It claims no crash or distributed durability.
- A draft artifact preview may exist before review. Materialized candidate
  emission requires review bound to the exact Session revision, state digest,
  and preview digest; an output-affecting change invalidates that review.
- The Runtime Contract node and definition remain blocked candidates of
  `kind.runtime_contract`; package validation cannot accept them.
- The Artifact Emitter is not the Artifact Preview. The preview is not an
  accepted Definition Pack, and a Definition Pack is not canonical definitions.
- Supporting the Ubiquitous Language Goal is not achieving it.

## Views

- [`views/business-view.json`](views/business-view.json) contains product
  meaning, outcomes, rules, the Language Project, and local concept candidates.
- [`views/system-view.json`](views/system-view.json) contains only proposed,
  not-implemented system responsibilities.
- [`views/bridge-view.json`](views/bridge-view.json) contains only cross-branch
  traceability and explicit claim limits.

The JSON registries are the machine-readable package state. This README is a
human projection and does not redefine them.

`definitions.json` gives selected runtime concepts scientific/formal,
plain-language, and CyberAlchemy Language Project voices. Its authority posture
is `ontology-candidate-not-canonical`. Promotion, if ever needed, belongs to
`authority/definitions/DEFINITIONS.md` through definitions-governance.

## First Experiment Target

The first proposed experiment is bounded to the exact current
`LANG-EX-GOVERNANCE-POLICY-001` exercise. It should preserve the exercise's
bounded context, mappings, evidence, owners, and unresolved Rule Review
Recommendation instead of manufacturing completion. The ontology defines only
the pre-code Experiment Frame. A separate Experiment record must bind Project,
Goal, protocol, conditions, measures, stop rules, and evidence limits before
any run; a separate pre-run manifest must later bind executable and environment
identity.

## IPC Boundary

This ontology does not require an IPC socket. The smallest slice can use one
local process, one JSON session store, and an in-process CLI. Chat remains a
projection adapter until a later integration requirement justifies transport.

## Upstream Condition

The central product ontology currently reports a source-digest blocker after
concurrent canonical-definition changes. The Language Project package also
reports a separate Governance authority-enforcement selector drift. This bridge
binds exact current source files but does not claim either upstream package is
accepted. Both blockers remain in `residue.json` under their own owner routes.

## Package Files

| File | Purpose |
| --- | --- |
| `profile.json` | Package identity, owners, bridge type, visibility, and ceiling. |
| `sources.json` | Exact source identities, branches, digests, and owners. |
| `definitions.json` | Three-voice package-local candidate definitions attached to ontology subjects. |
| `nodes.json` | Business projections and not-implemented system candidates. |
| `relations.json` | Typed business, system, and bridge relations. |
| `views/` | Separate business, system, and bridge projections. |
| `residue.json` | Open decisions, upstream drift, owner gaps, and missing evidence. |
| `schemas/language-runtime-product-ontology.schema.json` | Closed machine contracts. |
| `schema-amendment.json` | Explicit witness for the candidate-definition and graph-shape amendment. |
| `scripts/validate.py` | Deterministic source, graph, view, boundary, and receipt validation. |
| `tests/test_negative_mutations.py` | Fail-closed regression mutations for semantic and authority boundaries. |
| `receipts/` | Append-only validation history. |

## Validate

From the repository root:

```bash
python3 cyberAlchemy-v2/language/runtime/ontology/scripts/validate.py
python3 cyberAlchemy-v2/language/runtime/ontology/scripts/validate.py --write-receipt
```

Check-only mode writes nothing. Receipt mode writes only after every reachable
package check passes.

## Claim Ceiling

This package describes one proposed product/runtime bridge and system
decomposition. It does not show that sessions persist, CLI and chat synchronize,
transitions are correct, artifacts are accepted, the Goal is achieved, or a
runtime has been implemented, tested, published, deployed, or admitted.
