# I00 bounded domain prerequisites — completion evidence

Date: 2026-09-17. Status: tested construction candidate. Authority effect: none.
This closes I00 only, not L1, installed qualification or the full goal.

## Obligation accounting

| Obligation | Current evidence | Result |
| --- | --- | --- |
| Event occurrence identity/version/time policy | `application-event.test.ts` historical focused evidence; combined fixture emits generated-clock occurrence with exact identity/version. | Implemented; bounded field subset. |
| Explicit multi-input Mapping | `application-mapping.test.ts`, three tests freshly pass; no inferred calculation or factory. | Pass |
| FindOrder Query and result cardinality | `application-query.test.ts`, seven freshly pass; explicit Rule projection, zero/one/multiple outcomes and currentness. | Pass |
| Operation effects | `application-effects.test.ts`, two freshly pass; writes/Event batch, rejection and uncertainty distinct from delivery. | Pass |
| Public request/response identity | `application-interface.test.ts`, four freshly pass; Interface local payloads remain distinct, hostile bindings reject, exact version policy. | Pass |
| Qualified public Mapping | Same suite: request-to-Entity and Entity-to-public response lower through existing v3; exact contract/ontology/target identity; native projection and hostile input checks. | Pass |
| Combined vertical | `application-domain-vertical.test.ts`, two freshly pass after final edit. Public request normalization/mapping → explicit caller Mapping → keyed Query adapter → Operation/Event commit → actual committed result mapped to public response. | Pass for test-adapter composition |
| Compiler buildability | Alch `npm run typecheck` passes after bridge changes; five review diagnostics repaired. | Pass |
| Predecessor regression | Query/Mapping/effects/source/integration/domain-lowering selection: 27/27 pass, zero skips. | Pass |

The combined test covers success, missing/duplicate reads, guard failure,
malformed Event, rejected commit and uncertain commit. It retains maximum UInt64
identity, unchanged caller inputs, immutable outputs and source/graph trace.
Response mapping consumes `outcome.value` only after a committed outcome.

## Implementation

Alch `ApplicationType` has an explicit qualified public-contract case. The
Interface normalizer resolves local public references. Domain and public type
validation remain separate; public payloads are not fabricated Entities.
The Mapping lowerer resolves ontology-field paths through either domain data
or an Interface contract, preserving the qualified payload identity.

Public Mapping uses existing `domainspec.typed-mapping/v3`; domain-only Mapping
retains v2. A public target's canonical `maps` edge selects the owning Interface.
The backend v3 restriction to Entity or public-contract targets remains intact.
Mappings are pure projections, not Entity construction or operation execution.
`use` and `target_use` are explicitly null: no Interface member association is
inferred from matching shapes. I04 must bind endpoint/member associations.

## Exact changed source snapshot

Paths are under the sibling Alch implementation directory. These are observed
bytes, not a release freeze or a refresh of the historical L0 receipt.

| Path | SHA-256 |
| --- | --- |
| `src/application-source.ts` | `e6ed940a2233bddc6ff4520eeef8e05fee64208e7f05bc2923d6dec2929db2ac` |
| `src/application-interface.ts` | `1f14b8d4d808f29b04a2e1811ef3d72ed9faf453e66d188126aa66052cfb0b73` |
| `src/application-domain-lowering.ts` | `ab189a3dc4d6ed521cee8ef665696383f5799839b122179d80c3f89f373816e6` |
| `test/application-interface.test.ts` | `7a5b1529471460d2e92ea0f8c22dbc33df570146904626de28a84f05154b6f0b` |
| `test/application-domain-vertical.test.ts` | `38e80db2bebfb77b8c08260bb4058262ea8e655cc0fb3e4c805ba0036393afdd` |

## Remaining scope and next frontier

I02 persistence, I03 messaging and I04 APIs now have their I00/I01 prerequisites.
I05 generic runtime/provider lowering remains independently ready. The compiler
still rejects integration-bearing formation until the integration join exists.
No bypass was added. I06/I07 retain optional Query public-verifier compatibility,
source-driven execution bindings, safe CLI output and the actual application
scenario. C02 owns full constructor/meta-type breadth; C05 owns three-target
application parity. No generated workflow, durable provider, delivery, EVF,
approval, profile admission, publication or deployment is established here.
