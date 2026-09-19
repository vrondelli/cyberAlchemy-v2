# WP-RMT-002 — Seven active meta-type implementation candidates

## Outcome

Produce bounded, native, three-language candidate implementations for the seven ontology rows that remain `active` and `candidate-mapped`: Operation, Rule, Interface, Mapping, Event, State Machine, and Workflow. Each type crosses ten atomic evidence gates: admission binding, hostile family, TypeScript, Python, Rust, parity, replay, REL-A relations, registry non-membership, and candidate projection. Operation, Event, State Machine, and Workflow also bind semantic plan epoch `WP-RMT-002/S1/2026-08-16` and contract digest `75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`.

This Work Pack adopts and hardens existing W3/W4, Operation, and Rule bytes as read-only precedent. It does not claim those prior bytes satisfy this Work Pack until a unit binds and replays them. If an existing shared source must change, execution stops for an Invoke Refresh; no unit silently expands into shared precedent.

## Current gate

The S1 refresh candidate is authoring-complete and projects `selection-ready` only for these exact 22 target bytes. This staged package does not change the live plan, select a unit, or grant apply authority. A later exact-byte apply requires independent review, owner acceptance, and fresh validation. The prior owner-accepted one-target validator repair remains a satisfied historical prerequisite:

- `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260816T110235Z-wp-rmt-001-ontology-v2-validator-repair-live-apply/LIVE-APPLY-RECEIPT.json`
- SHA-256 `846ddd35a91093e0d0e4292309783c31312f43b4b9ba863dec65f7ccba509e92`
- result `pass`
- evidence inventory `b8c0e4a8c083b78bbd656367edeca8bce624897573956ea1edd8b1c3816634cd`
- repaired validator `985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c` / 149370 bytes

That receipt proves the five protected ontology-v2 live targets remain unchanged, the exact live replay kills 37/37 hostile controls with distinct wrong-generation and stale-reference diagnostics, the ordinary live validator passes 24/24 checks, and authority remains `none`.

The prior block remains immutable history. The original live-apply receipt `a8d4e29bb48159a953f986d4fdb34434f0fd81467ed321bd384544bdc0d97dda` failed `promotion-wrong-generation-preimage`; sidecar receipt `706e42dd9f0fd4ab9a220ab85e284a0b93bb9dfebc6a7b994683894c57b77f76` classified the defect as ordering/error-classification only. Exact owner decision `7b793737bc55642eb09469f16812f36713ec32363d38a5c4910378e84ada4969` accepted repair receipt `dda3c156f86f3813311892bc8f04e969f669b65171f7a16d79da41cf1a2beb18` before the repaired postimage was installed.

Selection readiness is not task admission or execution. `RMT-OP-001` remains the sole frontier, while `selected_unit` and `route_id` remain `null`. Implementation Readiness may evaluate that frontier only after these exact S1 plan bytes are live, independently reviewed, owner-accepted, and freshly revalidated.

## Semantic plan epoch

The exact S1 source is SF-04 in `2026-08-16-first-stable-foundation-candidate.md`, SHA-256 `2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9`. The plan contract is closed by digest `75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`:

1. Operation observes one versioned transaction/effect group, state-write attempt and outcome, durable-outbox checkpoint, stable occurrence identity, and commit outcome. State and occurrence commit atomically.
2. Event keeps persistence, publication attempt, acknowledgement, delivery, and consumption as separate observations. Publication happens after commit, is at-least-once, and retries idempotently with the same occurrence identity.
3. State Machine returns deterministic next-state and effect intents. It performs neither publication nor compensation.
4. Workflow binds exact versioned Operation transaction/effect-group and State Machine transition/effect-intent handles. After commit it preserves durable facts; compensation is forward recovery only.
5. Fixture/evaluator representability is not provider proof. Independent provider, database, restart, recovery, and acknowledgement-ambiguity evidence remain separate requirements.
6. No path may claim distributed exactly-once delivery.

The required ordered fault matrix covers failure before state write, between state and outbox, after outbox before publish, send failure, success with acknowledgement timeout, duplicate or reordered delivery, poison occurrence, and recovery/replay. Closed decode, future version, missing member, mixed commit, stale binding, occurrence reuse, rollback after commit, and non-idempotent retry are separate exact hostile controls.

## Work graph

| Wave | Types | Entry dependency | Purpose |
|---|---|---|---|
| W0 | Operation | live ontology-v2 gate | Establish the narrow state-changing action slice |
| W1 | Rule, Interface | `RMT-OP-010` | Prove guard and boundary contracts in parallel |
| W2 | Mapping, Event | both W1 candidate receipts | Close effects/connections semantics |
| W3 | State Machine, Workflow | W2 receipts, then State Machine before Workflow | Close lifecycle and orchestration semantics |

The exact graph is in `SWU-MANIFEST.json`. The only initial frontier is `RMT-OP-001`.

Every manifest row is closed by its exact task-local record in `SWU-CONTRACTS.json`. That record makes each remaining multi-file target/provider stage one acceptance unit: all declared bytes, exact command set, verification evidence, independent audit, and one last-written receipt either pass together or the unit stops without a pass receipt. `WRITE-SCOPE-BASELINE.json` proves all 189 planned paths were absent and assigns one owner SWU to each. The seven Rust units own explicit run-local Cargo target paths that must be removed before their terminal receipts. `HOSTILE-CATALOGUE.json` declares 98 exact executable controls: 14 per type, including four REL-A evidence controls per type. `RELATION-CONTRACTS.json` binds 18 per-type DomainSpec-to-architecture translations and their allowed endpoint types.

## Ten-unit cycle per type

1. **001 — admission binding:** lock the active ontology row, criterion schema, semantic plan epoch, exact candidate evidence denominator, language target forms, lifecycle ceiling, and immutable source hashes.
2. **002 — hostile family:** implement executable non-noop base, S1 cross-boundary, closed-decode, and REL-A hostiles with exact stable diagnostics before target claims.
3. **003 — TypeScript:** adopt or create an exact target, observer, direct provider, and focused tests without canonical registry admission.
4. **004 — Python:** prove the same portable contract with native Python evidence and target-specific controls.
5. **005 — Rust:** prove the same portable contract with native Rust evidence, compile/static controls, and an isolated run-local Cargo target.
6. **006 — parity:** bind all three direct providers, preserve native evidence separately, and prove normalized S1 semantic parity.
7. **007 — replay:** rerun the exact parity closure in fresh processes and verify deterministic occurrence, acknowledgement-ambiguity, and recovery receipts.
8. **008 — relations:** prove the per-type REL-A owner/source/target contract or emit only deferred blueprints.
9. **009 — registry negative:** prove every direct provider is absent from the canonical registry.
10. **010 — candidate projection:** consume the four passing closure receipts and write one bounded implementation candidate plus projection receipt that repeats the S1 epoch and contract digest. No ontology admission or PromotionRecord is authored.

## Shared semantic pipeline

Every source adapter must fail closed through:

`Declared -> ParsedCompletely -> ShapeValid -> ProfileAdmitted -> EndpointAdmissible`

The proof must keep lexical/source shape, topology, native static evidence, DomainSpec graph evidence, semantic-handle binding, runtime observations, and provider/database/restart evidence distinct. Cross-language parity compares normalized semantics, never native hash bytes.

## Relation ownership

REL-A remains binding. A materialized relation needs independent relation-owner, source-endpoint, and target-endpoint evidence bundles. If a candidate does not contain an exact assertion for all three, the result remains a deferred relation blueprint.

The plan-level catalogue fixes the required diagnostics for stale owner evidence, source mismatch, target mismatch, and materialization without an exact assertion. A different rejection code is not accepted as equivalent evidence.

## Claim ceiling

Candidate-local implementation and proof planning only, bound to semantic epoch `WP-RMT-002/S1/2026-08-16`. The candidate projection preserves `RMT-OP-001` as a possible future frontier, but no SWU is selected or executed and staging is not apply. It grants no ontology admission, PromotionRecord, authority, canonical registry membership, promotion, publication, release, deployment, production readiness, distributed exactly-once delivery, or cross-language native byte equality.
