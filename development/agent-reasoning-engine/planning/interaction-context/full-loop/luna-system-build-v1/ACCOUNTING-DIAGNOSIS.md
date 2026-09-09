# Credit-accounting diagnosis

The runner's budget design measured one Luna worker but watched a shared account.
Its client-side stop could not cap usage from the coordinating conversation or
concurrent sessions, and checked the balance only between completed worker turns.
The old 40-credit envelope was not a guaranteed total-experiment spending cap.

## Reconciliation of the recorded interval

| Component | Credits | Evidence ceiling |
| --- | ---: | --- |
| Luna worker, standard rate | 0.48907 | Token-based estimate |
| Luna worker, previous padded estimate | 0.50396 | Estimate with input reserve |
| This Astra coordinating session | 21.92255 | Standard-rate estimate |
| Two other local Astra sessions | 81.66810 | Standard-rate estimate; shared billing account unverified |
| Shared account decrease | 190.12757 | Recorded balance snapshots |
| Remaining difference under the standard-rate/shared-account assumption | 86.04785 | Unreconciled, not a Luna charge |

Local telemetry contains 13 controller usage updates and 14 updates in two other
Astra sessions during the approximately five-minute window. Counting deltas of
unique cumulative counters avoids counting repeated token notifications twice.
Cached input receives its discounted rate; reasoning output is not added a second
time. Only token/model/timestamp metadata was extracted; conversation content and
credentials were not copied. The JSON companion records the selected evidence.

Rates were checked against [official Codex pricing](https://learn.chatgpt.com/docs/pricing).
Luna's existing per-million unit conversion is correct. The worker used 11,912
input and 14,317 output tokens. Astra's standard rates are materially higher.

This confirms concurrent model activity, not an itemized invoice. The runner did
not timestamp each balance read; the diagnostic window uses start plus elapsed
runtime. Request boundaries, speed tiers, delayed billing, additional sessions,
and whether the other sessions share the same billing account prevent exact
reconciliation. Do not label the residual as money spent by Luna or ARE.

## Corrected operating procedure

1. Keep separate ledgers for worker estimates, controller estimates, unrelated
   account activity and observed balance movement. Never allocate an account-wide
   delta to one worker or compare two arms using that delta.
2. Preserve a priced model/tier record, cached and uncached token counts, request
   identifiers and UTC timestamps on every usage and balance event. Missing rates
   or usage make attribution unknown, never zero.
3. For a future experiment, let the deterministic host runner perform waiting,
   acceptance and progress logging. Avoid repeated model-driven polling through a
   large-context controller. Controller preparation and final review still cost
   tokens and must appear in the experiment budget.
4. Retain both a worker-estimate stop and the conservative account-drop stop.
   Timestamp their inputs and report their causes separately. Neither is a hard
   server-side spending cap, and in-flight work can exceed a client-side reserve.
5. Before another paid run, use a quiet account window or an independently metered
   billing allocation, verify remaining budget, and establish how controller cost
   is covered. Exact historical settlement needs itemized account usage evidence;
   it cannot be recovered from these snapshots alone.

Operational owner: experiment runner/controller. Affected stage: paid model
execution. Product construction remains at the unchanged Luna v1 candidate, with
its two review defects and failing model-authored test. ARE and v2 are unrun.
The diagnosis adds evidence only: no new experimental model calls, runner changes,
model configuration changes, top-ups, publication or candidate repairs occurred.
This coordinating diagnosis itself must not be described as free account usage.
