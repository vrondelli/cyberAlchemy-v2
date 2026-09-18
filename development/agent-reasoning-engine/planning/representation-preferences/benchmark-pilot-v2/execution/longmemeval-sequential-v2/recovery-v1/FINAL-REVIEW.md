# Exact suffix recovery review

Reviewer: `/root/pilot_selectivity`. Date: 2026-09-18. Authority effect: none.
Disposition: no material blocker identified for this exact stopped boundary and
unchanged suffix, subject to the coordinator's immutable recovery receipt. No model
or tokenizer calls were made by this review.

## Evidence

Independently ran `recovery.test.mjs`: **2/2 tests passed**. The read-only prefix
verifier checked original frozen-source hashes, 28 model-start records, schedule
order, matching request/receipt hashes, per-call usage and final-answer receipt
bindings. The stopped prefix has seven completed arm/task answers and **65762 known
model tokens**. The boundary failure is tokenizer `request-failed`, with no additional
model start. No blind-score mapping was needed to establish this operational fact.

Offline execution of the suffix dispatched **36 distinct fake model calls** and no
completed prefix generation ID. Combined answers reached 16; fake suffix usage was
added to the existing 65762 total. This proves runner scheduling/accounting behavior,
not successful live recovery or answer quality.

The recovery begins at a complete arm/task boundary. Therefore skipping the seven
completed arm/task keys preserves all prior evidence and does not discard active
partial notes. The next independent arm/task correctly begins with empty notes under
the original protocol. A mid-ingestion boundary would need a different audited note
state restoration path; this approval does not cover such a boundary.

The single new tokenizer admission attempt is an explicit protocol amendment. It is
recorded in a new exclusive run directory; the failed attempt and original stopped
result remain unchanged. No completed generation repeats, automated retry, task
substitution, output repair, score-based selection or changed prompt is introduced.
A further failure stops again. The same tokenizer reservation, output caps, provider
settings and source-linked claim path remain in effect.

The runtime initializes accounting from the verified prefix and enforces **199499**
tokens for combined sequential-v2 execution. Together with sequential-v1's **5301**
tokens this preserves the **204800** branch ceiling. Tokenizer retries do not create
model generation usage, and the evidence must keep request kinds distinct.

The launcher rechecks declared recovery bindings and original prefix hash, reruns
the original-source verifier and native research continuity against the current
policy, checks disk space and exclusively creates its live
directory. The final synthesis must join prefix and suffix with explicit provenance;
this is an operational continuation, not a fresh independently scored experiment.
Blind review of the already completed answers does not authorize changing the suffix.

## Bounded limitations

The verifier and runner jointly validate the exact current boundary. The coordinator
also added direct assertions of prefix array lengths and deterministic call-ID
derivation, and these additions received source review here. The runner separately
checks metadata lengths; the earlier offline test established the intended split.
This receipt is not a general-purpose recovery-engine certification. It certifies
only the reviewed exact-boundary construction and leaves all existing semantic-score
and source-reference limitations unchanged.

## Exact reviewed files

Paths relative to this directory; SHA-256 byte hashes.

| File | SHA-256 |
| --- | --- |
| `PROTOCOL.md` | `488e6f05727c5f4e57004aa2e6c0d1f262d06f673872362409b9cd28750a0b57` |
| `verify.mjs` | `253c013ab4300626dcf080ae63c662dccbb913ac41a883cdb5d3e4f591e3a3b8` |
| `runner.mjs` | `442e2fb97e6bdd371ed1af8adc14f912dc956e0b6d6d9e1618ae0e14c95a02a4` |
| `run.mjs` | `fc8754d148e64b554cfa767d0a217f1d0e016ec709ee0fc9c24c3d06711947e6` |
| `recovery.test.mjs` | `55fb7baa92cf762fe7d8cdccc8475e6abbdb9443b7ec54bab059bb78ae73a533` |

## Open Questions

Coordinator owns the recovery freeze, live suffix execution, further failure handling,
blind review of remaining answers and combined D02/D04 evidence. Provider availability
is unproven until live dispatch; no benchmark completion is claimed by this review.
