#!/usr/bin/env python3
"""Run and close the remaining live post-apply validation gates for TDE @4."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path, PurePosixPath
from typing import Any

from jsonschema import Draft202012Validator


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
RUN_REL = RUN.relative_to(REPO).as_posix()
PROPOSAL_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/"
    "20260825T001515Z-tde-lifecycle-command-repair-proposal"
)
PROPOSAL = REPO / PROPOSAL_REL
TARGET_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4"
)
TARGET = REPO / TARGET_REL
SOURCE_INVENTORY = PROPOSAL / "source/SOURCE-INVENTORY.json"
EXPECTED_CANDIDATE_SHA = "655e56a9e6798695652789a4147e9ecf57539eeae637bb524c4937f5225dc078"
EXPECTED_INVENTORY_DIGEST = "e450921cbe2072c9142b992289db3e49564040cda54bc9727fba6a85a89ef565"
EXPECTED_MATERIAL_PROPOSAL_DIGEST = "e53224d9cade91854acfb9fa4435c38c59b56d06aa3ec6e39098f422b512ca05"
EXPECTED_SEMANTIC_DIGEST = "61aea5107edca198f4dddd67e316af5e8c9a6fcb8c5cdb8f6826f3d5bea8122f"
FAILED_LEDGER_SHA = "80061f85aa8e9385b7a8fe8998cac14ff5f843c5400fd3e06c1af5afe8b98242"
SIDECAR_SHA = "0735023f0f8069b057998a0f190f01055597a5d5d5a815fa1794fb1467886ed5"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: Any) -> str:
    return sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode())


def write_json(relative: str, value: Any) -> Path:
    path = RUN / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def write_text(relative: str, value: str) -> Path:
    path = RUN / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value.rstrip() + "\n", encoding="utf-8")
    return path


def exact_ref(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {"path": path.relative_to(REPO).as_posix(), "sha256": sha256(data), "size_bytes": len(data)}


def command(argv: list[str]) -> dict[str, Any]:
    completed = subprocess.run(
        argv,
        cwd=REPO,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    return {"argv": argv, "cwd": ".", "exit_code": completed.returncode, "output": completed.stdout}


inventory = json.loads((PROPOSAL / "proposal/TARGET-INVENTORY.json").read_text())
binding = json.loads((PROPOSAL / "proposal/VALIDATION-COMMAND-BINDING.json").read_text())
entries = inventory["entries"]
expected_relatives = {
    Path(entry["target_path"]).relative_to(TARGET_REL).as_posix() for entry in entries
}
live_files = sorted(path for path in TARGET.rglob("*") if path.is_file())
actual_relatives = {path.relative_to(TARGET).as_posix() for path in live_files}
live_symlinks = sorted(path.relative_to(TARGET).as_posix() for path in TARGET.rglob("*") if path.is_symlink())
equality_failures = []
for entry in entries:
    target = REPO / entry["target_path"]
    staged = REPO / entry["staged_path"]
    if not target.is_file() or target.is_symlink():
        equality_failures.append({"path": entry["target_path"], "reason": "missing-or-symlink"})
        continue
    live_data = target.read_bytes()
    staged_data = staged.read_bytes()
    if live_data != staged_data or sha256(live_data) != entry["sha256"] or len(live_data) != entry["size_bytes"]:
        equality_failures.append({"path": entry["target_path"], "reason": "live-staged-inventory-mismatch"})
if actual_relatives != expected_relatives:
    equality_failures.append(
        {
            "reason": "exact-target-set-mismatch",
            "missing": sorted(expected_relatives - actual_relatives),
            "extras": sorted(actual_relatives - expected_relatives),
        }
    )
if live_symlinks:
    equality_failures.append({"reason": "symlinks", "paths": live_symlinks})

json_failures = []
whitespace_failures = []
eof_failures = []
for path in live_files:
    data = path.read_bytes()
    relative = path.relative_to(TARGET).as_posix()
    if data and not data.endswith(b"\n"):
        eof_failures.append(relative)
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        whitespace_failures.append({"path": relative, "reason": "not-utf8"})
        continue
    for line_number, line in enumerate(text.splitlines(), start=1):
        if re.search(r"[ \t]+$", line):
            whitespace_failures.append({"path": relative, "line": line_number, "reason": "trailing-whitespace"})
    if path.suffix == ".json":
        try:
            json.loads(text)
        except json.JSONDecodeError as error:
            json_failures.append({"path": relative, "error": str(error)})

live_equality = {
    "schema_version": "domainspec-v2.tde-r4-live-byte-equality/v1",
    "status": "pass" if not equality_failures else "block",
    "expected_target_count": 84,
    "live_file_count": len(live_files),
    "exact_set_equal": actual_relatives == expected_relatives,
    "live_staged_equal": not equality_failures,
    "symlinks": live_symlinks,
    "failures": equality_failures,
    "authority_effect": "none",
}
write_json("validation/LIVE-BYTE-EQUALITY.json", live_equality)

live_unit = command(binding["apply_argv"])
live_unit_pass = live_unit["exit_code"] == 0 and "RESULT: pass" in live_unit["output"]
write_json(
    "validation/LIVE-UNIT-VALIDATION.json",
    {
        "schema_version": "domainspec-v2.tde-r4-live-unit-validation/v1",
        "status": "pass" if live_unit_pass else "block",
        "matching_contract_count": len(list((TARGET / "plan/work-pack/shared/validation-contracts").glob("TDE-EPOCH-*-VALIDATION.json"))),
        "command": live_unit,
        "authority_effect": "none",
    },
)

fixture_root = RUN / "validation/operand-fixtures"
negative_operands = [
    ("aggregate-json-file", (TARGET / "plan/work-pack/shared/VALIDATION-CONTRACTS.json").relative_to(REPO).as_posix(), 0),
    ("missing-path", (fixture_root / "missing").relative_to(REPO).as_posix(), 0),
    ("empty-directory", (fixture_root / "empty").relative_to(REPO).as_posix(), 0),
    ("nine-contract-directory", (fixture_root / "nine").relative_to(REPO).as_posix(), 9),
]
negative_results = []
for fixture, operand, observed_count in negative_operands:
    argv = list(binding["apply_argv"])
    argv[argv.index("--contracts") + 1] = operand
    result = command(argv)
    passed = result["exit_code"] == 1 and "RESULT: block" in result["output"]
    negative_results.append(
        {
            "fixture": fixture,
            "operand": operand,
            "observed_contract_count": observed_count,
            "expected_exit": 1,
            "status": "pass" if passed else "block",
            **result,
        }
    )
negative_pass = all(item["status"] == "pass" for item in negative_results)
write_json(
    "validation/LIVE-OPERAND-NEGATIVE-FIXTURES.json",
    {
        "schema_version": "domainspec-v2.tde-r4-live-operand-fixtures/v1",
        "status": "pass" if negative_pass else "block",
        "fixtures": negative_results,
        "authority_effect": "none",
    },
)

lifecycle = command(
    [
        "python3",
        f"{PROPOSAL_REL}/validate_proposal_regressions.py",
        "lifecycle",
        "--staged-root",
        TARGET_REL,
        "--output",
        f"{RUN_REL}/validation/LIVE-LIFECYCLE-WORDING-REGRESSION.json",
    ]
)
execution_entry = command(
    [
        "python3",
        ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py",
        "--projection",
        f"{TARGET_REL}/plan/EXECUTION-ENTRY.json",
        "--output",
        f"{RUN_REL}/validation/LIVE-EXECUTION-ENTRY-VALIDATION.json",
    ]
)
candidate_dispatch = command(
    [
        "python3",
        ".agents/skills/dispatch-spec/scripts/validate-dispatch.py",
        f"{TARGET_REL}/DISPATCH.json",
        "--json",
    ]
)
try:
    candidate_dispatch_result = json.loads(candidate_dispatch["output"])
except json.JSONDecodeError:
    candidate_dispatch_result = {"raw": candidate_dispatch["output"]}
write_json(
    "validation/LIVE-CANDIDATE-DISPATCH-VALIDATION.json",
    {
        "schema_version": "dispatch-spec.validation-receipt/v1",
        "status": "pass" if candidate_dispatch["exit_code"] == 0 else "block",
        "command": candidate_dispatch,
        "result": candidate_dispatch_result,
        "authority_effect": "none",
    },
)

proposal_dispatch = json.loads((PROPOSAL / "DISPATCH.json").read_text())
proposal_dispatch["dispatch_id"] = "invoke-refresh-tde-r4-apply-20260824T234828Z"
proposal_dispatch["intent"] = {
    "raw": "invoke:refresh:apply-approved",
    "objective": "Apply and validate the exact frozen @4 planning candidate without crossing acceptance or implementation gates.",
    "target_artifact": RUN_REL,
}
proposal_dispatch["subagent_strategy"]["permission_prompt"] = "invoke:refresh:apply-approved"
proposal_dispatch["subagent_strategy"]["execution_owner"] = "/root/tde_epoch_r4_apply"
proposal_dispatch["subagent_strategy"]["explanation"] = "One bounded helper applies only the exact 84 approved planning targets and emits run-local evidence; the parent retains all final claims and later authority gates."
role = proposal_dispatch["subagent_strategy"]["roles"][0]
role["role_id"] = "tde-r4-exact-apply-validator"
role["purpose"] = "Material-gate, create, and live-validate the exact frozen @4 planning candidate."
role["capability_mode"] = "refresh-apply-approved"
role["owns"] = f"only {RUN_REL}/** and the exact 84 inventory paths under {TARGET_REL}/**"
role["write_scope"] = [f"{RUN_REL}/**", f"{TARGET_REL}/** (exact 84 create-only inventory paths)"]
role["forbidden_write_scopes"] = [
    "all prior @2/@3/proposal/apply roots",
    "projects/domainspec-v2/impl/",
    "projects/domainspec-v2/authority/",
    "projects/domainspec-v2/.craft/",
    "arcanum/",
    ".agents/",
    ".arcanum/",
    ".git/",
    "telemetry/",
]
role["mutation_policy"] = "exact-create-only-after-ready-material-handoff"
role["output_refs"] = ["REFRESH-REPORT.md", "refresh-report.json", "APPLY-RECEIPT.json", "HELPER-RECEIPT.json"]
proposal_dispatch["steps"][1]["name"] = "Validate material package and apply exact @4 create targets"
proposal_dispatch["steps"][1]["mode"] = "refresh-apply-approved"
proposal_dispatch["steps"][1]["stop_conditions"] = ["stop unless material receipt and file-bound handoff are current, exact, ready, and blocker-free"]
proposal_dispatch["steps"][2]["name"] = "Validate exact live bytes, WPRA, readiness, and controller structure"
proposal_dispatch["steps"][2]["mode"] = "refresh-live-validation"
proposal_dispatch["steps"][2]["inputs"] = [{"kind": "artifact", "ref": TARGET_REL}]
proposal_dispatch["steps"][2]["outputs"] = [{"kind": "receipt", "ref": "validation/VALIDATION-LEDGER.json"}]
proposal_dispatch["steps"][3]["name"] = "Close apply and route to v2 preacceptance closure"
proposal_dispatch["steps"][3]["mode"] = "refresh-apply-closeout"
proposal_dispatch["steps"][3]["outputs"] = [
    {"kind": "artifact", "ref": "REFRESH-REPORT.md"},
    {"kind": "receipt", "ref": "HELPER-RECEIPT.json"},
]
proposal_dispatch["steps"][3]["stop_conditions"] = ["stop before owner acceptance, selection, chain approval, Task Session, Victor decision, or product implementation"]
proposal_dispatch["boundary_evidence"]["state_namespaces"] = [
    {"namespace": "tde-r4-apply-evidence", "owner": "invoke-refresh", "write_policy": f"exclusive to {RUN_REL}/**"},
    {"namespace": "tde-r4-canonical-plan", "owner": "Rondelli", "write_policy": f"exact 84 create-only inventory paths under {TARGET_REL}/**"},
]
proposal_dispatch["boundary_evidence"]["promotion_splits"] = [
    {"source": "validated @4 apply", "target": "v2 owner acceptance", "rule": "two-run closure, independent review, reflection adoption, generated v2 request, and exact Rondelli acceptance remain separate", "on_violation": "block"}
]
proposal_dispatch["promotion_guardrails"] = [
    "No target outside the exact 84 approved @4 planning paths is created or changed.",
    "No @2 or @3 acceptance, apply authority, selection, or approval transfers to @4.",
    "No owner request, acceptance, selection, chain approval, Task Session, Victor decision, product implementation, merge, publication, release, or deployment is synthesized.",
]
proposal_dispatch["observability"]["signal_grouping"] = "run-local only; telemetry append out of scope"
write_json("DISPATCH.json", proposal_dispatch)
write_json(
    "validation/TECHNIQUE-TRACE.json",
    {
        "schema_version": "dispatch-spec.technique-trace/v1",
        "dispatch_id": proposal_dispatch["dispatch_id"],
        "techniques": [
            {"technique": "sequence", "application": "Precheck, material gate, exact create, live validation, and closeout execute in order."},
            {"technique": "concrete_path_evidence", "application": "All 84 creates bind exact staged and live SHA-256 values."},
            {"technique": "artifact_contract_bridge", "application": "The applied plan is exercised through unit, WPRA, readiness, and controller consumers."},
            {"technique": "validation_loop", "application": "Positive, negative, lifecycle, readiness, and controller gates preserve every exit."},
            {"technique": "owner_boundary_check", "application": "Rondelli apply authority does not become owner acceptance or execution authority."},
            {"technique": "authority_split_gate", "application": "Apply closes with authority none and routes separately to v2 preacceptance closure."},
            {"technique": "residue_ledger", "application": "The failed readiness attempt and remaining closure, review, acceptance, selection, and execution gates stay visible."},
            {"technique": "observability_grouping", "application": "Evidence remains run-local without telemetry mutation."},
            {"technique": "state_namespace_boundary", "application": "Writes are limited to the run root and exact canonical inventory."},
        ],
        "distill": {"status": "skipped", "rationale": "Exact narrow apply of a frozen planning candidate with unchanged ten-unit decomposition."},
        "authority_effect": "none",
    },
)
apply_dispatch = command(
    ["python3", ".agents/skills/dispatch-spec/scripts/validate-dispatch.py", f"{RUN_REL}/DISPATCH.json", "--json"]
)
try:
    apply_dispatch_result = json.loads(apply_dispatch["output"])
except json.JSONDecodeError:
    apply_dispatch_result = {"raw": apply_dispatch["output"]}
write_json(
    "validation/DISPATCH-VALIDATION.json",
    {
        "schema_version": "dispatch-spec.validation-receipt/v1",
        "status": "pass" if apply_dispatch["exit_code"] == 0 else "block",
        "command": apply_dispatch,
        "result": apply_dispatch_result,
        "authority_effect": "none",
    },
)

wpra_dir = RUN / "validation/live-wpra"
wpra_report_path = wpra_dir / "work-pack-readiness-report-v2.json"
manifest_path = wpra_dir / "plan-semantic-manifest.json"
selection_path = wpra_dir / "selection-handoff.json"
wpra_report = json.loads(wpra_report_path.read_text())
manifest = json.loads(manifest_path.read_text())
readiness_path = RUN / "validation/LIVE-IMPLEMENTATION-READINESS-PREFLIGHT.json"
readiness = json.loads(readiness_path.read_text())
readiness_schema = json.loads((REPO / ".agents/skills/implementation-readiness/schemas/plan-readiness-preflight-receipt.schema.json").read_text())
readiness_schema_errors = [error.message for error in Draft202012Validator(readiness_schema).iter_errors(readiness)]
wpra_hashes = {
    manifest_path.name: sha256(manifest_path.read_bytes()),
    selection_path.name: sha256(selection_path.read_bytes()),
    wpra_report_path.name: sha256(wpra_report_path.read_bytes()),
}
expected_wpra_hashes = {
    "plan-semantic-manifest.json": "852f2704f98bd28bf4734f006a43d6363073663b74ab613fe16696238a842422",
    "selection-handoff.json": "49d5424490f910aac47393cdc152c65d4df3a70700d647d36ea8cefad51f427d",
    "work-pack-readiness-report-v2.json": "43f274b54e79514cf233890200e7923202e64cc865071895485808767f69ceba",
}

def repository_ref(path: Path) -> dict[str, Any]:
    return exact_ref(path)


negative_approval = TARGET / "plan/EXECUTION-ENTRY.json"
controller_config = {
    "schema_version": "1.0.0",
    "chain_id": "apply-probe-tde-multiformalism-profile-epoch-r4-20260824T234828Z",
    "repository_root": ".",
    "state_directory": f"{RUN_REL}/validation/controller-probe-state",
    "scope_id": "DS-TDE-MULTIFORMALISM-PROFILE-EPOCH@20260824T174651Z",
    "manifest_ref": repository_ref(manifest_path),
    "audit_report_ref": repository_ref(wpra_report_path),
    "wpra_v2": {
        "audit_config_ref": repository_ref(TARGET / "readiness/audit-config.json"),
        "execution_contracts_ref": repository_ref(TARGET / "plan/work-pack/shared/EXECUTION-CONTRACTS.json"),
        "selection_handoff_ref": repository_ref(selection_path),
        "initial_selection_request_ref": repository_ref(negative_approval),
        "initial_selection_receipt_ref": repository_ref(negative_approval),
    },
    "audit_verdict": "pass",
    "audit_flags": [],
    "approved_epoch": {
        "epoch_id": manifest["plan_epoch_id"],
        "audit_projection_digest": wpra_report["audit_projection_digest"],
        "canonical_semantic_digest": manifest["canonical_semantic_digest"],
        "source_snapshot_digest": manifest["source_snapshot_digest"],
        "decision_gate_approval_receipt_ref": repository_ref(negative_approval),
        "approval_owner_ref": "Rondelli",
        "approval_status": "approved",
    },
    "finite_frontier": [f"TDE-EPOCH-{index:03d}" for index in range(1, 11)],
    "run_budget": {"max_task_session_requests": 10},
    "risk_ceiling": "bounded-write",
    "allowed_task_session_flags": [],
    "persistence": {"mode": "append-only-hash-chain", "collision_policy": "exclusive-create"},
    "compensation": {"mode": "none", "rationale": "Isolated apply validation probe; no Task Session or product mutation is admitted."},
}
write_json("validation/controller-probe-chain-config.json", controller_config)
controller_state = RUN / "validation/controller-probe-state"
controller_state_before = controller_state.exists()
controller = command(
    ["python3", ".agents/skills/task-session-until-blocker/scripts/run_chain.py", "--config", f"{RUN_REL}/validation/controller-probe-chain-config.json"]
)
try:
    controller_result = json.loads(controller["output"])
except json.JSONDecodeError:
    controller_result = {"terminal_code": "UNPARSEABLE", "raw": controller["output"]}
controller_state_after = controller_state.exists()
controller_pass = (
    controller["exit_code"] == 2
    and controller_result.get("terminal_code") == "EPOCH_APPROVAL_INVALID"
    and "MANIFEST_SHAPE_INVALID" not in controller["output"]
    and not controller_state_before
    and not controller_state_after
)
write_json(
    "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json",
    {
        "schema_version": "domainspec-v2.tde-r4-live-controller-compatibility/v1",
        "status": "pass" if controller_pass else "block",
        "expected_terminal_code": "EPOCH_APPROVAL_INVALID",
        "observed_terminal_code": controller_result.get("terminal_code"),
        "former_gate_cleared": "MANIFEST_SHAPE_INVALID" not in controller["output"],
        "controller_state_before": controller_state_before,
        "controller_state_after": controller_state_after,
        "task_sessions_started": 0,
        "product_mutations": 0,
        "command": controller,
        "authority_effect": "none",
    },
)

source_inventory = json.loads(SOURCE_INVENTORY.read_text())
source_failures = []
for entry in source_inventory["entries"]:
    path = REPO / entry["path"]
    if not path.is_file() or path.is_symlink():
        source_failures.append({"path": entry["path"], "reason": "missing-or-symlink"})
        continue
    data = path.read_bytes()
    if sha256(data) != entry["sha256"] or len(data) != entry["size_bytes"]:
        source_failures.append({"path": entry["path"], "reason": "digest-or-size-drift"})
source_baseline = json.loads((RUN / "validation/SOURCE-BASELINE.json").read_text())
proposal_failures = []
for reference in source_baseline["proposal_refs"]:
    path = REPO / reference["path"]
    if not path.is_file():
        proposal_failures.append({"path": reference["path"], "reason": "missing"})
        continue
    data = path.read_bytes()
    if sha256(data) != reference["sha256"] or len(data) != reference["size_bytes"]:
        proposal_failures.append({"path": reference["path"], "reason": "digest-or-size-drift"})
historical_failures = []
for reference in source_baseline["historical_preserved_refs"]:
    path = REPO / reference["path"]
    if not path.is_file():
        historical_failures.append({"path": reference["path"], "reason": "missing"})
        continue
    data = path.read_bytes()
    if sha256(data) != reference["sha256"] or len(data) != reference["size_bytes"]:
        historical_failures.append({"path": reference["path"], "reason": "digest-or-size-drift"})
material_refs = [
    exact_ref(RUN / "material/material-package.json"),
    exact_ref(RUN / "material/material-package-receipt.json"),
    exact_ref(RUN / "material/refresh-material-handoff-request.json"),
    exact_ref(RUN / "material/refresh-material-handoff.json"),
]
source_preservation = {
    "schema_version": "domainspec-v2.tde-r4-live-source-preservation/v1",
    "status": "pass" if not source_failures and not proposal_failures and not historical_failures else "block",
    "stopped_r3_file_count": source_inventory["source_count"],
    "stopped_r3_inventory_digest": source_inventory["inventory_digest"],
    "stopped_r3_failures": source_failures,
    "proposal_failures": proposal_failures,
    "historical_preservation_failures": historical_failures,
    "material_refs_after_apply": material_refs,
    "canonical_r4_file_count": len(live_files),
    "canonical_r4_exact_to_inventory": not equality_failures,
    "product_paths_in_apply_scope": [],
    "product_mutations": [],
    "authority_mutations": [],
    "git_effect": "none",
    "authority_effect": "none",
}
write_json("validation/SOURCE-PRESERVATION.json", source_preservation)

sidecar_path = RUN / "READINESS-CLI-GOVERNANCE-DEFECT-RECEIPT.json"
failed_ledger_path = RUN / "validation/FAILED-ATTEMPT-LEDGER.json"
preacceptance = {
    "schema_version": "domainspec-v2.invoke-preacceptance-v2-gate/v1",
    "status": "gated",
    "candidate_id": "dsv2-tde-multiformalism-profile-epoch@4",
    "live_candidate_exact": not equality_failures,
    "owner_request_emitted": False,
    "historical_v1_request_reused": False,
    "required_before_v2_request": [
        "passing two-run no-effect consumer closure over exact live @4",
        "passing independent review over the same closure graph digest",
        "implemented or enforced reflection-adoption receipt with passing cross-capability regression",
        "v2 generator emit-request",
        "validate-request",
    ],
    "current_missing": [
        "two-run no-effect consumer-closure receipt",
        "independent review over the same closure graph",
        "reflection-adoption receipt and cross-capability regression",
    ],
    "owner_request_path_present": False,
    "next_route": "invoke preacceptance-closure v2 and independent review",
    "authority_effect": "none",
}
write_json("validation/PREACCEPTANCE-V2-GATE.json", preacceptance)

checks = {
    "exact_live_target_set": not equality_failures and len(live_files) == 84,
    "json": not json_failures,
    "whitespace": not whitespace_failures,
    "eof": not eof_failures,
    "unit_contract_positive": live_unit_pass,
    "unit_contract_negative_matrix": negative_pass,
    "lifecycle_wording": lifecycle["exit_code"] == 0,
    "execution_entry": execution_entry["exit_code"] == 0,
    "candidate_dispatch": candidate_dispatch["exit_code"] == 0,
    "apply_dispatch": apply_dispatch["exit_code"] == 0,
    "wpra": wpra_report.get("verdict") == "pass" and wpra_report.get("terminal_code") == "PLAN_SEMANTIC_READY" and wpra_report.get("canonical_semantic_digest") == EXPECTED_SEMANTIC_DIGEST,
    "wpra_triplet_immutable": wpra_hashes == expected_wpra_hashes,
    "implementation_readiness": not readiness_schema_errors and readiness.get("status") == "pass" and readiness.get("code") == "PLAN_IMPLEMENTATION_READY" and readiness.get("authority_effect") == "none" and readiness.get("mutation_ready") is False and readiness.get("reusable_for_execution") is False,
    "readiness_failed_attempt_preserved": sha256(failed_ledger_path.read_bytes()) == FAILED_LEDGER_SHA,
    "readiness_sidecar_joined": sha256(sidecar_path.read_bytes()) == SIDECAR_SHA,
    "controller": controller_pass,
    "source_preservation": source_preservation["status"] == "pass",
    "preacceptance_owner_request_absent": preacceptance["owner_request_emitted"] is False,
}
ledger_status = "pass" if all(checks.values()) else "block"
commands = [
    {"attempt": 1, "check": "Preapply exact unit validator", "exit_code": 0, "result": "pass/10-contracts"},
    {"attempt": 2, "check": "Preapply lifecycle regression", "exit_code": 0, "result": "pass/84-targets"},
    {"attempt": 3, "check": "Preapply operand negative matrix", "exit_code": 0, "result": "pass/four-rejections"},
    {"attempt": 4, "check": "Material package validator", "exit_code": 0, "result": "pass/ready/84-paths"},
    {"attempt": 5, "check": "File-bound material handoff", "exit_code": 0, "result": "pass/ready/mutationReady=true"},
    {"attempt": 6, "check": "Live WPRA", "exit_code": 0, "result": "pass/PLAN_SEMANTIC_READY"},
    {"attempt": 7, "check": "Initial readiness wrapper with occupied --audit-output-dir", "exit_code": 1, "result": "preserved-failed/governance-only"},
    {"attempt": 8, "check": "Corrected readiness wrapper with immutable --audit-report", "exit_code": 0, "result": "pass/PLAN_IMPLEMENTATION_READY"},
    {"attempt": 9, "check": "Live exact unit validator", "exit_code": live_unit["exit_code"], "result": "pass/10-contracts" if live_unit_pass else "block"},
    {"attempt": 10, "check": "Live operand negative matrix", "exit_code": 0 if negative_pass else 2, "result": "pass/four-rejections" if negative_pass else "block"},
    {"attempt": 11, "check": "Live lifecycle regression", "exit_code": lifecycle["exit_code"], "result": "pass/84-targets" if lifecycle["exit_code"] == 0 else "block"},
    {"attempt": 12, "check": "Live execution entry", "exit_code": execution_entry["exit_code"], "result": "pass" if execution_entry["exit_code"] == 0 else "block"},
    {"attempt": 13, "check": "Live candidate Dispatch", "exit_code": candidate_dispatch["exit_code"], "result": "pass" if candidate_dispatch["exit_code"] == 0 else "block"},
    {"attempt": 14, "check": "Apply helper Dispatch", "exit_code": apply_dispatch["exit_code"], "result": "pass" if apply_dispatch["exit_code"] == 0 else "block"},
    {"attempt": 15, "check": "Controller structural probe", "exit_code": controller["exit_code"], "expected_exit": 2, "result": "pass/EPOCH_APPROVAL_INVALID" if controller_pass else "block"},
]
write_json(
    "validation/COMMAND-EXITS.json",
    {
        "schema_version": "domainspec-v2.command-exit-ledger/v1",
        "commands": commands,
        "failed_attempt_preserved": True,
        "later_success_does_not_erase_attempt": True,
        "masking_prohibited": True,
        "all_acceptance_critical_final_checks_pass": ledger_status == "pass",
        "authority_effect": "none",
    },
)
write_json(
    "validation/VALIDATION-LEDGER.json",
    {
        "schema_version": "domainspec-v2.tde-r4-apply-validation-ledger/v1",
        "status": ledger_status,
        "checks": {key: "pass" if value else "block" for key, value in checks.items()},
        "json_failures": json_failures,
        "whitespace_failures": whitespace_failures,
        "eof_failures": eof_failures,
        "symlinks": live_symlinks,
        "readiness_schema_errors": readiness_schema_errors,
        "failed_attempt_preserved": True,
        "authority_effect": "none",
    },
)
if ledger_status != "pass":
    raise SystemExit("POSTAPPLY_VALIDATION_BLOCKED")

changed_entries = [
    {
        "operation": "create",
        "path": entry["target_path"],
        "sha256": entry["sha256"],
        "size_bytes": entry["size_bytes"],
        "staged_path": entry["staged_path"],
        "live_equals_staged": True,
        "scope": "canonical @4 planning candidate",
    }
    for entry in entries
]
write_json(
    "validation/CHANGED-BYTE-INVENTORY.json",
    {
        "schema_version": "domainspec-v2.tde-r4-apply-changed-byte-inventory/v1",
        "canonical_create_count": len(changed_entries),
        "canonical_update_count": 0,
        "canonical_delete_count": 0,
        "canonical_changes": changed_entries,
        "product_changes": [],
        "authority_changes": [],
        "prior_artifact_changes": [],
        "apply_evidence_root": RUN_REL,
        "authority_effect": "none",
    },
)

apply_receipt = {
    "schema_version": "domainspec-v2.invoke-refresh-apply-receipt/v1",
    "receipt_id": "tde-r4-lifecycle-command-repair-apply-20260824T234828Z",
    "status": "pass",
    "candidate_id": "dsv2-tde-multiformalism-profile-epoch@4",
    "canonical_target_root": TARGET_REL,
    "created_count": 84,
    "updated_count": 0,
    "deleted_count": 0,
    "target_inventory_digest": EXPECTED_INVENTORY_DIGEST,
    "material_proposal_digest": EXPECTED_MATERIAL_PROPOSAL_DIGEST,
    "canonical_semantic_digest": EXPECTED_SEMANTIC_DIGEST,
    "candidate_manifest_sha256": EXPECTED_CANDIDATE_SHA,
    "material_package_ref": exact_ref(RUN / "material/material-package.json"),
    "material_receipt_ref": exact_ref(RUN / "material/material-package-receipt.json"),
    "material_handoff_ref": exact_ref(RUN / "material/refresh-material-handoff.json"),
    "live_byte_equality_ref": exact_ref(RUN / "validation/LIVE-BYTE-EQUALITY.json"),
    "wpra_report_ref": exact_ref(wpra_report_path),
    "implementation_readiness_ref": exact_ref(readiness_path),
    "governance_defect_sidecar_ref": exact_ref(sidecar_path),
    "failed_attempt_ledger_ref": exact_ref(failed_ledger_path),
    "validation_ledger_ref": exact_ref(RUN / "validation/VALIDATION-LEDGER.json"),
    "apply_consumed": True,
    "replay_authorized": False,
    "owner_acceptance_emitted": False,
    "selection_emitted": False,
    "chain_approval_emitted": False,
    "task_session_started": False,
    "product_implementation_started": False,
    "mutation_ready": False,
    "authority_effect": "none",
    "claim_ceiling": "Exact @4 planning candidate applied and structurally validated; no acceptance, selection, execution, merge, promotion, publication, release, or deployment authority.",
}
write_json("APPLY-RECEIPT.json", apply_receipt)

refresh_report = {
    "mode": "refresh",
    "phaseStatus": "pass",
    "phaseStatusBasis": {"artifactComplete": True, "refreshAuthoringBlockerCount": 0},
    "activationSource": "direct-user",
    "mutationMode": "apply-approved",
    "mutationModeSource": "explicit",
    "handoffStatus": "ready",
    "sourceSignals": json.loads((RUN / "reconciliation/REFRESH-SIGNALS.json").read_text())["signals"],
    "targetArtifacts": [entry["target_path"] for entry in entries],
    "deltaSummary": [{"class": "status_changed", "count": 84, "claim": "Exact @4 planning candidate paths changed from absent to created and live-validated."}],
    "proposedChanges": [],
    "appliedChanges": changed_entries,
    "skippedChanges": [],
    "materialPackage": {
        "required": True,
        "receiptPresent": True,
        "schemaValid": True,
        "patchVerdict": "pass",
        "mutationHandoff": "ready",
        "packageId": "tde-r4-lifecycle-command-repair-apply-20260824T234828Z",
        "packageDigest": "fe48f463b428afec6c8126b33bd4de454b38f5fb362b36306c62a5cedfa9d1ad",
        "expectedPackageId": "tde-r4-lifecycle-command-repair-apply-20260824T234828Z",
        "expectedPackageDigest": "fe48f463b428afec6c8126b33bd4de454b38f5fb362b36306c62a5cedfa9d1ad",
        "validatedPaths": [entry["target_path"] for entry in entries],
        "dependencyResult": "pass",
        "ownerBoundaryResult": "pass",
        "publicationBoundaryResult": "pass",
        "validationCommands": [" ".join(binding["apply_argv"])],
        "lifecycleOwner": "Rondelli",
        "authorityClass": "private",
        "publicationClass": "internal",
        "applyConsumed": True,
    },
    "mutationReady": False,
    "blockers": [
        {
            "id": "PREACCEPTANCE_V2_CLOSURE_REQUIRED",
            "scope": "target-lifecycle",
            "owner": "invoke-preacceptance-closure and independent reviewer",
            "status": "open",
            "claim": "Two-run no-effect closure, independent review, and reflection adoption are required before a v2 Rondelli owner-acceptance request.",
        },
        {
            "id": "EXACT_RONDELLI_ACCEPTANCE_REQUIRED",
            "scope": "target-lifecycle",
            "owner": "Rondelli",
            "status": "open",
            "claim": "No @4 owner acceptance exists; no selection or chain approval is authorized.",
        },
    ],
    "nextRoute": "invoke preacceptance-closure v2 and independent review",
    "validation": [
        {"check": key, "status": "pass" if value else "block"} for key, value in checks.items()
    ],
    "authorityEffect": "none",
}
write_json("refresh-report.json", refresh_report)

report_md = f"""# Invoke Refresh report: TDE @4 exact apply

## Outcome Brief

The exact 84-file `{apply_receipt['candidate_id']}` planning candidate was created and live-validated. The previously invalid lifecycle wording and unit-validation command now pass on canonical bytes, while implementation remains gated behind v2 closure, independent review, and exact owner acceptance.

- Objective: apply the frozen @4 planning candidate without crossing acceptance or execution boundaries.
- Result: 84 create-only files are byte-equal to staging; WPRA, Implementation Readiness, unit, lifecycle, Dispatch, and controller structural checks pass.
- Why it matters: the planning baseline is now live and exact, so the next lawful work is preacceptance evidence—not product implementation.

## Boundary and Next Decision

- Changed: exactly 84 canonical planning files under `{TARGET_REL}/**` plus run-local apply evidence under `{RUN_REL}/**`.
- Unchanged: stopped @3, accepted @2, proposal bytes, material bytes after handoff, product code, authority, owner acceptance, selection, chain approval, Task Session, Victor decision, Git, Craft, telemetry, publication, release, and deployment.
- Open questions: none inside the approved apply scope; v2 consumer closure, independent review, and reflection adoption remain intentionally unperformed.
- User decision: none for apply closeout.
- Next action: run v2 preacceptance closure and independent review before generating a renewed exact Rondelli acceptance request.

## Technical Details

- Phase status: `pass`
- Handoff status: `ready`
- Mutation mode: `apply-approved`
- Applied changes: `84 create`, `0 update`, `0 delete`
- Material package digest: `fe48f463b428afec6c8126b33bd4de454b38f5fb362b36306c62a5cedfa9d1ad`
- Material receipt SHA-256: `ad2f9421ad241ffc56ed4b8d80609a688526e728b5bd0205a6185bcd03d1f170`
- Candidate manifest SHA-256: `{EXPECTED_CANDIDATE_SHA}`
- Inventory digest: `{EXPECTED_INVENTORY_DIGEST}`
- Proposal material digest: `{EXPECTED_MATERIAL_PROPOSAL_DIGEST}`
- Canonical semantic digest: `{EXPECTED_SEMANTIC_DIGEST}`
- WPRA: `PLAN_SEMANTIC_READY`, runtime admission `pending-selection`, mutation ready `false`
- Implementation readiness: `PLAN_IMPLEMENTATION_READY`, proof-only, reusable `false`, mutation ready `false`
- Controller: expected `EPOCH_APPROVAL_INVALID`; `MANIFEST_SHAPE_INVALID` absent; no controller state or Task Session created
- Governance defect: initial occupied-directory readiness command exit 1 remains preserved; sidecar-authorized `--audit-report` correction passed without changing the WPRA triplet
- Preacceptance: owner request not emitted; v2 closure/review/adoption are the next gate
- Distill: skipped because the exact frozen ten-unit decomposition was unchanged
- Authority effect: `none`
"""
write_text("REFRESH-REPORT.md", report_md)

helper = {
    "schema_version": "domainspec-v2.invoke-refresh-helper-receipt/v1",
    "agent_id": "tde_epoch_r4_apply",
    "role_id": "tde-r4-exact-apply-validator",
    "dispatch_id": proposal_dispatch["dispatch_id"],
    "step_id": "s4-handoff",
    "capability_ref": "invoke",
    "capability_mode": "refresh-apply-approved",
    "spawn_status": "spawned",
    "join_status": "join-ready",
    "close_status": "closed",
    "status": "pass",
    "task_status": "complete",
    "domain_gate_status": "apply-complete-target-lifecycle-gated",
    "candidate_id": "dsv2-tde-multiformalism-profile-epoch@4",
    "artifacts": [
        exact_ref(RUN / "REFRESH-REPORT.md"),
        exact_ref(RUN / "refresh-report.json"),
        exact_ref(RUN / "APPLY-RECEIPT.json"),
        exact_ref(RUN / "validation/VALIDATION-LEDGER.json"),
        exact_ref(RUN / "validation/CHANGED-BYTE-INVENTORY.json"),
    ],
    "changed_byte_inventory": {
        "canonical_create_count": 84,
        "canonical_update_count": 0,
        "canonical_delete_count": 0,
        "product_change_count": 0,
        "evidence_root": RUN_REL,
    },
    "validation": {"status": "pass", "checks": checks},
    "observer_status": "run-local-only-telemetry-out-of-scope",
    "blockers": refresh_report["blockers"],
    "residue": ["v2 preacceptance closure", "independent review", "reflection adoption", "exact Rondelli acceptance", "selection", "chain approval", "Task Session", "Victor pre-merge"],
    "reroute": refresh_report["nextRoute"],
    "handoff_note": "Parent must independently verify the helper receipt and may route only to v2 preacceptance closure; implementation is not admitted.",
    "owner_request_emitted": False,
    "selection_emitted": False,
    "task_session_started": False,
    "authority_effect": "none",
    "claim_ceiling": apply_receipt["claim_ceiling"],
}
write_json("HELPER-RECEIPT.json", helper)

print(
    json.dumps(
        {
            "status": "pass",
            "run_root": RUN_REL,
            "canonical_target_root": TARGET_REL,
            "canonical_create_count": 84,
            "wpra": "PLAN_SEMANTIC_READY",
            "implementation_readiness": "PLAN_IMPLEMENTATION_READY",
            "controller_terminal": "EPOCH_APPROVAL_INVALID",
            "owner_request_emitted": False,
            "implementation_started": False,
            "helper_receipt_sha256": sha256((RUN / "HELPER-RECEIPT.json").read_bytes()),
        },
        indent=2,
    )
)
