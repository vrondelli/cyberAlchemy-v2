# Independent isolated evaluator core review

Approved offline at the exact bindings below. All12 synthetic evaluator tests independently passed, including unchanged native rubric rendering with synthetic references. No actual reference answer, gold dataset, provider, tokenizer endpoint or network was accessed.

The full-S loader requires the separate reference package, pinned full-source revision/SHA/bytes/500 records, fixed four IDs, bounded per-file hashes and exact source question/type/date identity. It returns only a hashes-only public binding and an isolated scoring closure. Native rubric hash is fixed; response interpretation accepts only exact normalized yes/no.

Scoring requires a terminal, source-valid, transport-settled generation seal, reconciled known call/pair/global usage, eight fixed answer slots and a separate evaluator freeze binding the exact seal, references, code and rubric. Failed/missing answers remain unsuccessful and do not produce fabricated judge requests. Both arms retain four-slot denominators. Arm labels do not enter judge prompts; schedule IDs are opaque.

Each judge is freshly metered with input<=6976,1024 reserved output and total<=8000; at most eight calls reserve64000. Failed costs remain allocated; missing usage holds8000 and stops new calls. Corrected dispatch handling preserves authoritative receipt usage despite zero exception shortcuts; unproven not-started claims remain unknown. Reasoning/cache subtotals must fit parent totals. Invalid judgments retain spend without correctness credit. Public evaluator journals exclude prompts, reference values, response text and raw error text.

| Source | SHA-256 |
| --- | --- |
| [evaluate.mjs](evaluate.mjs) | `11b5e0575b945d1ffb1f2fcabc62e063489d2d5c0bbce43d2cd7fd08e4793004` |
| [evaluate.test.mjs](evaluate.test.mjs) | `eaede88928ee809b74162656b5d09f2efccac57a700b8be29bb0bc1afeed9c76` |
| [adapter.mjs](adapter.mjs) | `bb1c30998933d15851d906002ec70b9d2ebbccef92e26264886f58dfb5b47226` |

## Open Questions

The actual same-variant identity binding, prospective scoring wrapper, transport log redaction, full source/code freeze and final live review remain separate gates. In particular provider transport receipts can contain response text unless the scoring wrapper redacts them; a judge echo must not expose reference values through public logs. Generation needs a global seal before any gold loading for scoring. Same-model rubric judgments and four tasks do not prove broader perfection; quality/completion and>=15% total costs require actual sealed results.
