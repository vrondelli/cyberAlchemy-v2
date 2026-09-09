# Luna repository audit using Codex allowance and credits

Completed 48 Luna turns in 15.43 minutes using the existing
ChatGPT/Codex login. No API key was used. The task audited twelve claims about
the actual ARE learning loop, with a draft and independent self-review pass in
each of two memory treatments. Each turn had its own ephemeral thread and
explicit accumulated prior work. The initial configuration failure made zero
model calls and remains preserved in RESULT.json; RESULT-v2.json is the completed run.

| Measure | Plain summary | ARE-selected memory |
|---|---:|---:|
| Correct draft verdicts | 12/12 | 12/12 |
| Correct reviewed verdicts | 12/12 | 12/12 |
| Draft verdict plus exact citations | 11/12 | 10/12 |
| Reviewed verdict plus exact citations | 11/12 | 9/12 |
| Strict citation repairs in self-review | 0 | 0 |
| Strict regressions in self-review | 0 | 1 |
| Input tokens | 455,679 | 481,657 |
| Cached input tokens, subset | 111,104 | 87,296 |
| Output tokens, including reasoning | 16,162 | 17,557 |
| Median model response latency | 17.13s | 18.08s |
| Token-rate credit equivalent | 2.2633 | 2.5422 |
| Conservative usage estimate | 3.3329 | 3.5371 |

The account reported 500 purchased credits at the beginning and end, while its
included Codex allowance moved from 96% to 98% used. The observed purchased-credit
drop was zero. These snapshots are account-wide and can include other activity;
reporting may lag. Token-rate equivalent totals 4.8055 credits;
the conservative estimate totals 6.8699, below the 50-credit stop.
Neither figure is a billing receipt. API dollar estimates from the parent package
do not apply to this run. [Verified Codex pricing](https://learn.chatgpt.com/docs/pricing).

Parent review of all 24 final findings found the verdicts and core explanations
consistent with supplied source evidence. Frozen strict citation failures remain
failures: ARE added indentation to one applicability quote, extra escaping to an
invalidation quote, and indentation to missing-output quotes. The summary also
had indentation errors and one wrong line number in its missing-output finding.
These are exact citation defects, not evidence of wrong high-level claim verdicts.
No runtime defect was established by this audit. Raw model reports are unchanged.

The automatic scorer was independently recomputed in Python, exact source hashes
were verified, and all 48 completed turns used distinct threads. Local credit
checks reject missing/blocked balances and reserve a margin before a new turn.
There were no model tools or delegated operations. Codex internal retry counts
are not independently visible; 48 is a turn count, not a backend-request claim.

Interpretation: Luna understood these source-level claims well. A fixed self-review
pass did not improve citation accuracy. ARE-selected memory did not improve final
quality or reduce measured tokens/latency on this task. One staged audit cannot
establish causal superiority, general reliability or model-wide performance.
Both arms shared the same evidence and task questions; the comparison isolates
the actual ARE memory projection, not the full Codex wrapper or unrestricted
repository coding. Context-preparation timing includes startup/account reads,
so isolated ARE computation overhead is not evaluable from that field. Human
maintenance usability remains unmeasured.

Product construction frontier: this bounded Luna product test is complete. A
practical next improvement is deterministic citation verification in audit delivery,
followed by another independently selected task if broader evidence is needed.
Any correction of model reports should be a separate derived artifact, preserving
this frozen comparison. No current prototype source or serving profile changed.
Operational residue: product approval, production activation and publication remain
separate product/runtime-owner decisions. This receipt grants no such authority.

Evidence: [raw run](RESULT-v2.json), [assessment](ASSESSMENT.json),
[summary audit](AUDIT-summary.md), [ARE audit](AUDIT-are.md),
[independent verifier](assess.py), [startup diagnosis](REPAIR.md),
[frozen source manifest](MANIFEST-v2.json).
