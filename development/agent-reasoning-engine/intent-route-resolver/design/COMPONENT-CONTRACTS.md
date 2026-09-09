# Component contracts

## `RouteRequest@1`

Required: schema version, request ID, JSON-only `RoutableIntentEnvelope@1`, and
complete catalog snapshot. A request is not approval.

## `RoutableIntentEnvelope@1`

Required: schema version, source projection schema, source digest, preserved raw
intent or opaque source reference, typed discriminator map, and constraints.
Discriminator values use `declared | inferred | unresolved` posture. The
envelope rejects non-JSON and host-runtime-native values.

## `IntentRouteRuntimePort@1`

`resolveJson(requestText)` accepts UTF-8 JSON text and always returns UTF-8 JSON
text. Caller-controlled parse/version/shape failures are typed invalid
responses, not uncaught exceptions. The port delegates only to the pure
resolver and has no discovery, transport, persistence, or execution behavior.

The returned `IntentRoutePortResponse@1` contains:

```yaml
protocol_version: intent-route.runtime-port@1
request_id: string | null
disposition: RouteDisposition@1 | null
transport_diagnostic:
  subject: transport | request
  reason_codes: [port.invalid-json | port.unsupported-request-version | port.invalid-request]
  details: [string]
```

Exactly one of `disposition` or `transport_diagnostic` is non-null. Parse
failure uses `port.invalid-json`; a parsed unknown request version uses
`port.unsupported-request-version`; any other request admission failure uses
`port.invalid-request`. Details are stable request-validator reason codes, not
stacks or runtime exception strings.

## `SelectedLocalIntentMapper@1`

The mapper consumes `intent-record.selected-local@1` plus a versioned,
digest-bound mapping profile. It preserves raw intent and source field posture,
maps only declared selectors, reports unmapped fields, and emits unresolved
discriminators for absent source values. It never invents a value.

## `CapabilityRouteCatalogSnapshot@1`

Required: schema version, catalog ID/version, owner reference, effective-state
marker, content digest, and finite routes. Every route has a unique ID,
capability reference, mode, required predicates, exclusions, required inputs,
dominance edges, contract references, and forbidden effect classes.

Catalog validation rejects:

- missing owner or digest;
- duplicate route IDs;
- dominance edges to missing routes;
- self edges or cycles;
- unknown predicate operators;
- non-canonical duplicate keys; and
- mutable handles without frozen content.

## Predicate contract

L0 operators are finite: `equals`, `one-of`, `present`, and `absent`.
Predicates consume typed discriminator values only. Free-text similarity,
embedding distance, model confidence, and repository search are excluded.

## Eligibility trace

For every route, record:

- exclusion checks and their results;
- required predicate checks and their results;
- unresolved material discriminator IDs;
- eligibility posture: `eligible | conditional | rejected`; and
- reason codes.

The complete trace prevents a displayed candidate from hiding rejected or
conditional alternatives.

## Dominance contract

Dominance is a directed acyclic relation declared by the catalog owner.
Only eligible routes participate. Transitive dominance may eliminate a route;
route order and numeric scores may not.

## `RouteDisposition@1`

Required envelope fields:

```yaml
schema_version: intent-route.disposition@1
request_id: string
request_digest: sha256
catalog_id: string
catalog_digest: sha256
kind: candidate | ambiguous | no-match | invalid
authority_effect: none
candidates: [RouteCandidate]
evaluated_routes: [EligibilityTrace]
ambiguity: Ambiguity | null
invalid: InvalidDiagnostic | null
receipt_digest: sha256
```

`candidate` has exactly one candidate. `ambiguous` has either multiple
non-dominated candidates or at least one outcome-sensitive missing
discriminator. `no-match` has zero candidates. `invalid` has zero candidates
and identifies request or catalog as the invalid subject.

## Clarification contract

The builder receives only material discriminator IDs and candidate route
contracts. It chooses the lexicographically first smallest discriminator set
that can separate remaining routes and renders one catalog-owned prompt
template. If no single discriminator separates them, it asks one set-valued
choice question listing stable route labels. It never asks multiple questions
in one disposition.

## Canonical receipt contract

Canonical JSON follows the JSON Canonicalization Scheme profile: valid JSON
values only, no insignificant whitespace, ECMAScript JSON number serialization,
UTF-8 encoding, and recursive property sorting by UTF-16 code units. Contract
sets are sorted by stable ID before encoding; arrays carrying meaning preserve
their declared order. SHA-256 is computed over the canonical UTF-8 bytes and
encoded as lowercase hex. The receipt digest excludes only its own digest
field. Replaying identical canonical inputs must produce byte-identical output
in Node and Chromium.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
