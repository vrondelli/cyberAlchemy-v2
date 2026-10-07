# G01 cap-12 Rust extension — cost gain, accuracy gate fails

This [prospective extension](EXTENSION-FREEZE.json) ran source-only
`Multi-SWE-Bench__rust__maintenance__bugfix__37f525d2` on pinned clap commit
`15f01789d2a6b8952a01a8a3881b94aed4a44f4c`. The unchanged cap-12
candidate and native convergence control were driven by one frozen
[pair plan](PAIR-PLAN.json). The new runner dispatched both arms in order,
wrote the [prediction seal](PREDICTION-SEAL.json) before pinned native
scoring, and wrote the [decision receipt](PAIR-RESULT.json) without manual
scoring steps.

| Metric | Control | Cap-12 shortlist |
| --- | ---: | ---: |
| Native Span-F1 | 0 | 0 |
| Native File-F1 | 0 | 0 |
| Known model tokens | 83,288 | 24,740 |
| Run duration | 227.856 s | 95.803 s |
| Model calls | 25 | 13 |

The candidate used 70.30% fewer known model tokens and finished 57.95%
faster, but did **not** improve either native quality metric. The four-gate
claim fails. Both arms selected the same non-gold
`clap_derive/src/derives/args.rs:165-204` range. At its 12-call stop, the
candidate had only one eligible wide source read, so its shortlist had no
alternative. Control also read `src/parse/validator.rs` later but did not
select it at terminal. These are exposed-task diagnostics; this exact task
cannot support a new prospective tuning claim.

Local artifacts: [control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control native score](control-native-score.json), and
[candidate native score](candidate-native-score.json). Full receipts remain
under `/opt/are/evolution-runtime/g01-shortlist-cap12-rust-r1/`.

## Open Questions

- Can a gold-blind early-stop condition based on the number of distinct wide
  source reads preserve large cost savings without stopping after one file?
- Why did control's later validator read not survive terminal selection?
