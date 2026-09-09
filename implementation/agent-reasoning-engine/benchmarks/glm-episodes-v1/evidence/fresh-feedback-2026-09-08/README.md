# Fresh episode evaluation result

The fixed four-episode run met its target: **4/4 first-pass repairs and 4/4 final verified repairs**. Both recycled episodes passed continuity. Container feedback accepted every proposal unchanged, using **zero corrective model/tokenizer calls**. All four containers were verified absent afterward.

| Fresh episode | Window / retention | First pass | Final oracle | Recycling |
| --- | --- | --- | --- | --- |
| Archive boundaries | 8K / recent-v2 | Pass | 8/8 | Not needed |
| Exact JSON scoring | 8K / clear | Pass | 8/8 | 2 recycles; continuity passed |
| Retention tool pairs | 12K / recent-v2 | Pass | 8/8 | Not needed |
| Long retention | 8K / recent-v2 | Pass | 8/8 | 5 recycles; continuity passed |

Initial execution used 40 model and 47 tokenizer attempts, below caps of 60/120. Correction used 0/4 model and 0/8 tokenizer attempts. The first-pass phase completed in 285.272 seconds. All four completion gates passed; minimum recorded admission headroom was 257 tokens. Final public validation and the separate final oracle completed without execution failures. The final oracle passed 32 checks. There were no retries, failure replacements, applied patches or default-policy changes.

## What changed

The evaluator now supports an explicit `--fresh-four` mode for completed four-trial initial runs. Unlike retained-submission filtering, this mode keeps unsubmitted trials in the denominator, grants at most one corrective request per trial, and separately reports first-pass repairs, final verified repairs, verified corrections and unsubmitted trials. Blocked stages cannot pass merely because a later oracle accepted a candidate. The previous six-retained-proposal mode keeps its two-request cap.

Four new schedule/scoring tests passed, and CLI syntax checking passed. The live run exercised the fresh-mode path; existing backend/runtime test totals are not claimed as newly rerun. Initial, feedback and orchestration source snapshots all remained unchanged across both phases. See [usage](../../FRESH-FEEDBACK.md).

## Interpretation and evidence

These are newly generated model outputs on four existing repository fixtures, not unseen tasks. The result establishes a clean execution of this fixed sample, including long 8K recycling and container-backed acceptance. It does not quantify the benefit of corrective feedback: all initial proposals were correct, so no correction was exercised. The earlier selected-defect correction result remains separate evidence, and all earlier failures remain preserved.

Evidence: [plan](PLAN.md), [schedule](schedule.json), [first-pass result](initial/result.json), [feedback/final result](feedback/result.json), [tests](tests.tap), and [orchestration freeze](orchestration-freeze.json). Private original protocol and correction state remain under `/tmp/are-fresh-feedback-35` and `/tmp/are-fresh-correction-35`; exported traces omit raw provider reasoning. CAV2-D65 bounded candidate evaluation, authority effect none.

## Open Questions

The next useful test is a predeclared repeatability batch across more task/window conditions, with every first-pass failure retained, followed by held-out tasks. Four successes cannot establish production reliability. The all-correct baseline leaves feedback improvement unmeasured here. Observable recycling and positive admission headroom cannot prove provider-internal compaction never occurs. Default activation remains separate work.
