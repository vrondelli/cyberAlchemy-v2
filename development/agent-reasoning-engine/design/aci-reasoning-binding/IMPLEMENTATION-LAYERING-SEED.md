# Implementation layering seed — ACI reasoning binding

Status: **design seed only; no implementation authorization**

| Layer | Candidate responsibility | Entry gate |
|---|---|---|
| L0 semantic | existing deterministic evaluator and semantic receipt content | already bounded/promoted; no new work |
| L1 local adapter contract | pure mapping types and rejection rules, with no journal/effect writes | owner selects option A or B and Invoke Plan revises SWUs |
| L1 external conformance | cross-language canonical refs, command/event/receipt and Work Bus fixture mapping | ACI W0 completion, Bus PASS where used |
| L2 reliability | crash, replay, idempotency, effect-intent, recovery and reconciliation proofs | ACI TASK-010 evidence plus local exact-effect gates |
| L3 private integration | private package/adapter and rollout envelope | ACI/APT lifecycle gates and G-ARE-L3 |

Candidate package boundaries if option A is selected later:

- `semantic-core`: current evaluator; no ACI dependency.
- `aci-binding-contract`: pure logical mappings and conformance fixtures.
- `aci-adapter`: future ACI-subordinate runtime adapter; no independent writer.
- `local-witness-adapter`: optional isolated evidence path explicitly unable to
  claim ACI compatibility.

No task, SWU, write scope, language, or dependency choice is selected here.

