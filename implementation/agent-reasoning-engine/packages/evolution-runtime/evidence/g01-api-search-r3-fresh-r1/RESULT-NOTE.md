# G01 paged API-search r3 matched pair — mechanism did not activate

The source-only GitHub CLI detached-HEAD task
`Multi-SWE-Bench__go__maintenance__bugfix__0dce19c1` had no prior local
prediction or score record at freeze time. Control and r3 candidate ran on
the same pinned commit `adc7aa794cea8e9a80502bb247ae6aa78739d440`
with GLM-5.3-Flash and the 8K context bound. The
[control](CONTROL-FREEZE.json) and [candidate](CANDIDATE-FREEZE.json) were
frozen before dispatch; both [predictions](PREDICTION-SEAL.json) were sealed
before pinned native scoring. Full VPS receipts remain under
`/opt/are/evolution-runtime/g01-api-search-r3-fresh-r1/`.

| Final native result / cost | Control | Candidate r3 |
| --- | ---: | ---: |
| Span-F1 / File-F1 | 0 / 0 | 0 / 0 |
| Symbol-F1 / Line-F1 | 0 / 0 | 0 / 0 |
| Peak trajectory gold-file coverage | 0.666667 | 0.666667 |
| Peak trajectory gold-span coverage | 0.164047 | 0.137718 |
| Known model input + output tokens | 85,121 | 80,914 |
| Model calls | 25 | 24 |
| Run duration (started/completed timestamps) | 184.608 s | 201.509 s |

Candidate tokens fell about 4.94%, but run duration rose about 9.16%, and
accuracy did not improve. Both final predictions selected only
`.github/PULL_REQUEST_TEMPLATE/bug_fix.md:1-19`, a non-gold file, despite
trajectories that encountered two of three gold files. See the
[control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control native score](control-native-score.json), and
[candidate native score](candidate-native-score.json).

R3 made zero pagination calls and zero automatic source acquisitions. The
candidate model did issue base `search` calls, but most used a broad root
prefix; the narrowed calls either used code identifiers not grounded by the
objective-term rule or yielded no eligible source observation. The frozen
r3 mechanism therefore had no opportunity to help on this task. This is not
evidence that pagination itself improves or worsens quality.

The stronger diagnosis is at terminal preparation: each arm's packet offered
only the convergence-bound pull-request-template read (`h0`), even though
other base reads had been delivered during exploration. The model could not
select those omitted reads. The next candidate should test a bounded,
gold-blind shortlist of delivered base reads at terminal, preserving receipt
binding and excluding obvious templates/tests; it must be evaluated on a
different untouched task. This task is now exposed.

## Open Questions

- Can a generic terminal shortlist retain relevant delivered reads without
  overfilling the 8K selection packet or promoting irrelevant files?
- Does that improve final native quality while preserving token and time
  advantages on an untouched matched task?
- Should search pagination remain opt-in for tasks where an eligible source
  query actually occurs, or be retired if activation remains rare?
