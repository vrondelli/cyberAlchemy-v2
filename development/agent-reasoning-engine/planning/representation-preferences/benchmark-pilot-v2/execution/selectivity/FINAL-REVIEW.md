# Final selectivity instrument review

Reviewer: `/root/pilot_selectivity`. Date: 2026-09-18. Authority effect: none.
Review disposition: no remaining material blocker in the exact instruments listed
below for the bounded four-task development pilot. This is instrument review, not
a provider-availability result, branch freeze, release admission, or quality finding.

The reviewer authored the initial selectivity fixtures and adapter; the coordinator
independently reviewed labels and added scorer corrections. This review independently
checks coordinator-authored shared instrumentation and those corrections. It is not
an independent second authorship audit of every original fixture.

## Evidence and findings

Ran the selectivity offline suite plus shared schedule and run-core suites: **11/11
passed**; added provider contract suite **2/2 passed**, zero live model calls. Real ARE selection and persisted restart produced
selected lesson counts `[1,0,0,1]` for apply, suppress, override, and change.

Earlier material findings are resolved at the reviewed hashes: invalid plain-text
payloads no longer throw; sentence tails cannot evade the two-sentence requirement;
malformed outputs retain task opportunity metadata; provider responses must match
the pinned model; actual input/output usage must fit the 7168/1024 caps; optional
cached/reasoning counts must be bounded by their parent totals; failed calls with
known usage consume the accumulated token total. Unknown usage stops the schedule.

AB then BA yields 16 generations using only development tasks. Both arms receive
identical authored history and the same output protocol. Treatment adds only actual
selected ARE items. No selected state is injected on the suppress/override cases.
Original episode wording and scope/override labels are coherent with the stated
hypothesis. Complete-history control can succeed without ARE; that is a legitimate
H0 outcome rather than a reason to change the fixtures after results.

The scorer remains a deterministic structural/content proxy. Negated, misleading,
or partly incorrect prose can contain all expected keywords. Every live output
requires a separate blind content review before a quality conclusion. Keep automated
and reviewed scores separate and preserve disagreement. Structural pass alone is
not semantic correctness, benchmark improvement, or successful retention.

Tokenizer counts are estimates tied to exact prompts; actual model input counts can
differ and are recorded. Runtime checks enforce the full 8K budget cap rather than
claiming tokenizer/model equality. All actual input plus output tokens, including
cached/reasoning components already included in totals, count once. No judge calls
are implied by this review. If judging is added, its tokens need the frozen budget.

The updated branch launcher checks all declared frozen file hashes, repeats native
research-continuity verification, checks the disk floor, and exclusively creates a
new run directory before constructing the provider. It therefore cannot silently
resume or duplicate a previous run. The protocol requires all source, prompt, score,
and review artifacts in the freeze bindings; the coordinator still owns verifying
that the actual freeze manifest contains the complete required set. The launcher and
protocol were reviewed after their addition.
No reserve task has been sent to a model in this review.

## Exact reviewed sources

Paths are relative to the parent execution directory. Byte hashes use SHA-256.
Changes after these hashes require a scoped review update before relying on this
receipt. The provider validation extraction was reread and its added tests passed.

| File | SHA-256 |
| --- | --- |
| `selectivity/adapter.mjs` | `c2c2f175538bf62d9b2a01d7fed59512d52104d0e50e74a550033d13a9402a14` |
| `selectivity/episodes.json` | `a22ddc3b47423a586b9f0213c84a24540154eb362c790fcda734362b411d2969` |
| `selectivity/gold.json` | `688793f1c0b18b3f0139c206e63c956e3af7a0f7b5cb96bd4d4b50941331fdf8` |
| `selectivity/scorer.mjs` | `31d5c62454da4560a5a987b1e26de04e41b98aede29ef02a66810457e781d053` |
| `selectivity/offline.test.mjs` | `d077188be9fb23a7ab66db7e9386e9f98f606c9fa666fdb299a82354f5f64fe5` |
| `selectivity/run.mjs` | `e9a9aa78ead7ca9761a8aa082017ae2b5570e5bfbb8405dd25ae4226c2be19c0` |
| `selectivity/RUN-PROTOCOL.md` | `27caefe09b52ebe545c35683448ec08454d02529a9a7f9c1be770ae977a90ce4` |
| `shared/provider.mjs` | `bf528e6377e2e7c83b615e168f6b62cb2515b8be2151b41acfc8963c84e1c842` |
| `shared/provider.test.mjs` | `9445358408815d35e7b1448bcde459f983199b9d19fd79a2de86902ac743e8d8` |
| `shared/schedule.mjs` | `f4198e6f1b03e47493ecbd6b3db84b1edb1ee4a9ed0d2fb59709550e4360ef50` |
| `shared/schedule.test.mjs` | `ca77b18ebb86a39bdf6890971ee30447ed189541505b2d9d5610ce3a3a948f35` |
| `shared/run-core.mjs` | `bded29a05f1b04cf28a83ca082516b6cb8b9959329c6d6f293a4d610271089fe` |
| `shared/run-core.test.mjs` | `fb8434483ca08703718094309ceba3dbab9027e616de010a17ad4590ef66819a` |

## Open Questions

Coordinator owns prospective branch freeze, exact launch validation, provider
availability, and blind content-review assignment. Will ARE improve quality or
reduce cumulative tokens when control retains the whole short history? That remains
an empirical question; the offline passes do not answer it.
