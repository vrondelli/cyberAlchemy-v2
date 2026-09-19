# Reporting

The campaign closeout reports:

```yaml
stream_id: BTE-L0A-REPAIR-THROUGH-L8-ONE-SHOT
result: pass | flag | block | interrupted
current_layer: <layer>
current_swu: <id-or-none>
completed_swus: []
receipts: []
verification: []
preserved_evidence: []
active_blockers: []
owner_gates: []
residue: []
extra_sources:
  - path: <path>
    gap: <named-gap>
    changed_result: true | false
admission_granted: false
production_authorized: false
exact_unblock_action: <action-or-none>
prior_layers_remain_valid: true | false | unknown
next_route: <capability-or-none>
```

Do not compress a blocked or partial stream into a completion percentage.
Separate healthy prototype evidence, completed layer evidence, consumer proof,
admission, release, and production state.
