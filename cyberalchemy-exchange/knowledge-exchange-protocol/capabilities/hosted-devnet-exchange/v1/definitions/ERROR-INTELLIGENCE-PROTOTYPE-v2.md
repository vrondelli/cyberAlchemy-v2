# Hosted Error Intelligence Prototype v2

Status: non-authoritative construction prototype
Prototype: `KEP-HOST-ERROR-INTELLIGENCE-PROTOTYPE-002`

This additive prototype does not change accepted definition bytes.

## KEP-HOST-PD9: Layered Failure

### Normative Definition

A Layered Failure is a bounded projection of one failed operation into exactly
one primary source layer: client, wallet, transport, HTTP, JSON-RPC,
transaction, instruction, program, hosted API, finality, persistence, or
unknown. Structured fields outrank message-text inference.

### Formal Model

`decode(raw, context) = (layer, code, evidence)` where `layer` is singular,
`code` is stable inside a registry version, and `evidence` excludes secrets and
unbounded raw payloads.

### Operational Interpretation

Decode JSON-RPC `data.err`, nested instruction errors, KEP custom program codes,
HTTP state, wallet state, and transaction signatures before using text fallback.

### Plain-Language Intuition

First identify which part failed; do not call every problem a Solana error.

### Domain-Context Voice

The hosted KEP browser normalizes failures before it renders or reports them.

## KEP-HOST-PD10: Protocol Effect Status

### Normative Definition

A Protocol Effect Status is the most conservative supported statement about
whether a failed client attempt could have changed public protocol state.

### Formal Model

`effect ∈ {none, rejected_before_submission, submission_attempted_unknown,
submitted_finality_unknown, finalized_failure, finalized_success, unknown}`.
Missing evidence resolves to `unknown`, never to `none`.

### Plain-Language Intuition

It answers “could anything have happened?” before suggesting another attempt.

### Domain-Context Voice

KEP uses effect status to prevent a second ownership or reissue transaction from
being submitted while the first attempt is ambiguous.

## KEP-HOST-PD11: Retry Disposition

### Normative Definition

A Retry Disposition is a non-authoritative safety instruction derived from
effect evidence. It may allow a fresh user attempt, require inspection or
waiting, or forbid automatic retry; it never executes the protocol operation.

### Formal Model

`unknown ∨ submission_attempted_unknown ∨ submitted_finality_unknown`
implies `inspect_before_retry`. No disposition permits automatic protocol retry.

### Plain-Language Intuition

It says what is safe to do next without doing it for the user.

### Domain-Context Voice

Telemetry may retry delivery; KEP transactions may not retry automatically.

## KEP-HOST-PD12: Versioned Error Registry

### Normative Definition

A Versioned Error Registry is an immutable mapping from structured failure
selectors to a canonical code, effect rule, retry disposition, safe copy, and
redaction posture. KEP custom program mappings must equal the deployed program
enum discriminants.

### Plain-Language Intuition

It is the shared dictionary that keeps browser, server, tests, and program
errors from disagreeing.

### Domain-Context Voice

Registry `kep-error-registry/v1` includes Solana layers and all twelve current
`ProtocolProgramError` codes.

## KEP-HOST-PD13: Durable Failure Evidence

### Normative Definition

Durable Failure Evidence is a redacted, idempotent append-only server record of
one normalized failure and its correlation identifiers. It is evidence of a
reported failure, not proof of a chain effect.

### Plain-Language Intuition

The service remembers the safe facts needed to diagnose a failure.

### Domain-Context Voice

The hosted service stores typed error fields in PostgreSQL and retains a bounded
same-tab queue when telemetry delivery is temporarily unavailable.

## Prototype Claim Ceiling

These terms guide construction only. They do not revise accepted definitions,
approve a product, prove production observability, or authorize deployment.
