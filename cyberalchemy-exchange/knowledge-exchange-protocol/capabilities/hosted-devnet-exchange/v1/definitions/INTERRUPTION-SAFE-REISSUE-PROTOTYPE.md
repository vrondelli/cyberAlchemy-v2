# Interruption-Safe Reissue Prototype

Status: non-authoritative construction prototype
Prototype: `KEP-HOST-INTERRUPTION-SAFE-REISSUE-001`

This additive prototype records lessons from the first successful public Devnet
reissue. It does not change accepted definition bytes or authorize deployment.

## KEP-HOST-PD14: Exact Fulfillment Replay

An Exact Fulfillment Replay is a repeated hosted fulfillment request whose
operation, transaction signature, artifact, originator, recipient, replacement
envelope bytes and digest, key version, and target revision equal the already
committed result. It returns that result without another state transition.

`committed(x) and replay(y) and x = y -> result(x), writes = 0`

A mismatch remains a conflict. Idempotency never converts a different request
into success.

## KEP-HOST-PD15: Pending Fulfillment Record

A Pending Fulfillment Record is same-session client state written before the
first Solana submission. It binds the request operation, fulfillment operation,
replacement envelope, artifact account, authorization, and—when available—the
first transaction signature.

The record contains encrypted envelope material but no plaintext or content
key. Once a signature is known, the record forbids construction of a second
transaction for that request.

## KEP-HOST-PD16: Reconciliation-Only Resume

A Reconciliation-Only Resume inspects the saved transaction signature. A
finalized successful signature may continue to the idempotent hosted
fulfillment; missing, failed, or non-finalized evidence stops without another
submission.

`saved_signature -> inspect -> finalized_success -> hosted_reconcile`

Every other result is a visible stop, never an automatic retry.

## KEP-HOST-PD17: Bounded Dependency Call

A Bounded Dependency Call has an explicit connection or request deadline and
classifies timeout without claiming that an effect did or did not occur beyond
available evidence.

Hosted HTTP and Devnet observation calls must terminate within their declared
local bound. Transaction submission remains single-attempt and effect-aware.

## KEP-HOST-PD18: Reissue Completion Evidence

Reissue Completion Evidence joins the saved attempt, finalized Solana
signature, exact hosted result, artifact revision, recipient key version, and
replacement-envelope commitment. It excludes plaintext, content keys, and
private encryption keys.

## Prototype Claim Ceiling

These definitions guide a new testable product candidate. They do not prove
interruption safety under every transport failure, approve the product, or
authorize deployment, publication, release, or another live transaction.
