# H-L: recent confirmed evidence first

Status: candidate protocol; native prospective registration and live qualification
remain required. Parent result: schema-agreement production R2 retrospective
registration. Preserve the rejected R1 and its review as historical evidence.

## Objective and continuity

Improve reusable ARE reasoning/evidence retention across tasks and models. Current
measurement uses GLM-5.3-flash, four fixed exposed ContextBench tasks, and the 8K
window. Perfect native quality and untouched confirmation remain required for
the active goal. The original ≥15% reduction in total model input/output tokens
remains unproven; historical comparisons cannot establish matched causal savings.
No fresh control runs. Incremental and radical mechanisms stay separate.

## Evidence and hypotheses

The [trace audit](LEDGER-VISIBILITY-AUDIT-R1.md) found alphabetically truncated
coverage ledgers omitting the latest returned path in 66/73 exploration requests.
43/72 successful direct reads returned only lines returned before from the same
source version. The [corrected score decomposition](SELECTION-LOSS-ANALYSIS-R2.md)
does not distinguish raw retrieval failure from delivery or projection loss.

- H-L (selected): recent confirmed source-version observations first in the
  ledger reduce repetition and increase exported confirmed-source recall per
  total model token without lowering native span-F1.
- H-M (competing): planning/reasoning or task interpretation dominates; ledger
  ordering improves presentation but not the registered quality/efficiency gates.
- H-R (separate radical): an explicit task-derived exploration frontier with a
  deterministic visited-evidence ledger improves coverage beyond reactive local
  tool choice. This protocol does not implement or dispatch H-R.

## Exact intervention

Use `recent-evidence-episode-r1.mjs` and `recent-evidence-ledger-r1.mjs`. Prioritize
the newest first-confirmed receipt among each source-version group's observations.
Replays cannot refresh an observation. Same-request ties use deterministic source
identity. Preserve complete verified coverage entries, literal/ranked tools,
source verification, recovery, history projection, terminal selection and scoring.
The candidate changes ledger ordering only, plus its recorded arm identity.

Ledger limits stay 384 measured tokens and four complete entries. Oversized first
entries may yield an empty ledger; retain this behavior for the isolated test.
Real full-request sizing stays mandatory; equal-entry-count offline replay does
not qualify token fit. No task-specific file names, benchmark answers, new prompt
advice, retries, replacement tasks or budget transfers.

## Fixed evaluation envelope

Four unchanged task identities and commits from the existing cohort; two shared
workers. Each task: at most 96,000 total model input/output tokens, 96 model calls,
88,000/95 exploration allocation and 8,000/1 final allocation, output cap 2,048.
Campaign ceiling: 384,000 tokens. Actual projected request envelope must be less
than 7,999. Keep complete costs and failures. Failed tasks remain in the assigned
denominator; unknown cost or missing mechanism evidence cannot count as support.

## Measures and prospective decision

Primary quality: equal-task mean native span-F1, with native file-F1, span recall,
precision and every per-task outcome retained. Efficiency Q: equal-task mean of
10,000 × exported confirmed-source union span recall / total model tokens.
This Q is not a causal savings estimate or proof of complete raw acquisition.

Mechanism measures use the same definitions as `audit-ledger-visibility-r1.py`:

- Repetition: pooled fully repeated successful direct `read_file` calls divided
  by all successful direct `read_file` calls, separated by source hash/revision.
  This measures returned lines, not confirmed consumption or unnecessary effort.
- Ledger omission: pooled exploration requests with latest successfully returned
  direct-read path absent from the actual captured ledger, divided by exploration
  requests after such a return. It is path-level, not version-specific.

Historical candidate thresholds, fixed before new live generation:

| Requirement | Threshold |
| --- | --- |
| Valid native outputs | All four fixed tasks |
| Accounting/source/window integrity | Complete, verified; no unknown model usage |
| Mechanism denominators | Positive on each task; all relevant calls/requests classified |
| Mean native span-F1 | At least 0.3917843227829315 |
| Mean Q | Greater than 0.049285014729090575 |
| Pooled direct-read repetition | Less than 43/72 |
| Pooled ledger omission | Less than 66/73 |

Use 1e-12 numerical tolerance: greater-than requires baseline + tolerance;
less-than requires baseline − tolerance; at-least permits baseline − tolerance.
If eligibility fails, the mechanism outcome is inconclusive. Eligible failure of
any support threshold is counterevidence; meeting all is descriptive support.
Report no-call/zero-denominator cases explicitly rather than treating them as
zero repetition or omission. Original perfect-quality and token-reduction goals
remain separate from this local hypothesis decision.

## DAG, reviews and operations

Reviewed parent result -> prospective native hypotheses/selection/experiment and
measurement/schedule/DAG -> candidate review -> exact source freeze and actual
tokenizer qualification -> supervised run -> native score/mechanism audit ->
research result and decision -> next hypothesis or untouched confirmation.

Local construction already has 13 passing tests and an independent approval.
The retrospective replay is presentation evidence only. No observations of future
behavior or completed gates may be inserted into the prospective DAG.

Product frontier: register the prospective experiment and qualify its runtime.
Research operator owns WSL/D free-space growth reserve, process settlement and
credential-reference preflight before any live launch. Publish/release remain
deferred. Operational checks grant no implementation or deployment authority.

## Open Questions

Does visibility cause better exploration, or merely change which files repeat?
Does prioritizing recent evidence hide older context the model needs? Can real
token fitting preserve the replay benefit? How much missing exported coverage
comes from delivery/projection rather than raw retrieval? Can improvements survive
untouched tasks and transfer beyond coding? H-R needs its own prospective design.
