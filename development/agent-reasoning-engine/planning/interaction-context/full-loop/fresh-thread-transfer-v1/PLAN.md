# Fresh-thread transfer experiment

User instruction: “lets do it”, continuing the broader learning experiment.
Route CA2-ROUTE-IMPLEMENT. Writes are confined to this experiment package.

Product construction frontier: the existing tested learning prototype, with live
same-thread integration evidence but no demonstrated gain over conversation
memory. Runnable work is experimental infrastructure and product testing. Reuse
existing definitions, ontology scaffold and DomainSpec model; no implementation
or meaning change is proposed. No new ontology dependency is selected.

Hypothesis: explicitly retained, source-grounded product conventions improve
appropriate first responses in fresh threads relative to no retained memory,
without applying to excluded requests or overriding current instructions.
Comparison B retains the same information and conditions in a plain-language
summary. A tie between B and C is no evidence of a scoped-engine advantage.

Training: three independently authored synthetic convention families, two real
turns each. Feedback explicitly selects retention within this sandbox product.
The host supplies the typed attribution and scope; extraction is not autonomous.
Freeze cases and rubric before model execution. Do not tune on live evaluation.

Evaluation: six novel requests (three applicable and three scope/override controls)
x three arms, each in its own fresh ephemeral thread. Rotate all six arm orders.
No training history is sent to evaluation threads. A selects no lessons; B gets
all retained conventions including conditions in a plain-language summary; C uses
the existing deterministic applicability projection. Same model and base prompt.

Budget: 24 model calls including training, zero optional interpretation/research
or judge calls, 30-minute dispatch deadline, 240s thread startup, 120s completion.
One app-server connection is reused, but never an evaluation thread. Tools and
multi-agent features disabled; read-only scratch root; no user-project effects.
Stop on effectful failure; preserve partial evidence; do not automatically retry.

Quality gates: C improves applicable compliance over A by at least one case and
passes all controls. Report B independently. No strict C-over-B gain means no
advantage beyond retained memory. Literal labels/order/format only; no semantic
quality, independent statistical replication, or model-weight learning claim.

Operational support: prior exact Codex 0.153.1 canary binding must still validate
(runtime owner; affects live test stage only). Product approval, deployment,
production retention and publication remain deferred owner work, no prototype
stage mutation. Runtime/source drift blocks only intersecting selected dependencies.
