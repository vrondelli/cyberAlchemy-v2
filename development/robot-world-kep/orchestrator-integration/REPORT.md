# Bounded orchestration candidate report

Date: 2026-09-12. Status: tested local candidate. Authority effect: none.
Product approval: not requested. Open questions: below and PLAN.md.

## Delivered

`robot-world.run/v1` and `robot-world.verify/v1` execute as two dependent commands
through the sibling OrchestratorService. A dedicated local executor selects only
those contracts before leasing, holds capacity while the child runs, renews its
fence, and submits digest-bound receipts/events to the existing owner. Python
owns the isolated default world and its action checks. Verification independently
reconstructs action and clock transitions before comparing the scripted trace.

The local driver supports completed replay without worker execution. An incomplete
owner refuses redispatch. A worker duplicate returns its unchanged cached bytes;
conflicting or interrupted attempts reject. Cancellation stops between ticks and
never releases the verification dependency. Local simulation/artifact effects are
reported as Applied, independently of the non-authorizing candidate posture.

Both stale local Cargo paths now select the complete pinned vendored kernel.
`build.py` verifies its three hashes before building. `run-rwo` binds the already
installed ICU 74 libraries through the repository compiler launcher. The old
historical source receipts remain unchanged. The standalone ARE decision worker
rejects missing/non-boolean `ok` and has six malformed-result probes.

## Validation

[verification.json](evidence/candidate-v1/verification.json) records exact commands,
exit codes and retained logs for **124 passing tests**:

- 16 Python contract/native-process tests: direct equality; action/clock/frame/trace
  tampering; exact float bytes; duplicate/conflicting/interrupted attempts; source
  binding; owner cancellation; malformed fence and incomplete success results.
- 36 existing Robot World tests: all previously missing-binary cases now pass;
  legacy golden behavior and successor dynamics remain covered.
- 71 selected Rust tests: the 69 existing ARE/native/gateway/web checks plus world
  capability/capacity preflight and hard deadline child termination.
- One Node test covers six malformed ARE results with no output receipt written.

The DomainSpec compiler produces two identical builds and validates the checked-in
six projections. The local browser smoke checks desktop/mobile layout, keyboard
frame selection and absence of page errors. These checks do not contact a model
or deploy a service.

The current 100-tick demonstration constructs **four buildings** and completes
both orchestrated commands with one peak occupied slot and zero slots retained
after completion. Its final revision is 300. Initial state, profile, engine,
world output and verification references are in
[demo.json](evidence/candidate-v1/demo.json). The replay page is
[runs/demo-v2/replay.html](runs/demo-v2/replay.html).

[candidate-manifest.json](evidence/candidate-v1/candidate-manifest.json) freezes
source, relevant dependencies, binaries, test evidence and the demonstration.
It is a local reproducibility record, not authenticated provenance or approval.

## Findings retained during construction

The first end-to-end attempt failed verification because a Rust JSON roundtrip
changed floating-point digits in a Python event. No failed result was accepted as
verified. The handoff now carries the original UTF-8 JSON string and raw digest;
the verifier checks those bytes before parsing. The regression compares the full
native run bundle to direct Python execution.

The first unit run exposed tuple/list representation differences when comparing
an in-memory return with its persisted JSON. The duplicate test now compares the
canonical JSON and unchanged file bytes, which are the actual wire contract.
An initial Rust test used a private helper; it was corrected to inspect the public
snapshot's run path without widening the production API.

## Open Questions and limits

- Scope is the default two-actor fresh world, 1–100 ticks, one attempt, 120 seconds
  wall time and 32 MiB per artifact. No shared-world or checkpoint resume claim.
- The local driver does not automatically supervise an orphan after its own hard
  crash. Incomplete history requires reconciliation and stopping any surviving
  process before another instance is launched. It never silently retries that owner.
- Task/actor identity comes from the trusted local host. Authenticated remote actor
  delegation and deployed dashboard launch controls require later implementation.
- ARE decision results are not launch permissions. The local CLI is owner-directed;
  it does not automatically turn an ARE gate/decision into a world mutation.
- Independent verification checks the bounded transition contract; policy/trace
  repeatability also uses the production policy. This is not formal proof or an
  independent implementation of every policy-scoring algorithm.
- Neural proposals, real dataset-driven policies, settlement and model calls remain
  outside this candidate. Earlier epoch and UI snapshots were not rewritten.
