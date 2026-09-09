# Hosted Error Observability Prototype

Status: non-authoritative construction prototype
Prototype: `KEP-HOST-ERROR-OBSERVABILITY-PROTOTYPE-001`

This prototype extends the hosted exchange without changing the accepted
`KEP-HOST-DEFINITION-SET-001` bytes.

## KEP-HOST-PD7: Client Error Evidence

A Client Error Evidence record is a bounded, redacted report of one failed
client attempt. It contains a unique attempt identifier, operation kind,
failure stage, stable error code, effect status, network, safe user-facing
message, and a digest of the local technical detail. It never contains wallet
secrets, signed transactions, plaintext knowledge, encryption keys, ciphertext,
authorization signatures, credentials, or an unbounded raw RPC response.

The hosted service appends each accepted record to durable storage. Receiving a
record does not prove a blockchain effect, authorize a retry, or replace direct
chain observation.

## KEP-HOST-PD8: Persistent Client Error

A Persistent Client Error is the active, user-visible explanation of a failed
attempt. It remains available across journey scenes and a same-tab refresh until
the user explicitly dismisses it or clears the session. It states what failed,
the known effect boundary, what the user can safely do next, the attempt
identifier, and whether the server received the evidence.

For `BlockhashNotFound`, the presentation states that preflight rejected the
transaction before submission. The client may offer a user-initiated fresh
attempt, but must not retry automatically.

## Prototype Claim Ceiling

These definitions guide construction only. They do not revise the accepted
definition set, admit ontology material, approve a product candidate, prove
durability outside PostgreSQL, or authorize deployment or a Devnet effect.
