# Essays Agent Runtime Ontology Plan

Status: candidate planning package  
Authority effect: none

This package plans the ontology family and construction order for the first
local Essays runtime with desktop, CLI, authorized remote clients, agent
proposals, durable persistence, optional capability-bounded WebAssembly
extensions, and supervised browser work.

## The seven ontologies

1. Essays Product Ontology — product identity, writer journey, artifacts,
   lifecycle, review, residue, export, and value.
2. Whisper-Derived Writing Capability Ontology — intent, composition, draft,
   feedback, revision, validation, and export behavior.
3. Multi-Client Agent Runtime Business Ontology — the existing candidate for
   client parity, proposals, receipts, revisions, recovery, and transport
   non-authority.
4. Agent And External-Effect Authority Ontology — grants, acceptance,
   revocation, credentials, browser effects, and uncertain outcomes.
5. Agent Runtime Architecture Property Ontology — falsifiable constraints such
   as deterministic transitions, durable-before-ack, parity, isolation, and
   adapter replaceability.
6. Generated Agent Runtime System Ontology — one DomainSpec-generated system
   model with nine views for kernel, protocol, storage, clients, agents/WASM,
   browser supervision, security, evidence, and platform topology.
7. Realization And Conformance Bridge — evidence-bearing links from business
   meaning to generated system artifacts, exact implementation, tests,
   telemetry, and drift.

Data, protocol, persistence, clients, agents, browser control, security
enforcement, observability, and deployment are system views rather than eight
independent ontologies. They share command, actor, grant, revision, event, and
receipt identities; separating them would make cross-client drift easier.

## What “one shot” means

The plan permits candidate authoring, compilation, and one separately authorized
bounded implementation campaign after the authored ontologies, capability
contracts, technology decisions, DomainSpec source, and generated system
ontology are structurally validated and frozen. Owner approval is not an
authoring or compilation prerequisite. It becomes mandatory only after an exact
merge candidate is frozen. Security, migration, browser-effect, conformance,
release, and deployment gates remain separate and are not bypassed.

Run:

```bash
python3 scripts/validate.py
```

The expected current result is `FLAG`: the plan should be structurally closed,
while pre-merge approval, remaining effect-owner decisions, DomainSpec output,
implementation authority, and conformance remain open.

## Claim ceiling

This is a private planning candidate. It does not adopt any ontology, select
candidate technologies, create DomainSpec source, generate a system ontology,
authorize implementation, register a ConstructionBinding, prove conformance,
or authorize remote access, browser effects, publication, release, or
deployment.
