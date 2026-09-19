# Source-order schema amendment

The terminal source-s-v3 attempt reported `projection.history-dates-out-of-order` at record 234 after 129,892,352 parser bytes, including read-ahead. Its storage guards admitted and provider calls were zero. This establishes the behavior of the received prefix from the pinned endpoint, **not** a fully hash-verified dataset fact: parsing stopped before whole-object SHA verification. The original chronology requirement was unnecessary for faithful source projection.

The projector now preserves exact upstream session/date positional order, without sorting, truncating or dropping turns. Date string/type/calendar checks, session/date cardinality and all other schema, hash, byte, memory, storage, privacy and publication checks remain. Selected-row receipts add only `history_dates_nondecreasing`, computed from date/time components, with equal dates admitted. This boolean is descriptive metadata, never an eligibility or selection filter. No source text or labels enter this diagnostic.

The adapter likewise accepts nonmonotonic dated histories, validates calendar-format/types/cardinality, and keeps original source positions through flattening, ranking tie breaks, projection restoration and ingestion chunk coverage. Its inherited control ingestion phrase “next chronological conversation chunk” is locally replaced with “next conversation chunk in original source order (dates remain attached)”. The frozen dependency is unchanged. Both final answer policies remain identical. Source dates still convey event timing; source position is not asserted to be chronological.

The pinned source remains `longmemeval_s_cleaned.json`, revision `98d7416c24c778c2fee6e6f3006e7a073259d48f`, 277,383,467 bytes, SHA-256 `d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442`. The four fixed IDs and all acquisition protections are unchanged. Full-object verification remains mandatory before publication. The static historical diagnostic vocabulary retains the old ordering reason so historical failures remain interpretable.

## Validation and bindings

33 Python synthetic tests pass under 64 MiB, and 12 adapter tests pass. New tests verify unsorted date/session positional pairing and source-content preservation, decreasing times on one day, duplicate dates, descriptive metadata, malformed/calendar-invalid/nonstring dates, cardinality rejection, whole-turn adapter coverage and corrected prompt wording. No real dataset, tokenizer, provider or network calls occurred in this amendment.

| File | SHA-256 |
| --- | --- |
| `project_stream.py` | `134f8fb2f7a17ab9d7c240e695aea8cd06f86887a2219094001029c6c71ae0a2` |
| `adapter.mjs` | `bb1c30998933d15851d906002ec70b9d2ebbccef92e26264886f58dfb5b47226` |
| `test_project_stream.py` | `dd969d55375a9b1ecb7cb757e233c399333e23e50d352f904aa7748ba2a15d58` |
| `adapter.test.mjs` | `3b3c1236e03da9e30a025d3588b7c05656f82da2c38f9a439435f75ad19fdb39` |
| `acquire_source.py` | `205faf6f827e03ef8666a2131f4cb8127f33c8353fb5f11870d9cbb7c46bb4b7` |
| `source-s-v1.attempt.json` | `64bb53f61b59934f7e5e364c96fffadfd97e2ff7d1eef1450935094dbaa4c043` |
| `source-s-v2.attempt.json` | `bd9940cf1d5120bf659d49577808b564986f33cd4857baf62cf5d1559b4efcf2` |
| `source-s-v3.attempt.json` | `7a0c9eb4fed7d542ae313c19c490f0c655f14abf73b8ad0627c028cb4ed1027d` |

The three historical failure markers are preserved; a new attempt must have its own marker. Earlier exact-hash reviews remain historical evidence, superseded for the changed projector/adapter only by this amendment and its independent review.

## Open Questions

Independent review is required before the next separately recorded acquisition. The prior prefix failure does not prove the remainder of the full stream will pass other schema checks. Real source publication, actual-tokenizer long-history qualification, full ingestion budgets, and native isolated evaluation remain pending. This amendment does not claim benchmark success or relax the quality/completion objective.
