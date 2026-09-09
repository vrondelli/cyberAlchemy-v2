#!/usr/bin/env python3
"""Materialize exact refs and the unconfirmed experiment/propose dispatch."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[5]
ROOT = Path(__file__).resolve().parent
PREFIX = ROOT.relative_to(REPO).as_posix()
HARNESS = ROOT.parent / "micro-swarm-harness"
HARNESS_PREFIX = HARNESS.relative_to(REPO).as_posix()
DISPATCH_ID = "2026-09-01-context-footprint-micro-swarm-native-control-propose"
RECEIPTS = f"{PREFIX}/proposal-execution/receipts"


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def stable_bytes(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exact_ref(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {"path": path.relative_to(REPO).as_posix(), "sha256": digest(data), "size": len(data)}


def build_run_blueprint() -> dict[str, Any]:
    task_ids = [f"MAP-{index:03d}" for index in range(1, 7)]
    luna = []
    names = ["Abramsky, Samson", "Bubenik, Peter", "Burroni, Albert", "Day, Brian", "Deligne, Pierre", "Fong, Brendan"]
    for task_id, name in zip(task_ids, names, strict=True):
        luna.append({
            "role_id": f"luna-{task_id.lower()}",
            "agent_name": name,
            "model": "gpt-5.6-luna",
            "task_ids": [task_id],
            "read_scope": [f"{HARNESS_PREFIX}/fixtures/example-manifest.json", "only the task's allowed_sources paths and selectors"],
            "forbidden_scope": ["peer outputs", "Sol output", "frozen gold cards", "dispatch ledger"],
            "output_ref": f"{PREFIX}/run-evidence/luna/{task_id}.json",
        })
    return {
        "schema_version": "cav2.micro-swarm-native-run-blueprint.v1",
        "status": "deferred_until_frozen_proposal",
        "physical_child_concurrency": 3,
        "waves": [
            {"wave_id": "luna-wave-1", "parallel": True, "roles": [item["role_id"] for item in luna[:3]]},
            {"wave_id": "luna-wave-2", "parallel": True, "depends_on": ["luna-wave-1"], "roles": [item["role_id"] for item in luna[3:]]},
            {"wave_id": "sol-reference", "parallel": False, "depends_on": ["luna-wave-2"], "roles": ["sol-reference"]},
            {"wave_id": "parent-mechanical", "parallel": False, "depends_on": ["sol-reference"], "roles": []},
        ],
        "roles": luna + [{
            "role_id": "sol-reference",
            "agent_name": "Brandenburg, Martin",
            "model": "gpt-5.6-sol",
            "task_ids": task_ids,
            "read_scope": [f"{HARNESS_PREFIX}/fixtures/example-manifest.json", "all six tasks' allowed_sources paths and selectors"],
            "forbidden_scope": ["Luna outputs", "frozen gold cards", "dispatch ledger"],
            "output_ref": f"{PREFIX}/run-evidence/sol/cards.json",
        }],
        "parent_mechanical": {
            "scorer": f"{PREFIX}/score_parity.mjs",
            "gold": f"{HARNESS_PREFIX}/fixtures/cards/control-cards.json",
            "criterion": f"{PREFIX}/CRITERION.json",
            "output_ref": f"{PREFIX}/run-evidence/parity-result.json",
        },
        "authority_ceiling": "Blueprint only; it is not a run sheet and grants no spawn, model-call, ledger, publication, or deployment authority.",
    }


def briefing(identity: str, angle: str, instructions: str, inputs: list[str], forbidden: list[str], fields: list[str], domain_field: str = "domain_gate_status") -> dict[str, Any]:
    return {
        "agent_identity": identity,
        "angle": angle,
        "instructions": instructions,
        "status_semantics": {
            "task_status_field": "task_status", "task_complete_value": "completed",
            "task_blocked_value": "blocked", "domain_gate_status_field": domain_field,
            "domain_gate_is_separate": True,
        },
        "read_policy": {"input_refs": inputs, "allowed_read_scopes": inputs, "forbidden_read_scopes": forbidden, "required_input_refs_readable": True},
        "write_policy": {"mutation_policy": "read-only", "write_scope": [], "forbidden_write_scopes": [PREFIX, "telemetry/agents/subagents-dispatch.yaml"]},
        "receipt_shape": {"required_fields": fields, "completion_requires_all_fields": True},
        "authority_ceiling": {
            "summary": "Read-only proposal evidence only.",
            "allowed_actions": ["read_declared_inputs", "run_declared_read_only_validator", "return_structured_receipt"],
            "forbidden_actions": ["edit_files", "freeze_criterion", "run_model_arms", "score_live_results", "mutate_dispatch_ledger", "publish", "deploy"],
        },
    }


def build_briefings() -> dict[str, Any]:
    criterion_inputs = [f"{PREFIX}/{name}" for name in ["CRITERION.json", "criterion.schema.json", "render_criterion.py", "CRITERION.md", "validate_criterion.py", "TOURNAMENT-SPEC.md", "RUN-BLUEPRINT.json"]]
    equivalence_inputs = [f"{PREFIX}/{name}" for name in ["GUIDE-MANIFEST.json", "verify_guide_equivalence.py", "RUN-BLUEPRINT.json"]] + [f"{HARNESS_PREFIX}/fixtures/example-manifest.json", f"{HARNESS_PREFIX}/schemas/claim-card.schema.json"]
    wave_receipts = [f"{RECEIPTS}/{name}" for name in ["criterion-design.json", "criterion-validation.json", "arm-equivalence-audit.json", "arm-equivalence-validation.json"]]
    forbidden_results = [f"{PREFIX}/run-evidence/", f"{HARNESS_PREFIX}/outputs/", f"{HARNESS_PREFIX}/fixtures/cards/control-cards.json"]
    return {"roles": {
        "criterion-designer": briefing(
            "Popper, Karl - criterion designer", "falsifiability, timing boundary, and mechanical scoring",
            "Audit the exact criterion package and run validate_criterion.py read-only. Reject any model-authored scientific verdict or unmeasurable five-minute boundary.",
            criterion_inputs, forbidden_results + [f"{PREFIX}/GUIDE-MANIFEST.json"],
            ["task_status", "domain_gate_status", "findings", "criterion_validation", "blockers"]),
        "arm-equivalence-auditor": briefing(
            "Kuhn, Thomas - arm-equivalence auditor", "equal task and source exposure across Luna and Sol arms",
            "Run verify_guide_equivalence.py read-only and determine whether both arms bind the same six tasks, card schema, and source policy without reading results or gold cards.",
            equivalence_inputs, forbidden_results + [f"{PREFIX}/CRITERION.json"],
            ["task_status", "domain_gate_status", "findings", "arm_equivalence_validation", "blockers"]),
        "validity-skeptic": briefing(
            "Lakatos, Imre - blind validity skeptic", "confounds, discrimination, reproducibility, and claim ceiling",
            "Consume only the criterion package and four admitted wave-one receipts. Return proposal_status valid or invalid; remain blind to live results and frozen gold content.",
            criterion_inputs + wave_receipts, forbidden_results + [f"{PREFIX}/GUIDE-MANIFEST.json"],
            ["task_status", "proposal_status", "findings", "bounded_repair_request", "blockers"], "proposal_status"),
    }}


def role_binding(role_id: str, payload: dict[str, Any], briefings_sha: str) -> dict[str, Any]:
    payload_sha = digest(stable_bytes(payload))
    return {
        "contract_version": "arcanum.confirmed-role-briefing.v0.1",
        "source_binding": {"artifact_path": "micro-swarm-propose.execution-briefings.json", "artifact_sha256": briefings_sha, "selector": f"/roles/{role_id}", "selected_payload_sha256": payload_sha},
        "briefing": payload, "briefing_sha256": payload_sha,
    }


def build_dispatch(briefings: dict[str, Any], briefings_sha: str) -> dict[str, Any]:
    specs = [
        ("criterion-designer", "criterion-design", [f"{RECEIPTS}/criterion-design.json", f"{RECEIPTS}/criterion-validation.json"], []),
        ("arm-equivalence-auditor", "arm-equivalence-audit", [f"{RECEIPTS}/arm-equivalence-audit.json", f"{RECEIPTS}/arm-equivalence-validation.json"], []),
        ("validity-skeptic", "validity-skeptic", [f"{RECEIPTS}/validity-skeptic.json"], ["criterion-designer", "arm-equivalence-auditor"]),
    ]
    roles, steps = [], []
    for role_id, step_id, outputs, dependencies in specs:
        payload = briefings["roles"][role_id]
        roles.append({
            "role_id": role_id, "purpose": payload["angle"], "owns": " and ".join(outputs),
            "capability_ref": "experiment", "capability_target": f"{PREFIX}/CRITERION.json", "capability_mode": "propose-validity",
            "agent_count": 1, "mutation_policy": "read-only", "write_scope": [], "forbidden_write_scopes": payload["write_policy"]["forbidden_write_scopes"],
            "briefing_binding": role_binding(role_id, payload, briefings_sha), "depends_on_roles": dependencies,
            "input_refs": payload["read_policy"]["input_refs"], "output_refs": outputs, "applies_to_steps": [step_id],
        })
        step = {
            "step_id": step_id, "name": payload["angle"], "capability_ref": "experiment", "capability_status": "local-extension",
            "capability_metadata": {"source": "implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/experiment/SKILL.md", "validation_note": "The proposal remains read-only and cannot freeze itself."},
            "mode": "propose-validity", "pattern": "dialectic" if role_id == "validity-skeptic" else "validation",
            "parallel": role_id != "validity-skeptic", "techniques": ["sequence"], "roles": [role_id],
            "inputs": [{"kind": "receipt" if item.startswith(RECEIPTS) else "artifact", "ref": item} for item in payload["read_policy"]["input_refs"]],
            "outputs": [{"kind": "receipt", "ref": item} for item in outputs], "join_policy": "all",
            "stop_conditions": ["stop on read-scope breach, validator failure, missing receipt, or blocked task status"],
        }
        if dependencies:
            step["depends_on_steps"] = ["criterion-design", "arm-equivalence-audit"]
            step["convergence_criteria"] = ["valid only when the frozen criterion is falsifiable, discriminating, reproducible, and mechanically adjudicable", "invalid when any design defect remains"]
        else:
            step["evidence_artifact"] = outputs[-1]
        steps.append(step)
    return {
        "dispatch_id": DISPATCH_ID,
        "intent": {"raw": "Validate the micro-swarm parity criterion before any model run.", "objective": "Return valid or invalid without freezing or executing the experiment.", "target_artifact": f"{PREFIX}/CRITERION.json"},
        "mode": "validation", "techniques": ["sequence", "observability_grouping"], "steps": steps,
        "gates": [
            {"gate_id": "g-wave-one-evidence", "kind": "validation", "owner": "parent-orchestrator", "condition": "Both independent validators return passing receipts.", "applies_after_wave": "criterion-and-arm-evidence", "requires_role_receipts": specs[0][2] + specs[1][2], "evaluation": {"mode": "receipt_status"}, "on_fail": "block"},
            {"gate_id": "g-proposal-domain-outcome", "kind": "quality", "owner": "parent-orchestrator", "condition": "Only a valid design may proceed to a later freeze request.", "applies_after_wave": "validity-skeptic", "requires_role_receipts": specs[2][2], "evaluation": {"mode": "domain_status", "source_role_id": "validity-skeptic", "source_field": "proposal_status", "pass_values": ["valid"], "resolved_values": ["invalid"]}, "on_fail": "block"},
        ],
        "subagent_strategy": {
            "status": "required", "trigger": "Independent criterion and arm-equivalence obligations precede blind validity attack.",
            "explanation": "Two independent wave-one roles validate criterion and exposure; one wave-two skeptic sees only admitted receipts.",
            "context": ["No model-arm execution is authorized.", "No result, gold-card content, publication, or deployment may be read or produced."],
            "binding_mode": "capability-bound", "execution_owner": "parent-orchestrator", "execution_contract_version": "arcanum.capability-bound-execution.v0.2",
            "roles": roles,
            "execution_waves": [
                {"wave_id": "criterion-and-arm-evidence", "role_ids": ["criterion-designer", "arm-equivalence-auditor"], "parallel": True, "join_policy": "all", "gate_after": "g-wave-one-evidence", "on_incomplete": "block"},
                {"wave_id": "validity-skeptic", "role_ids": ["validity-skeptic"], "parallel": False, "join_policy": "all", "depends_on_waves": ["criterion-and-arm-evidence"], "gate_after": "g-proposal-domain-outcome", "on_incomplete": "block"},
            ],
            "parallelism": "mixed", "join_policy": "all", "authorization": "requires_user_permission",
            "permission_prompt": "Run the exact micro-swarm criterion proposal after all preconfirmation gates pass?",
            "receipt_requirements": ["agent_id", "role_id", "spawn_status", "join_status", "close_status", "dispatch_id", "step_id", "capability_ref", "capability_target", "capability_mode", "wave_id", "write_scope", "status", "artifacts", "validation", "observer_status", "blockers", "residue", "reroute", "handoff_note"],
        },
        "observability": {"dispatch_id_required": True, "trace_events": ["subagent_spawned", "wave_joined", "gate_decided", "subagent_closed"], "signal_grouping": "dispatch_id, run_id, and wave_id"},
        "promotion_guardrails": ["valid permits only a later exact freeze request", "invalid closes the proposal", "no outcome runs model arms or grants publication authority"],
    }


def build_sheet(dispatch_ref: dict[str, Any], briefings_ref: dict[str, Any]) -> dict[str, Any]:
    package_names = {
        "source_ref": "CRITERION.json", "schema_ref": "criterion.schema.json", "renderer_ref": "render_criterion.py",
        "generated_view_ref": "CRITERION.md", "protocol_ref": "TOURNAMENT-SPEC.md", "guide_manifest_ref": "GUIDE-MANIFEST.json",
        "criterion_validator_ref": "validate_criterion.py", "guide_equivalence_validator_ref": "verify_guide_equivalence.py",
    }
    return {
        "dispatch_id": DISPATCH_ID, "schema_version": "0.10.0", "dispatch_type": "experiment",
        "goal": "Validate and either permit a later freeze request for the six-Luna versus single-Sol 300-second control criterion, or close it invalid before model execution.",
        "context": "The criterion compares two waves of three Luna explorers with one blind Sol reference on the same frozen six tasks. Sol is not the scientific judge; a deterministic parent scorer owns the final verdict. Proposal roles are read-only and blind to live outputs. This proposal grants no freeze, run, registration, publication, or deployment authority.",
        "max_loops": 1, "final_approver": "parent", "working_folder": f"{PREFIX}/",
        "experiment_contract": {
            "phase": "propose", "criterion_output_path": "CRITERION.json",
            "criterion_package": {key: exact_ref(ROOT / filename) for key, filename in package_names.items()},
            "execution_dispatch_ref": dispatch_ref, "execution_briefings_ref": briefings_ref,
            "pre_freeze_obligations": [
                {"obligation_id": "arm-equivalence-independent-audit", "execution_role_id": "arm-equivalence-auditor", "receipt_ref": f"{RECEIPTS}/arm-equivalence-validation.json", "gate_id": "g-wave-one-evidence", "required_read_scopes": [f"{PREFIX}/GUIDE-MANIFEST.json", f"{PREFIX}/RUN-BLUEPRINT.json", f"{HARNESS_PREFIX}/fixtures/example-manifest.json"], "independent_of_role_ids": ["criterion-designer"]},
                {"obligation_id": "blind-validity-skeptic", "execution_role_id": "validity-skeptic", "receipt_ref": f"{RECEIPTS}/validity-skeptic.json", "gate_id": "g-proposal-domain-outcome", "required_read_scopes": [f"{PREFIX}/CRITERION.json", f"{RECEIPTS}/criterion-validation.json", f"{RECEIPTS}/arm-equivalence-validation.json"], "independent_of_role_ids": ["criterion-designer", "arm-equivalence-auditor"]},
            ],
        },
        "anti_bias_global": "criterion validity versus arm-exposure equivalence and blind confound attack",
        "groups": [
            {"group_id": "criterion-and-arm-evidence", "n": 2, "anti_bias": "methodology (mechanical falsifiability versus equal arm exposure)", "predicted_disagreements": [{"pair": [0, 1], "statement": "Agent 0 may accept a mechanically complete criterion while agent 1 rejects unequal task or source exposure; each tests an independent methodology failure mode."}], "agents": [
                {"agent_name": "Popper, Karl", "role": "writer", "model": "gpt-5.6-sol", "token_budget": 1800, "angle": "falsifiability, timing boundary, and deterministic scoring", "initial_prompt": "Run only the exact criterion audit and bound read-only validator; return declared receipts without editing, freezing, or running model arms."},
                {"agent_name": "Kuhn, Thomas", "role": "auditor", "model": "gpt-5.6-sol", "token_budget": 1800, "angle": "equal task, schema, and source exposure across Luna and Sol arms", "initial_prompt": "Run only the bound arm-equivalence audit; remain blind to live outputs and frozen gold-card contents."},
            ]},
            {"group_id": "validity-skeptic", "agents": [{"agent_name": "Lakatos, Imre", "role": "skeptic", "model": "gpt-5.6-sol", "token_budget": 1800, "initial_prompt": "Consume only the exact criterion package and admitted wave-one receipts; return valid or invalid while remaining blind to live outputs and gold-card contents."}]},
        ],
        "connections": [{"from": "criterion-and-arm-evidence", "to": "validity-skeptic", "type": "sequential"}],
    }


def main() -> int:
    manifest = json.loads((ROOT / "GUIDE-MANIFEST.json").read_text())
    manifest["shared_task_manifest"] = exact_ref(HARNESS / "fixtures/example-manifest.json")
    manifest["shared_card_schema"] = exact_ref(HARNESS / "schemas/claim-card.schema.json")
    manifest["frozen_gold_cards"] = exact_ref(HARNESS / "fixtures/cards/control-cards.json")
    write_json(ROOT / "GUIDE-MANIFEST.json", manifest)

    write_json(ROOT / "RUN-BLUEPRINT.json", build_run_blueprint())
    criterion = json.loads((ROOT / "CRITERION.json").read_text())
    criterion["bound_artifacts"] = {
        "task_manifest": exact_ref(HARNESS / "fixtures/example-manifest.json"),
        "card_schema": exact_ref(HARNESS / "schemas/claim-card.schema.json"),
        "gold_cards": exact_ref(HARNESS / "fixtures/cards/control-cards.json"),
        "micro_swarm_harness": exact_ref(HARNESS / "scripts/micro-swarm.mjs"),
        "arm_equivalence_manifest": exact_ref(ROOT / "GUIDE-MANIFEST.json"),
        "run_blueprint": exact_ref(ROOT / "RUN-BLUEPRINT.json"),
        "parity_scorer": exact_ref(ROOT / "score_parity.mjs"),
    }
    write_json(ROOT / "CRITERION.json", criterion)
    subprocess.run(["python3", str(ROOT / "render_criterion.py")], check=True)

    briefings = build_briefings()
    briefings_path = ROOT / "micro-swarm-propose.execution-briefings.json"
    write_json(briefings_path, briefings)
    dispatch = build_dispatch(briefings, digest(briefings_path.read_bytes()))
    dispatch_path = ROOT / "micro-swarm-propose.execution.dispatch.json"
    write_json(dispatch_path, dispatch)
    sheet = build_sheet(exact_ref(dispatch_path), exact_ref(briefings_path))
    sheet_path = ROOT / "micro-swarm-propose.dispatch-sheet.json"
    write_json(sheet_path, sheet)

    projector = REPO / "implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/domainspec-subagents-strategy/material-strategy.cjs"
    result = subprocess.run(["node", str(projector), "--project", str(sheet_path)], check=True, capture_output=True, text=True)
    write_json(ROOT / "micro-swarm-propose.material-projection.json", json.loads(result.stdout))
    print("NATIVE_CONTROL_PREPARATION=pass")
    print("CONFIRMATION=not_requested")
    print("REGISTRATION=not_started")
    print("SPAWN_ATTEMPTS=0")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
