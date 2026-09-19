---
artifact: invoke-define
status: candidate-complete-design-gated
updatedAt: 2026-07-21
docType: define
owner: DomainSpec-v2 backend-type-test-engine-completeness
invokeMode: define
semanticAuthority: none
dispatchId: 20260721-bte-contract-completeness-rebase
dispatchStep: s02-define
---

# Define: Backend Graph Composability And Test Derivation

## Start Here

This package defines the all-backend proof target for DomainSpec v2. It says
what must exist and what must be proved before the project may claim structural
graph composability and derived-test completeness. It does not choose the
formation-authority repair, design components, schedule implementation, admit a
profile, or promote a release.

Read in this order:

1. this file for the boundary and object model;
2. [REQUIREMENTS.md](REQUIREMENTS.md) for stable proof requirements;
3. [GLOSSARY.md](GLOSSARY.md) for plain-language terms;
4. [the accepted formation decision](decisions/DEC-BTE-FORMATION-AUTHORITY-001.md)
   for the versioned YAML-replacement direction and compatibility rule;
5. [work-pack/shared/GAPS.md](work-pack/shared/GAPS.md) for current residue.

Every Markdown file in this package is explanatory or planning evidence. None
is a semantic source for a DomainSpec graph, node, edge, formation rule,
obligation, test, binding, evaluator, or release claim.

## Goal And Proof Claim

The goal is to make this causal chain explicit, typed, exact-set checked, and
independently replayable for every admitted backend structural obligation:

```text
machine sources
  -> admitted profile and source records
  -> normalized graph
  -> independently specified obligations
  -> generated obligations and tests
  -> unique runtime bindings
  -> independent evaluators and executions
  -> killed mutations
  -> replayable receipts and fail-closed aggregates
  -> independently run consumers
```

The eventual bounded claim is:

> For one explicitly admitted backend profile and its exact versioned source
> set, the DomainSpec v2 compiler rejects malformed formations and relations,
> preserves a canonical graph, derives exactly the independently specified
> structural obligations, binds and executes every generated test without
> skip/todo/orphan residue, kills the selected mutations, and emits receipts
> that an independent replay can join back to every governing source digest.

This claim is structural. It is not business correctness, semantic
satisfiability, implementation conformance, full-language completeness, UI
coverage, production authorization, or release admission.

## Scope

In scope:

- the 13 active backend kinds and their 16 canonical formation criteria;
- current-v1 compatibility and a future successor profile, kept versioned and
  separately admitted;
- selected backend relationship-family planning coverage after owner admission;
- authored node and edge sources, normalized graph, obligation derivation,
  generated tests, runtime bindings, evaluators, execution and mutation results;
- exact-set comparison, receipt replay, fail-closed core/consumer aggregates;
- IOLM and Body War as independent consumers of a green core receipt;
- preservation of the completed `SWU-BTE-001` kernel and `SWU-BTE-003` adapter
  receipts as narrow implementation facts.

Out of scope:

- UI kinds, UI relationships, and FPR-02U progress;
- semantic or business truth beyond an admitted evaluator contract;
- cross-graph SMT/FOL/Cedar/Datalog solving and temporal model checking;
- treating research, audit, Inventory, generated graphs, tests, or receipts as
  language authority;
- implementation work, Task Session selection, release promotion, or changes
  to CyberAlchemy, IOLM, Body War, Craft, or Inventory in this Invoke stage.

## Exact Denominators

The three current counts answer different questions and must never be added,
substituted, or used to promote one another.

| Symbol | Count | Meaning | Current status |
| --- | ---: | --- | --- |
| `D_kind` | 13 | active backend members in `definitions/meta-types/meta-types.yml` | canonical inventory; successor admission still separate |
| `D_form` | 16 | criterion IDs across the 13 backend `*.schema.yml` files | canonical schema inventory; exact compiler parity open |
| `D_rel` | 17 | pure-backend relationship families selected for planning | candidate coverage pending profile/relationship-owner admission |

`D_rel` is the 17 families whose scopes are backend-only (`same-feature` and/or
`cross-feature`): `performs`, `produces`, `produces-for`, `creates`, `triggers-cross`,
`enforces`, `calculates`, `transitions`, `exposes`, `orchestrates`, `applies`,
`maps`, `contains`, `reads`, `emits`, `owns`, and `belongs-to`. The 21
endpoint-pair and 29 endpoint-plus-scope expansions remain derived, unselected
diagnostics. They are not alternative denominators.

## Machine-Source And Evidence Map

| Claim class | Current machine owner | Role in this package |
| --- | --- | --- |
| backend kind inventory | `definitions/meta-types/meta-types.yml` | owns `D_kind` membership and kind-to-criterion-schema references |
| formation criteria | `impl/spec/meta-types/{structural,behavioral,connective,lifecycle}/*.schema.yml` | own `D_form` criterion declarations and required structure |
| current-v1 profile | `definitions/minted-project/supported-profiles.yml` | declares four kinds, three relations, and per-kind JSON formation schemas |
| current-v1 node envelope and bodies | `impl/spec/minted-project/node.schema.json` and `impl/spec/minted-project/formations/*.schema.json` | own current-v1 source shape until explicitly retired by a versioned decision |
| relationship signatures | `definitions/relationships/relationships.yml` | owns registered signatures; does not by itself admit the BTE successor profile |
| consumer node and edge sources | future admitted JSON contracts under consumer projects | authored semantic input; exact layout remains Design/decision work |
| compiler/kernel behavior | `impl/tools/minted-project/compiler.ts`, `impl/tools/lib/meta-type-criteria.ts`, `impl/tools/minted-project/meta-type-body-adapter.ts` | implementation behavior and proof target, not definition authority |
| normalized graph and manifest | generated schema-bound JSON | derived semantic/provenance read models, never source authority |
| obligations, tests, results, mutations, receipts | future schema-bound machine artifacts | derived proof/evidence records with explicit owners and digests |
| audit 002 and Inventory | accepted review and generated lookup projections | constrain claims and locate evidence; never semantic authority |
| this Define package | Markdown | explains intent, requirements, decisions, gaps, and routing only |

The current compiler path proves why the formation owner cannot be guessed:
`SupportedProfile` reads `formation_schemas`, but `validateFormation` consults
only development `formation_contracts` and otherwise invokes the YAML-backed
adapter. The compiler also removes base node-schema violations under `$.body`.
Audit 002 therefore found a JSON-invalid/YAML-valid Entity false green. That is
`GAP-029`, not an authorization to prefer either representation.

## Contract Objects

These are package-local contract roles. Their definitive machine schemas and
field-level design belong to the later Design stage.

| Object | Identity minimum | Responsibility | Must not do |
| --- | --- | --- | --- |
| `Profile` | profile ID, version, source digest | admit exact kinds, formation contracts, relationships, and source layout | widen itself implicitly |
| `Criterion` | criterion ID, schema path, schema digest | state one decidable formation check | hide required structure or invent semantic truth |
| `NodeSource` | node ID, kind, source anchor, content digest | preserve one authored concept and body | be replaced by a generated graph row |
| `EdgeSource` | edge ID, signature, endpoints, source anchor, content digest | preserve one authored relation and its ordering/scope data | infer an unadmitted relationship |
| `Graph` | graph ID, profile/source digests, normalized node/edge sets | provide the canonical normalized derivation input | become authored authority |
| `Obligation` | obligation ID, governing source/criterion/rule IDs and digests | state one deterministic structural claim to check | be defined only by the generator being measured |
| `TestCase` | test ID, obligation ID, fixture/expected-predicate references | make one obligation executable or report typed unsupported residue | invent an expected value or count skip/todo as execution |
| `Binding` | binding ID, typed role, test/fixture/evaluator/runtime digests | join exactly one test role to one runnable target | select arbitrary first matches or accept empty matches |
| `Evaluator` | evaluator ID/version, scope, input/output contracts | independently judge a bounded claim | masquerade as a universal semantic oracle |
| `ExecutionResult` | run/result IDs, test/binding/evaluator digests | record the actual runnable-test outcome | substitute for the test or evaluator contract |
| `MutationResult` | mutant ID, target obligation/criterion/family, run ID | prove the selected negative was rejected/killed | count an unselected or surviving mutant as proof |
| `Receipt` | receipt/run IDs and all upstream identities/digests | join one bounded proof chain and expose residue | grant profile or release admission |
| `AggregateReceipt` | aggregate ID, required-check manifest digest, child receipt IDs | fail closed over exact required core or consumer evidence | pass on empty, missing, stale, duplicate, or extra evidence |

## Required Invariants

1. Every accepted source, derived artifact, test, result, and receipt is bound
   to exact profile and governing-source identities and content digests.
2. Current-v1 and successor profiles have distinct IDs/versions, contracts,
   fixtures, receipts, and admission decisions.
3. A node fails when any contract selected by its admitted formation-authority
   decision rejects it.
4. A graph rejects absent endpoints, invalid endpoint types, unadmitted scope or
   direction, duplicate identities, stale source digests, and lost ordering.
5. The normalized minted graph and source manifest are the canonical inputs to
   BTE derivation; a disconnected Markdown or feature-document path cannot
   establish completeness.
6. The validation owner freezes a nonempty exact `O_spec` independently of the
   generator. Completeness requires:

   ```text
   O_spec = O_gen = T_gen = E_run = M_killed
   ```

   Equality means exact stable IDs, not equal counts.
7. Every required obligation has exactly one role-typed, unique,
   digest-compatible binding and an independent evaluator.
8. `skip`, `todo`, orphan, unrunnable, unsupported-without-residue, missing,
   duplicate, stale, extra, empty, and surviving-mutant states fail the relevant
   completeness aggregate.
9. A receipt preserves source-to-result causality and can be replayed without
   trusting the producer's summary or literal `pass` fields.
10. IOLM and Body War run after core, against exact core handles, using their
    own versioned contracts, runners, receipts, and replay checks. They cannot
    author or upgrade DomainSpec truth.
11. Backend and UI are independent lanes. Neither lane is proof for, or a
    scheduling blocker of, the other.

## Selected Formation Direction And Remaining Proof Blocker

[DEC-BTE-FORMATION-AUTHORITY-001](decisions/DEC-BTE-FORMATION-AUTHORITY-001.md)
accepts Option 2: Design a distinct versioned YAML-owned formation replacement
with explicit JSON-contract retirement and compatibility/migration proof.

The decision unblocks Design only. It does not make the current YAML adapter
authoritative, retire JSON schemas, change current v1 in place, or close
`GAP-029`. Until the replacement is machine-defined, implemented, validated,
and owner-admitted, current v1 stays frozen under its existing declarations and
cannot claim full formation conformance while its JSON schemas are bypassed.

The mandatory false-green negative control is this Entity body:

```json
{"fields":[{"type":7,"identity":"yes"}]}
```

The replacement path must reject it at the compiler boundary and preserve the
reason, governing contracts, migration disposition, and digests in evidence.
No source implementation may proceed before Design defines the machine
replacement and its retirement/migration proof.

## Discovery, Template, And Route Evidence

- Discovery-existence gate: satisfied by the accepted 53-row/12-column audit
  002 package, its corrected 55-entry evidence overlay, the current machine
  sources, and the narrow EVF graph/evidence design.
- Context Builder: the strict deep pack is current and all ten selected source
  hashes still match; its eight obligations remain covered. See
  [DEFINE-CONTEXT.md](DEFINE-CONTEXT.md).
- Inventory: the accepted audit result was resolved through
  `.arcanum/inventory/index.json`; Inventory remains a lookup projection.
- Template: `domainspec-spec` supplied capability, concept, relationship,
  dependency, and consumer checks. Its Markdown-source assumption was rejected
  because this package requires machine authority.
- Structured interview: skipped because the user approved this exact Stage A
  scope. The outcome-changing formation choice was exposed through Decision
  Gate and later resolved by the user's direct Option 2 selection.
- Dispatch: validated route
  `20260721-bte-contract-completeness-rebase`, step `s02-define`; see
  [DEFINE-DISPATCH-TRACE.md](DEFINE-DISPATCH-TRACE.md).
- Distill: Standard local Proposer/Balancer validation passes this definition
  boundary; see [DEFINE-DISTILL-VALIDATION.md](DEFINE-DISTILL-VALIDATION.md).

## Layering Gap

The existing `IMPLEMENTATION-LAYERING.md` predates audit 002. It incorrectly
starts from YAML-owned formation and admitted 16-family relationship breadth.
The later Plan stage must regenerate it so the versioned YAML replacement,
JSON retirement map, and current-v1 migration/compatibility proof precede
successor breadth, while relationship work remains admission-gated. This
Define records the gap; it does not edit implementation layers or expose an
SWU.

## Result And Next Route

Define is complete for its purpose: goal, claim, boundaries, authorities,
denominators, objects, invariants, requirements, and residue are explicit.

The next route is **Invoke Design**. It must materialize Option 2 as proposed
versioned machine contracts and compatibility/migration rules; it cannot admit
or implement them. `DEC-GCP-001` remains local to the optional key-and-door
semantic fixture and does not block the formation-replacement design.
