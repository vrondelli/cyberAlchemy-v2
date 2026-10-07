# L1 whole-application vertical — bounded completion record

Date: 2026-09-20. Authority effect: none.
Scope: I00–I07 and L1X of `EXECUTION-DAG.json` review 5.
Outcome: one `application-v1` Alch source deterministically forms, builds,
verifies, compiles and exercises the bounded reference-pack TypeScript
application without author-supplied persistence, messaging or external-API
backend JSON. The full 37-node product goal is not complete.

## Obligation accounting

| Node | Result within L1 | Evidence |
| --- | --- | --- |
| I00 | pass for the bounded combined source | `I00-COMPLETION.md`; Event, Mapping, optional Query, Interface and Operation identities remain typed and distinct. |
| I01 | pass for the closed arrow grammar | `INTEGRATION-GRAMMAR.md`; paths are declarative typed relationships, not control flow. |
| I02 | pass for static persistence lowering | `PERSISTENCE-LOWERING.md`; exact Entity, Query and accepted write-Operation references. |
| I03 | pass for same-source messaging lowering | `MESSAGING-LOWERING.md`; Event, Message, Mapping, channel and Operation identities remain distinct. |
| I04 | pass for inbound/outbound API lowering | `I04-COMPLETION.md`; named public contracts and Mapping v3 consumers remain qualified. |
| I05 | pass for explicit runtime-profile lowering | `RUNTIME-PROFILE-LOWERING.md`; target, runtime, providers, environment references and messaging destination are source-authored. |
| I06 | pass for deterministic graph join | `APPLICATION-JOIN.md`; all partitions and optional Query v2 consumers join through the checked application graph. |
| I07 | pass for the bounded TypeScript vertical | Public file loading derives reference-pack internal contracts, builds and exactly verifies provider artifacts, natively compiles them, observes optional Query zero/one/multiple behavior, kills a compiling cardinality mutant and runs the signed-inbound loopback. |
| L1X | pass as bounded evidence join | This accounting and the validation below; runtime observations are stated separately from static compilation. |

## Author-facing boundary

The application companion selects bindings, interpretation, execution,
evidence and the named runtime profile. It does not contain persistence,
messaging or external-API composition documents. Those internal contracts are
derived from the checked logical declarations and the exact
`domainspec.reference-postgresql16-nats-http/v1-candidate` pack. Partial manual
integration companions reject. Unsupported packs and ambiguous persistence
write-Operation ownership reject rather than selecting a first match.

The failure-continuation binding uses the one explicit persistence
`accepts-writes-from` Operation required by this bounded reference-pack
vertical. This is an L1 restriction, not a claim that all applications have one
global provider-failure outcome.

## Validation

The focused Alch application selection passes **10/10 with no skips** and
strict typecheck passes. It covers safe bounded loading, source and companion
currentness, partial integration rejection, unchanged destinations on failure,
exact build/verify, native compilation, zero-row absence rollback, one-row
commit, two-row `QUERY_CARDINALITY` rollback, a strict-compiling cardinality
mutant that disagrees with the independent public-flow oracle, and signed
inbound invalid/valid observations.

The DomainSpec CLI build passes. Its focused provider application generation,
publication and CLI suite passes **24/24 with no skips**, including TypeScript,
Python and Rust provider generation regressions. Those Python/Rust checks retain
existing backend evidence; L1 completion claims only the TypeScript user
vertical.

PostgreSQL, NATS and outbound HTTP were not contacted. Provider formation,
native compilation, an in-process Operation scenario and the bounded signed
HTTP loopback do not establish durability, delivery, remote interoperability,
deployment readiness or production operation.

## Relevant implementation checkpoint

These hashes identify the bounded L1 evidence increment. They are not the P03
candidate freeze or a complete dependency inventory.

| File | SHA-256 |
| --- | --- |
| `language/.../implementation/src/application-integration-derivation.ts` | `cce2c3c3014b827f228e338b57dd950e68e74c15b63ffaf66fe28e691a60b97b` |
| `language/.../implementation/src/application-file-input.ts` | `87837dbc3079ac0183f3b2a0f18ad1cdb0b61bc13916c17e4430f2680bb7e982` |
| `language/.../implementation/src/application-whole.ts` | `8d9bcf2300c76b7ba4f3a1085ddfc91fddd6eeafebe8e6a0bf81aec47e0dad45` |
| `language/.../implementation/test/application-file-input.test.ts` | `56b48e741195a581a1c66d285e43c7f196ea777bbc339855ec84aa64bd2354a6` |
| `language/.../implementation/test/fixtures/application-whole-fixture.ts` | `b00c94f7291feb129f130c3f1f13780192bdec69c1b9480e81b10973b8d2908b` |
| `craft/.../impl/cli/src/generation/provider-application-v1.ts` | `49089ed9262b2103be2d240aca5f90e06092673b91124559ce5b87d77060ce62` |
| `craft/.../impl/cli/src/system-integration/kernel-v2.ts` | `f8fecd0b25653487ceea7ea1e4da1ed0ebb3dd626e35a88ddb8422388fe42c75` |

## Next construction and authority boundary

C01 is the next product-construction node: unify capability profiles around the
shared parser and normalized model without redefining the language. No product
owner test is requested before L4X. This receipt grants no approval,
publication, release, deployment, provider operation or production authority.

## Open Questions

L2 owns applications with multiple persistence write Operations and any richer
failure-outcome selection surface. C02–C06 retain complete meta-type,
formal-consumer, module/multiple-entry and three-language parity obligations.
