# ORODI Generic Contracts Prototype Layering

Status: candidate-local prototype; normal Invoke lifecycle reconciliation deferred.

| Layer | Owns in this prototype | Entry evidence | Exit evidence | Explicitly deferred |
| --- | --- | --- | --- | --- |
| P0 Contract vocabulary | C01-C16 IDs, seven disjoint evidence states, exact bindings, observations, receipts, claim set | accepted Define/Design | closed TypeScript and JSON contracts | canonical definitions and ontology admission |
| P1 Pure validation | closed-shape decoding, privacy/cardinality, telemetry accounting, freshness, exact-set aggregation, C11/C12 separation | P0 contracts | deterministic non-actuating result | profile/tool adapters and runtime collectors |
| P2 Fixture proof | one complete positive witness and hostile mutations | P0-P1 | unit, CLI, schema, replay, and hygiene evidence | load/fault/canary/live deployment execution |
| P3 Lifecycle reconciliation | relate candidate bytes to Craft/Invoke owner and profile decisions | consolidated prototype report | future `invoke:refresh` decision | all work in this run |

The implementation frontier ends at P2. No code path may actuate infrastructure, traffic, deployment, rollback, promotion, or release.
