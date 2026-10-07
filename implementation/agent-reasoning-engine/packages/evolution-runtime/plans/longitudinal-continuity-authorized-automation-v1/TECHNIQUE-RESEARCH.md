# Technique Research

Status: planning evidence; no dependency adoption  
Authority effect: none

## Local predecessor evidence

The completed `interaction-learning-objective-cycle-v1` is the direct
predecessor for `IL-LPC-01`. It measured a historical
`episode_success_rate = 0.50`, rejected three hypotheses, and supported the
provider-free deterministic `IL-H04` candidate at 20/20 prospective episodes
with zero critical regressions. The new cycle must reuse that evidence instead
of reconstructing the same corpus and baseline.

The existing durable evolution kernel already provides append-only events,
derived projections, task frontiers, leases, fencing, typed handoffs, recovery,
and disabled-by-default candidate definitions. External workflow frameworks are
therefore reference designs, not replacement runtime dependencies.

## External techniques selected for adaptation

| Source | Technique to reuse | ARE adaptation |
| --- | --- | --- |
| [LongMemEval](https://github.com/xiaowu0162/LongMemEval) | Separate extraction, multi-session reasoning, knowledge updates, temporal reasoning, and abstention | Freeze fixture families for scope recall, explicit correction, temporal replacement, exception handling, and ambiguity suspension |
| [Mem0](https://github.com/mem0ai/mem0) | Explicit memory lifecycle and time-aware retrieval | Model append, revise, revoke, suspend, and revalidate as typed events; keep retrieval/projection deterministic for the first milestone |
| [LangGraph memory](https://langchain-ai.github.io/langgraph/how-tos/cross-thread-persistence-functional/) | Distinguish thread-local state from cross-thread stores | Keep conversational, objective, workflow, and user preference scopes separate instead of one undifferentiated memory record |
| [Letta/MemGPT](https://github.com/letta-ai/letta) | Explicit state tiers and inspectable memory | Retain compact hot projections while preserving content-addressed provenance and cold evidence bindings |
| [Temporal architecture](https://github.com/temporalio/temporal/blob/main/docs/architecture/README.md) | Deterministic workflow history; side effects isolated as idempotent activities | Keep policy/frontier derivation pure and bind effects to idempotency, fencing, retry, compensation, and receipts |
| [LangGraph interrupts](https://langchain-ai.github.io/langgraph/concepts/breakpoints/) | Durable conditional pause and resume | Map uncovered or risky actions to `ask`, ambiguous unsafe actions to `abstain`, invalidated work to `stop`, and covered work to `execute` |
| [DSPy GEPA](https://github.com/stanfordnlp/dspy/blob/main/docs/docs/diving-deeper/gepa-in-depth.md) | Feedback-shaped metrics and Pareto candidate search | Preserve per-case structured failure feedback and multiple hypotheses; defer model-driven prompt search until deterministic contracts pass |

## Techniques deliberately not adopted yet

- No new database, vector store, graph store, workflow engine, or Python
  dependency is needed for the first result.
- No LLM judge is used for the fixed replay milestone. Every fixture has a
  frozen oracle and exact structural scorer.
- No benchmark headline from another project is treated as comparable to ARE's
  objective-level success metric.
- No external framework is allowed to create or widen authorization.

## Acceleration decision

Reuse the existing ARE coordinator and predecessor evidence. Implement only the
missing typed preference projection, authorization controller, fixed fixtures,
metric calculator, and cycle-specific validator bindings. This produces a
clear local result before paying VPS/model cost, while leaving the prospective
GLM lane intact.

## Open Questions

Operational questions remain in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
