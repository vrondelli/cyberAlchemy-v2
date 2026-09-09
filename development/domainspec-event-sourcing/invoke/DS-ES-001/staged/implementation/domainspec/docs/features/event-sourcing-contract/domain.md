---
tags: [event-sourcing, domain-model]
node_type: spec
is_session: false
layer: domain
nature: explanatory, reference, technical
status: draft
version: 0.1.0
last_updated: 2026-09-01
---

# Event Sourcing Contract Domain

## Source Entities

### EventSourcingContractSource

Root authored value containing `schemaVersion`, `contractId`, `streams`, `events`, and `projections`.

### StreamDefinitionSource

Declares a unique `streamId` and a `subjectKind` of `entity`, `relation`, or `process`. Version one fixes concurrency to expected-stream-version.

### EventDefinitionSource

Declares a unique `eventType`, its `streamId`, a non-empty `payloadSchemaRef`, and fixed complete-resulting-state semantics.

### ProjectionDefinitionSource

Declares a unique `projectionId`, one or more consumed event types, stream-subject keying, required rebuildability, and latest-valid-checkpoint-plus-tail recovery.

## Compiled Values

The compiled root contains normalized declarations, derived event inventories per stream, fixed ordering semantics, and a stable runtime-obligation list. It contains no handles to authored mutable arrays.

## Invariants

1. Identifiers and schema references are non-empty after trimming checks.
2. Stream, event, and projection identifiers are unique in their namespaces.
3. Every event references one known stream.
4. Every stream has at least one declared event.
5. Every projection consumes at least one known, unique event type.
6. Version-one fixed semantics cannot be overridden.
7. Compiled set-like collections are lexicographically ordered.

## Relationships

| From | Relation | To |
| --- | --- | --- |
| EventSourcingContractSource | contains | StreamDefinitionSource |
| EventSourcingContractSource | contains | EventDefinitionSource |
| EventSourcingContractSource | contains | ProjectionDefinitionSource |
| EventDefinitionSource | belongs to | StreamDefinitionSource |
| ProjectionDefinitionSource | consumes | EventDefinitionSource |
| CompiledStreamDefinition | contains | compiled event-type inventory |
