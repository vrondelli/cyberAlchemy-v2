# W3 — State Machine and Workflow

State Machine begins after Mapping, Event, and Rule close. Workflow begins
after State Machine and Operation close. Existing W4 bytes remain read-only
precedent; target-owned candidate paths stay disjoint.

State Machine returns deterministic next-state plus effect intents and performs
neither publication nor compensation. Workflow binds exact versioned Operation
transaction/effect-group and State Machine transition/effect-intent handles.
After atomic commit, Workflow preserves durable state and occurrence and may
emit only forward-compensation intent. Stale bindings, rollback after commit,
and non-idempotent retry fail with stable codes; no W3 path claims distributed
exactly-once delivery.
