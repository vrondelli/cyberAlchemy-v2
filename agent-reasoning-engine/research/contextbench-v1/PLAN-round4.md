# Oversized tool-response recovery

Status: candidate plan, not frozen or live. Authority effect none.
Continuity: [round4-continuity.json](round4-continuity.json).

## Gap and question

[Round three](round3-closeout.json) used 94,260 model tokens across six attempts:
five pending-response context stops and one empty selection, with no native score.
Ten cells remained unstarted under its shared-failure stopping rule. Keeping tool
results prevented silent first-delivery loss but did not let the model recover
when the fresh request itself could not fit.

H7: can truthful, bounded deferral feedback after measured admission failure let
the model request smaller source pages without inventing delivery or tool effects?
Competing H8 uses permanently smaller pages; the retained H0 explanation remains
that task understanding limits results even with usable delivery. The initial
GLM small-window goal, enduring ARE outcomes, cumulative input/output token cost,
and fixed ContextBench milestone remain unchanged. Cheaper termination is not a
benefit. No SWE-bench follow-on or broader context-window substitution.

## Selected construction

Select H7. First try the ordinary fresh request with the complete pending exchange.
Only if measured context admission still fails, try one explicit deferral rendering.
Keep assistant call identities, original returned bytes in the journal, and all
mutation results. Only known successful read-only result bodies may be replaced
by bounded notices identifying that execution succeeded but payload delivery did
not occur, with exact result digest and smaller-page guidance. Never silently
truncate source, summarize it with a model, claim an edit failed when it succeeded,
or mark a withheld read as delivered. No automatic tool replay or extra effects.

The model chooses the next permitted tool action. A repeated smaller read creates
its own exact call/result identity and requires successful request delivery before
source credit. If even the deferral request cannot fit, retain the explicit context
stop. Finalization remains tools-disabled and cannot obtain free recovery actions.

## Work DAG and acceptance

| Task | Depends on | Evidence |
| --- | --- | --- |
| R4-P | Round-three reviewed decision | Typed alternatives, selection and objective/method continuity. |
| R4-D | R4-P | Safe read-only deferral projection; mutation/error preservation; bounded metadata; no false delivered read or source substitution. |
| R4-I | R4-D | Measured full-fresh then deferral rendering; only actually delivered notices recorded as delivered; pending exchange and strict token admission intact. |
| R4-E | R4-I | Reject-large → actionable notice → smaller read → confirmed delivery → valid selection; real failed-envelope replay and negative controls; tokenizer-only replay before models. |
| R4-F | R4-E | Exact matrix/protocol, D08 criteria, source freeze, initial envelope, exposure, tokenizer request allowance and continuity review. |
| R4-R | R4-F | Matched H1 comparison under identical common instrument; fixed failure stopping rules and complete accounting. |
| R4-L | R4-R | Scoped observations, reviewed learning decision and remaining goal gap. |

This is a work projection, not admitted D08 state. The scientific chain remains
objective → gap → question → competing hypotheses → selection → experiment/tasks
→ results → observations → reviewed decision → successor. R4-D is runnable offline;
the executing agent owns construction and verification. Credentials and repository
caches are operational prerequisites for replay/preflight/live stages only.
Deployment, other benchmarks and unrelated tool cleanup remain deferred.

H7 is falsified as an instrument fix if withheld source receives native credit,
mutation status is changed, invalid tool feedback disappears, or the known large
responses still cannot produce actionable bounded feedback in the tested envelope.
It is not proven useful merely by fitting a request. H1 remains the live matched
index question; common repairs do not independently establish H7 causal benefit.
Full task scope, 8K/10K/12K windows, token tiers, thresholds and reserved confirmation
remain in [acceptance.json](acceptance.json). No retrospective score changes.

## Open Questions

- How many exact tokenizer measurements are needed for full/fresh/deferred
  candidates, and what finite allowance must the successor transport bind?
- Can retained reasoning or a large assistant call itself prevent even metadata
  delivery? Keep that case an explicit admission outcome.
- How should a single oversized source line be handled? Do not pretend a partial
  line is a fully delivered native span; allow explicit smaller/narrower retrieval
  or honest inability until a separately tested fragment contract exists.
- Does model-directed repaging improve completed outcomes within total tokens,
  or cause repeated fruitless retries? Record it rather than assume benefit.
