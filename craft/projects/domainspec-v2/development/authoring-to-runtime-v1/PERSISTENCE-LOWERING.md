# I02 persistence construction

Status: implemented I02 static-lowering candidate, 2026-09-17. Authority effect: none.

Alch `src/application-persistence.ts` now joins authored persistence intent to
the current DomainSpec `PersistenceCompositionV2` through the backend's public
`compilePersistenceCompositionV2` API. `src/domainspec-cli.ts` exposes that
capability with an explicit missing-build diagnostic. No backend schema was
forked and no database or remote provider is contacted.

## Current boundary

The internal companion has closed members: `schema_version` selecting
`alchlang.application-persistence/v1-candidate`, exact `source_sha256`, an
explicit `composition`, and `declarations` keyed by authored persistence name.
Each selection contains exactly `persistence_binding_ref` and
`transaction_binding_ref`. Provider/resource/physical choices are not guessed.
This is an internal construction input, not the final I07 user-facing format.

The existing parser supplies the model. The bridge checks:

- exact authored persistence declaration coverage and source bytes;
- `stores` resolves to an Entity with an explicit identity;
- `serves` resolves to a Query whose source is that Entity;
- write consumers resolve to Operations explicitly writing that Entity;
- exact logical-subject, property and identity-mapping coverage;
- each authored field retains its existing persistence shape;
- a local transaction selects the persistence binding and the same profile,
  and cannot span distinct resources;
- no extra persistence bindings, mappings or transactions hide in the companion.

Query optional/list cardinality and source locations are retained in the trace.
They are not converted into invented `serves` domain edges. The returned files
contain the backend-consumable source composition, a separate compiled snapshot,
and an exact source/input/composition trace. The source file round-trips through
the public backend compiler without dropping compiled-only digest fields.
Currentness recomputes the entire result; rehashing mutated
trace values does not authorize them. Other integration declarations are listed
as deferred, never silently represented as complete.

Domain-only lowering still rejects integrations unless an explicit persistence
context is supplied. With that context, only persistence declarations are
accepted: missing bindings or any messaging/API declarations still reject.
The same unchanged source bytes flow through domain formation, Rule/Query
projection and executable preparation. All three persistence files participate
in formation trace/currentness and interpretation digests. A changed physical
mapping therefore invalidates an old interpretation rather than silently
reusing it. No text stripping or replacement source hash is used.

Executable compilation checks each served Query's actual compiled source and
result cardinality, and each write consumer's selected Entity write slot.
The result retains the persistence artifacts and composition digest separately
from generated domain modules, ready for I06's full integration graph join.
It does not infer a Query call inside an Operation or emit a fictitious edge.

## Evidence

`test/application-persistence.test.ts` exercises real public backend compilation,
determinism, unchanged inputs, wrong declaration roles, field coverage and type
drift, missing/stale inputs, altered cardinality traces, read-only/write-only
consumers and cross-resource transaction rejection. Its provider fixture is
adapted explicitly from the backend's development fixture; it is not an
installed-consumer test or a live PostgreSQL test.

The earlier three-test persistence selection remains historical. The current
suite has four tests, including the same-source domain/Query/write join,
artifact coverage, physical-mapping currentness drift and mixed-integration
rejection. All four pass after the final source/compiled separation change.
The preceding domain/executable/Rule/persistence regression passes 14/14;
integration/combined-domain/persistence passes 13/13. All have zero skips.

## Completion accounting and downstream work

I02's declared static-lowering obligations are covered: exact existing
persistence contract emission, Entity/Query/Operation reference closure,
field/identity shape preservation, explicit local transaction agreement and
trace-bound same-source executable preparation. The compiler uses explicit
internal physical/provider choices, not yet the final user-facing syntax.
I05/I07 own that authored selection path; I06 owns the complete
domain/integration/provider join. No public CLI,
adapter execution, durable commit, migration execution, delivery or approval is
claimed. No product decision was changed by this increment.
