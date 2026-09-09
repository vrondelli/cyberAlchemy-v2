# Refresh report — ACI binding option A synchronization

## Result

- Mode: `refresh`
- Activation source: `direct-user`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Handoff status: `ready` for Invoke Plan authoring
- Decision: `G-ARE-ACI-BINDING` passed with
  `ACI-BIND-A-SUBORDINATE`
- Applied targets: `13`
- Selected SWU: `none`
- Implementation authorized: `false`

Option A now governs the local architecture. Integrated command/event facts,
canonical acceptance identity, replay cursor, and effect intents are
ACI-owned. Semantic derivation and reasoning-receipt content remain private
evaluator/artifact responsibilities. Local-only interim evidence is allowed
only under an explicit non-integration ceiling.

## Applied delta

- Closed `BLK-ARE-ACI-BINDING-001` with the exact owner receipt.
- Accepted the six-view binding design as the local ACI-subordinate target.
- Changed Invoke's next route to an ACI-subordinate conformance plan revision.
- Preserved `selected_swu: none` and
  `implementation_authorized: false`.
- Opened/preserved `BLK-ARE-ACI-MATURITY-001` as the active external dependency
  in Work Pack and Craft.
- Updated the Craft source ledger, generated index, and human view through a
  separate Craft-owned material package.

## Surviving gates

- ACI runtime Work Pack remains blocked.
- Bus integration still has no later post-remediation `PASS`.
- ACP remains discovery.
- APT mutation remains blocked.
- Cross-repository conformance fixtures/receipts do not exist.
- Artifact durability, incident readiness, rollout, intent evidence, and
  anti-bias efficacy remain open.
- The SPEC glossary still has the previously recorded evaluator-status drift;
  it was outside this exact refresh scope.

## Material evidence

| Owner | Package | Validator | Handoff |
|---|---|---|---|
| Invoke | `ARE-ACI-BINDING-INVOKE-APPLY-20260723` | `pass`, 10 paths | `ready` |
| Craft | `ARE-ACI-BINDING-CRAFT-APPLY-20260723` | `pass`, 3 paths | `ready` |

Both packages are private/internal, bind exact target baselines and staged
outputs, and report no dependency, owner, publication, or validation failure.

## Validation

- Decision admissibility receipt: `gate`, four admissible options.
- Explicit owner selection: A.
- Staged synchronization validator: pass.
- Invoke material package and handoff: pass/ready.
- Craft material package and handoff: pass/ready.
- Applied synchronization validator: pass.
- Binding-design Dispatch Spec: pass.
- Refresh Dispatch Spec: pass.
- Markdown links, JSON/YAML parsing, Craft ledger/index hash parity, and
  whitespace checks: pass.
- External orchestrator worktree: clean.
- Public Arcanum: not mutated by this route.

## Next route

`invoke:plan ACI-subordinate conformance revision`

That route may update the plan around conditional local-only versus future
integrated conformance. It must not select or execute an SWU until the relevant
external-maturity and task-specific gates pass.

