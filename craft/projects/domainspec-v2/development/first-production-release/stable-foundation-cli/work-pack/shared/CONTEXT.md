# Shared execution context

## Immutable planning inputs

- `SPEC.md` and `DESIGN.md` define the candidate and architecture.
- `DESIGN-SCOPE-MANIFEST.json` and `DESIGN-SELECTION-RESULT.json` close Design.
- `work-pack/shared/SOURCE-BINDINGS.json` carries exact hashes.
- `work-pack/shared/SWU-MANIFEST.json` owns unit boundaries and order.

## Runtime exploration rule

At Task Session time, Context Builder selects only the owning SWU, its parent
task, referenced design selectors, exact source/predecessor receipts, and nearby
implementation symbols needed to close obligations. It must not ingest this
entire planning root or infer authority from Inventory.

## Global constraints

- Product writes stay under the exact SWU scope.
- Planning closeout writes stay under the exact six-target closeout inventory.
- Current definitions, profiles, authority, ledger, Inventory, RMT, Git, and
  release namespaces are read-only unless a separately owned future route says otherwise.
- No network, credentials, public transport, deployment, or release effect.
- Planned witnesses are not evidence until their exact commands run and receipts bind outputs.

## Expected Task Session result

```yaml
swu_id: SWU-SFC-NNN
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: native-stage
receipt_artifact: <fixed runs path>
files_touched: []
validation: []
blockers: []
residue: []
reroute: <owner or none>
handoff_note: <closeout inputs and next state>
```

