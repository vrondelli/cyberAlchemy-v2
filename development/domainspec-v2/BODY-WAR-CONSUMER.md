---
artifact: domainspec-v2-body-war-consumer
status: candidate
scope: private-read-only
updatedAt: 2026-07-17
---

# Body War Consumer Contract

Body War is a downstream consumer-proof/product-witness surface for the
DomainSpec v2 backend engine. It is not a provider dependency, graph authority,
profile owner, or release gate owner.

## Source and integration boundary

- DomainSpec engine/profile authority remains in `projects/domainspec-v2/`.
- Body War application meaning remains in
  `projects/body-war/docs/features/parque-taquaral-online-mvp/`.
- This consumer contract lives under the CyberAlchemy DomainSpec v2 working home
  and may import immutable graph, obligation, projection, and receipt handles.
- No engine/profile copy, semantic re-authoring, callback, deployment, or network
  provider is required for FPR-02B admission.

## Read-only input

The adapter accepts only an explicit `candidate` or `authoritative` posture and
matching source/profile/graph/obligation/receipt digests. It verifies stable IDs,
provenance, profile identity, and declared output roots before projection.

Any source, schema, profile, rule, consumer posture, or receipt-input mutation
revokes the consumer result until a corrected `O_spec`, deterministic run,
negative replay, and reviewed receipt exist.

## Redacted field allowlist

The proof fixture may expose only the redacted Body War summary fields:

- `activity_id`
- `name`
- `sport_type`
- `distance_meters`
- `moving_time_seconds`
- `average_speed_mps`
- `start_date`
- explicit consent acknowledgement and consent text

Raw provider payloads, tokens, private credentials, geometry, scoring, ranking,
and undeclared fields are rejected. Private source paths must not leak into the
consumer projection.

## Security posture

FPR-02B requires no callback route, deployed endpoint, external origin, or live
provider integration. Any future interactive Body War mutation route requires a
new security decision covering consent and CSRF/origin protection.

## Proof obligations

- input identity and digest comparison;
- private read-only projection;
- exact redaction allowlist and undeclared-field rejection;
- missing, empty, stale, mismatched, unknown-ID, and private-path negatives;
- deterministic repeated projection;
- no claim of semantic satisfiability, business correctness, profile admission,
  FPR closure, production readiness, or upstream authority.
