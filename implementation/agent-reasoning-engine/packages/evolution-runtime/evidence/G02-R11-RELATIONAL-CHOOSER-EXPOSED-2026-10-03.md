# G02 r11 exposed relation-rich C++ chooser — development result

Status, 2026-10-03: **terminal exposed diagnostic; r5 choices sealed and audited, no campaign result**.

The [versioned source-only packet builder](../research/g02-product-r4/build-g02-r11-relational-packets-exposed-r2.py)
used the previously sealed G02 r11 direct-include pool and the same three
already-exposed C++ tasks, ordinals 4, 8, and 12. The `PACKETS.json` SHA-256
is `b0f556d5cbb4a102164e49ca9745dedb92ee54182a59505759def643f38c33bd`.
The per-task eligible counts are 16, 23, and 28; packet JSON sizes are 12,321,
14,955, and 16,451 bytes. Each candidate carries direct include links and up
to three bounded issue-overlap/structural code windows. No gold, DSH selection,
or native score was included. Prior evaluator exposure of this same pool means
this is development tuning, never independent confirmation.

The r2 runner was frozen before dispatch at VPS
`/opt/are/evolution-runtime/g02-r11-relational-choice-exposed-r2/FREEZE.json`.
Its same-account tokenizer returned HTTP 200 and 22 prompt tokens, but the
tiny generation returned HTTP 200 without a usable answer under `max_tokens:64`.
The preflight failed, so **zero task packets were sent**. Its preflight SHA-256
is `6e93d84a275005d41488eba61e6935f92c50dcae388474e5098581fcac77a874`.

The separately frozen r3 runner changed only the tiny-generation output cap
to 256. Its freeze SHA-256 is
`c4ee9550e3f2962eb04ced65afee6bd65d4aa472a0f8b624ca2318359768b287`.
Tokenizer and tiny generation passed; preflight SHA-256 is
`633482414bb72d875730973aecdaa630eb301a52b14337cd4c1e04da4f5cb115`.
The first task request, ordinal 4, then failed in the bounded transport after
277 ms with `content-type-invalid`: the upstream response did not satisfy the
JSON content-type contract. No HTTP status, response body, or provider usage
was available from that transport error. The sealed response SHA-256 is
`b87db3ca00984439d1edf82a36bfccd54b33780cf4a9a52d63350ee0e5046728`.
There was no automatic retry; ordinals 8 and 12 were not dispatched. The
failed request's cost remains **unknown**, not zero. The error does not by
itself identify whether the non-JSON response came from the provider, an
intermediate gateway, request size, or payload inspection.

A final separately sealed r4 diagnostic compacted the same source-only pool
to 7,901/10,166/11,417 packet JSON bytes, retaining all 16/23/28 eligible
candidate paths and two short source windows each. Its packet SHA-256 is
`8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255`.
The r4 freeze SHA-256 is
`4af2fa27087309d75957fe7163325350ab467f2c6564bae6396b4a0190b3482d`.
Tokenizer/tiny-generation preflight again passed (receipt SHA-256
`e60a4bbe6af8714030db5806c00bd3c0505ec3eaca30b663346f16ac70e17cd6`),
but the first task again failed with `content-type-invalid`, this time after
259 ms (response receipt SHA-256
`b8a0727fcbd76ca63af647dd0018bec0b24efc670570d2db08e8562bb15f58ae`).
No task 8 or 12 call and no retry followed. This repeated transport failure
occurs with two different packet sizes; it does **not** establish a byte
threshold, a payload-specific trigger, or a provider-side cause. The r4 failed request's usage is
also unknown. Chooser calls were paused until response status/content-type
metadata could be captured without leaking response bodies.

A one-shot metadata-only diagnostic reconstructed the exact r4 task-4 request
(SHA-256 `cc36795bf612f347112f1769e686d3778ed96c9db9859aeb170266a6803c1ecc`,
8,867 wire bytes) and received HTTP **400**, no `Content-Type`, and a
128-byte body. The body was discarded; only its SHA-256 was retained. The
private freeze and result hashes are
`0e617a1101a4fa6f3aebba6311b9ea6712ab74130877f2fb92ce581f0330c306`
and `6edfe1501902d392604b13ac89aad70e852994c1d07deb6ef3d1191a21a5a95d`.
The local ARE GLM client permits `reasoning_effort` values `low`, `high`, or
`max`, while r3/r4 sent `medium` directly. This is a concrete request defect
consistent with HTTP 400; the discarded body means the provider's exact
rejection reason remains unobserved.

The separately frozen r5 runner changed that field to permitted `low` on the
same compact source-only packets and completed **3/3 valid calls** (freeze
SHA-256 `0096d288fd7a7ef7c58fd0c78f7658efc8ac1f663ca26c89f788ea606ea0b1db`).
All paths and known usage were sealed before evaluator access (seal SHA-256
`5ebfe8c89292b071566b099e7af442e3df83022633ba947d36f4f06823439bf0`).
The evaluator-only hit audit found **2/9** new gold files and **7/9** false
positives, with **7,802** known model tokens over the three chooser calls
(audit SHA-256
`fbe0b392b591be396f22b83707e71b0c64de4daa16903c3dac4a4003b319a458`).
This improves on the earlier exposed 0/9 chooser hit count but is not
independent quality evidence.

An evaluator-only set-based replay verified the archived native file-score
counts before adding the nine proposed files. Across the three exposed tasks,
mean ARE File-F1 moves **0.21667 → 0.26010** counterfactually, versus DSH
**0.24046**. Two tasks improve and one regresses; the task-level deltas are
`+0.11364`, `+0.16667`, and `-0.15000`. Receipt SHA-256:
`2b25709505a73ea0aaaefe2b64ea0199c7b9912c3abb0ae56ae527cc6571fa61`.
This is **not** actual ARE read delivery or native rescoring, excludes any
downstream model/read cost, and uses an already-exposed three-task subset. It
cannot support a G02 campaign or superiority claim. The task-12 regression
follows from zero gold-file coverage in the direct-include candidate pool:
a chooser cannot select missing candidates. The next source-only development
target is coverage beyond direct includes plus selective abstention.

All referenced receipts are retained on the private VPS and have matching
private WSL copies under
`/home/vlad_/are-benchmark-archive/g02-r11-relational-choice-exposed-r2-20261003/`
and
`/home/vlad_/are-benchmark-archive/g02-r11-relational-choice-exposed-r3-20261003/`,
with r4 at
`/home/vlad_/are-benchmark-archive/g02-r11-relational-choice-exposed-r4-20261003/`.
The metadata diagnostic and r5 result are at corresponding private WSL roots
`g02-r11-nonjson-header-exposed-r1-20261003/` and
`g02-r11-relational-choice-exposed-r5-20261003/`.
No actual ARE read, native File-F1/Span-F1, independent cohort, or superiority
claim follows. R5 is a candidate-generation signal, not a promoted read
policy.

## Open Questions

- Which source-only relation can cover genuinely relevant documentation and
  generated single-header mirrors outside direct include neighbors without
  a high-false-positive text pool?
- What confidence/abstention rule avoids three false-positive reads when the
  candidate pool lacks strong support?
- Can a new policy survive actual ARE read delivery, full cost accounting,
  and an independently predeclared fresh matched G02 cohort?
