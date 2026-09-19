# API lowering — I04 construction increment

Status: scoped I04 complete; see `I04-COMPLETION.md` for the acceptance audit.
Authority effect: none.
Product lane: construction. Date: 2026-09-17.

The Alch compiler now has `src/application-external-api.ts` beside the existing
messaging and persistence lowerers. It reuses the public DomainSpec
`compileExternalApiCompositionV2` API through `src/domainspec-cli.ts`.
It does not add a domain relationship, interpreter, provider or HTTP runtime.

## Exact companion input

`alchlang.application-external-api/v1-candidate` has exactly these members:

- `source_sha256`: exact authored source bytes.
- `composition`: explicit current DomainSpec external API composition.
- `declarations`: every authored inbound/outbound declaration, each containing
  only its `binding_ref`.
- `external_apis`: every authored logical outbound API alias, mapped to a closed
  pair `{contract_ref, interface_ref}`. The first selects the existing external
  contract; the second selects a declared Alch Interface by source name. Aliases
  cannot shadow domain nodes. A contract is not the domain Interface boundary.
- `contract_refs`: outbound request/result source names mapped explicitly to
  backend payload references. Qualified Interface contracts retain their owner
  and local contract identity; distinct source payloads cannot collapse.
- `schema_version`: the exact version above.

I06's combined graph exposed the earlier conflation of contract identity and
Interface identity. The lowerer now requires both explicitly and checks the kernel
logical boundary against the selected domain Interface while checking contract_ref
against the external contract. An old scalar alias binding rejects; no boundary is
inferred from a request payload or silently substituted. This repairs the candidate
companion binding to the existing DomainSpec distinction; it adds no domain type.

The concise arrows never invent request or response mappers. Both must exist
as Mapping declarations and match the specialized composition. The lowerer
checks authored payload endpoints, operation roles, inbound Operation input and
output types, mapping totality, inbound input-parameter coverage, outbound
consumer selectors, provider/failure consistency and authentication resolution.
The existing backend checks direction, retry safety and observation ceilings.

Output contains the original source composition, compiled composition, source
HTTP routes and a trace. Each route keeps its declaration, binding and protocol
operation identity, method and path. Duplicate method/path pairs reject.
Re-formation compares the complete result against exact source and bindings.
Routes are **intent**, not proof that an HTTP listener exists. Both runtime
observation flags and authority effect remain false/none.

## Same-source executable join

The helper is now wired into domain formation, Rule projection and executable
compilation through an explicit `ApplicationExternalApiContext`. The standalone
formation trace still says payload join `required`; executable compilation
supplies `externalApiJoin` with the exact compiled-domain manifest and source
composition digest. The joined trace binds that result, without changing the
standalone trace into execution evidence. Missing context still rejects.

Next construction work, under the existing approved scope:

I04 acceptance now includes the public-to-Value-Object API Operation request join
and exact historical capsule reconstruction. I05 owns runtime/provider authoring;
I06/I07 own whole-app joins.

## Public Mapping Value Object successor

The selected `public-mapping-value-object-contract.json` references canonical
`maps` and extends only the target ceiling. Its SHA-256 is
`924538cd28276e3076e06c011ce47cbe73c8d232c230ae9d2407f3abf012caf8`.
The predecessor remains unchanged and rejects Value Object targets. Compilation
accepts only exact selected definition bytes and binds the actual digest. The
132-source capsule retains all 131 immediate predecessor sources unchanged.

Alch admits a declared Value Object target without converting the public input
into domain data. TypeScript, Python, Rust and the reconciled Mapping verifier
select the successor. All retain pure field projection, separate from domain
factories, invariant execution, persistence and Operation execution.

Native whole-application tests project zero into Money, whose declared positive
invariant would reject it at construction. All three projections return the
explicit fields; they neither construct Money nor certify its invariant. Strict
TypeScript compilation exposed an unused optional input alias, repaired with
demand-driven input aliases in the public Mapping renderer. Rust compilation
exposed missing explicit optional lifting, now emitted as `Some` where required.
Defaults also preserve the checked optional result type.

The two API-direction registry projections remain covered alongside this native
Value Object projection. A separate same-source native Alch fixture now executes
the complete public request → Value Object Mapping → Operation → public response
path and rejects a substituted Entity input owner. It uses an explicit local
test adapter; no listener, remote provider or production admission is claimed.

## Public runtime consumer closure

The shared `application-graph-v1.ts` runtime binder now preserves Mapping v3
input/result types, including qualified Interface contracts. It recognizes
both provider-operation and protocol-operation body references. The bounded
`compileExternalApiRuntimeBindingsV1` API shares these same rules with full
application graph compilation; it does not assemble a transport.

`application-binding-v1.ts` resolves API payload references as `public-contract`
references to an Interface plus an exact contract fragment. Missing contracts,
wrong owners and input/target identity substitution reject. Domain `data` and
public contracts remain separate reference roles. Canonical and packaged binding
and graph schemas retain this distinction. The current commerce expected fixture
changes only the new reference-kind matrix row and the resulting binding hash;
its source, graph, edges and runtime bindings are unchanged.

| Consumer | Current evidence |
| --- | --- |
| Bounded API join / full application graph | Same runtime rows; exact source and snapshot checks. |
| Application integration binding | Qualified public request/result references resolve without domain records. |
| Operation request binder | Exact mapped result type and parameter coverage; hostile bindings reject. |
| TypeScript whole-app runtime mapping registry | Native compilation and request/response projection, max UInt64 and invalid-value rejection. |
| Python whole-app registry and domain imports | Native public projection, public type imports and invalid-value rejection. |
| Rust whole-app registry and domain imports | Native cargo test executes both projections with max UInt64. |
| Alch same-source executable pipeline | Public ingress -> domain Mapping -> generated Operation -> public response, plus outbound projections. |

The cross-language test found and repaired Rust public-field projection:
Interface structs expose fields, while domain values use generated getters.
The generator now preserves that distinction rather than adding getters or
flattening the public contract. These are focused public-payload cases, not a
claim that all later profile/constructor/verification obligations are complete.

## Backend candidate corrections

The same increment repairs two pre-existing decoder gaps. The v2 candidate's
canonical and packaged schemas now allow empty outbound-contract and outbound
failure-translation arrays. Actual outbound bindings still require exact
referenced records. This permits an inbound-only application without fabricated
outbound intent; it does not remove inbound failure or authentication checks.

Non-null authentication references now must resolve at the exact boundary in
both directions, including webhook endpoints. Previously a missing reference
could bypass the conditional boundary check. Direct backend regressions cover
both corrections. Existing frozen candidate receipts are not refreshed: these
changed bytes are new construction evidence, not a claim about the old freeze.

## Verification and unresolved-work ownership

`test/application-external-api.test.ts` exercises deterministic formation,
non-mutation, exact currentness, named payload distinctions, role and mapper
rejection, provider/auth/retry boundaries, duplicate routes and outbound-only
authoring without invented inbound consumers. It uses the existing backend
fixture through the public adapter and performs no network calls.

`test/system-integration/external-api-runtime-bindings.test.ts` in the backend
compares bounded and full graph joins and rejects identity substitution and
totality drift. `test/generation/public-api-application.test.ts` compiles and
executes the public API projections under all three language profiles. Its
temporary source and generated projects are disposed after the test, including
the Rust target directory. The existing commerce source fixture stays unchanged.

Current run results are in `EXECUTION-STATUS.md`. The remaining-work owner is
I05/I06/I07 in `EXECUTION-DAG.json`; I04 closure is recorded separately. No new
product decision, provider admission or release approval is selected here.
