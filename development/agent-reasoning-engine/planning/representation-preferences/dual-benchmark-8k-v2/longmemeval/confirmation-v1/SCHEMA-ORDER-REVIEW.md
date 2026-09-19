# Independent source-order review

Approved for the bounded schema correction and a separately recorded acquisition under the unchanged native storage guard. This is not approval of a model run or a benchmark-success claim. No blocking findings remain in this change.

The failed v3 receipt identifies `projection.history-dates-out-of-order` at record 234, after 129,892,352 bytes including read-ahead. It establishes a rejected received prefix, not a fully verified upstream object: final SHA verification was not reached. Preserving upstream order removes an unnecessary ordering assumption without sorting, dropping, merging or reassigning dates/sessions.

The projector retains strict date syntax/calendar validation, positional date/session cardinality, message schema/privacy filtering, four fixed IDs, pinned revision/full SHA/byte/record counts, output bounds, and publication/cleanup checks. Inverting exactly the order check removal and diagnostic return-field addition reconstructs the previously reviewed projector SHA `092e14a5ff652ec23350d348737bc102ccd27f9f9c5903eb6824ec95d504a205`. The new nondecreasing-date flag is descriptive only and does not filter rows.

The adapter preserves original positions in flattening, priority tie breaks, selected-turn restoration and chunk coverage. It now validates history date format/calendar explicitly. Both final-answer policies remain equal. Its local control ingestion wrapper corrects the inherited chronology wording while retaining the frozen dependency; source order is not represented as event chronology. Original date strings still accompany evidence.

Independent verification passed: 33 Python synthetic tests under a 64 MiB address-space limit and 12 Node adapter tests. Coverage includes reversed dates with intact contents/pairing, decreasing times on one day, equal dates, invalid date/type/cardinality rejection, source binding/privacy, request caps and corrected prompt wording. No network, real source extraction, tokenizer or provider calls occurred. Wrapper and native storage guard hashes equal their pre-change values. Historical v1/v2/v3 failure markers are preserved.

## Exact reviewed bindings

| File | SHA-256 |
| --- | --- |
| [project_stream.py](project_stream.py) | `134f8fb2f7a17ab9d7c240e695aea8cd06f86887a2219094001029c6c71ae0a2` |
| [adapter.mjs](adapter.mjs) | `bb1c30998933d15851d906002ec70b9d2ebbccef92e26264886f58dfb5b47226` |
| [test_project_stream.py](test_project_stream.py) | `dd969d55375a9b1ecb7cb757e233c399333e23e50d352f904aa7748ba2a15d58` |
| [adapter.test.mjs](adapter.test.mjs) | `3b3c1236e03da9e30a025d3588b7c05656f82da2c38f9a439435f75ad19fdb39` |
| [acquire_source.py](acquire_source.py) | `205faf6f827e03ef8666a2131f4cb8127f33c8353fb5f11870d9cbb7c46bb4b7` |
| [storage_guard.mjs](storage_guard.mjs) | `bd73efe258976c2d44992fa153122c6f3e6dbc5ee00a2be038f36f53fb5d150f` |
| [SCHEMA-ORDER-AMENDMENT.md](SCHEMA-ORDER-AMENDMENT.md) | `431feeb11be293ad9c00c04450331bf3a1dc136aff86df19ca489ea5bcda536a` |
| [source-s-v1.attempt.json](source-s-v1.attempt.json) | `64bb53f61b59934f7e5e364c96fffadfd97e2ff7d1eef1450935094dbaa4c043` |
| [source-s-v2.attempt.json](source-s-v2.attempt.json) | `bd9940cf1d5120bf659d49577808b564986f33cd4857baf62cf5d1559b4efcf2` |
| [source-s-v3.attempt.json](source-s-v3.attempt.json) | `7a0c9eb4fed7d542ae313c19c490f0c655f14abf73b8ad0627c028cb4ed1027d` |

## Open Questions

A new attempt must pass the complete pinned-object SHA and all remaining schema/resource checks before publishing a source package. Any previously unobserved source incompatibility must fail explicitly. Original-history tokenizer qualification, frozen generation/evaluation budgets, isolated native evaluation and the full quality/15% efficiency conjunction remain pending. Earlier reviews and failed attempts remain historical evidence; this review does not convert them to successful acquisitions.
