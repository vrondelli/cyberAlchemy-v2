# Refine Seed Proposal — Minted Project Node Package Toy Game

- **run_id:** `20260714-minted-project-node-package-toy-game`
- **target:** the DomainSpec contract for minting a consumer project whose domain specifications are machine-first, node-addressable, agent-traversable, and human-readable through generated views
- **preset:** standard
- **research:** research-if-gap-appears; local-first and no external research without later operator confirmation
- **status:** strategy-only; runtime execution awaits operator confirmation

## Operator Intent

Use a toy game to refine the design before resuming the blocked FPR-01 source-home decision. DomainSpec is the factory: it owns the language, schemas, compiler, validators, and mint contract. A minted project owns its domain nodes, edges, meaning, and local authority decisions. DomainSpec-local feature packs are fixtures or witnesses, not consumer-domain authority.

## Problem Being Refined

The current discussion exposed three collapses that must be falsified cheaply:

1. DomainSpec repository space was confused with a minted consumer project's authority space.
2. Markdown human views were confused with machine authority and traversal inputs.
3. A feature-level machine monolith was confused with a graph assembled from addressable node records.

The existing FPR-01 census proves the source-home question is unresolved and explicitly prohibits inferring a compiled graph from path observations. The architecture evidence proposes a node envelope with identity, intent, connections, body, residue, and epistemic proof, but says the envelope and validator are designed rather than built.

## Toy Game

Mint a disposable `key-and-door` consumer project inside this run folder. Its smallest valid graph uses only existing DomainSpec kinds and relationship labels:

- `Player` — Entity
- `UnlockDoor` — Operation
- `HasKeyRule` — Rule
- `DoorUnlocked` — Event
- `Player --performs--> UnlockDoor`
- `HasKeyRule --enforces--> UnlockDoor`
- `UnlockDoor --produces--> DoorUnlocked`

Compare three source layouts:

1. one canonical file per node with source-owned outgoing typed connections;
2. one file per node plus separate first-class edge files;
3. aspect-bundle files grouped by kind.

The compiler target is one normalized `graph.json`; the human target is generated Markdown. Neither generated artifact may become an independent semantic source.

## Required Failure Tests

- a connection targets a missing node;
- two files claim ownership of the same edge id;
- a connection uses an unknown or endpoint-invalid relationship label;
- compiled `graph.json` no longer matches source digests;
- generated Markdown no longer matches source/graph digests;
- an implementer route requires parsing Markdown to recover a missing machine field;
- a DomainSpec-local fixture is mistaken for consumer-project authority.

## Convergence Criteria

- The factory/consumer authority split is explicit and survives every candidate layout.
- A project-local manifest resolves every canonical node source without hard-coded DomainSpec repository paths.
- An implementer can traverse the normalized graph and open one node source on demand without parsing Markdown.
- Every canonical node and edge has exactly one source owner.
- Generated graph and human views are reproducible and digest-bound.
- The selected small layout recomposes into the future project-mint contract without deciding production promotion.
- Rejected alternatives and failure evidence remain in the run evidence index.

## Write Scope

Only this refinement run folder:

`projects/domainspec-v2/development/refinement-runs/20260714-minted-project-node-package-toy-game/`

No FPR decision artifact, authority source, validator, production template, Craft state, Inventory state, or consumer project outside the run folder may change.

## Canonical Stage Configuration

1. Context Builder — strict local evidence pack.
2. Invoke Define — define the factory, consumer, machine-source, compiled-graph, and human-view boundaries.
3. Interrogation refine-review — dialectic across factory owner, consumer owner, and implementer-agent viewpoints.
4. Research decision — local-first; ask before any bounded external research.
5. Distill — select the smallest coherent experiment unit.
6. Invoke Design — materialize the three-layout toy game and evidence contract.
7. Interrogation refine-design-review — attack authority, traversal, and view-drift claims.
8. Distill Repair — run failure cases and repair or reject candidates.
9. Invoke Plan — write a non-executed project-mint implementation plan.
10. Final Interrogation and Refine synthesis — decide whether evidence is strong enough to resume Decision Gate.

## Done Criteria

A final refined synthesis names one selected or still-blocked node-package design, cites toy-game evidence, preserves the DomainSpec-to-consumer authority handoff, and emits a non-executed plan. It does not implement the project minter or settle FPR-01 by itself.
