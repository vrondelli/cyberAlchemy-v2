# Investigation retention and finalization candidate

Status: additive candidate; five final offline tests pass, including finding-only enforcement
and the full twelve-assignment stress. Independent review remains pending. No live launch or benchmark-quality claim.

## Policy

The visible investigation request retains task/question instructions and the
latest complete assistant/tool exchange. Older captures and receipts remain
available to the branch evidence join; this changes replay policy, not evidence
identity or archive membership. Its effect on model quality is unproven.

Before an exploration call, the candidate measures the entire envelope through
the transport cache. Exploration is admitted only if the 24K/24-call phase can
also reserve 8K tokens and one call for submitting findings. Otherwise the next
request exposes only submit_investigation and asks for supported provisional
claims or an honest empty set. A source call or mixed submission in that phase
is rejected before tool execution. Findings are not generated deterministically.

Plan, investigation and join caps remain unchanged, as do the 96K/96-call arm
limit and measured 8K request limit. Terminal source selection still validates
against receipt-bound evidence and the pinned source. No phase transfers,
automatic retries or additional model allowance are introduced.

## Offline evidence and storage scope

The repeated-read fixture requests twelve exploration rounds and charges each
local response its simulated measured input usage. It respects the actual
available tool set when the candidate requires finding submission. Three policy
tests initially passed; a fourth now covers finding-only enforcement.

With the original shared 24 MiB ordinary storage allowance, the first independent
assignment now completes 19 model calls and closes all investigations, but later
assignments stop at the disk guard. This isolates retention progress from storage.

An explicitly separate storage fixture declares 128 MiB maximum run artifacts,
including 16 MiB reserved for final writes. Outcome storage remains at 32 MiB,
including its existing 8 MiB reserve. Two workers and all twelve assignments are
unchanged. D: had approximately 24 GB free before launch; temporary fixture
repositories are removed after completion. No general or production cap changed.

Under this allocation, all twelve assignments completed and reconciled: 14 model
calls per minimal/current task and 19 per independent task. Run artifacts occupied
72,174,136 allocated bytes and outcomes 12,325,564 bytes in the first full pass.
Tokenizer counts per task were 91, 141 and 74 respectively, below existing
192/291/192 limits. [The final observation](INVESTIGATION-RETENTION-STRESS-R1.json) owns exact final-run measurements.
This is evidence for the tested trajectory, not a bound for every future task.

## Research and next work

These changes address shared completion defects under
[the native research follow-up](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
They do not prove memory architecture superiority, perfect native quality or
15% model-token savings. A successful offline fixture is not a native benchmark
score. The original fresh-control comparison and untouched confirmation remain.

Next runnable work: independent review, exact source closure and prospective
experiment registration. State the new replay policy and storage allocation in
that experiment. Keep the radical retrieval-first hypothesis as a competing
branch; no accepted quality result is inferred from infrastructure tests.

Operational owner: benchmark orchestrator. A live storage envelope still requires
fresh D:/WSL admission and exact launch review. Publication and release remain
deferred; no external model or evaluator ran in these fixtures.

## Open Questions

Independent review; quality effects of latest-exchange
replay; tokenizer demand for different trajectories; full prospective source
closure; live storage policy and admission; retrieval-first treatment/ablation
and exact experiment registration.
