# Essays database and agent-editing decision

Decision ID: `ESSAYS-DECISION-DATABASE-AGENT-EDITING-001`

Status: `BLOCK` pending Essays Project owner selection.

Recorded: 2026-09-01.

## Question

Which local persistence and agent-editing boundary should replace or extend the
current single-workspace `localStorage` runtime?

## Admissible options

### `ESSAYS-DB-INDEXEDDB-HANDOFF` — browser IndexedDB with explicit handoff

- Benefit: the smallest browser-only database, no service or new dependency,
  and continuity with the accepted no-network realization boundary.
- Cost and risk: agents cannot directly share the browser database; the
  frontend must export an exact proposal package and import an agent-produced
  proposal before the writer explicitly accepts it.
- Choose when: one local writer and a transparent file handoff are sufficient.
- Downstream impact: add multi-essay indexing, IndexedDB migration, proposal
  export/import, writer acceptance, DomainSpec nodes, a replacement realization
  baseline, and conformance evidence.

### `ESSAYS-DB-SQLITE-PROPOSAL-SERVICE` — SQLite with loopback proposal service

- Benefit: the frontend and bounded agent tools can share one durable database;
  agent writes can be recorded as proposals rather than accepted prose.
- Cost and risk: introduces a local service, API authentication and concurrency
  concerns, database migration, lifecycle management, and a network boundary
  forbidden by the current accepted baseline.
- Choose when: direct agent-tool access to a shared local store is essential.
- Downstream impact: revise the Product Capability and ontology, extend
  DomainSpec, compile a new system graph, obtain exact replacement-baseline
  acceptance, then implement the SQLite service, frontend client, proposal CLI,
  migrations, and conformance evidence.

### `ESSAYS-DB-DEFER` — defer

- Benefit: preserves the current accepted candidate and its evidence.
- Cost: multiple essays and agent proposal exchange remain absent.
- Downstream impact: no implementation mutation.

### `ESSAYS-DB-STOP` — stop

- Benefit: closes the feature stream without changing the runtime.
- Cost: the requested capability is not built.
- Downstream impact: no implementation mutation.

`Explain / more context` is a standing non-decision option. It expands these
trade-offs but grants no implementation authority.

## Recommendation

Select `ESSAYS-DB-INDEXEDDB-HANDOFF` unless direct, programmatic agent access to
the shared store is essential. It is the smallest extension that preserves the
current local-only security boundary and human editorial authority.

## Evidence

- `../../../PRODUCT-THESIS.md`
- `../../../domainspec-project/specs/essays-runtime/feature.json`
- `../../REALIZATION-BASELINE.candidate.json`
- `../../OWNER-ACCEPTANCE-RECEIPT.json`
- `../../../runtime/src/ports/workspace-repository.ts`
- `../../../runtime/src/adapters/local-storage-repository.ts`
- `../../../runtime/src/App.tsx`
- `option-admissibility-request.json`
- `option-admissibility-receipt.json`

## Current decision

Selected option: none.

Remaining blocker: the Essays Project owner must choose one admissible option.

Decision effect: none. No database, agent invocation, accepted prose mutation,
publication, deployment, or external effect is authorized by this record.
