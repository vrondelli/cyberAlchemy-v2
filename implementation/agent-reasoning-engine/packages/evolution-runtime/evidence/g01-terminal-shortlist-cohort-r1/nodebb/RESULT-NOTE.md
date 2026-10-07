# G01 fixed-shortlist NodeBB replication — four gates pass on one task

The second task in the [predeclared cohort](../COHORT-FREEZE.json) ran on
source-only `SWE-Bench-Pro__javascript__maintenance__bugfix__99b38b09`, pinned
to NodeBB commit `a592ebd1ff1915c72a71b7f738f1dc0ec7ed4f03`. The fixed
[control](CONTROL-FREEZE.json) and [candidate](CANDIDATE-FREEZE.json) preceded
GLM dispatch. [Both predictions](PREDICTION-SEAL.json) were sealed before
pinned native scoring. The [decision](PAIR-DECISION.json) applies the cohort's
four strict gates.

| Metric | Control | Fixed shortlist |
| --- | ---: | ---: |
| Native Span-F1 | 0 | 0.224439 |
| Native File-F1 | 0 | 0.307692 |
| Known model tokens | 83,834 | 82,731 |
| Run duration | 290.698 s | 286.541 s |
| Model calls | 22 | 22 |

The candidate improved quality, used 1.32% fewer known model tokens, and
finished 1.43% faster. Its terminal packet offered eight receipt-bound source
ranges from nine eligible reads. It selected `src/user/data.js` and
`src/user/profile.js`, both scored as gold files; control selected only
`public/src/client/account/edit/username.js`, which was not a gold file.

The first control attempt failed **before model dispatch** because the
partial-clone repository cache could not be cloned by the runner. A full
repository clone pinned to the same commit replaced that cache. Both scored
arms used the full clone; candidate code, task, and cohort rule did not change.
The failed attempt remains in the remote evidence root, separate from the
scored `attempt-02` arms.

Local artifacts: [control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control score](control-native-score.json), and
[candidate score](candidate-native-score.json). Full receipts remain under
`/opt/are/evolution-runtime/g01-terminal-shortlist-nodebb-r1/`.

This one-task four-gate pass does **not** overturn the fixed-cohort rejection:
the earlier zstd task missed the duration gate. NodeBB is now exposed and
cannot be reused for a prospective claim.

## Open Questions

- Why did terminal selection consistently improve final quality while the
  duration result varied across repositories?
- Can a next, predeclared fixed candidate meet all four gates across a larger
  untouched multi-repository cohort without relying on narrow timing margins?
