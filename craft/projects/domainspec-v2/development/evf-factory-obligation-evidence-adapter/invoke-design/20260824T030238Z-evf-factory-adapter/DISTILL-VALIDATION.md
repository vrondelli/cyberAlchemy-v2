# Distill Design-Unit Validation

- Target context: one separately owned EVF-to-factory obligation/evidence adapter Design
- Objective/output: smallest coherent architecture contract that binds an exact EVF obligation to verified factory/provider evidence without owner collapse
- Mode/budget: `standard`; one proposal track, two rounds, one reconciliation
- Role execution: local Proposer/Balancer simulation because this bounded helper was the one user-authorized subagent and nested delegation was outside scope
- Verdict: `flag`

## Discovery baseline

- Accepted: topology B and a separate adapter Design route.
- Implemented: generic factory provider/evidence lifecycle.
- Planned: registered TLA/TLC provider and corpora.
- Missing: adapter, accepted exact schemas, accepted negative fixtures, and current EVF invocation of FMP.
- Constraints: no Plan, tasks, SWUs, implementation, TLC execution, authority, publication, telemetry, or Git mutation.

## Round 1

### Proposer

Candidate unit: one versioned adapter with two responsibilities—obligation translation and verified-evidence translation—bound by one immutable request-to-receipt identity relation.

Evidence/assumption: the accepted topology and audit require both translations; the factory already owns all generic lifecycle mechanics.

### Balancer

- Objection category: **split pressure**. Could request translation and evidence translation be two adapters?
- Objection category: **authority**. A candidate field list could be mistaken for accepted EVF or factory schema.
- Objection category: **claim inflation**. A verified factory receipt could be represented as proving EVF's broader intent.

### Reconciliation

- Reject the two-adapter split at Design-unit level. Without one versioned identity relation, the exact obligation-to-request-to-receipt currentness proof becomes hidden glue. Implementations may use internal modules later, but the contract must close as one unit.
- Revise every field list to “minimum semantic bindings,” with exact bytes and assignees owner-gated.
- Require the output to take the narrowest of obligation, provider-node, and factory-run ceilings.

## Round 2

### Proposer

Refined unit: one contract-only adapter Design bundle containing four field classes (`ObligationBinding`, `VerifiedFactoryEvidenceBinding`, `ProviderVerdictProjection`, `EVFEvidenceHandle`), fail-closed decision rules, planned witness contracts, and owner gates.

### Balancer

- Objection category: **hidden lifecycle duplication**. Currentness checks might grow into another verifier.
- Objection category: **semantic collapse**. Provider verdict mapping might classify raw TLC output.
- Objection category: **plan readiness**. The bundle is structurally validated but exact protected contracts are unaccepted.

### Reconciliation

- Currentness consumes a factory-owned verification binding; the adapter never replays or verifies run bytes.
- Verdict projection consumes a provider-owned total class; the adapter never classifies raw TLC logs.
- Retain a `flag`: Design selection can pass while normal Plan remains deferred behind exact owner gates.

## Smallest coherent unit

**One versioned obligation-to-verified-evidence contract.** Its primary responsibility is to prove the identity-preserving, non-inflating join from one EVF obligation to one verified factory/provider result. Splitting further loses either the request-to-receipt currentness relation or the consumer-facing claim ceiling.

## Closure and recomposition

The unit has named inputs, outputs, owners, failure behavior, and evidence boundaries. It recomposes upward as:

```text
EVF obligation semantics
  + adapter identity/taxonomy bridge
  + factory lifecycle evidence
  + provider solver semantics
  = bounded EVF evidence handle
```

No hidden glue is required if the exact owner-approved verification/currentness binding exists. Without that binding, recomposition blocks rather than infers currentness.

## Technique trace

| Technique | Result |
| --- | --- |
| abstraction-level guard | pass; the unit is a Design contract, not an implementation task |
| recomposition proof | pass with owner gate; all four owner surfaces remain separate |
| evolution profile | pass; explicit adapter and provider versions are the smallest justified extension boundary |
| frame-expiry note | recorded below |
| navigable result check | pass; owner gates and next route are explicit |
| cognitive load check | triggered; four field classes and three evidence meanings make the join reviewable |
| requisite variety | triggered; one positive and eight negative planned witnesses cover distinct failure classes |
| boundary-object check | triggered; adapter contract is the shared object, while authority stays with each owner |
| concept-vs-knowledge status | triggered; exact schemas and current invocation are candidate/absent, not established facts |
| premortem | triggered; likely failure is treating receipt digest as current verified evidence |
| tournament | skipped; accepted decision already rejected topology A and C |

## Evolution profile and deferred complexity

Expected evolution is additional provider versions or evaluator families. The minimum extension boundary is explicit adapter/provider version data plus owner-approved compatibility rules. Provider discovery, generic plugin negotiation, queues, persistence, retries, migration machinery, and broad evaluator composition are deferred because no current tension requires them.

## Tension ledger

- Resolved: one contract unit versus two independently versioned translations.
- Resolved: currentness check versus duplicate verifier.
- Stable owner gate: exact schema bytes, fixture bytes, verifier handle, provider taxonomy, and human assignees.
- Stable claim boundary: bounded model evidence is not implementation conformance or theorem proof.

## Premortem

Likely failure: an implementation accepts a matching semantic-receipt digest without proving the run root is current, complete, and verified for the same obligation. Guardrail: the adapter accepts only the exact factory-owner-approved verification/currentness binding and rejects receipt-only evidence.

## Frame expiry

Re-run Distill if the factory embeds accepted currentness proof directly into a new receipt version, EVF changes its obligation or evidence-handle meaning, a second provider family requires incompatible result semantics, or the adapter gains durable state/external effects.

## Navigation

Start with `ARCHITECTURE.md` and `SOURCE-CONTRACTS.md`. Use `DESIGN-SELECTION-RESULT.json` only for source/selection closure. Route next to the four exact owner gates; do not route to normal Plan while the Distill verdict remains `flag`.

## Evidence emission and telemetry

- Evidence emission: `not-configured` for Distill runtime events; no accepted event ledger was supplied.
- Telemetry: not appended because this helper's write scope forbids telemetry mutation. The missing append is visible residue and does not change the verdict.
