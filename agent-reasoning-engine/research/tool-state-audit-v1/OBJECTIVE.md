# ARE objective: useful reasoning state within token budgets

Status: user-directed guiding objective, saved from the project conversation.
Authority effect: none. Planning guidance, not an admitted execution state or a
replacement for canonical product definitions. Owner: ARE product owner.

## Objective

**Help the same model reason, preserve continuity, recover, and complete tasks
more reliably within a given total model-token budget, without unnecessary token
consumption.** Discover reusable mechanisms for ARE and its agents; qualify their
transfer to other tasks, models and domains through evidence. GLM and real coding
benchmarks remain the current concrete proving ground.

This records the user's corrections: token efficiency is the cost constraint,
not the whole objective; correctness, useful reasoning continuity, recovery and
completion must remain visible. Local computation time, storage, wall-clock
latency and dollar prices are not optimization cost metrics for this inquiry.
Operational timeouts may still bound execution; they are not measures of benefit.

## What ARE must distinguish

1. **State capture and preservation.** Record tool results, candidate identities,
   tests and evidence references deterministically where possible. Preserve source
   attribution, uncertainty, constraints and the distinction between observations,
   hypotheses and conclusions. Storing a model claim does not make it true.
2. **State presentation and use.** Select and render information the model needs
   after a context change. Accurate archives alone do not establish that the model
   can retrieve or use them. Measure retained falsifiers, recoverable evidence and
   progress without automatically penalizing rereading or reasonable verification.
3. **Workflow policy and tools.** Schemas, validators, tool execution, recovery
   feedback and available actions must agree. Model-generated hypotheses and
   checkpoint restrictions are additional policies, not inherent requirements of
   deterministic memory. Diagnose their effects separately.
4. **Task outcome.** Retain independently judged correctness, regression avoidance,
   successful recovery and completion. A cheaper abandonment is not an improvement.

## Token accounting and comparisons

Count actual input plus output tokens across every model request attributable to
an attempt, including state construction if model-assisted, repeated state
presentation, tool schemas/results in requests, explicit hypothesis generation,
retries and failed requests when usage is available. Reasoning tokens already
included in output usage must not be counted twice. Cached input still counts as
input tokens for this metric. Missing usage is unknown, not zero; report bounds
and coverage rather than invented totals. Tokenizer requests do not add model
reasoning tokens unless a provider explicitly reports such usage separately.

Compare outcomes under equal total-token budgets and report success across a
predeclared budget range. A fixed number of calls does not equal fixed tokens.
The configured context window, cumulative token budget and per-response output
cap are three separate limits. Longer windows do not automatically imply more
useful state or better results.

A matched-prefix continuation comparison may charge an identical prefix once per
branch for end-to-end reporting and show continuation-only tokens separately.
Include arm-specific preparation/compaction tokens. Build every state using only
information available at the split: no future tests, reference solution or
hindsight. Keep model, tools, policy and remaining allowance equivalent while
varying the state treatment. Full-history controls apply only when history fits;
longer-window references are separately labelled, not treated as equal-window
controls. Freeze repetitions, exposure conditions and scoring before dispatch.

## Evidence needed

- State fidelity: relevant objectives, constraints, evidence, failed attempts and
  unresolved questions remain accurate and attributable.
- State usefulness: the model can recover needed evidence, respect known
  constraints and update a falsified approach; plausible explanations alone do
  not prove this. Evaluate observable decisions and actions, not presumed access
  to private reasoning or the fluency of a self-explanation.
- Task benefit: better independently verified outcomes at equal tokens, or
  comparable outcomes with fewer tokens, without hiding premature abandonment.
- Limits: retain failures, inconclusive results and model capability limits.
  Failure at one arbitrary budget does not prove ARE cannot help; increasing
  budgets does not prove that it does. Cross-domain transfer remains unproven
  until separately tested.

## Immediate next boundary

Audit tools and all accumulated experiment evidence before selecting the next
intervention. Two Sol medium auditors inspect implementation and traces; a third
agent recaps experiment families. Parent synthesis must distinguish current
reproducible defects, historical fixed defects, design problems, model errors,
measurement gaps and unknown causes. See [delegation](DELEGATION.md),
[plan](PLAN.md) and the [project lighthouse](../../LIGHTHOUSE.md).

The audit and plan do not launch another live study or activate an engine change.
Future fixes should address general contracts with regression coverage, not add
one more special case for the next failing field or task.

## Open Questions

Which state is preserved but not made usable? Which tool failures are preventable
without hiding model errors? What token budgets expose a meaningful operating
range for GLM? Which baseline isolates ARE's state benefit fairly? Which metrics
predict progress without rewarding verbosity or redundant self-explanation? What
existing traces lack the data needed to answer these questions?
