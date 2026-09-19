# W2 — Mapping and Event

Mapping and Event begin only after both W1 candidate receipts pass. They may
run in parallel and must re-observe, not silently own, the shared W3
effects/connections substrate.

Event additionally binds semantic epoch `WP-RMT-002/S1/2026-08-16` and keeps
persistence, publication attempt, acknowledgement, delivery, and consumption
separate. W2 closes after-outbox/before-publish, send failure, success/ack
timeout, duplicate or reordered delivery, poison occurrence, and
recovery/replay boundaries with the same stable occurrence identity.
Fixture/evaluator representability remains separate from independent provider,
database, restart, recovery, delivery, and consumption proof.
