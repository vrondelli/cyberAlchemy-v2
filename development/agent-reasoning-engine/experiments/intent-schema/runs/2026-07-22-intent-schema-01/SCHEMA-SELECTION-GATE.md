# g6 schema-selection decision gate

Status: **INVALID — run 01 is rejected evidence and cannot satisfy g6**

> Correction recorded `2026-07-22T11:50:58-03:00`: the terminal s6 receipt
> admits run 02 and explicitly excludes run 01 from live evidence. The two
> operator answers preserved below were elicited against this invalid run's
> proposal and therefore do not authorize run-02 schema selection. They remain
> visible as conversation history only. The authoritative pending gate is
> [`../2026-07-22-intent-schema-02/SCHEMA-SELECTION-GATE.md`](../2026-07-22-intent-schema-02/SCHEMA-SELECTION-GATE.md).

Target: local candidate IntentRecord used by the private agent reasoning-engine
authoring package.

This is not a canonical CAV2 definition/schema decision. Definitions-governance
and schema-amendment owners retain any later canonical route.

## Controlling evidence

- [`RESULT.md`](RESULT.md) — bounded findings and candidate actions.
- [`metrics.json`](metrics.json) — 15-record posture/pressure evidence.
- [`records.jsonl`](records.jsonl) — source-locked projections.
- [`corpus-manifest.json`](corpus-manifest.json) — accepted 12+3 freeze.
- [`../../../../spec/INTENT-RECORD.md`](../../../../spec/INTENT-RECORD.md) — candidate under test.
- `CAV2-D39` — seven semantic questions remain the upstream minimum.
- `CAV2-D56` — validator success is shape evidence only.

## Blocker 1 — semantic-field treatment

Question: How should the local candidate treat the seven CAV2-D39 semantic
fields after the live evidence?

### Option A — evidence-led local candidate (recommended)

- **Select:** revise `source`; retain `purpose`, `scope`, `constraints`,
  `target_pressure`, `current_output_hypothesis`, and `revision_route`.
- **Concrete revision:** `source` must distinguish originating actor/owner from
  capture-artifact provenance. Scope/constraint guidance receives examples but
  the fields stay separate.
- **Benefit:** uses the strongest observed pressure while preserving all seven
  upstream semantic questions and explicit missingness.
- **Cost/risk:** the local schema becomes slightly more structured; it still needs
  a revision-bearing future corpus and owner clarification policy.
- **Downstream impact:** Invoke may reconcile the definition and design/plan the
  engine using a local revisable IntentRecord@1. No canonical promotion.

### Option B — freeze the seven fields unchanged

- **Select:** retain all seven and keep the current `source` FieldValue shape.
- **Benefit:** smallest immediate change and simple continuity with the initial
  hypothesis.
- **Cost/risk:** ignores the 15/15 source collapse between actor and artifact
  provenance; future engine work may encode a known ambiguity.
- **Downstream impact:** Invoke can continue, but must carry the source ambiguity
  as an active design blocker/residue.

### Option C — defer semantic selection and run stronger evidence

- **Select:** no field action yet; commission a revision-bearing and/or
  independently annotated corpus.
- **Benefit:** avoids fixing the local shape from one author and 15 local records.
- **Cost/risk:** delays all downstream engine reconciliation, design, plan, and
  final Craft refresh; the current dispatch remains open.
- **Downstream impact:** a new experiment question and Task Session are required.

### Explain / more context

Non-committal. Requesting explanation does not resolve the gate; the same three
options will be presented again with deeper source examples and downstream
effects.

Selected option: **A — evidence-led local candidate**

- Source of decision: direct operator response, `A`, after requesting and
  reviewing the concrete proposal.
- Timestamp: `2026-07-22T11:49:44-03:00`.
- Rationale: accept the evidence-led separation of originating actor/owner from
  capture-artifact provenance while retaining the other six CAV2-D39 semantic
  fields. This selects local candidate treatment only; it does not promote a
  canonical definition, approve the record envelope, or authorize downstream
  action while Blocker 2 remains open.

## Blocker 2 — record-envelope treatment

This decision will be asked after Blocker 1 resolves, unless Blocker 1 selects
deferral.

- Recommended: require a source selector, make excerpt optional/partial, split
  `captured_at` into `recorded_at` plus optional `source_declared_at`, and leave
  `revision_history` granularity unresolved pending revision-bearing evidence.
- Alternative: keep the current envelope unchanged and carry all three issues as
  active residue.
- Deferral: stop downstream authoring until new envelope evidence exists.

Selected option: **A — evidence-led envelope**

- Source of decision: direct operator response, `A`, after Blocker 1 was
  resolved and the envelope alternatives were presented separately.
- Timestamp: Blocker 1 at `2026-07-22T11:46:09-03:00`; Blocker 2 at
  `2026-07-22T11:49:44-03:00`.
- Rationale: require a durable selector, allow excerpts to be explicitly
  partial or omitted, distinguish record time from source-declared time, and
  keep revision-history granularity unresolved until revision-bearing evidence
  exists. This remains a local candidate decision and grants no canonical
  promotion or implementation authority.

## Decision record fields

- Source of decision: two direct operator responses after separate option
  presentations and one requested proposal explanation.
- Timestamp: `2026-07-22T11:46:09-03:00`.
- Rationale: evidence-led semantic and envelope treatments selected as recorded
  above, bounded to the private local candidate.
- Decisions resolved: 2/2.
- Remaining blockers: 0.
- Deferred decisions: revision-history item granularity and populated
  originating-actor examples remain future evidence work.
- Next step: proceed to `s7-engine-define-reconcile` under the existing dispatch.
