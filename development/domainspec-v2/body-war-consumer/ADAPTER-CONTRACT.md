# Body War Consumer Adapter Contract

## Input

Consume immutable DomainSpec graph, obligation, projection, and receipt handles
with the same `candidate`/`authoritative` posture, source/profile/graph/obligation
identity, and digest rules as the IOLM consumer.

## Output

Emit only a redacted, private, read-only projection for the declared SuggestedTrack
and ActivityEvidenceCandidate fixture. Preserve stable IDs and source provenance;
do not emit a DomainSpec graph or rewrite Body War source authority.

## Fail-closed controls

Reject missing or empty input, mismatched/stale digests, unknown IDs, undeclared
fields, raw provider payloads, private-path leakage, mutation verbs, and any
consumer posture that is not explicit. Repeated clean projections must be
byte-stable.

## Ownership

Body War consumer owner maintains this adapter contract and its redaction proof.
DomainSpec v2 owners retain engine/profile authority. Craft indexes receipts only.
