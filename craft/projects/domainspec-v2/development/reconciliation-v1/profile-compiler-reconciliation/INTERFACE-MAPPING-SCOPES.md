# Interface Mapping scope inspection and source decision

Date: 2026-09-09. PCR-06 Interface prerequisite. Inspector: implemented and
verified. Successor source format: option B selected by user `yes` on 2026-09-09.
Authority effect: none. This is internal construction evidence, not user-facing
product documentation or a completed Interface generator.

## Confirmed source defect

The legacy `mappingFieldTypes` function in
`impl/cli/src/input/project-model.ts` combines every Interface operation's
request and result fields into one Map keyed only by `field_id`.
Later entries silently replace earlier entries. Four independent `status`
fields can therefore become one field whose type depends on operation order:

| Member | Request status | Result status |
| --- | --- | --- |
| settle | String | Boolean |
| inspect | Integer | UUID |

An identity Mapping from this Interface's unqualified `status` to an Entity's
UUID identity passes when `inspect` is last. Reversing member order rejects
with `MTCLI_MAPPING_TYPE`. The final test exercises the actual source compiler,
not only a reimplementation of the projection. The legacy parser/generator
remain unchanged; their behavior is evidence to migrate explicitly, not a
successor contract to preserve silently.

## Implemented inspection

`impl/cli/src/input/interface-mapping-scopes.ts` exports
`inspectInterfaceMappingScopes(graph)`. It accepts only registered unchanged
compiled snapshots and reports:

- Each duplicate field name with every distinct member/request/result endpoint,
  full type, required flag, source digest and exact JSON pointer.
- Each legacy Mapping source/target field use pointing into an Interface,
  with either one resolved candidate or all ambiguous candidates.
- Typed Mappings explicitly outside this legacy-field inspection.
- Definition, graph and source-manifest identities and a deterministic report
  digest; owned recursively frozen output and no migration or other effects.

Equal field types do not merge endpoint identities. A unique field candidate
does not prove type compatibility or authorize migration. No new metatype,
canonical graph edge, Entity surrogate, transport adapter or CLI command is
introduced.

[Definition](interface-mapping-scopes-contract.json) SHA-256:
`995555a8db94d8d31c59d096596a8f3c41b698959f7eadb5c6e3336528a53035`.
Ontology: `../ontology/interface-mapping-scopes-candidate.json`.
Both preceded implementation.

## Verification

Final four-file focused run: **28 pass, 0 fail, 0 skip**, **4.27 seconds**.
It includes six scope-inspector tests plus the version policy, existing
project-model and composition-boundary suites. Controls cover source and target
uses, request/result and member distinctions, reordered source, equal types,
required flags, exact source identities, immutability, forged/cloned snapshots,
inert rejected getters, explicitly uninspected typed Mappings, and the actual
legacy compiler's order-sensitive identity Mapping behavior.

Initial fixture tests omitted the feature manifest's node/edge registrations;
the fixture setup was corrected without weakening compiler assertions.
Final source typecheck and frozen checks pass: 39 catalog rows, 31 relationship
signatures, five integration definitions across three languages.

The separate 32-file shared-regression checkpoint including the new version
policy passed **371/371**, zero failures/skips, **274.07 seconds**. That run did
not include the subsequently added scope-inspector test file. Its six tests are
covered by the final focused run above; do not combine overlapping counts into
a fictitious single regression. Temporary dependency symlinks were removed;
cached dependencies and user-owned dependency directories remain intact.

## Remaining work

### Blocking public source-format decision

How should a Mapping identify an Interface's public data contract while
preserving member and request/result distinctions?

**A. Exact member slots.** Bind to a specific member's request or result, for
example `SettlementApi.completeSettlement.result`. This is direct and minimizes
named declarations for one-off endpoints. Reuse across members requires explicit
bindings and compatibility checks; the Mapping must not infer another slot by
matching field names. Choose this when endpoint-local authorship is the primary
model. Source schemas, mapping target resolution and generated descriptors must
carry exact member/side identity.

**B. Named Interface-owned public contracts — recommended.** Declare a public
contract such as `SettlementApi.SettlementResponse`, let several members refer
to it, and let a Mapping target that exact owned contract. This supports reuse
without manufacturing an Entity/Value Object or flattening the Interface.
It adds local contract declarations and name-resolution rules. Choose this when
several operations/queries deliberately share a public shape. Compiler schemas,
type import/name resolution, mapping target checking and migration must preserve
the named owner/contract identity separately from each consuming member/side.

The existing factory already uses `SettlementResponseMap/v1` for both
`completeSettlement` and `findSettlement`, while its native provider returns a
shared `SettlementResponse` (nullable for the query). This supports recommending
B, but the fixture is not authorization to choose a new authored source format.

Both options keep the canonical `Mapping --maps--> Interface` relationship;
the specific contract/slot is an explicit typed binding, not a new DS-D8 verb.
Neither option permits record-wide field flattening or implicit type-based
endpoint selection. Shared domain Value Objects/Enums remain reusable values,
not a reason to represent every boundary contract as an Entity.

Selection: B, named reusable Interface-owned public contracts. Decision source:
the user's `yes`, answering the recommendation on 2026-09-09. Decisions resolved:
one. Remaining source-format blockers: zero. The previous Decision Gate pause
is resolved. Exact definition: [named-interface-contract.json](named-interface-contract.json).
Implementation evidence: [NAMED-INTERFACE.md](NAMED-INTERFACE.md).

Deferred separately: Workflow DEC-08, public CLI entry-point integration,
Python/Rust parity and later PCR stages. Once selected, define the precise typed
source, implement resolution and structural generation, and verify explicit
Mapping reuse and native consumer types before advancing the full CLI ledger.

## Task-session evidence

Request `ds-cli-continuation-20260909-052`; `CA2-ROUTE-IMPLEMENT`.
Route receipt:
`6551c4a8906b88cfb08b33e5b3d3518f37f47e7834704ed0cc3aae5434e95b71`.
Context result:
`e7abeff2eb7aaaa86ff3464e9ff2e94fff995dce8b235f6f9b88878e0b5c400c`.
Eight-file effect assessment:
`4301cfb9603a27f1773ded5ffe0859c3dab838676186b9ea1636662e6d3bad21`.
No extra owner gate references were required for the bounded inspector;
existing user-directed construction authorization applies. Route/effect
receipts grant no implementation or publication authority.

The preceding policy continuation selected this Interface source investigation;
result digest `dbd4afd46fdc678fb3edb5d60f9f46e84e5f0a854f4c80d7c58708cc44908220`.
At the inspector completion boundary, no successor implementation option was
offered before the source-format choice. ARE returned `block` with
`continuation.zero-admissible`; result digest
`8b01b1acac035535050959fa71188ff23d0e111cb0caea1faf0638287fe253c4`.
This reflects the caller's unresolved-choice boundary, not independent proof
that no possible implementation exists.
No automatic source migration, admission, publication, default cutover or
AlchLang reconciliation occurred.
