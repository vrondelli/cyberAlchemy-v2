# Verified result of the GLM research loop

The active objective was to analyze the accumulated evidence, generate hypotheses through the research ontology, test them and obtain an explained engine improvement. That research-to-result loop is complete for the demonstrated mechanism. This is not full GLM product acceptance. See [completion audit](completion-audit-89.json) for requirement-level evidence and explicitly unachieved broader requirements.

H22 established that full-history admission could reject a request only97–121tokens beyond its effective limit; fallback then removed the previously delivered route and region facts. Recovery selected irrelevant or incomplete sources. H23 tested a different intervention: preserve every tool payload and argument but keep redundant envelope digest/byte-count fields in audit sidecars instead of spending model-context tokens on them.

The isolated JS adapter validates the complete envelope schema and preserves unsupported envelopes unchanged. It reproduces135 offline prompt projections and all6 measured request pairs. Actual tokenizer measurements saved316/320/319 input tokens at8K/10K/12K, admitting all three original rejected requests. Source-heavy negative controls still reject.

In the frozen18-row live comparison, H23 passed all3near-boundary tasks versus0/3for the identical H21 agent with its original envelope adapter. All6unpressured controls passed. H23 retained both facts, used7model calls per task and avoided local recycling in all3near-boundary cases. Baseline produced2verified incorrect proposals and1missing proposal. Total94model/113tokenizer calls; no retries, replacements or transport failures. Independent review and reconstruction of132projected tool messages across51candidate renders passed. Controller96620 is terminal, exit0.

The6stronger-pressure trials blocked in both arms before decisive fact delivery. They test capacity rejection, not retention after reading the facts. Seven raw-semantic outcomes are unknown: those6blocks plus the12K baseline missing proposal. This result supports a narrow causal improvement in a fixed task family; it does not establish reliability across arbitrary repository tasks.

## Reusable artifacts

- [JS adapter and complete schema validation](../payload-js-v1/README.md)
- [Measured tokenizer comparison](../payload-token-v1/RESULT.md)
- [Live result and independent audits](../payload-live-v1/RESULT.md)
- [Research DAG](dag-payload-live-87-final.json):122canonical records/206edges
- [Original complete pressure analysis](../measured-pressure-episode-v1/process-analysis.json)

## Construction and operational lanes

Completed construction: analyzed failure mechanism, falsifiable ontology-linked hypothesis, isolated implementation, offline/actual-token/live tests and checked result. No core/default changes, product activation or publication occurred. Owner: ARE implementer/evaluator.

Remaining product construction belongs to the existing [GLM finish plan](../../../../../GLM-FINISH-PLAN.md): held-out tasks, repository answers/multi-file behavior, broader context qualification, supported ARE entry point and product acceptance. Independently calibrated post-delivery pressure recovery remains a research question. These gaps are explicit; no generic claim that small windows or GLM are fully solved is made. User owns adoption, serving and publication decisions.

## Open Questions

Does this mechanism generalize to held-out repository tasks and larger source bodies? What evidence-selection/recovery policy works when complete payloads still cannot fit? How should paged/unknown envelopes be supported? Provider-internal compaction is not observable through these receipts; only local admission/recycling is verified.
