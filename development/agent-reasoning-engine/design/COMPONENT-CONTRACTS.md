# Candidate component contracts

Status: **unwitnessed design contracts**. These interfaces are planning inputs,
not implemented APIs or canonical schemas.

## Shared record rules

Every durable record carries `record_type`, `schema_version`, `run_id`,
`created_at`, `producer`, `input_digests`, and `content_digest`. Unknown schema
versions, cross-run substitutions, missing digests, and digest mismatch fail
closed. Time values record whether they came from a source, a frozen clock, or
the local recorder.

Records preserve three namespaces:

- `authority`: owner, scope, status, applicability, expiry, revocation;
- `evidence`: issuer, source handle, transform, validator, admissibility;
- `execution`: commands, attempts, events, joins, timeouts, and effects.

No field changes namespace merely because the same string appears elsewhere.

## Intent Projector

Input: raw source expression, technical `source_ref`, and optional explicit
semantic expresser/revision-owner evidence.

Output: `IntentRecord selected-local@1` and a `ProblemFrame` projection handle.

Rules:

1. Preserve raw expression and technical provenance.
2. Populate every D39 field with `declared`, `inferred`, or `unresolved` posture.
3. A file path or capture agent cannot populate semantic `source`.
4. A nearby maintainer or navigation link cannot populate `revision_route`.
5. `current_output_hypothesis` creates no scope, authority, or permission.
6. Do not emit revision-history items; their schema is unresolved.

## Authority Resolver and Catalog Loader

`AuthoritySnapshot` minimum:

```yaml
snapshot_id: string
as_of: date-time
owners: []
scopes: []
source_selectors: []
status: active | expired | revoked | unresolved
precedence_policy_ref: string
challenge_policy_ref: string
digest: sha256
```

`RuleCatalogManifest` minimum:

```yaml
catalog_id: string
catalog_version: string
evaluator_id: semantic-judgment-evaluator@1
conclusion_domain: []
rules: []
issuer_ref: string
validator_ref: string
precedence_policy_ref: string
unknown_policy: defer | escalate
temporal_policy_ref: string
challenge_policy_ref: string
expires_at: date-time | null
revoked_at: date-time | null
digest: sha256
```

The resolver does not discover its own authority. A model, search result,
catalog member, evaluator, or receipt cannot name itself as the missing owner.
Cycles in authority or self-judgment produce rejection or owner escalation.

## Gate adapters

Both gate adapters return a complete CAV2-D37-linked record:

```yaml
gate_decision_id: string
gate_kind: orchestration-entry | exact-effect
verdict: pass | flag | block | defer
owner_ref: string
authority_snapshot_digest: sha256
subject_digest: sha256
evidence_refs: []
residue: []
effect_of_decision: string
decided_at: date-time
```

The entry subject is a bounded run envelope. The effect subject is one exact
action envelope containing action, target, scope, authority basis, risk,
rollback/compensation, receipt digest, and idempotency key. The adapters cannot
reuse or translate one decision into the other.

## Effort Controller

Input dimensions are owned policy facts, not model self-estimates:

- reversibility and effect protection;
- authority impact and scope breadth;
- source novelty and evidence gaps;
- contradiction/material challenge state;
- required lanes and temporal urgency.

Output:

```yaml
tier: T0 | T1 | T2 | T3 | T4
required_roles: []
required_techniques: []
budgets: {}
stop_conditions: []
escalation_conditions: []
policy_refs: []
```

Hard rules: unknown risk does not default low; protected/irreversible/broad
effects require T4; missing required evidence, owner, or exact binding blocks or
defers; removing evidence or lanes cannot improve result or lower required tier.

## Technique Selector

Each selected technique records catalog ID/version, activation trigger, required
role or artifact, operational check, stop condition, and evidence expected. Its
inputs are manifest-required **candidate** obligations and effort policy, not a
final `ApplicabilityDecision`. Techniques absent from the catalog or selected
decoratively are invalid. A technique may shape how observations are produced
or challenged; it never decides final applicability, admissibility, or outcome.

## Actor Protocol and Runtime Journal

Commands are immutable and idempotently identified. Events include dispatched,
started, observation-proposed, challenge-proposed, failed, timed-out, joined,
cancelled, and closed. Joins name required and optional lanes. Partial failure
is resolved only by the frozen join/challenge policy; it is never silently
treated as agreement.

The journal persists the entry decision before the first command and the
reasoning receipt before any effect decision. Historical replay reads journaled
facts only and emits no model, tool, or effect command.

## Evaluator-owned Observation Admitter

Each proposed observation carries:

```yaml
observation_id: string
claim_type: string
value: any
issuer_ref: string
source_ref: string
transform_refs: []
validator_ref: string | null
temporal_scope: {}
posture: proposed | admitted | rejected | unresolved
rejection_reason: string | null
digest: sha256
```

Admission applies the frozen manifest. Schema conformance alone is insufficient.
The `ProblemFrame` holds handles and questions, not silently accepted facts.
This is a deterministic evaluator subcomponent and cannot independently change
applicability, derivation, outcome, or residue.

## Semantic evaluator@1

Input: immutable digests for `ProblemFrame`, `AuthoritySnapshot`,
`RuleCatalogManifest`, `ObservationSet`, `TechniquePlan`, `EffortProfile`, entry
gate, runtime journal cut, and challenge closure state.

Output: exactly one terminal outcome plus one reproducible
`ApplicabilityDecision` and derivation trace.

Ordered reducer:

1. Validate record versions, required digests, acyclic ownership, and input
   consistency; otherwise `InvalidInput`.
2. Validate catalog owner/status/time/revocation and evaluator binding; otherwise
   `UnauthorizedCatalog` or `EscalateOwner` as pinned by owner policy.
3. Match the registered conclusion domain; if absent, `OutOfDomain`.
4. Reproduce applicability, precedence, exceptions, conflicts, and defeaters.
5. Reject or defer missing mandatory evidence, required lanes, or challenge
   closure; unknown never becomes positive.
6. If a well-founded applicable defeater survives, return
   `Ineligible.Defeated`.
7. If required support or closure is insufficient, return
   `Deferred.Insufficient`.
8. If an owner decision is required, return `EscalateOwner`.
9. Otherwise return `RecommendedUnderSnapshot` with bounded derivation.

Catalog drift after a prior result produces `Invalidated` during current
revalidation. The evaluator makes no actor/tool calls and has no effect adapter.

## Evaluator-owned Reasoning Receipt Assembler

The deterministic assembler binds all input/output digests, applicable and defeated rule IDs,
admitted/rejected observation IDs, executed challenge/technique records,
derivation steps, terminal outcome, unresolved residue, and the entry decision.
It states its claim ceiling explicitly: a recommendation under captured inputs,
not premise truth, proof, approval, promotion, confidence, or permission.

It serializes the reducer result and cannot change applicability, derivation,
outcome, or residue. Receipt persistence is a precondition to calling the effect
gate. Persistence failure closes the run incomplete with zero effect calls.

## Effect Dispatcher test double

The first witness may expose only a test double accepting:

```yaml
outcome: RecommendedUnderSnapshot
reasoning_receipt_digest: sha256
effect_gate_decision_digest: sha256
fixed_effect_envelope_digest: sha256
idempotency_key: string
```

Every other outcome or non-pass gate returns without a call. Repeated delivery
of the identical valid envelope returns the prior logical result. A real effect
adapter is outside the first SWU.

## Replay and revalidation

- `historicalReplay(run_id)`: verify retained digests and rerun deterministic
  reducers only; no mutable provider calls and no effect attempts.
- `currentRevalidate(run_id, as_of)`: resolve fresh authority, catalog,
  evidence, and time state under a new run ID; may return `Invalidated`.

Late defeat after an effect opens an incident/compensation record. It never
rewrites the historical gate as if authorization had not occurred.
