---
title: Current implementation review and remaining execution DAG
date: 2026-09-17
status: reviewed-planning-candidate
authority_effect: none
---

# Current implementation and next work

This is the current scheduling review, superseding earlier next-step prose, not
historical receipts. It reviews the working tree, including unfinished changes.
No implementation was changed in this review. The canonical graph remains
[EXECUTION-DAG.json](EXECUTION-DAG.json); its human view is
[IMPLEMENTATION-DAG.md](IMPLEMENTATION-DAG.md).

## Outcome

The backend must not be restarted. The remaining work connects the target
Alch authoring model to existing DomainSpec contracts, then qualifies that
complete path. The immediate frontier is an unfinished public-contract bridge.

Nine nodes retain scoped historical completion evidence: B00, S01–S06, L0X
and I01. Twenty-eight nodes remain, including partial I00 and the O01 support
task. This is an obligation count, not a time estimate or percentage complete.
The current working tree is **not buildable**: fresh Alch typechecking fails.
Historical L0 completion does not certify these later modified bytes.

## Fresh evidence

Sources below are relative to:

- Alch: sibling `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation`.
- DomainSpec: this project's `impl/cli`.

| Surface | Current finding | Evidence / consequence |
| --- | --- | --- |
| Domain vertical | Keyed optional Query, explicit Mapping, Operation writes and Event intents execute in a native test adapter. | Alch `test/application-domain-vertical.test.ts`, two passing tests. Not generated provider/workflow composition. |
| Interface | Named request/result contracts lower and generated public values execute. | Alch `application-interface.ts`, Interface branch in `application-domain-lowering.ts`, three passing Interface tests. No HTTP endpoint execution claimed. |
| Public Mapping | Incomplete. The normalized model accepts qualified public types, but the lowerer still emits only `typed-mapping/v2` and requires Entity/Value Object targets. | Alch `application-source.ts` versus `application-domain-lowering.ts:56–60,163–190`. Backend `typed-backend/mapping-public.ts` already supplies v3 and qualified contract identity. |
| Integration arrows | Grammar exists; integration-bearing domain lowering explicitly rejects. | Alch `application-integration.test.ts` seven passing tests; `APPLICATION_INTEGRATION_LOWERING_REQUIRED` in domain lowering. I01 is not I02–I06 completion. |
| Runtime/provider authoring | Target generic authoring-to-provider join remains missing. | Existing backend `whole-application.ts` exports provider and application contracts; this does not complete Alch I05. |
| Public user flow | Target executable preparation still consumes explicit interpretation and execution-selection objects. | Alch `application-executable.ts`; CLI has separate historical profile paths rather than a completed target application-v1 flow. I07 remains required. |
| Optional Query verification | Generation/native tests exist, but the inspected TS Query observer rejects a top-level null. | DomainSpec `verification/reconciled-query-runner.ts`, `observe` root guard. Valid absence must be observed under the v2 protocol before I07 verification can pass. |
| Full language | Application type union is a bounded subset; it does not yet contain sum. Application declaration union omits Calculation, Policy, Workflow and State Machine. | Alch `application-source.ts`; C02/C03 own complete authoring and consumer coverage, not a backend rewrite. |

Fresh commands from the Alch implementation directory:

1. `npm run typecheck`: **FAIL**, five diagnostics:
   - `application-domain-lowering.ts:60`: qualified public type is not handled before reading `element`.
   - `application-interface.ts:60`: recursive public type normalization is not type-safe.
   - `application-source.ts:282`: domain/public recursive type union mismatch.
   - `application-source.ts:311`: Mapping target field union is not narrowed.
   - `application-interface.test.ts:54`: mutation fixture indexes an insufficiently typed file map.
2. `node scripts/run-toolchain.mjs tsx --test test/application-interface.test.ts test/application-domain-vertical.test.ts test/application-integration.test.ts`: **12/12 pass**, zero skips.
3. `node scripts/run-toolchain.mjs tsx --test test/application-query.test.ts test/application-mapping.test.ts test/application-effects.test.ts`: **12/12 pass**, zero skips.

These 24 focused tests do not typecheck the compiler sources and do not cover
qualified public Mapping execution. Their native generated-output checks do
not discharge the five compiler-source diagnostics. No full repository,
three-language application, installed-consumer or remote-provider run was made.

## Immediate DAG: finish I00, then join integrations

The following labels are work steps inside existing nodes, not additional
canonical node IDs or a competing graph.

```text
I00: repair public-type handling and five typecheck errors
  -> lower qualified public Mapping through existing v3
  -> test both request-to-domain and domain-to-response projections
  -> extend combined domain fixture and close I00
       + I01 (grammar already complete)
       -> I02 persistence -------------------+
       -> I03 publication/subscription ------+-> I06 exact graph/protocol join
       -> I04 inbound/outbound APIs ---------+             |
I05 generic runtime/provider profile --------+             v
                                                 I07 public CLI + verify
                                                 + native local scenario
                                                          |
                                                         L1X
```

I05 is dependency-ready independently. Repair the shared build first before
concurrent edits to that model; parallel eligibility does not require agents.
I07 authoring-contract design can be prepared early, but its implementation
and completion still depend on I06. Do not infer business behavior to avoid
explicit authoring, and do not introduce imperative operation bodies.

| Node | Exact remaining output | Exit check |
| --- | --- | --- |
| I00 | Public Mapping v3 bridge with qualified contract identity, exact ontology paths and maps target owner; named Interface contracts in combined fixture. | Five diagnostics gone; native request → explicit Mapping → domain action → explicit response Mapping; wrong contract/field/type/coverage rejects; inputs unchanged; no factory or delivery claim. Explicit member association or null remains distinct. |
| I02 | Existing persistence contracts emitted from stores/serves/write references. | Entity/Query/Operation target-role validation; optional query absence and duplicate behavior retained; no invented edges or provider inference. |
| I03 | Existing Message, channel, publication and subscription contracts. | Event/Message identities separate; Mapping input/output compatibility; exact legal relationships; failure/acknowledgement behavior remains explicit. |
| I04 | Existing inbound/outbound contracts with public request/result mappings. | Exact Interface member associations, Operation shape and public payload compatibility; malformed bindings reject; no credentials or business logic in endpoint definitions. |
| I05 | Generic target/runtime/provider/environment selection. | Exact provider contract, missing or conflicting selections reject, secret references only, no ARE-specific dependency. |
| I06 | Joined domain/integration/provider graph and protocol-consumer inventory. | Exact source currentness, cross-partition references and deterministic output. Identify every optional Query consumer before I07. |
| I07 | Public application-v1 CLI/API derives internal contracts from explicit author inputs; TS optional-query verifier support; one generated application scenario. | Actual public verify accepts valid absent/single optional results, detects duplicates and semantic mutants; safe companion loading; failed/stale builds leave destination unchanged; no test-only manual composition. |
| L1X | Joined one-source TS evidence. | Compile, verify and bounded local run are separately evidenced; no claim that emission proves delivery. |

## Remaining layers

| Layer / decision | Dependency chain | Required evidence and deferral |
| --- | --- | --- |
| L1: can one authored application actually work? | Above DAG | One complete TS application first. Full language breadth deferred. |
| L2: is the promised language coherent across targets? | L1X → C01 → {C02,C03,C04} → C05 → C06 → L2X | Shared profile/model; 13 meta-types and constructors; declared Rule consumers; modules/multiple entries; 39 domain cells **plus** three-target integration scenarios. Optional-query verifier parity is included. TS/Python/Rust, not Kotlin. |
| L3: do formal and runtime observations preserve meaning? | L2X → E01 → E02 → E03; L2X → E04; {E03,E04} → E05 → L3X | Verification authoring, exact FormalClaim projection, EVF outcomes, separate commit/acceptance/delivery/completion evidence, non-collapse/orthogonality/mutation/currentness. No inferred proof or authority. |
| L4: can a clean consumer reproduce the candidate? | L3X → P01; {P01,O01} → P02 → P03 → P04 → P05 → L4X | Package allowlists/docs, three installed flows, exact successor freeze, D65 binding candidate, independent review, product-review handoff. Publication/deployment/production remain separate. |

This follows the implementation-layering boundary: minimum useful application
before breadth, evidence closure before release-candidate qualification. Prior
identity, explicit cardinality, immutable input, source-currentness and
effect-separation guarantees must survive every layer. The main costs are
consumer compatibility at L1, native parity at L2, evidence joins at L3 and
clean installation at L4; avoid full applications for pure parser edits.

## Operational lane

O01 belongs to the implementation/toolchain maintainer and affects only P02.
Its current host/container diagnosis must be refreshed before repair. It does
not gate runnable I00/I05 work. No remote providers, credentials, publication,
release, deployment or broad test cleanup is authorized by this review.

## Review of the plan

Disposition: suitable planning candidate **with a failing-build prerequisite**,
not a claim of current readiness. This is primary-agent self-review, not P05.

| Review check | Result |
| --- | --- |
| Starts at current code, not stale status prose | Corrected: Interface exists; public Mapping and typecheck are incomplete. |
| Avoids declaring grammar executable | I02–I06 remain required; lowering rejection retained. |
| Avoids deferring a prerequisite until after its consumer | Corrected: optional Query verifier compatibility is explicit in I06/I07, with later cross-target closure at C05. |
| Avoids recreating backend semantics | Existing Interface/public Mapping/persistence/messaging/API/provider contracts are reused. |
| Preserves product decisions | Declarative graphs, explicit mappings/inputs, Rule-to-claim linkage and separate runtime/verification choices retained. |
| Preserves bounded verification cost | Focused changed-boundary checks, layer-level integration joins, installed checks at P02. Tests are classified by obligation, not removed because they are numerous. |
| Separates status from history | Nine historical scoped completions retained; no digest refresh or green current-build claim. |
| Covers all remaining work | All 37 canonical node IDs retained; 28 outstanding obligations, no dropped layer or delivery scope. |
| Independent review | Not performed here; P05 remains required against frozen candidate bytes. |

No new product decision is selected. Stop future implementation only for a
concrete conflict with existing product semantics, an unrepresentable canonical
relationship or a separately authorized effect. This review does not grant
product approval, profile admission, operational authority or release.

Plan validation: `python3 validate_dag.py` passes revision 4 (37 nodes, five
layers, one root, one terminal, acyclic). A separate comparison confirms all
46 Mermaid edges equal the JSON dependencies. Dependency-ready nodes are I00
and I05 in construction, O01 in support. The planning directory is untracked;
no commit or publication is claimed.
