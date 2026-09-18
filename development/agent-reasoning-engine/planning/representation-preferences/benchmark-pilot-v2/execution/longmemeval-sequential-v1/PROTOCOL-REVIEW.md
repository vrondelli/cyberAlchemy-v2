# Sequential LongMemEval protocol review

Reviewer: `/root/pilot_selectivity`. Authority effect: none. Date: 2026-09-18.
Scope: read-only review of the four files below; no model/tokenizer calls and no
inspection of eventual answer quality. Only this receipt was written.
Disposition: causal protocol is defensible as a bounded successor, with the concrete
implementation/wording gates below required before a run-ready freeze. No live
runner or freeze implementation is certified by this review.

## Findings

Equal access is preserved by `chunkHistory`: the same dated user/assistant content
is partitioned into whole turns, flattening is checked against the original ordered
units, and oversized turns fail instead of being cropped. Treatment adds source IDs;
control removes only those IDs. Both notes systems receive the same retention
instructions except the intended source-reference requirement. This is a comparison
of ordinary notes against source-linked notes, including the extra citation burden.
It cannot isolate the ledger's storage implementation from the citation instruction,
and cannot establish a general ARE-versus-no-memory advantage.

Ingestion prompts contain only the current chunk and earlier notes. They do not
include the final query, its date, answer, or labels. The answer prompt contains only
last retained notes plus the current question/date, with identical abstention
instructions in both arms. `prepareHistory` validates the question/date to check
chronology but seals only visible historical turns; it does not include the final
question in source events. No oracle preference or answer is introduced.

The preflight multiplicities correctly reserve two repetitions for each arm's
individual ingestion call and four occurrences for each shared answer prompt.
Thus a 48-ingestion/16-answer schedule includes every generation in the reservation.
The 512-token carried-note allowance is not a proven tokenizer identity. The protocol
correctly requires tokenizing every actual request and stopping before generation
if it exceeds its particular empty-note baseline plus 512 reservation. Merely checking
7168 tokens would not establish this tighter cumulative reservation. The runner must
also preserve actual failed-call usage, unknown usage, cached input, reasoning output,
and the full cumulative branch ceiling. These checks were not yet implemented in a
reviewed runner here.

The source ledger uses the existing ARE append/seal/replay APIs and verifies that
replayed source content exactly matches every expected source unit. Source evidence
is immutable; source manifest and per-turn event digests bind the projection.

## Required before freeze

1. Clarify the protocol's phrase “actual ARE ledger event IDs.” Current prompts expose
   `sN-mN` source aliases, not event digests. Persist the exact task-scoped alias-to-event
   mapping and describe them as ledger-bound aliases. Passing actual longer event
   digests instead would require fresh prompt admission, not silent substitution.
2. Implement and test the promised retained-note claim path. `ledger.mjs` currently
   seals source turns only; it does not persist generated notes as model claims.
   The runner must store claims separately, bind each to its task/arm/repetition and
   prior state, and record invalid/missing source references without repairing them.
   If the implementation merely adds source labels to prompts, report that narrower
   mechanism rather than claiming ledger-backed retained note state.
3. Before dispatch, verify the actual note-bearing request against its reserved
   baseline plus 512, both per-call caps and remaining cumulative budget. Bind copied
   source inputs, all prompts, split, chunks, ledger mappings, scorer/native rubric,
   shared provider, schedule, protocol, review and source implementation by hash.
4. Pin the blind native-rubric review procedure and calibration evidence. Report this
   as an adapted sequential oracle-history pilot, with proxy/semantic disagreements,
   not an official full-history or retrieval benchmark score.

The first failed 233552-token admission remains valid counterevidence and must not be
overwritten. Compact-note preflight results were not inspected here, so this receipt
does not assert that the new schedule fits. No quality or benefit claim follows from
protocol acceptance. A failure to retain facts within 512 tokens is a valid result.

## Exact reviewed files

| File | SHA-256 |
| --- | --- |
| `PROTOCOL.md` | `1651eab3048a7ff8d94204c7007b6e9fd7ea591a462068185126df865dacc341` |
| `chunks.mjs` | `b4077ee20d404a444fe91ae1bee149b9ce12e5f19388fb129857b99d79aabfc6` |
| `preflight.mjs` | `8f52d37b6cc12c610a772fa4469cd23de08476a9ee9893dd0d807710244c48ef` |
| `ledger.mjs` | `a3dcad9893f1c14331b81ab2533f7a37ff4cd7ae52b1780db5a9deec43447ca9` |

## Open Questions

Coordinator owns the pending runner, actual tokenizer admission, complete freeze,
claim-state implementation and independent score review. Does citation burden improve
attribution enough to offset fewer retained facts? Does low reasoning leave adequate
note content inside 512 completion tokens? These remain empirical hypotheses.
