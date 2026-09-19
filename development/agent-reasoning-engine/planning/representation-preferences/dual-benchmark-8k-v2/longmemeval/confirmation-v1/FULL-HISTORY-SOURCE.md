# Pinned full-history source and bounded acquisition plan

Status: primary-source metadata verified; no full dataset downloaded, no tokenizer or generation calls, and no gold values output. Benchmark research is already authorized. Streaming extraction, storage checks, source validation and experiment instrumentation remain prerequisites; another user permission request is not the missing gate. The oracle-only candidate in [PLAN.md](PLAN.md) remains unchanged and cannot substitute for full-history confirmation.

## Exact upstream object

The official repository points to the cleaned release and distinguishes S full histories from oracle evidence-only histories. It describes the original S setting as approximately 115K Llama-3 tokens, versus oracle-only evidence sessions. That is upstream approximate characterization, **not target-model token measurement of the cleaned four-task cohort**. The repository's documented schema includes question ID/type/date/text, history dates and session arrays, alongside evaluator labels that must be removed. [Pinned official README](https://github.com/xiaowu0162/LongMemEval/blob/9e0b455f4ef0e2ab8f2e582289761153549043fc/README.md)

| Binding | Exact value |
| --- | --- |
| Dataset repository | `xiaowu0162/longmemeval-cleaned` |
| Immutable dataset revision | `98d7416c24c778c2fee6e6f3006e7a073259d48f` |
| S full-history filename | `longmemeval_s_cleaned.json` |
| Exact size | `277383467` bytes, approximately 264.53 MiB |
| LFS content SHA-256 | `d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442` |
| Git file object ID | `9d31e513f6a03c21044f037a81cc34ddc7d7eaa6` |
| LFS pointer size | `134` bytes |
| Xet object hash, not the raw-file SHA | `fe0747f5550e9fde473a53e420873d14df62a7f1500aa234b1d8758d57abe399` |

These bindings come from the pinned [Hugging Face tree metadata API](https://huggingface.co/api/datasets/xiaowu0162/longmemeval-cleaned/tree/98d7416c24c778c2fee6e6f3006e7a073259d48f?recursive=false&expand=false). The later source stream must use the immutable [S object endpoint](https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned/resolve/98d7416c24c778c2fee6e6f3006e7a073259d48f/longmemeval_s_cleaned.json), not `main`. The API response was 1,127 bytes; no dataset body was requested in this research step.

The pinned dataset card declares MIT, English, and the exact oracle/S/M filenames. It explains that this cleaned version removes interfering noisy sessions. Preserve this provenance and attribution rather than treating the cleaned file as the original unmodified paper release. [Pinned dataset card](https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned/raw/98d7416c24c778c2fee6e6f3006e7a073259d48f/README.md)

The official code repository is also MIT licensed. Its reviewed revision is `9e0b455f4ef0e2ab8f2e582289761153549043fc`; README SHA-256 is `c4ff45676683d9e2f7cf7d9099d26426f14635ec110dbb1da818d1019a142573` and LICENSE SHA-256 is `d3c4b9aa54759df6ded337978a6f3b55b75615e5e4525c3b82d7e2627d4b9732`. Retain the applicable license notice with any extracted source package. [Pinned official license](https://github.com/xiaowu0162/LongMemEval/blob/9e0b455f4ef0e2ab8f2e582289761153549043fc/LICENSE)

The same tree metadata identifies the local oracle object as 15,388,478 bytes with SHA-256 `821a2034d219ab45846873dd14c14f12cfe7776e73527a483f9dac095d38620c`, matching the prior local schema audit. The full-history S object is a different file; identifying it does not change the existing oracle candidate's provenance.

## Exact source-only projection

Use the existing four reserved question IDs, without score or difficulty filtering: `09ba9854_abs`, `06db6396`, `cc06de0d`, `54026fce`. This creates a **separately versioned S-variant study**, not a replacement of oracle histories under an old source hash. Verify all four occur exactly once and preserve all dated sessions and user/assistant turns in the S file for those IDs. Do not select sessions using oracle overlap or evaluator labels.

The parser may emit only `question_id`, `question_type`, `question`, `question_date`, `haystack_dates`, and `haystack_sessions`. Within sessions, retain only `role` and `content`; reject invalid types and unsupported roles. Generate positional source aliases locally and drop original session identifiers from generator input. Drop `answer`, `answer_session_ids`, nested `has_answer`, and every other non-whitelisted field. Validate date/session cardinality and chronological ordering; do not silently repair, truncate or reorder anomalies. This proposed whitelist follows the documented schema; actual S schema validation remains pending until acquisition. [Official schema](https://github.com/xiaowu0162/LongMemEval/blob/9e0b455f4ef0e2ab8f2e582289761153549043fc/README.md#-dataset-format)

Before model use, compare the four whitelisted question/date fields to their oracle counterparts and record any difference as a variant-binding issue, not an automatic substitution. Record per-row source-only hashes, complete-history hashes, counts, source revision and full-file verified SHA. Do not assert genuinely long histories until the real target tokenizer measures each full source history above 8,000 tokens. Generation still requires every actual request plus reserved output at most 8,000 through a reviewed sequential or retrieval protocol.

## Bounded streaming procedure

1. Implement and offline-test a strict incremental JSON parser/projection pipeline, including labels appearing before or after `question_id`, escaped strings, chunk boundaries, duplicate IDs, mismatched dates, and injected cancellation. A token/event parser should discard non-whitelisted subtrees without logging their values. A question ID appearing late must not cause evaluator labels to be buffered with generator state.
2. Run a single HTTPS stream only when it will not interfere with the active ContextBench run. Proposed throughput ceiling: 1 MiB/s, one connection, no automatic retry, timeout/cancellation receipts. Request `Accept-Encoding: identity`; follow the expected Hugging Face object redirect without printing signed query strings. Metadata retrieval is complete; **this stream has not started**.
3. Hash the entire exact response byte stream while the parser processes it. Set a strict network-byte maximum of 277,383,467, reject extra bytes and require exactly that count at EOF. Continue through all 500 documented records even after finding the four candidates; stopping early cannot verify the full LFS SHA. Require the final SHA-256 above. Do not rely on ETag, Xet hash, partial range hash or first-four extraction as equivalent verification.
4. Keep only the four whitelisted source rows in a private staging location. Proposed limits: 8 MiB per selected source row, 32 MiB total source output, 64 MiB parser memory, and at least 128 MiB available within the coordinator's host-disk reserve before streaming. These are explicit admission ceilings, not claims about measured row sizes. If exceeded, stop without publishing partial candidates; review a new limit rather than truncating histories. The 277 MB mixed dataset is never saved to disk.
5. Publish the four-row source projection only after complete hash, size, schema and selection checks pass. The staging directory is not a generator input before verification. Emit an acquisition receipt containing immutable URL, expected/actual byte count and SHA, four selected IDs, source-only hashes, parser/code hashes, bounded resource usage and cleanup disposition. Keep failures/cancellations explicit and clean unverified temporary output.

A full-stream verification still consumes approximately 277 MB of network traffic even though only a small four-row projection is retained. At 1 MiB/s the transfer takes at least about 265 seconds, excluding latency. Schedule it outside the active bandwidth-sensitive run; bounded disk usage does not make the transfer free.

## Evaluation separation and unresolved gates

Reference answers belong in a separate evaluator-only projection and process, with separate hashes and permissions. The generator and source selector must never receive that projection. If an evaluator extractor shares the verified byte stream in a later reviewed design, its output must be a separate private artifact, never joined to source rows or logs; alternatively stream the pinned file separately for the evaluator and account for that bandwidth. This research step extracted no references. Freeze the scorer and judge budget independently before live scoring.

Pending implementation gates are the streaming parser/tests, host-disk and bandwidth admission, full-byte integrity verification, source-only schema validation, four target-tokenizer length measurements, exposure re-audit, and a new S-variant comparison manifest with complete model/judge cost accounting. The existing oracle JSON remains unchanged. These are instrumentation and scientific readiness gates within the authorized research, not a missing user authorization.

## Open questions

Do all four reserved IDs exist unchanged in the pinned cleaned S file? Do their complete histories exceed 8,000 target-model tokens, and do all projected rows fit the proposed resource ceilings? Which full-task control and treatment preserve the original memory-efficiency question at this larger scale? Can references be isolated during the same stream without broadening generator access? The metadata establishes a concrete acquisition target; it does not settle these empirical and implementation questions.
