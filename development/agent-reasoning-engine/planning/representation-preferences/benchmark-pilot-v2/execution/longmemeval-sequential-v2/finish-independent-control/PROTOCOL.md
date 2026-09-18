# Independent final control slot

This post-stop amendment follows the reviewed disposition in
[FAILURE-CONTINUATION-REVIEW.md](../recovery-v1/FAILURE-CONTINUATION-REVIEW.md).
The original global-stop failure remains immutable. This is a disclosed descriptive
completion of slot accounting, not a clean preregistered completed run.

Run only repetition2, abstention task, control: three ingestion calls and one answer,
using unchanged frozen source chunks, prompts, model settings and token reservations.
The failed treatment is not retried and its partial notes are not accepted.
Its dependent ingestion/answer calls are blocked. If this independent control
finishes, outcomes are15completed+1failed answer slots out of16; generation slots
are61successful+1failed+2blocked out of64. Missing treatment is zero in fixed task
success denominators, not removed from the pair or fabricated as an abstention.

Carry139074tokens including failed output once. Maximum cumulative v2 usage199499;
the earlier v1 cost5301 remains included in the overall204800 branch ceiling.
No source cropping, new tasks, changed answer caps, retries or post-outcome scoring
changes. Score only real completed answers with the frozen native rubric. Preserve
completion status separately from correctness. Report the operational amendment.

## Open questions

Can the independent control complete under the unchanged note cap? The failed
treatment remains a failure regardless of that result. A clean replication would
require a separate future protocol and budget, not reuse of these amended results.
