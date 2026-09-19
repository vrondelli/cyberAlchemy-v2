# Bounded full-S v3 readiness

This additive successor implements the user's operational reserve override recorded in [OPERATING-RESERVE-AMENDMENT.md](OPERATING-RESERVE-AMENDMENT.md). It preserves earlier guard, host-v2 wrappers and frozen artifacts. No provider, tokenizer, network, live launch or freeze creation occurred during implementation.

`../../storage-host-small-run.mjs` retains verified D: mount/registry identity and 8 GiB guest free space, with a 1 GiB host floor. Launch additionally reserves 32 MiB. Per-event and pre-dispatch checks retain these new floors, with no C: fallback. Source, cohort, reference, generation and judging rules are unchanged: four pairs, eight answers, 153 generation calls, two workers and actual 8K admission.

`output-budget.mjs` wraps the inherited durable exclusive writer for every generated wrapper artifact. Each generation or evaluation directory has a 32 MiB cap. Ordinary artifacts stop at 24 MiB; final GENERATION-SEAL.json or RESULTS.json may use the reserved remaining space but must itself fit within 8 MiB. The guard sums the greater of file logical length and allocated blocks, includes directories, and adds rounded allocation plus one metadata block before each write. Symlinks, special files and excessive directory entries fail closed. A rejected ordinary event remains in the wrapper's in-memory event stream, preserving known usage for its final artifact. If the final artifact itself cannot be persisted, inherited error handling attaches the in-memory seal/report; this is not a claim that any filesystem failure is recoverable.

The separate freeze schema is `are.full-s-live-freeze/v3`, filename `live-bounded-v3-freeze.json`. It binds the small-run guard, verified host JSON/provenance, output-budget implementation and operating-reserve amendment. Review files are LIVE-BOUNDED-V3-REVIEW.json and EVALUATOR-BOUNDED-V3-REVIEW.json, scopes full-s-generation-bounded-v3 and full-s-evaluator-bounded-v3. Single-use generation/evaluation namespaces are live-bounded-v3-rN and score-bounded-v3-rN.

Thirty-one targeted offline tests pass: eleven guard cases, seventeen inherited/amended wrapper/scoring cases, and three output allocation/reserve cases. Synthetic exchanges use injected functions without sockets. Freeze-builder syntax is checked without executing it.

## Open Questions

Independent review, exact review-bound freeze and actual corrected storage admission remain required. The capacity override does not establish that restarting the PC will reclaim storage, and does not permit unchecked growth. The output cap covers owned generation/evaluation artifacts, not unrelated concurrent filesystem activity. No campaign quality or savings outcome exists for this unexecuted successor.
