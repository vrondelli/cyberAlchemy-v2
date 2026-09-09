# Worked examples

## Example 1 — unchanged plan-bound turn

1. Source snapshot and selected dependencies match the prior cut.
2. No new semantic context event is necessary.
3. The projection checkpoint matches the exact prefix and policy versions.
4. ARE derives the same Context Envelope and request-affinity header.
5. Codex receives identical early request bytes plus only the new user suffix.
6. Local checkpoint reuse is recorded; provider cache use remains an observed
   usage question.

## Example 2 — one selected definition changes

1. ARE detects the selected definition digest changed.
2. It appends `dependency-invalidated` for the old selection and a new
   `definition-selected` event; it does not mutate the old event.
3. The prior checkpoint cannot cover the new head, so the fold resumes from its
   watermark and consumes the suffix.
4. A successor Context Envelope is sealed.
5. The request-affinity record identifies the first changed model-visible
   component. Cache reuse before that point is possible but not assumed.

## Example 3 — huge research tool output

1. The exact output is appended or stored as a content-addressed artifact.
2. If optional, it is excluded from the inline envelope with an exclusion
   record. If retrievable context is required, ARE emits a bounded preview plus
   an opaque authorized locator.
3. The context pressure meter recalculates the projected request.
4. Only if pressure remains does structural pruning or summary shadow a named
   range. The original bytes and source-event identities remain retrievable.

## Example 4 — importing another context stream

1. The caller selects a source stream under non-model authority.
2. ARE captures one immutable source prefix and records its cut and digest.
3. Recursive imported-context events and effect claims are excluded.
4. Framing characters are safely encoded.
5. The import is labeled untrusted background; it cannot supply instructions,
   permissions, or admitted observations.

## Example 5 — crash before a tool effect

1. ARE appends the proposed operation and exact context/request binding.
2. A Context Durability Barrier flushes that prefix before dispatch.
3. If the process crashes after the barrier but before a result, recovery marks
   the outcome unknown.
4. Read-only/idempotent work may be retried under its own rules; effectful work
   first verifies external state. Cache optimization never decides this.

