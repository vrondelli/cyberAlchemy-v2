# G01 exposed r10 — failed-test channel GLM result

Status, 2026-10-04: **the prospective exposed-development gate passed; no fresh confirmation or superiority claim.** The [r10 protocol](G01-BUGSWARM-EXPOSED-R10-GLM-PROTOCOL-2026-10-04.md) was fixed before packet construction, provider calls, and r10 scoring. It carried the sealed r9 failed-test-channel candidate lists into the unchanged raw-listwise GLM packet shape. All 24 source-only packets were sealed at SHA-256 `631e04900738119551324d94a6116685c0dc6cfce33d96c19b25243d7488be44` (seal `40fe610aea20940cb5c40e7ef96baacbe6ce88729e8987c4a9ba2eaeead12f65`); the largest was 19,657 bytes under the 24,000-byte cap. Cases with unchanged candidate lists had byte-identical r8 and r10 prompts.

The pinned VPS `glm-5.3-flash` transport completed **24/24 same-account tokenizer admissions** and **24/24 one-shot generations**, all valid under the prospectively frozen sole-JSON-or-complete-`json`-fence normalizer. Maximum prompt size was 5,422 tokens plus the 512-token reserve, under 8,192. Tokenizer prompt total was 89,957 tokens and 7,377 ms summed; generation cost was 89,957 prompt plus 1,324 completion tokens, 51,012 ms summed, 24 calls. There were no retries or transport failures. The exact VPS run was copied into private WSL cold storage, and a remote/local full-directory SHA-256 manifest digest matched at `b3268e00f2a4419de5852964af90411149e4d90378316ee2f6eef3b8a05532eb`. The independent prediction seal, written before evaluator access, is SHA-256 `885d3cbbc080850046ec43a42c9494cbb8f9d5980c0e404652b1c11e40416fdc`; prediction rows are SHA-256 `730830e2eb4b8a431529b932b858026bcbf7715bb3dbd7e45e50640dbe1f16c6`.

Evaluator-only authenticated direct-Git-tree labels for the same exposed 24 repositories give:

| Arm | MRR@8 | Hit@3 | Rank 1 |
| --- | ---: | ---: | ---: |
| Unchanged ARE file ranker | 0.15873 | 6/24 | 1/24 |
| Graph r2 | 0.39311 | 13/24 | 6/24 |
| r8 raw-listwise GLM | 0.52951 | 14/24 | 11/24 |
| r10 failed-test-channel GLM | **0.58681** | **18/24** | 11/24 |

Candidate reach was **21/24**. R10's paired MRR@8 difference versus ARE was **+0.42808**, repository-bootstrap 95% interval **[+0.29960, +0.55853]**, with 18 wins, six ties and zero losses; versus graph r2 it was **+0.19370**, interval **[+0.06597, +0.31895]**. The three newly reachable cases 10, 15 and 23 scored reciprocal ranks **0.5, 0.33333 and 0.33333**, respectively. R10 versus r8 was **+0.05729**, interval **[-0.02604, +0.14063]**, with five wins, 17 ties and two losses: the point estimate improved, but the matched improvement is not independently established. The evaluator receipt in private archive `graph-confirm-r4/exposed-r10/EVALUATION.json` is SHA-256 `63a851b58349ad2d6171c836e5ca007e7b12f9fd623bb6539a9300459d6602ac`; every frozen development-gate condition passed.

R10 used **89,957** generation prompt tokens versus r8's **71,757** (about 25% more), so no efficiency superiority follows. Both runs use the same exposed cases; further tuning against these scores would compound exposure. The next high-value test is a prospectively selected, repository-disjoint and authenticated 24-case cohort with the exact r9 acquisition rule, r10 packet/normalizer, unchanged comparators, full token/time accounting, and a frozen claim gate. A distinct structural/symbol acquisition hypothesis may target the remaining three candidate misses, but must not be folded into this frozen r10 rule after observing its score.

## Open Questions

- Does r10 transfer to a new repository-disjoint population with complete authenticated source, log, and label coverage?
- Can prompt cost be reduced without sacrificing the 21/24 reach benefit, tested on a separate development set?
- Which structural mechanism can recover the remaining candidate misses without using exposed gold to choose paths?
