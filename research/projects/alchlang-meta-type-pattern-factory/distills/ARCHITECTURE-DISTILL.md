# Architecture distill

## The central separation

```text
authoring syntax
  -> static frontend decoder
  -> profile-bound semantic carrier
  -> DomainSpec instance formation + relationship closure
  -> target-neutral compilation graph
  -> realization and pattern planning
  -> isolated generated sources
  -> DomainSpec factory proof DAG
  -> construction binding + conformance evidence
  -> optional separately authorized runtime observation
```

The new capability is a **profile resolver and projection compiler**, not a
TypeScript meta-type class hierarchy. Source factories remain frontend syntax,
not admission or realization providers.

## What belongs where

| Concern | Owner abstraction | Example |
|---|---|---|
| Kind of domain meaning | DomainSpec meta-type | `DS-D1.4 Operation` |
| Human/programmatic notation | AlchLang frontend profile | Markdown or static TypeScript arrows |
| Typed semantic instance | AlchLang carrier + DomainSpec projection | `ReleaseCredit` bound to `DS-D1.4` |
| Target-language form | realization provider | Operation TypeScript arrow subset |
| Infrastructure responsibility | system-integration binding | repository, transaction guarantee, failure outcome |
| Reusable composition | architecture pattern | transactional Outbox over Operation + Event + bindings |
| Concrete behavior | runtime provider | SQLite store/dispatcher |
| Confidence | evidence graph | generator, conformance, hostile and replay receipts |

## Invariants

1. Source factories never grant meta-type admission.
2. Frontends never execute authored TypeScript during compilation.
3. Every carrier node records its exact DomainSpec meta-type reference.
4. Profiles pin exact IDs and digests; no mutable-current lookup after
   resolution.
5. A source file may expand to many nodes, but each canonical instantiation and
   factory proof input remains isolated and explicitly named.
6. Realization providers are explicitly registered; ambient discovery is
   forbidden.
7. Patterns compose meta-types; a pattern is not promoted into a meta-type just
   because it generates code.
8. `effect` and `performs` are semantic relationships or pattern bindings until
   a separate DomainSpec admission says otherwise.
9. Technical availability, owner stability, provider selection, runtime
   observation, and execution authority are separate dimensions.
10. Adding a meta-type must not require changing the generic factory executor.

## Required carrier revision

Carrier v3 should add, for every semantic node:

- `domainspec_meta_type_ref` with baseline ID, baseline digest, and meta-type ID;
- `source_span` and frontend profile reference;
- closed body-schema version;
- typed relationship instances with canonical signature IDs;
- an explicit distinction between semantic expression AST and generated target
  source;
- pattern bindings and their exact catalog/profile refs;
- construction authority ceiling.

The carrier must remain target-neutral and must not contain executable source
strings.

## Factory bridge

The DomainSpec proof factory should remain downstream of semantic compilation.
AlchLang produces a deterministic `FactoryProjectionManifest` containing:

- one instantiation item per semantic node;
- one generated realization source input per selected target row;
- one direct-proof node per realization provider;
- join-proof nodes for relationship and pattern closure;
- exact source, provider, tool, component, and dependency identities;
- expected artifact and evidence digests.

This preserves the existing factory model instead of teaching the factory to
parse Markdown or TypeScript authoring syntax.
