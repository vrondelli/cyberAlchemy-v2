#!/usr/bin/env python3
"""Build the validated five-Luna Flocq proof fan-out and typed briefings."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
DISPATCH_ID = "flocq-whole-proof-five-luna-v1"
CAPABILITY = "task-session"
ONTOLOGY = "private_repo/cyberAlchemy-v2/research/projects/flocq-whole/ontology"
VERO = "vero_source"
BENCHMARK = "vero_benchmark"
COMMON_INPUTS = [
    f"{ONTOLOGY}/product-ontology.json",
    f"{ONTOLOGY}/system-ontology.json",
    f"{ONTOLOGY}/bridge-ontology.json",
    f"{ONTOLOGY}/proof-context.json",
    f"{ONTOLOGY}/sources.json",
    f"{ONTOLOGY}/validation.json",
    f"{BENCHMARK}/manifest.json",
]
FORBIDDEN = [
    f"{VERO}/Flocq/Bundle.lean",
    f"{VERO}/Flocq/Harness.lean",
    f"{VERO}/Flocq/Calc/Impl",
    f"{VERO}/Flocq/Calc/Spec",
    f"{VERO}/Flocq/Core/Impl",
    f"{VERO}/Flocq/Core/Spec",
    f"{VERO}/Flocq/IEEE754/Impl",
    f"{VERO}/Flocq/IEEE754/Spec",
    f"{VERO}/Flocq/Pff/Impl",
    f"{VERO}/Flocq/Pff/Spec",
    f"{VERO}/Flocq/Prop/Impl",
    f"{VERO}/Flocq/Prop/Spec",
    ONTOLOGY,
]


ROLE_DATA = [
    {
        "role_id": "luna-core-foundations",
        "wave": "wave-1-foundations-calc",
        "angle": "Foundation proof author",
        "purpose": "Prove the 39 scored Core/Zaux, Core/Raux, and Core/Digits obligations.",
        "modules": ["Core/Zaux", "Core/Raux", "Core/Digits"],
        "writes": [
            f"{VERO}/Flocq/Proof/Core/Zaux.lean",
            f"{VERO}/Flocq/Proof/Core/Raux.lean",
            f"{VERO}/Flocq/Proof/Core/Digits.lean",
            f"{VERO}/receipts/luna-core-foundations.json",
        ],
        "receipt": f"{VERO}/receipts/luna-core-foundations.json",
        "depends": [],
    },
    {
        "role_id": "luna-core-formats",
        "wave": "wave-1-foundations-calc",
        "angle": "Format semantics proof author",
        "purpose": "Prove the 29 scored Core/FLT, Core/GenericFmt, and Core/Ulp obligations.",
        "modules": ["Core/FLT", "Core/GenericFmt", "Core/Ulp"],
        "writes": [
            f"{VERO}/Flocq/Proof/Core/FLT.lean",
            f"{VERO}/Flocq/Proof/Core/GenericFmt.lean",
            f"{VERO}/Flocq/Proof/Core/Ulp.lean",
            f"{VERO}/receipts/luna-core-formats.json",
        ],
        "receipt": f"{VERO}/receipts/luna-core-formats.json",
        "depends": [],
    },
    {
        "role_id": "luna-calc",
        "wave": "wave-1-foundations-calc",
        "angle": "Calculation kernel proof author",
        "purpose": "Prove all 64 scored Calc obligations across six modules.",
        "modules": ["Calc/Bracket", "Calc/Div", "Calc/Operations", "Calc/Plus", "Calc/Round", "Calc/Sqrt"],
        "writes": [
            f"{VERO}/Flocq/Proof/Calc/Bracket.lean",
            f"{VERO}/Flocq/Proof/Calc/Div.lean",
            f"{VERO}/Flocq/Proof/Calc/Operations.lean",
            f"{VERO}/Flocq/Proof/Calc/Plus.lean",
            f"{VERO}/Flocq/Proof/Calc/Round.lean",
            f"{VERO}/Flocq/Proof/Calc/Sqrt.lean",
            f"{VERO}/receipts/luna-calc.json",
        ],
        "receipt": f"{VERO}/receipts/luna-calc.json",
        "depends": [],
    },
    {
        "role_id": "luna-ieee754",
        "wave": "wave-2-ieee-pff-prop",
        "angle": "IEEE 754 proof author",
        "purpose": "Prove all 59 scored IEEE754 Binary, Bits, and PrimFloat obligations.",
        "modules": ["IEEE754/Binary", "IEEE754/Bits", "IEEE754/PrimFloat"],
        "writes": [
            f"{VERO}/Flocq/Proof/IEEE754/Binary.lean",
            f"{VERO}/Flocq/Proof/IEEE754/Bits.lean",
            f"{VERO}/Flocq/Proof/IEEE754/PrimFloat.lean",
            f"{VERO}/receipts/luna-ieee754.json",
        ],
        "receipt": f"{VERO}/receipts/luna-ieee754.json",
        "depends": ["luna-core-foundations", "luna-core-formats", "luna-calc"],
    },
    {
        "role_id": "luna-pff-prop",
        "wave": "wave-2-ieee-pff-prop",
        "angle": "Pff and error-property proof author",
        "purpose": "Prove the 11 scored Pff obligations and the scored Prop/PlusError theorem.",
        "modules": ["Pff/Pff", "Prop/PlusError"],
        "writes": [
            f"{VERO}/Flocq/Proof/Pff/Pff.lean",
            f"{VERO}/Flocq/Proof/Prop/PlusError.lean",
            f"{VERO}/receipts/luna-pff-prop.json",
        ],
        "receipt": f"{VERO}/receipts/luna-pff-prop.json",
        "depends": ["luna-core-foundations", "luna-core-formats", "luna-calc"],
    },
]


def canonical_sha(value: object) -> str:
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()


def file_sha(path: Path) -> str:
    raw = path.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.sha256(raw).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> None:
    briefings = {"dispatch_id": DISPATCH_ID, "roles": {}}
    all_wave1_receipts = [r["receipt"] for r in ROLE_DATA if r["wave"].startswith("wave-1")]
    for role in ROLE_DATA:
        inputs = list(COMMON_INPUTS)
        if role["depends"]:
            inputs += all_wave1_receipts
        briefing = {
            "agent_identity": role["role_id"],
            "angle": role["angle"],
            "instructions": (
                f"Use ontology {ONTOLOGY} to prove only manifest-scored modules {', '.join(role['modules'])}. "
                "Edit only the assigned Proof files. Inspect frozen Impl/Spec and dependency proofs as read-only. "
                "Replace theorem holes with Lean terms, compile iteratively, preserve every unresolved theorem as typed residue, "
                "and write the declared JSON receipt. Apply dispatch techniques sequence, validation_loop, execution_receipt_handoff, "
                "observability_grouping, and residue_ledger. Local compilation is evidence, not benchmark admission."
            ),
            "status_semantics": {
                "task_status_field": "task_status",
                "task_complete_value": "complete",
                "task_blocked_value": "blocked",
                "domain_gate_status_field": "proof_gate_status",
                "domain_gate_is_separate": True,
            },
            "read_policy": {
                "input_refs": inputs,
                "allowed_read_scopes": [ONTOLOGY, f"{BENCHMARK}/manifest.json", f"{VERO}/Flocq", f"{VERO}/lakefile.toml", f"{VERO}/lean-toolchain", f"{VERO}/receipts"],
                "forbidden_read_scopes": [],
                "required_input_refs_readable": True,
            },
            "write_policy": {
                "mutation_policy": "lifecycle-owned",
                "write_scope": role["writes"],
                "forbidden_write_scopes": FORBIDDEN,
            },
            "receipt_shape": {
                "required_fields": [
                    "dispatch_id", "agent_id", "role_id", "task_status", "proof_gate_status",
                    "modules", "theorems_total", "theorems_compiled", "files_changed", "validation",
                    "blockers", "residue", "started_at", "ended_at",
                ],
                "completion_requires_all_fields": True,
            },
            "authority_ceiling": {
                "summary": "Candidate proof authoring and self-validation only.",
                "allowed_actions": ["read frozen sources", "edit assigned Proof files", "run local Lean checks", "write assigned receipt"],
                "forbidden_actions": ["edit Impl or Spec", "change manifest or harness", "claim ontology admission", "claim official benchmark completion", "publish or deploy"],
            },
        }
        briefings["roles"][role["role_id"]] = briefing
    briefing_path = HERE / "briefings.json"
    write_json(briefing_path, briefings)
    briefing_artifact_sha = file_sha(briefing_path)

    roles = []
    steps = []
    for idx, role in enumerate(ROLE_DATA, 1):
        role_id = role["role_id"]
        step_id = f"s{idx:02d}-{role_id}"
        inputs = list(COMMON_INPUTS)
        if role["depends"]:
            inputs += all_wave1_receipts
        briefing = briefings["roles"][role_id]
        roles.append({
            "role_id": role_id,
            "purpose": role["purpose"],
            "owns": ", ".join(role["modules"]),
            "capability_ref": CAPABILITY,
            "capability_target": f"flocq-proof:{'+'.join(role['modules'])}",
            "capability_mode": "execute",
            "agent_count": 1,
            "mutation_policy": "lifecycle-owned",
            "write_scope": role["writes"],
            "forbidden_write_scopes": FORBIDDEN,
            "briefing_binding": {
                "contract_version": "arcanum.confirmed-role-briefing.v0.1",
                "source_binding": {
                    "artifact_path": "briefings.json",
                    "artifact_sha256": briefing_artifact_sha,
                    "selector": f"/roles/{role_id}",
                    "selected_payload_sha256": canonical_sha(briefing),
                },
                "briefing": briefing,
                "briefing_sha256": canonical_sha(briefing),
            },
            "depends_on_roles": role["depends"],
            "input_refs": inputs,
            "output_refs": [role["receipt"]],
            "applies_to_steps": [step_id],
        })
        steps.append({
            "step_id": step_id,
            "name": role["purpose"],
            "capability_ref": CAPABILITY,
            "mode": "execute",
            "pattern": "fanout",
            "parallel": True,
            "join_policy": "all",
            "depends_on_steps": [f"s0{i}-{ROLE_DATA[i-1]['role_id']}" for i in range(1, 4)] if role["depends"] else [],
            "techniques": ["sequence", "validation_loop", "execution_receipt_handoff", "observability_grouping", "residue_ledger"],
            "inputs": [{"kind": "receipt" if x in all_wave1_receipts else "artifact", "ref": x} for x in inputs],
            "outputs": [{"kind": "receipt", "ref": role["receipt"]}],
            "evidence_artifact": role["receipt"],
            "stop_conditions": ["frozen input drift", "write-scope violation", "Lean environment failure", "proof blocker recorded as residue"],
        })

    dispatch = {
        "dispatch_id": DISPATCH_ID,
        "intent": {
            "raw": "Use five Luna subagents with the Flocq ontology and dispatch-spec techniques to try to create the whole proof.",
            "objective": "Attempt all 203 manifest-scored Flocq proofs with five bounded Luna authors and an official parent evaluation.",
            "target_artifact": f"{VERO}/Flocq/Proof",
            "operator_sentence": "Five Luna agents author disjoint proof families in two gated waves; the parent joins and evaluates the union.",
        },
        "mode": "mixed",
        "scope_roots": {
            "private_repo": "/home/vrondelli/projects/domainspec-core",
            "vero_source": "/tmp/flocq-vero-proof.956F6Y/agent_runs/flocq-ontology-luna/source",
            "vero_benchmark": "/tmp/flocq-vero-proof.956F6Y/benchmarks/Flocq",
        },
        "ontology_binding": {
            "ontology_id": "flocq-vero-benchmark-v1",
            "mapped_preflight_intent": "prove all 203 manifest-scored specs",
            "selected_route": "CA2-ROUTE-DELEGATE",
            "required_gate_result": "source-digest-replay-pass",
        },
        "techniques": ["sequence", "validation_loop", "execution_receipt_handoff", "observability_grouping", "residue_ledger", "delegation_boundary"],
        "technique_overlays": [{
            "overlay_id": "ontology-informed-proof-fanout",
            "trigger": "203 scored obligations span disjoint module families and exceed one active agent context.",
            "techniques": ["sequence", "validation_loop", "execution_receipt_handoff", "residue_ledger"],
            "applies_to_steps": [s["step_id"] for s in steps],
            "validation_expectation": "Every role returns theorem counts, compile evidence, blockers, and residue before its wave gate is evaluated.",
        }],
        "subagent_strategy": {
            "status": "required",
            "trigger": "User explicitly authorized five Luna subagents for the 203-proof repository-scale target.",
            "explanation": "Disjoint module ownership fits bounded fan-out; two waves respect the four-slot runtime ceiling.",
            "context": ["ontology flocq-vero-benchmark-v1", "22 modules", "203 scored specs", "four total concurrency slots"],
            "binding_mode": "capability-bound",
            "execution_owner": "CA2-ROUTE-DELEGATE parent",
            "execution_contract_version": "arcanum.capability-bound-execution.v0.2",
            "roles": roles,
            "execution_waves": [
                {"wave_id": "wave-1-foundations-calc", "role_ids": [r["role_id"] for r in ROLE_DATA[:3]], "parallel": True, "join_policy": "all", "depends_on_waves": [], "gate_after": "g01-wave-1-receipts", "on_incomplete": "block"},
                {"wave_id": "wave-2-ieee-pff-prop", "role_ids": [r["role_id"] for r in ROLE_DATA[3:]], "parallel": True, "join_policy": "all", "depends_on_waves": ["wave-1-foundations-calc"], "gate_after": "g02-wave-2-receipts", "on_incomplete": "block"},
            ],
            "parallelism": "fanout",
            "join_policy": "all",
            "authorization": "approved",
            "permission_prompt": "Approve five Luna proof authors in two waves with frozen inputs and disjoint Proof-file scopes? Confirmed by the user's current request.",
            "receipt_requirements": [
                "agent_id", "role_id", "spawn_status", "join_status", "close_status", "residue", "reroute",
                "dispatch_id", "step_id", "capability_ref", "status", "artifacts", "validation",
                "observer_status", "blockers", "handoff_note",
                "capability_target", "capability_mode", "wave_id", "write_scope",
            ],
        },
        "subagent_lifecycle": {"status": "none", "agents": []},
        "steps": steps,
        "gates": [
            {"gate_id": "g01-wave-1-receipts", "kind": "validation", "owner": "CA2-ROUTE-DELEGATE parent", "condition": "All three Wave 1 agents are joined and their exact proof receipts exist.", "applies_after_wave": "wave-1-foundations-calc", "requires_role_receipts": [r["receipt"] for r in ROLE_DATA[:3]], "evaluation": {"mode": "receipt_status"}, "on_fail": "block"},
            {"gate_id": "g02-wave-2-receipts", "kind": "validation", "owner": "CA2-ROUTE-DELEGATE parent", "condition": "Both Wave 2 agents are joined and their exact proof receipts exist.", "applies_after_wave": "wave-2-ieee-pff-prop", "requires_role_receipts": [r["receipt"] for r in ROLE_DATA[3:]], "evaluation": {"mode": "receipt_status"}, "on_fail": "block"},
            {"gate_id": "g03-promotion-guardrail", "kind": "promotion_guardrail", "owner": "CyberAlchemy v2 product owner", "condition": "Proof receipts cannot promote or admit the ontology and cannot substitute for official Vero evaluation.", "on_fail": "block"},
        ],
        "observability": {"dispatch_id_required": True, "parent_dispatch_id": None, "trace_events": ["dispatch_validated", "agent_spawned", "agent_joined", "wave_gate_evaluated", "official_evaluation_completed", "dispatch_closed"], "signal_grouping": DISPATCH_ID},
        "boundary_evidence": {
            "boundaries": [
                {"boundary_id": "b01-native-delegation", "kind": "capability_handoff", "from_owner": "CA2-ROUTE-DELEGATE parent", "to_owner": "five bounded Luna roles", "applies_to_steps": [s["step_id"] for s in steps], "contract": "Only assigned Proof files and receipts may be mutated; frozen source and ontology remain read-only.", "on_violation": "block"},
                {"boundary_id": "b02-receipt-return", "kind": "evidence_return", "from_owner": "five bounded Luna roles", "to_owner": "CA2-ROUTE-DELEGATE parent", "applies_to_steps": [s["step_id"] for s in steps], "contract": "Each role returns the declared typed receipt and explicit residue.", "on_violation": "block"},
            ],
            "authority": {"lifecycle": "CA2-ROUTE-DELEGATE parent", "execution": "bounded Luna role", "validation": "parent plus official Vero evaluator", "evidence": "parent", "memory": "not authorized", "promotion": "human owner only"},
            "receipts": [{"receipt_id": r["receipt"], "producer": r["role_id"], "required_fields": ["dispatch_id", "artifacts", "validation_result", "status", "blockers", "residue"], "stores": [r["receipt"]], "on_missing": "block"} for r in ROLE_DATA],
        },
        "promotion_guardrails": ["No proof agent may alter or admit ontology records.", "Only the official evaluator may establish scored benchmark results.", "No publication, release, deployment, or external effect is authorized."],
    }
    write_json(HERE / "dispatch.json", dispatch)


if __name__ == "__main__":
    main()
