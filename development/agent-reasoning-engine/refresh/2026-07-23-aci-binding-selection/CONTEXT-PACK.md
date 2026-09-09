# Context pack — ACI binding option A synchronization

## Selection

- Context Builder mode: `strict`
- Activation source: `direct-user`
- Mutation mode: `apply-approved`
- Source decision:
  `decisions/aci-reasoning-binding/BINDING-RECEIPT.json`
- Target workflow:
  `cyberAlchemy-v2/development/agent-reasoning-engine/`

## Refresh signals

| ID | Type | Claim | Targets |
|---|---|---|---|
| `SIG-BIND-A-DECISION` | status_changed | `G-ARE-ACI-BINDING` passed with option A. | binding design and parent design |
| `SIG-BIND-A-BLOCKER` | blocker_resolved | The local ownership-disposition blocker closes. | Work Pack and Craft |
| `SIG-BIND-A-ROUTE` | route_changed | The next route is ACI-subordinate plan revision, not implementation. | Work Pack and Craft |
| `SIG-BIND-A-RESIDUE` | blocker_opened | External ACI/Bus/ACP/APT maturity remains the active integration blocker. | Work Pack and Craft |

## Target inventory

Invoke owns the SPEC, architecture, binding-design, Work Pack, task, and wave
status deltas. Craft owns `.craft/ledger.yml`, `.craft/index.json`, and
`CRAFT.md`. Decision Gate owns the already-persisted decision artifacts.

## Claim boundary

Option A accepts an architectural target, not runtime compatibility. It
authorizes no implementation and selects no SWU. Local interim evidence remains
explicitly non-integrated until cross-repository conformance and external owner
receipts pass.

