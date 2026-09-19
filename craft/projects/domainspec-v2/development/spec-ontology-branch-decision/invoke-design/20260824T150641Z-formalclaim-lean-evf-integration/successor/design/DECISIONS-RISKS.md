# Decisions, Risks, and Residue — FormalClaim Lean/EVF @3

## Decisions

| ID | Decision | Reason | Status |
| --- | --- | --- | --- |
| D01 | Supersede unaccepted @2 with one combined @3 candidate before acceptance. | Avoid accepting FOL bytes and immediately invalidating their acceptance with Lean changes. | candidate |
| D02 | Make FormalClaim explicitly multi-formalism. | FOL is useful but cannot canonically express every dependent/category/temporal claim without loss. | candidate |
| D03 | Separate the Lean source proposition from theorem declaration/proof evidence. | A successful proof cannot become co-canonical meaning. | candidate |
| D04 | Support native Lean and translated-to-Lean bindings. | Native DTT/category claims should not be forced through FOL; translations need governed semantic mappings. | candidate |
| D05 | Require environment-bound proposition identity. | Pretty text, theorem name, and path-only identity are unstable and ambiguous. | candidate |
| D06 | Admit category theory only through explicit local model profiles. | Typed arrows do not establish category laws or global DomainSpec structure. | candidate |
| D07 | Treat type theory as Lean's foundation and DS-D8 typing as distinct. | Prevent conceptual collision between proof foundation and graph endpoint validation. | candidate |
| D08 | Add a separate Lean EVF provider family. | Graph-law Datalog/Alloy and SMT meanings do not match theorem checking. | candidate |
| D09 | Use four Lean outcomes and classify build failure as unresolved. | Tool failure is not evidence that the proposition is false. | candidate |
| D10 | Fail closed on `sorry`, unexpected axioms, unsafe declarations, stale identities, and ceiling inflation. | Proof confidence is bounded by the exact checker environment and trust boundary. | candidate |
| D11 | Keep theorem evidence separate from runtime conformance. | Formal structures do not prove parser, deployment, mediation, or empirical fidelity. | candidate |
| D12 | Treat research as upstream candidate input only. | Research records do not supply proof or ontology authority. | candidate |
| D13 | Preserve `ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning`. | It matches the existing candidate authority direction and owner split. | candidate |

## Risks

| ID | Risk | Guardrail | Future owner |
| --- | --- | --- | --- |
| R01 | A theorem declaration becomes the source claim. | Source proposition identity lives in FormalClaim; declaration identity lives only in request/receipt. | formal-claims owner |
| R02 | Translation silently changes meaning. | Exact mapping, loss class, direction, assumptions, and separate owner acceptance. | formalization bridge owner |
| R03 | FOL becomes mandatory for every claim. | Native Lean path and one-profile-per-claim rule. | formal-language profile owner |
| R04 | Category terminology inflates a typed graph. | Complete category admission profile plus collapse-test and counterexamples. | category-model owner |
| R05 | Stale build proves current bytes. | Raw toolchain/dependency/source/import/type digests and currentness replay. | Lean provider owner |
| R06 | `sorry` or axioms hide proof gaps. | Explicit audit policy and fail-closed receipt. | Lean provider owner |
| R07 | Build failure is called a refutation. | Total outcome normalization forces unresolved. | EVF evaluator owner |
| R08 | Graph receipt is extended by enum only. | New Lean request/manifest/receipt family; existing schema unchanged. | EVF owner |
| R09 | Theorem is reported as runtime correctness. | Independent runtime-conformance binding and negative fixture. | conformance owner |
| R10 | Existing theorem files are described as an admitted provider. | Capability-state table distinguishes substrate, design, implementation, admission, and run. | parent reviewer |
| R11 | Proof self-discharges or promotes. | Separate lifecycle owner decision and authority-none receipts. | obligation/authority owners |
| R12 | Research analogy is treated as proof. | Research-input tag and exact Lean proof/request receipt requirement. | research/formal-claims owners |

## Residue

- No @3 contract schema, validator, fixture, adapter, provider registration, or
  runtime-conformance implementation exists from this Design.
- No Lean build or theorem inspection ran.
- Existing Lean files are selected source substrate only; their current staging
  and claim ceilings remain unchanged.
- No claim is made that DomainSpec globally forms a category.
- The exact normalization algorithm for a stable Lean proposition identity
  remains a Plan/implementation design obligation; this Design states its
  required inputs and non-path-only invariant.
- Owner acceptance and Victor Boscaro's independent verification remain open.
