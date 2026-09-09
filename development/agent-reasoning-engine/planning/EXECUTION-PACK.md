# Agent reasoning engine execution pack

Status: **ACI-subordinate choreography planned; execution gate blocked**

## Dependency flow

```text
owner policy records
       |
       v
W0: evaluator@1 witness [completed/promoted]
       |
       +-------------------------------+
       |                               |
       v                               v
W1A: local-only containment      W1B: external conformance
  non-integration guard            fixture admission
  optional local prep              pure outbound/inbound maps
  no ACI claims                    optional Bus proposal map
       |                               |
       |                     ACI owner receipts + join
       |                               v
       +------------------------> historical replay
                                       |
                                       v
W2: exact-effect candidate mapping + new-command revalidation
    + semantic artifact durability + incident governance
       |
       v
W3: private ACI-subordinate adapter and controlled rollout
```

W1A and W1B are not interchangeable. W1A can produce only explicitly
non-integrated evidence. W1B cannot start until current external owner receipts
and fixture vectors pass. No completion in W1A opens W1B.

Inside W1B, fixture admission precedes semantic-reference and actor-event
mapping. Optional Work Bus mapping starts only after a separate Bus `PASS`.
Historical replay joins admitted ACI facts and immutable semantic artifacts.
Within W2, semantic artifact durability and failure fixtures may prepare in
disjoint scopes after ACI-subordinate identities are fixed.

## Wave contracts

- [`W0-L0.md`](work-pack/waves/W0-L0.md): owner policies then one evaluator SWU.
- [`W1-L1.md`](work-pack/waves/W1-L1.md): local-only containment, external
  fixture admission, pure ACI mappings, optional Bus proposal mapping, and
  historical replay.
- [`W2-L2.md`](work-pack/waves/W2-L2.md): new-command drift, semantic artifact
  durability, exact-effect candidate mapping, and degraded behavior.
- [`W3-L3.md`](work-pack/waves/W3-L3.md): private ACI-subordinate packaging and
  rollout evidence.

## Synchronization rules

1. A downstream wave consumes terminal receipts and exact artifact digests, not
   prose summaries.
2. Failed or partial lanes remain visible to joins and later owner gates.
3. No worker may edit an upstream receipt or reinterpret its verdict.
4. One SWU is handed off at a time; unknown or unselected SWU IDs block.
5. The parent verifies every claimed test and write scope before work-pack state
   changes.
6. `SWU-ARE-002` is superseded and cannot be selected.
7. Local-only receipts can update only their local-only evidence/status targets;
   they cannot open an integrated gate.
8. Integrated work consumes exact external owner receipts and admitted fixture
   manifests, not discovery prose or copied schemas.
9. Every mutation-capable handoff requires a preflight-complete Task Session
   closeout synchronization contract; current status is block.
10. Promotion, public publication, ACI acceptance, and real effects require
    separate owner routes.

## Expected SWU result

```yaml
swu_id: SWU-ARE-NNN
result: pass | flag | block | interrupted
capability_ref: task-session | goal | manual-owner
receipt_kind: native-stage | subagent | local-fallback | blocked
receipt_artifact: path | none
files_touched: []
validation: []
blockers: []
residue: []
reroute: string | none
handoff_note: string
```

## Stop boundary

This pack is a future handoff description only.

- No SWU is selected.
- Local-only candidate `SWU-ARE-019` still lacks an exact closeout contract and
  explicit owner selection.
- Integrated candidate `SWU-ARE-016` additionally lacks external owner receipts
  and cross-repository fixtures.

The current route must not invoke Task Session, goal, implementation workers,
external effects, Craft mutation, external repository mutation, or public
packaging.
