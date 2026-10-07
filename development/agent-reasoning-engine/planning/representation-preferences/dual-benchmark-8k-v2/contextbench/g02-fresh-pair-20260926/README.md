# G02 fresh paired probe (2026-09-26)

This is a two-task development probe of the R2c ARE candidate against the
pinned DeepSeek Harness control, both using GLM-5.3-Flash on the VPS. It is not
a full ContextBench confirmation or patch-correctness test.

The older `reserved_confirmation_instances` partition cannot be called
untouched: round 30 accounted all 233 identities. We therefore selected one
Go task (`flipt-io/flipt`) and one JavaScript task (`NodeBB/NodeBB`) from the
prepared source-only development partition. Before selection, a literal-ID
search across repository experiment records found no matches for either task
outside generic task manifests; compressed/external evidence is not covered by
that search. Within each of those repositories, the selected ID has the lowest
SHA-256 rank of `g02-fresh-pair-v1\0` plus the ID among unmentioned tasks. Gold
and reference patches were not inspected to choose the pair.

`fresh-pair-are.mjs` binds those task hashes to the existing R2c worker.
`ranked-source-acquisition.mjs` fixes only the long-statement primer admission
failure, preserving the R2c ranking algorithm in the hash-pinned base module.
`run_pair.py` runs two paired arms with separate evidence roots, no model
retry, and a 30-minute per-arm deadline. `run_dsh_repair.py` retries only the
control after a zero-model-call proxy constructor failure. `export_slot.mjs`
converts sealed outputs to native ContextBench predictions without gold; native
scoring is a later local step.

The first two VPS attempts stopped before any benchmark model call. They remain
under `/opt/are-harness-benchmark/g02-fresh-pair-20260926` and
`/opt/are-harness-benchmark/g02-fresh-pair-r2-20260926`. The active attempt is
`/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926`. Do not aggregate failed
attempt cost into the valid-row total without labeling it separately.

## Open Questions

Will both arms export valid selections on each task? Do quality and token
advantages persist on these new tasks? How much of the apparent efficiency is
architecture versus a differing finalization path or control budget stop?
