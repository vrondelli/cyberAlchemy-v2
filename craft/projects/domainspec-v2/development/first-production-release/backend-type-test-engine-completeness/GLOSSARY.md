---
artifact: invoke-glossary
status: explanatory-candidate
updatedAt: 2026-07-21
owner: DomainSpec-v2 backend-type-test-engine-completeness
semanticAuthority: none
---

# Glossary: Backend Graph Composability And Test Derivation

These explanations help humans read the Define package. They do not create or
promote canonical DomainSpec vocabulary. If this file and a cited machine
source disagree, the machine source wins and the discrepancy becomes a gap.

| Term | Plain-language meaning | Status | Machine/evidence anchor |
| --- | --- | --- | --- |
| machine source | A versioned file whose owning lifecycle is allowed to state the specific machine claim: for example a YAML kind/criterion registry, JSON source schema, code contract, accepted decision, or receipt schema. | linked | source map in `DEFINE.md` |
| profile | The versioned admission contract that says which kinds, formation contracts, relationships, and source layout may be compiled together. | linked/current-v1; successor pending | `definitions/minted-project/supported-profiles.yml` |
| kind | A typed category of DomainSpec node, such as Entity, Rule, or Workflow. | linked | `definitions/meta-types/meta-types.yml` |
| backend kind | One of the 13 active non-UI members in the current DS-D1 backend inventory. | linked | `definitions/meta-types/meta-types.yml` |
| criterion | One named, decidable formation check declared inside a kind's YAML schema, such as `identity` or `writes_state`. | linked | `impl/spec/meta-types/**/*.schema.yml` |
| required structure | The literal table/section shape a kind must supply before its criteria can be meaningfully checked. It is distinct from the criteria themselves. | linked but not compiler-complete | same 13 YAML schemas; audit `GAP-006` |
| formation contract | The admitted machine rule(s) that determine whether a node body is a valid instance of its declared kind. | Option 2 direction accepted; machine replacement/admission pending | `supported-profiles.yml`, `node.schema.json`, formation JSON schemas, YAML criteria; `GAP-029` |
| formation authority | The owner-approved rule deciding which formation contracts govern a profile version and how conflicts are handled. | decision resolved; versioned machine materialization pending | `DEC-BTE-FORMATION-AUTHORITY-001` |
| relationship signature | A named typed edge contract with source/target kinds, direction, scope, multiplicity, semantics, and validation obligations. | linked | `definitions/relationships/relationships.yml` |
| relationship family | One signature ID treated as one planning row even when it allows several endpoint or scope variants. | planning term | 16-family candidate set in `DEFINE.md` |
| denominator | The exact versioned set against which “all” is measured. A count without the member identities is not a denominator. | package-local proof term | `REQUIREMENTS.md` acceptance equation |
| `D_kind` | The exact 13-member backend kind inventory. | canonical inventory | `definitions/meta-types/meta-types.yml` |
| `D_form` | The exact 16 kind-scoped criterion identities across the 13 backend schemas. | canonical schema inventory | `impl/spec/meta-types/**/*.schema.yml` |
| `D_rel` | The 16 pure-backend relationship families selected for BTE planning. It is not admitted successor authority yet. | candidate/admission-blocked | relationship YAML plus audit `GAP-004` |
| node source | One authored machine record containing a stable node ID, kind, intent/body, source anchor, and digest. | current-v1 linked; successor design pending | `impl/spec/minted-project/node.schema.json` |
| edge source | One authored machine record containing a stable edge ID, relationship signature, endpoints, scope/order data, source anchor, and digest. | successor design pending | audit `GAP-012`; later Design |
| graph | A deterministic normalized set of admitted nodes and edges, bound to exact sources and profile/registry digests. It is derived, not authored authority. | current narrow shape; successor work open | `impl/spec/minted-project/graph.schema.json` |
| graph composability | The bounded property that independently authored, admitted graph fragments can be combined while preserving valid endpoint typing, identity, scope/direction/order, provenance, and the causal effects selected for proof. | target claim, not yet proved broadly | `DEFINE.md` invariants; audit `GAP-012`–`GAP-016` |
| source manifest | A generated provenance view that lists the exact source inputs and digests used to build a graph. | derived read model | `impl/spec/minted-project/source-manifest.schema.json` |
| obligation | One stable machine-addressable claim that the admitted graph and governing rule/criterion require the test engine to check. | candidate contract | EVF design evidence; later BTE Design |
| `O_spec` | The nonempty exact obligation set frozen by a validation owner independent of the generator. | required, missing | audit `GAP-017` |
| `O_gen` | The exact obligations produced by the derivation engine from the canonical graph and governing contracts. | current path incomplete | audit `GAP-016`, `GAP-017` |
| test case | An executable check derived from exactly one required obligation, with a fixture and bounded expected predicate or explicit blocking residue. | candidate contract | EVF design evidence; audit `GAP-019` |
| `T_gen` | The exact generated test set corresponding to the required generated obligations. | required, missing breadth | acceptance equation |
| binding | A typed, unique, digest-bound bridge from a test role to its fixture, adapter, evaluator, and runtime target. | current implementation underfit | audit `GAP-018` |
| evaluator | An independent checker for one explicit scope: structural, local, graph, temporal, or semantic. It returns a bounded verdict and evidence. | interface family; breadth missing | audit `GAP-021` |
| execution result | The raw outcome of running a test through its selected binding and evaluator, including the exact run and input identities. | required contract | later Design; audit `GAP-022` |
| `E_run` | The exact set of required test identities that actually executed successfully enough to receive a bounded evaluator verdict. | required, missing breadth | acceptance equation |
| mutant | A stable, deliberate defect inserted into one selected criterion, obligation, or relationship effect to prove the corresponding test rejects it. | required negative proof | audit `GAP-024` |
| `M_killed` | The exact required obligation identities whose selected mutants executed and were rejected. | required, missing breadth | acceptance equation |
| residue | A typed fact that prevents a broader claim, such as unsupported scope, missing formal predicate, skip, todo, orphan, stale binding, or surviving mutant. | linked concept; fail-closed use required | engine residue package; `REQUIREMENTS.md` |
| receipt | An append-only evidence record joining exact upstream identities/digests to a bounded verdict, evidence, and residue. A receipt cannot admit a profile or release. | current narrow forms; complete chain missing | `impl/spec/minted-project/build-receipt.schema.json`; audit `GAP-022` |
| replay | Independent recomputation of source digests, identity joins, exact sets, required checks, and verdict scope without trusting the receipt producer's summary. | required, incomplete | audit `GAP-022` |
| aggregate receipt | A fail-closed receipt that proves an exact required-check manifest and exact child receipts were present, current, nonempty, nonduplicated, and replayed. | required, missing | audit `GAP-023` |
| core proof | The DomainSpec-owned structural result through sources, compiler, graph, obligations, tests, bindings, evaluators, execution, mutations, receipts, and replay. | target, blocked | future `verify:bte:core` |
| consumer proof | A fresh independent run by an application against an exact green core handle, proving it can consume the result without authoring core truth. | target, blocked after core | IOLM and Body War requirements |
| IOLM | Interactive Ontology Learning Map, a downstream proof consumer that must independently check graph/hierarchy/table parity and provenance. | consumer, not authority | `cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/` |
| Body War | A downstream application consumer that still needs a machine contract, schema, runner, receipt, and replay lane. | consumer, not authority | audit `GAP-027` |
| exact-set equality | Equality of stable member identities and governing versions/digests, not merely equality of counts. | required proof rule | `REQUIREMENTS.md` acceptance equation |
| false green | A passing compiler, test, or aggregate result that omits or bypasses a governing contract. | observed current-v1 risk | audit `GAP-029` |
| admission | An explicit owner action that makes a versioned profile, relationship scope, or release claim valid for use. Evidence alone does not perform it. | lifecycle term | supported-profile authority metadata and owner decisions |

## Everyday Reading Of The Chain

- A **node** says “this concept exists and has this kind and body.”
- An **edge** says “these two concepts are related in this admitted way.”
- The **graph** is the compiler's normalized picture of those nodes and edges.
- An **obligation** says “because this graph and rule exist, this exact thing
  must be checked.”
- A **test case** makes that obligation runnable.
- A **binding** says exactly where and how to run it.
- An **evaluator** judges only the kind of claim it owns.
- An **execution result** says what actually happened.
- A **mutant** proves the test notices a deliberate defect.
- A **receipt** connects the result back to every source and governing contract.
- **Replay** checks that connection without trusting the original producer.
- An **aggregate** fails if any required link is absent, stale, empty, skipped,
  duplicated, or contradicted.
