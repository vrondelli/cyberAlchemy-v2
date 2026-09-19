# Admission capacity review

Status: measured offline limitation; current candidate is not ready for paid
long-trajectory launch. No provider or storage cap was changed.

## Measured evidence

The [probe](ADMISSION-CAPACITY-OBSERVATION-R1.json) ran all twelve oversized
assignments through the current composed runner. Every assignment selected final
context and reconciled. All source repositories were temporary and removed.

| Arm | Model calls per task | Tokenizer calls per task | Maximum fits per batch | Allocated bytes per run |
| --- | ---: | ---: | ---: | ---: |
| Minimal history | 3 | 7 | 5 | 414,356 |
| Current ARE | 3 | 8 | 6 | 852,408 |
| Independent investigations | 10 | 26 | 5 | 1,508,688 |

All run artifacts together occupied 11,102,088 allocated bytes; outcomes occupied
2,085,564 bytes under a separate guard. The ordinary allowance is 25,165,824 bytes
per guard, with another 8,388,608 reserved for final artifacts. These are measured
short-fixture sizes, not a bound on a full research run.

Model/tokenizer responses are local fixtures. The probe uses the production
transport, persistence and reconciliation path; it does not measure GLM quality,
paid model-token use or provider tokenizer accuracy.

## Capacity finding

The inherited transport permits 192 tokenizer requests for a 96-call ordinary
arm and 291 for deferral mode. One oversized batch required five or six fitting
measurements. With repeated oversized batches, fitting can exhaust this allowance
before the model-call ceiling. This is a concrete possible failure, not proof
that a particular benchmark task will hit it.

The halving algorithm terminates: at most eight results, each at most 100
reducible units, require at most 56 reductions plus the initial rendering.
Consequently its worst-case measurement demand can exceed existing transport
capacity. Serialization rejections need no tokenizer call, and cached renderings
are reused, but neither establishes sufficient headroom in general.

Full outputs also appear in normal tool journals and the new archive records.
Captures, episode/results and sealed outcomes add further storage. The short
fixture cannot establish long-trajectory fit. The existing guarded writer
prevents uncontrolled disk growth; reaching its ceiling would still invalidate
the experiment through incomplete evidence.

## Next decision and tasks

Keep the existing caps for now. Before a paid successor:

1. Derive a shared fitting policy with an explicit per-episode tokenizer budget,
   preserving a reserve for remaining model requests and final selection.
   Compare fitting demand and delivered coverage with the current policy;
   do not silently substitute smaller evidence just to pass capacity tests.
2. Eliminate redundant archive payloads through durable digest references to
   already-recorded tool results, while keeping original bytes recoverable and
   distinguishing archived from confirmed delivery. Test missing/tampered
   referenced evidence and writer failures.
3. Run a bounded long-trajectory offline stress test under the unchanged guards,
   including terminal persistence and outcome sealing. Then review the exact
   prospective candidate and register its experiment before paid execution.

This is a refinement of budget-aware-delivery in the
[native research follow-up](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json),
not evidence for either memory architecture. The radical retrieval-first branch
and repaired current architecture must use the same capacity policy. Perfect
quality, 15% total-model-token savings, complete accounting and untouched
confirmation remain unchanged.

Operational owner: benchmark orchestrator. Exact live freeze and D:/WSL storage
admission are pending. Publication and release remain deferred.

## Open Questions

Exact fitting reservation policy; coverage effects of faster fitting; reusable
durable output references; full-length storage demand; independent review and
the retrieval-first experiment contract. Provider tokenizer requests are not
counted as model-generation tokens, but their hard limit affects completion.
