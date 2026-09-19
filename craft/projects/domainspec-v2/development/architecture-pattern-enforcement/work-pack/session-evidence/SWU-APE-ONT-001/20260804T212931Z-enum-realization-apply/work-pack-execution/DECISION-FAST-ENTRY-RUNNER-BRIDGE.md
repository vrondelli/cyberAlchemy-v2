# Decision: bridge Work Pack fast entry into single-use Task Session execution

- Decision ID: `DEC-APE-FAST-ENTRY-RUNNER-BRIDGE`
- Status: pending operator decision
- Classification: blocker
- Target: `SWU-APE-ONT-001`
- Blocked work: live two-file ontology mutation and terminal SWU receipt

## Evidence

The new Work Pack execution feature completed its owned path:

- compiled the current authority-neutral execution policy;
- selected `SWU-APE-ONT-001` through direct execution intent;
- issued an `execution-intent-binding` selection receipt;
- re-materialized the exact two-file Invoke package;
- issued a current single-use mutation admission;
- compiled `task-ready`;
- returned `TASK_READY` from the four-input fast guard;
- routed a fresh Task Session with zero authorization prompts.

The final governance runner still invokes `selected_swu(work_pack_bytes)` for
normal plan-once entry. Because the canonical Work Pack intentionally keeps
`selectedSWU` as `none`, the runner blocks with:

> work pack must contain exactly one selected SWU, observed 0

No live ontology target changed and the new admission remains unconsumed.

## Options

### `fix-public-runner-bridge` — recommended

Route a bounded public Arcanum change through the Task Session lifecycle owner.
The runner should accept a current, exact fast-entry receipt plus Work Pack
binding for plan-once selected-unit execution, then atomically consume the
existing admission. The change needs canonical schemas, positive/replay/stale
negative tests, and selective synchronization to generated `.agents` and
`.claude` packages.

- Benefit: the new Work Pack feature works end to end as designed.
- Cost/risk: expands scope from private APE execution into public Arcanum lifecycle code.
- Downstream impact: after validation, rebuild this APE admission against the fixed runner and execute without changing Work Pack prose.

### `legacy-work-pack-selection-row`

Add one selected-SWU row to the private Work Pack and use the current legacy
runner path.

- Benefit: smallest immediate workaround.
- Cost/risk: duplicates selection state in prose and defeats the requested new-feature route.
- Downstream impact: requires rehashing all artifacts bound to the Work Pack.

### `defer-ape-execution`

Keep the complete evidence chain and stop before live mutation.

- Benefit: no scope expansion.
- Cost/risk: Enum realization identity remains absent from the live ontology.

## Selection

- Selected option: pending
- Rationale: pending
- Source: pending user response
- Remaining blocker: Task Session fast-entry-to-governance-runner integration
- Deferred decisions: none
- Assumptions: none
