# Source And Candidate Interface Contracts

Status: Design candidate. Proposed field classes are minimum bindings, not accepted exact schema bytes.

## Existing source contracts

| ID | Owner | Existing contract | Design use |
| --- | --- | --- | --- |
| SC-EVF-OBLIGATION | EVF | `Obligation` in EVF Define/Design | source identity, rule type, source anchor, canonical parameters |
| SC-EVF-EVALUATOR | EVF | `Evaluator` and `Receipt` in EVF Design | temporal evaluator routing, bounded verdict, separated evidence and residue |
| SC-FACTORY-PROVIDER | factory | `FactoryNodeProviderV1` | registered provider ID/version and common semantic result/accounting seam |
| SC-FACTORY-LOCK | factory | `FactoryRunLock/v1` | request, ordered node, provider, tool/input/component, ceiling, and lock identities |
| SC-FACTORY-RECEIPT | factory | `FactorySemanticReceipt/v1` | request/lock digests, run, ordered verified node receipts, accounting, ceilings, authority none |
| SC-FACTORY-VERIFY | factory | verify/replay/reproduce pipelines | current complete-run verification, locked replay, and isolated reproduction evidence |
| SC-TLA-VERDICT | TLA/TLC provider | planned `FactoryNodeSemanticResult/v1` provider output | solver-specific total taxonomy and normalized semantic output; absent today |

## Candidate adapter boundary

### A. Obligation translation contract

Minimum semantic bindings:

- adapter schema/version;
- EVF obligation identity and canonical digest;
- EVF-owned expected evidence meaning or verdict vocabulary reference;
- bounded claim ceiling;
- requested provider ID and version as declared data;
- derived factory request identity/digest;
- `authority_effect: none`.

The adapter maps an already-authored obligation. It cannot invent an expected outcome, repair a model, alter obligation meaning, or silently choose a provider.

### B. Factory lifecycle evidence contract

Minimum semantic bindings:

- factory request digest;
- factory run-lock digest;
- factory semantic-receipt digest and run identity;
- target node identity, provider ID/version, semantic digest, replay digest, and complete accounting;
- factory-owned verification/currentness/replay binding;
- receipt and node claim ceilings;
- `authority_effect: none`.

The semantic receipt alone does not prove that the bytes now being consumed are a current, complete, verified run root. The exact verification/currentness handle is a factory/EVF owner gate; this Design does not invent its representation.

### C. Provider semantic verdict contract

Minimum semantic bindings:

- provider-owned total solver-result class;
- normalized semantic output or counterexample evidence;
- declared/passed positive denominator;
- declared/killed mutant denominator;
- provider claim ceiling;
- exact case/property/expected-result match for expected-red evidence.

The adapter may translate a recognized provider result into EVF's temporal evaluator vocabulary. It may not reinterpret fatal, incomplete, timeout, signal, missing-marker, wrong-property, unknown-taxonomy, or unexpected-red results as pass.

### D. EVF evidence handle contract

Minimum semantic bindings:

- all A/B/C identities needed to reproduce the join;
- one EVF-owned bounded verdict and residue set;
- the narrowest of obligation, provider-node, and factory-run claim ceilings;
- immutable handle identity/digest;
- `authority_effect: none`.

EVF owns the consumer-facing meaning and exact output schema. The adapter does not create release, ontology, promotion, deployment, or implementation-conformance authority.

## Owner gates

| Gate | Accountable role | Required acceptance |
| --- | --- | --- |
| OG-EVF-SCHEMA | EVF contract owner | exact input/output schema bytes, version, result mapping, and negative fixtures |
| OG-FACTORY-VERIFY | architecture-conformance factory owner | exact verified/current factory evidence handle and request/receipt bindings |
| OG-PROVIDER-TAXONOMY | TLA/TLC provider owner | exact total result taxonomy and provider version compatibility |
| OG-ROLE-ASSIGNMENT | DomainSpec primary owner | role-to-person assignments and any second-approval requirement |

No gate is satisfied by this candidate.
