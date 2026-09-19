# Independent packet runner review

Status: 29 synthetic tests passed independently. The reviewed preparation and native accounting design is suitable for continued bounded instrumentation work, but the current runner is **not approved for live dispatch** pending the failure-path corrections below. Tokenizer-only execution also awaits the parent-owned preflight setup/lifecycle correction and its regression tests. No provider, tokenizer endpoint, network, real source records, or gold were accessed in this review.

## Exact reviewed sources

| File | SHA-256 |
| --- | --- |
| `prepare.mjs` | `3156168d87f6e38798da4f20eac5f032eb369de1130be9063188c84fcacc49a5` |
| `run.mjs` | `a7752b358a22874052c77ff02a8c33e60d4cb941d819db8b8460cb9ca01a4f19` |
| `prepare.test.mjs` | `d2cfe70e39aec5a1871912557b21c04e639f9633f4acc5e1f7944cd9256ff589` |
| `run.test.mjs` | `a595af3476c32e2b53503780b3768dbeec10fe2faa574fb2028226e1b5ae751c` |
| `inherited.test.mjs` | `3435cc5aee1a42997986e7b18ac19209fc77fe479200995c2cfb2eff38a174bd` |
| `ranking.test.mjs` | `2a9e423bc5b699aaec367ef3a4e64bdb7f5fa17d15309f2a9ab0f1630a6ba649` |

## Verified behavior

`extractBoundary` requires a single expanded terminal presentation/attempt, receipt and request digests, idle ledger integrity, a unique matching captured wire, and no later model receipt. It derives the prefix before the terminal receipt and excludes that old terminal response from new expenditure. Receipt-bound delivery reconstruction rejects unmapped prefix observations. Native retained-reasoning verification runs both at extraction and immediately before continuation.

`derivePrefixLedger` binds transport identity, prefix hashes, known usage and original counters. Native `bindRunLedger` imports those receipts into a fresh recycler scope; it is explicitly a counterfactual continuation, not a claim to restore the old recycler checkpoint. New usage comes only from suffix receipts. Separate logical totals add historical prefix cost per variant; historical tokens must not be called new spend. Unknown dispatched usage conservatively reserves 8,000 tokens. Model retries are disabled, and each suffix admits at most one new model request.

Complete native admission includes tokenizer input, provider margin, retained reasoning and the 2,048-token output reserve, bounded to 8,000 and below the recycler threshold. Preparation rebuilds the legacy public packet, fits both variants together, and substitutes only the packet message/tool. `runSlot` rechecks packet/tool integrity and rejects any other wire drift. Injected tokenizer callbacks are an integration boundary: live preparation must bind them to the reviewed native meter and persist their attempts, not treat arbitrary callback values as real qualification.

`restoreVerifiedBase` uses existing local Git objects with lazy fetch disabled, verifies exact base commit and regular blob mode, checks Git SHA-1/blob size plus SHA-256 and strict UTF-8, rejects traversal/symlinks, and enforces the 32 MiB restoration ceiling. It never clones or fetches. The regression verifies independence from edited working-tree bytes. Storage checks surround creation/writes. Restoration failure can leave an owned partial directory; orchestration must record and remove it deliberately, never reuse it as a verified base.

The pool creates sixteen fixed slots for eight ordered donors, uses two workers, sequential AB/BA variants per donor, and blocks further dispatch on unknown cost, persistence failure or capacity codes. Its public guard checks eight unique donor IDs and four task identities, but does not by itself prove exactly the fixed control/treatment donor pair for each task; the live wrapper must build jobs from `fixedDonors`/bound donors and freeze that mapping.

## Remaining failure-path gaps

1. At the reviewed source, `runNativeRequest` catches post-generation `completeStep` or `recycler.close` errors but chooses `generated` status whenever a response exists. `runSlot` then exports and overwrites status as completed whenever `generated` exists. Generic cleanup errors not matching the listed filesystem codes can have `persistence_failure=false`, allowing `all_valid=true` despite lifecycle failure. Any such failure must retain known suffix cost, terminalize the slot as failed, and stop shared health rather than claim a completed native prediction.
2. `runPairs` awaits `health.report` without containment. An injected reporting exception reproduces rejection of the entire pool with neither `error.result` nor `error.receipts`; fixed-slot results and aggregate known cost are not returned. Catch reporting failure, retain the current result and known/unknown accounting, stop new work, and still finalize all sixteen slots or attach the complete in-memory result to the thrown error.
3. Preflight setup/lifecycle robustness is being corrected separately by the parent. Before approval, verify setup failures prove zero dispatched model cost, tokenizer/persistence errors cannot be mistaken for successful preparation, and real transport cancellation and output cleanup have explicit ownership.

## Verification and open questions

Ran `node --test .../packet-diversity-v1/*.test.mjs`: 29 passed, zero failures. Tests exercise the real native GLM transport/ledger/recycler through an in-memory HTTP primitive; no sockets are opened. A separate in-memory `runPairs` health-reporter failure injection reproduced gap 2 without providers. Gap 1 follows directly from the catch/status/export branches and needs a focused regression after correction.

A final exact-hash review must follow fixes. Real preparation still needs bound source restoration, a fixed sixteen-slot manifest, bounded tokenizer setup, and persisted actual native admission. Live execution needs the reviewed lifecycle/health corrections and a frozen maximum 128,000 new model tokens. Native scoring remains isolated and unexecuted. This experiment is an archived terminal component diagnostic, not a fresh trajectory, perfect-score result, or proof of fifteen-percent whole-trajectory savings.

## Follow-up implementation (author report, independent approval pending)

At the parent’s explicit request, this reviewer subsequently implemented gaps 1 and 2 in `run.mjs`; this section is an implementation report, not independent approval of those changes. Lifecycle errors now mark failed slots, preserve known/unknown suffix usage, retain the original error plus phase diagnostics, attempt both cleanup actions, prevent native-export success, and stop shared dispatch. Tokenizer-only lifecycle/persistence failures cannot qualify a wire. Health reporting/check failures are contained and recorded while all sixteen slots and aggregate cost are returned. The native recycler remains the default; an injected factory enables meaningful post-generation cleanup regression tests.

All 32 packet tests pass, including three new regression tests covering both completeStep/close failures through the real native fixture, throwing health reporters with known and unknown costs, and tokenizer-only cleanup failure. No sockets, provider or tokenizer endpoints were used. Parent-owned setup fixes remain separately reviewed.

- `run.mjs`: `92ae4fc66fb3c012b65571eede0696e6c96e344221039c2fb99a88a9da9f3806`.
- `run.test.mjs`: `cde6bee61ecb9d54bc9dd21cf8813262d4638be9eff71efa042caceca2172707`.

A further preflight regression rejects an arbitrary post-tokenizer recycler error. The gate permits only explicit native dispatch-admission denial for a valid preflight or a measured fresh-context-too-large disposition for sizing/backoff; neither case dispatches a model. Lifecycle/persistence failures always reject. Updated runner suite: 11/11 passed. Superseding source hashes:

- `run.mjs`: `af5d99f7284375335b5934b17f56e7ff2080fff0c28b4bbb3059afffe090df8d`.
- `run.test.mjs`: `499da8463f163c3cf9495b20561f3ef98bf3d5f17aa024acdfed0163c0d28688`.
