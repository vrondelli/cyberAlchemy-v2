# g6 schema-selection decision gate — admitted run 02

Status: **PASS — admitted evidence-led local treatment selected**

Target: local candidate IntentRecord used by the private agent reasoning-engine
authoring package.

This gate is controlled by the admitted terminal run named in
[`../../../../receipts/intent-schema-live-run.json`](../../../../receipts/intent-schema-live-run.json).
It cannot promote CAV2 definitions, establish semantic truth, authorize
implementation, or support an anti-bias efficacy claim.

## Controlling evidence

- [`RESULT.md`](RESULT.md), SHA-256
  `580bb856a37aea21939bd2ffc06c4e505243167ab0397c7a2e4d0605d65abf3b`.
- [`adjudication-packet.json`](adjudication-packet.json), SHA-256
  `b1e07f0f8644bd9f4a65fcb270f68ad261317f5b05cbbb963f11ce4df8e6798c`.
- [`metrics.json`](metrics.json), SHA-256
  `4c3e7a6ca00db2917225b047070b1c849a1a632789485252a0d99c593c10914a`.
- [`records.jsonl`](records.jsonl), SHA-256
  `29788dc4a4db56ee7de346ca66683b07ac6a75af540d8f8522593e79e3a3609a`.
- `CAV2-D39`: upstream seven-question semantic minimum.
- `CAV2-D56`: conformance supplies shape evidence only.

## Provenance correction

The previous decision exchange accidentally used run 01. The terminal s6
receipt marks that run blocked before population and excludes it from live
evidence. Its proposal materially differs from run 02: run 02 recommends
revising `revision_route` capture and does not support a selector/excerpt-status
or timestamp-envelope redesign. Prior answers therefore do not transfer as
consent.

## Blocker — admitted local candidate treatment

Question: Which treatment should the local candidate apply from run-02 evidence?

### Option A — admitted evidence-led treatment (recommended)

- Revise `source` guidance so semantic expresser/accountable authority remains
  distinct from technical `raw_intent.source_ref` provenance.
- Retain `purpose`, `scope`, `constraints`, `target_pressure`, and
  `current_output_hypothesis` as separate CAV2-D39 projections.
- Retain `revision_route` as a required semantic question, but revise capture
  guidance: an owner route must be explicit or the value stays `unresolved`.
- Retain `raw_intent` and identity/version mechanics.
- Leave `revision_history` granularity unresolved until a revision-bearing run.
- Preserve whole-field posture; finer-grained provenance remains a possible
  later experiment rather than a selected requirement.

Benefit: follows the only admitted 12+3 run without converting frequency into
semantic necessity. Cost: the candidate remains partly provisional and carries
explicit residue.

### Option B — owner-designed envelope from the earlier proposal

Adopt the selector, excerpt-status, and split-timestamp design despite the lack
of admitted run-02 support, and classify those elements as owner-designed local
hypotheses rather than evidence-led findings. Also decide separately whether to
accept run 02's `revision_route` revision.

Benefit: preserves the earlier desired shape. Cost: it cannot honestly be
described as selected from this experiment and introduces another blocker.

### Option C — defer and gather stronger evidence

Do not select a local schema. Run revision-bearing and/or independently
annotated evidence before engine reconciliation.

Benefit: avoids fixing the shape from one author and 15 local records. Cost:
the current dispatch remains paused before s7.

### Explain / more context

Non-committal. Explain the run difference, record examples, and downstream
effects, then present the same options again.

Selected option: **A — admitted evidence-led treatment**

- Source of decision: direct operator response, `A`, after the provenance
  correction and full run-02 proposal were presented.
- Timestamp: `2026-07-22T11:56:09-03:00`.
- Rationale: use only the admitted run-02 evidence to revise semantic source
  capture and revision-route guidance; retain the remaining semantic fields,
  raw intent, identity, version, and whole-field posture; defer revision-history
  granularity and finer-grained provenance. No selector/timestamp/excerpt
  redesign is selected by this decision.

## Decision record fields

- Source of decision: direct operator response against this run-02 gate.
- Timestamp: `2026-07-22T11:56:09-03:00`.
- Decisions resolved: 1/1.
- Remaining blockers: 0.
- Deferred evidence already known: inter-rater consistency, representative
  fitness, revision-history granularity, and finer-grained provenance.
- Next step: proceed to `s7-engine-define-reconcile` under the confirmed
  dispatch; preserve all promotion and implementation boundaries.
