# Dispatch Technique Trace

| Technique | Trigger | Applied to | Validation expectation |
| --- | --- | --- | --- |
| `sequence` | every unit supplies the next unit's input | ordered five-SWU manifest | no later unit runs before dependency receipts pass |
| `scu_swu_reduction` | three different blocker classes were initially bundled | task-local SWUs | one behavior and one acceptance boundary per SWU |
| `recomposition_proof` | individual receipts must establish the adoption claim | work-pack recomposition section | all five receipts join without hidden glue |
| `validation_loop` | compiler, proof, build, and adoption can false-green | validation strategy | focused plus regression evidence per unit |
| `owner_boundary_check` | Invoke plans, Task Session executes, Refresh synchronizes | closeout contract | no owner mutates another owner's lifecycle artifacts |
| `handle_handoff` | canonical node proof must not copy direct AST context | BC-004/005 | graph, manifest, build, and node handles only |
| `residue_ledger` | most Financial Settlement clauses are not admitted | source proposal and report | every excluded clause remains explicit |
| `execution_receipt_handoff` | Task Session completion changes gates/status/routes | every SWU closeout | source and owner receipts are separate and joined |
| `authority_split_gate` | experimental proof is not release authority | package controls | release admission stays not-granted |

Full dispatch required: yes, because the route crosses Invoke, Task Session,
compiler/source owners, and Invoke Refresh. Subagent strategy is `none`; the
units are sequential and local.

Dispatch document: [execution.dispatch.json](execution.dispatch.json).
