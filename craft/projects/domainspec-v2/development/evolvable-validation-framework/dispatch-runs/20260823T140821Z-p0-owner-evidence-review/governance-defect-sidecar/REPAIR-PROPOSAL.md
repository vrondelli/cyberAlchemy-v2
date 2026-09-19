# Governance-defect repair proposal

Dispatch: `2026-08-23-evf-l3-p0-owner-evidence-review`
Failed native run: `20260823T143051Z-p0-owner-evidence-review`
Authority effect: none

## Decision

The failure is mechanical, not a product or domain disagreement. The confirmed strategy described three distinct audits, but the executable dispatch had no typed binding for each agent's identity, angle, task instructions, status meaning, or required return shape. The coordinator therefore could not persist those fields, and the native driver could not send them.

The runtime must fail closed when confirmed material cannot be projected into a complete native action. A causal-event PASS is not enough: it proves that calls, joins, and gate events were recorded in order, not that each worker received and completed the task the human confirmed.

## Exact loss path

1. `dispatch-sheet.json#/groups/0/agents/0..2` and `CONFIRMED-MATERIAL-PROJECTION.json#/material/groups/0/agents/0..2` contain the distinct `agent_name`, `angle`, and `initial_prompt` values. Each prompt also defines status semantics, exact checks, required output keys, read/write boundaries, and an authority ceiling.
2. `DISPATCH.json#/subagent_strategy/roles/0..2` has generic `purpose`, `owns`, capability, target, mode, mutation, scope, and reference fields, but no typed lane briefing or binding to the confirmed agent entry.
3. `.agents/skills/dispatch-spec/dispatch.schema.yml:164-225` has no briefing property or requirement, and allows unspecified properties. `.agents/skills/dispatch-spec/scripts/validate-dispatch.py:151-162,418-490` never requires or validates a briefing projection.
4. `.claude/skills/orchestrate/scripts/native_dispatch_coordinator.py:298-318,445-464` constructs initial and dependent actions from a fixed generic field set. It drops even `purpose` and `owns`; there is no briefing field to preserve.
5. `.claude/skills/orchestrate/scripts/native_dispatch_driver.py:290-315` renders only those generic action fields. Although `.claude/skills/orchestrate/hosts/codex-native.md:88-95` requires the host message to contain the required receipt shape, the driver emits only “Return one bounded receipt.”
6. The three live compiled actions and host requests exhibit that exact projection. The IOLM return's `scope_limitations[0]` then treats a forbidden-write scope as forbidden read, while the BTE return omits the promised per-output identities and denominator rechecks. The IOLM normalized receipt is still admitted as pass because its task-completion semantics were also absent.

## Minimal repair candidate

Make one typed briefing the canonical executable projection for every capability-bound role. Do not copy an unverified free-form prompt at spawn time.

The dispatch role should contain a structure equivalent to:

```json
{
  "briefing": {
    "source_binding": {
      "sheet_path": "<repository-relative path>",
      "sheet_sha256": "<sha256>",
      "material_projection_sha256": "<sha256>",
      "group_id": "<group id>",
      "agent_index": 0
    },
    "agent_identity": "<confirmed identity>",
    "angle": "<confirmed methodological angle>",
    "instructions": "<confirmed initial_prompt>",
    "status_semantics": {
      "pass_means": "task audit completed within the authority ceiling",
      "domain_gate_status_is_separate": true
    },
    "read_policy": {
      "required_refs_are_readable": true,
      "forbidden_read_scopes": []
    },
    "write_policy": {
      "mutation_policy": "read-only",
      "write_scope": [],
      "forbidden_write_scopes": ["<scopes>"]
    },
    "receipt_shape": ["<required keys>"],
    "authority_ceiling": "<confirmed ceiling>"
  },
  "briefing_sha256": "<canonical structured-briefing digest>"
}
```

Apply the repair as one separately owned candidate:

1. Define `briefing` and `briefing_sha256` in the Dispatch Spec schema for capability-bound roles. Require the source selector and all executable semantics above. Reject ambiguous read/write policy.
2. Extend the Dispatch Spec validator to recompute the canonical briefing digest and, when a strategy-sheet binding is declared, prove exact equality with the selected confirmed sheet agent and its sheet/material digests. Missing or mismatched material is `block`.
3. Extend the Orchestrate action schema and both coordinator constructors to copy the complete structured briefing and digest. Recompute and compare the digest before persisting an action.
4. Extend `prepare-spawn` to verify the persisted briefing digest and render the complete structured task into the host request. Keep the opaque task-name rule. State explicitly that `forbidden_write_scopes` does not prohibit reads; use a separate typed `forbidden_read_scopes` only when a read really is prohibited.
5. Render the exact receipt shape required by the host profile, including the task-specific return keys and status meaning. Do not normalize `completed` to `pass` unless the receipt proves the briefing's required checks.
6. Add briefing-fidelity validation before `action_attempted`. Event validation remains a separate causal invariant.

This is intentionally narrower than teaching workers to infer missing intent from targets or filenames. Inference cannot recover human-confirmed status semantics, authority ceilings, or methodological distinctions and would not be auditable.

## Permanent hostile regression

Add `confirmed_role_briefing_survives_dispatch_compile_and_host_projection` across Dispatch Spec and Orchestrate fixtures:

- Use three roles whose generic capability metadata is deliberately similar but whose confirmed identity, angle, instructions, status semantics, and receipt keys differ.
- Assert exact canonical equality and digest equality from sheet agent → dispatch role → initial/dependent compiled action → prepared host request.
- Delete or mutate one field at each boundary and assert a block before `action_attempted` or host-request exposure.
- Include a required private repository read under `cyberAlchemy-v2/` while the same prefix is listed in `forbidden_write_scopes`; assert read permission stays explicit and a write remains forbidden.
- Assert the host message contains the required receipt shape and that an incomplete result cannot normalize to pass.
- Run the existing causal/replay/partial-recovery suites to prove the new guard does not weaken native lifecycle evidence.

## Required revalidation and gates

For a repair candidate, revalidate the Dispatch Spec schema and validator fixtures, the action projection for both coordinator constructors, the driver host-request fixture, host-profile conformance, and the full Orchestrate causal-event suite. Regenerate any generated native packages from their canonical sources and compare the intended byte inventory before lifecycle-owner acceptance.

Do not edit or reinterpret the failed run. If a retry is later authorized, use a distinct run ID and newly materialized dispatch, action, host-request, receipt, and event artifacts. The parent must verify all three briefing bindings before any host call.

## Acceptance and retry boundaries

- This diagnosis needs no renewed owner acceptance or human confirmation; it is run-local evidence with no authority effect.
- A runtime/schema/validator/driver repair needs fresh acceptance from the owners of those lifecycle bytes. The prior dispatch confirmation did not authorize a runtime repair.
- The exact original sheet digest `d31545fb7ddd9e8a14fae168236b98eb15c11abf680105b9b7c9cc992c64552c` may remain the immutable source binding if the sheet bytes are unchanged. That reuse does not authorize a retry.
- Every retry needs fresh explicit retry authorization and a distinct run ID, even when the sheet digest is unchanged.
- If any material sheet byte changes, generate a new digest and projection, rerun readiness and both independent tension checks, and obtain fresh human confirmation before registration or spawn. Never stretch the old confirmation over changed bytes.

No retry, owner contact, owner decision, runtime change, acceptance, apply, product execution, promotion, publication, commit, or push is part of this proposal.
