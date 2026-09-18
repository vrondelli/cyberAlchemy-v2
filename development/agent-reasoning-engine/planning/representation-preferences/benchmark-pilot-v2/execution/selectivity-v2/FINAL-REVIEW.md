# Selectivity transport-successor review

Reviewer: `/root/pilot_selectivity`. Date: 2026-09-18. Authority effect: none.
Disposition: no remaining material blocker found in the bounded transport successor
at the exact hashes below. This review permits a coordinator freeze decision; it is
not a result, quality claim, deployment admission, or evidence of live completion.

## Review evidence

Verified byte equality with the preserved original for adapter, episodes, gold,
scorer, preflight tasks, schedule, and result. Reviewed local provider, launcher,
protocol and freeze builder. Enabled thinking, `clear_thinking:false`, and low
reasoning effort match the established production transport configuration. The
provider captures callback transport failures outside the secret-consumer boundary;
exceptions are retained as transport diagnostics without serializing credential
material. No retry or message/label change was introduced.

Independently executed three offline local receipt assertions: valid reasoning
usage accepted, wrong model rejected, excessive reasoning detail rejected. No
model or tokenizer calls were made. Shared provider tests target the original
provider and therefore do not independently certify successor payload/callback
changes; those changes received source review here.

The successor retains 7168 input and 1024 completion caps, including reasoning in
completion usage. Its frozen total cap is reduced to 172032 tokens, and the launcher
passes that cap to the run core. The coordinator reserves 32768 for the prior failed
request plus diagnostics under the original 204800 episode allocation. This is a
conservative reservation, not known provider usage: prior unknown actual usage must
remain explicitly unknown in research-wide accounting. It cannot be erased by a
successful successor. The freeze admission helper uses its default total ceiling,
but actual 16-call worst-case 131072 is below the stricter successor cap and runtime
enforces that cap, so this does not admit an excess run here.

The launcher rechecks every declared source hash, native continuity, and disk floor,
then creates an exclusive run directory. The freeze builder binds the selected
messages, tasks, score/gold files, adapter, local provider, shared core, launcher,
protocol, review and research records. Copied tokenizer receipts remain visibly
historical admission estimates; actual input is checked on every live response.
The builder output itself is still the coordinator's next action, not completed
by this review.

Original semantic-grader limitations remain. All outputs require blind content
review before quality conclusions. Full-history control may match ARE legitimately;
no result-dependent relabeling, retries or reserve opening is authorized here.

## Exact reviewed sources

Paths relative to this directory; SHA-256 byte hashes.

| File | SHA-256 |
| --- | --- |
| `provider.mjs` | `f5cbfd61af0b833bac15828ed827147db742a60ce256f6d32c5e05d4a3d6f46e` |
| `run.mjs` | `cf89b3b179288f42336b1004a92f31c29124622453ea498b6dfc532314669790` |
| `freeze.mjs` | `31a33bc8a3da2fbafcae0ca4d3d7cb9acb32a72418b830665f78f8cce54e78b1` |
| `RUN-PROTOCOL.md` | `735138bd1754c0453c00a771ab0ea10d985dfd27902395deb81b53b97d4986e1` |
| `adapter.mjs` | `c2c2f175538bf62d9b2a01d7fed59512d52104d0e50e74a550033d13a9402a14` |
| `scorer.mjs` | `31d5c62454da4560a5a987b1e26de04e41b98aede29ef02a66810457e781d053` |
| `gold.json` | `688793f1c0b18b3f0139c206e63c956e3af7a0f7b5cb96bd4d4b50941331fdf8` |
| `episodes.json` | `a22ddc3b47423a586b9f0213c84a24540154eb362c790fcda734362b411d2969` |
| `preflight/schedule.json` | `b3f3cb08b63e5191638bc309a68a91ddc19cbbfbca083e3e6dceeceeb705c34b` |
| `preflight/tasks.json` | `610ddd12c9649c06a9b3cabda565bc3b99ccf6eadc6e9cdde358f05d05492544` |
| `preflight/result.json` | `b7831cb4b836aff6d60df25585a399e0d4b7a504c79f0b20312821af1c4c0bb7` |
| `../shared/run-core.mjs` | `bded29a05f1b04cf28a83ca082516b6cb8b9959329c6d6f293a4d610271089fe` |
| `../shared/schedule.mjs` | `f4198e6f1b03e47493ecbd6b3db84b1edb1ee4a9ed0d2fb59709550e4360ef50` |

## Open Questions

Will mandatory reasoning fit the unchanged completion cap? This must be measured,
not assumed from transport compatibility. Coordinator owns freeze validation,
execution, blind semantic review, and keeping failed/unknown-usage evidence in the
final synthesis. No broad preference-learning or token-benefit claim exists yet.
