#!/usr/bin/env python3
"""Validate the proposal-only Refresh package without applying its postimages."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

from jsonschema import Draft202012Validator


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
PLAN_REL = Path(
    "projects/domainspec-v2/development/spec-ontology-branch-decision/"
    "invoke-plan/20260824T165704Z-formalclaim-lean-evf-implementation"
)
PLAN = REPO / PLAN_REL
STAGE = RUN / "staged-targets"
SWU1 = REPO / (
    "projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/"
    "formalclaim-lean-evf/SWU-FCL-001/RECEIPT.json"
)


def load(path: Path) -> dict:
    return json.loads(path.read_text())


def digest(path: Path) -> str:
    import hashlib

    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    checks: list[dict[str, object]] = []

    def record(check_id: str, passed: bool, evidence: object) -> None:
        checks.append({"id": check_id, "status": "pass" if passed else "fail", "evidence": evidence})

    target_inventory = load(RUN / "TARGET-INVENTORY.json")
    target_map = {item["path"]: item for item in target_inventory["targets"]}
    for target, item in target_map.items():
        target_path = REPO / target
        stage_suffix = Path(target).relative_to(PLAN_REL)
        stage_path = STAGE / stage_suffix
        record(
            f"accepted-preimage-unchanged:{target}",
            digest(target_path) == item["before_sha256"],
            {"actual": digest(target_path), "expected": item["before_sha256"]},
        )
        record(
            f"staged-postimage-exact:{target}",
            digest(stage_path) == item["after_sha256"],
            {"actual": digest(stage_path), "expected": item["after_sha256"]},
        )

    schema = load(REPO / ".agents/skills/work-pack-readiness-audit/schemas/audit-config-v2.schema.json")
    for name, path in [
        ("target-audit-config-schema", STAGE / "readiness/audit-config.json"),
        ("rebased-audit-config-schema", RUN / "validation/input/audit-config.rebased.json"),
    ]:
        errors = sorted(Draft202012Validator(schema).iter_errors(load(path)), key=lambda e: list(e.path))
        record(name, not errors, [f"{list(e.path)}: {e.message}" for e in errors])

    accepted_config = load(PLAN / "readiness/audit-config.json")
    target_config = load(STAGE / "readiness/audit-config.json")
    unit_fields = [
        "task_id",
        "swu_id",
        "unit_id",
        "dependencies",
        "canonical_successors",
        "command",
        "validation_contracts",
        "material_writes",
        "execution_outputs",
        "allowed_writes",
        "lifecycle_owner",
        "authority_class",
        "publication_class",
    ]
    accepted_units = [{k: unit[k] for k in unit_fields} for unit in accepted_config["execution_bindings"]]
    target_units = [{k: unit[k] for k in unit_fields} for unit in target_config["execution_bindings"]]
    record("unit-contract-fields-unchanged", accepted_units == target_units, {"unit_count": len(target_units)})
    record(
        "execution-policy-unchanged",
        accepted_config["execution_policy"] == target_config["execution_policy"],
        {"allowed_routes_digest": target_config["execution_policy"]["allowed_routes_digest"]},
    )
    typed = target_config.get("task_session_closeout_contracts", [])
    record(
        "typed-closeout-complete",
        len(typed) == 14
        and [item["unit_id"] for item in typed]
        == [f"SWU-FCL-{index:03d}" for index in range(1, 15)],
        {"count": len(typed), "units": [item["unit_id"] for item in typed]},
    )

    module_path = REPO / ".agents/skills/work-pack-readiness-audit/scripts/plan_semantics.py"
    spec = importlib.util.spec_from_file_location("plan_semantics", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    accepted_semantics = module.build_plan_semantics(accepted_config, REPO)
    original_load = module._load_object

    def overlay(path: Path):
        if path.resolve() == (PLAN / "readiness/AUDIT-BINDINGS.json").resolve():
            return load(STAGE / "readiness/AUDIT-BINDINGS.json")
        return original_load(path)

    module._load_object = overlay
    target_semantics = module.build_plan_semantics(target_config, REPO)
    record(
        "canonical-semantic-non-drift",
        accepted_semantics["canonical_semantic_digest"]
        == target_semantics["canonical_semantic_digest"],
        {
            "accepted": accepted_semantics["canonical_semantic_digest"],
            "target_postimage": target_semantics["canonical_semantic_digest"],
        },
    )
    record(
        "per-unit-semantic-non-drift",
        accepted_semantics["unit_contract_digests"] == target_semantics["unit_contract_digests"],
        target_semantics["unit_contract_digests"],
    )

    receipt = load(SWU1)
    terminal_schema = load(
        REPO / ".agents/skills/task-session/schemas/governance-terminal-receipt.schema.json"
    )
    terminal_errors = sorted(
        Draft202012Validator(terminal_schema).iter_errors(receipt), key=lambda e: list(e.path)
    )
    record(
        "swu-fcl-001-terminal-schema-valid",
        not terminal_errors,
        [f"{list(e.path)}: {e.message}" for e in terminal_errors],
    )
    joined = receipt["closeout_join"]["joined_owner_receipts"]
    continuity_truth = (
        receipt["result"] == "pass"
        and len(joined) == 1
        and joined[0]["owner_capability"] == "invoke"
        and joined[0]["result"] == "no-op"
        and receipt["closeout_join"]["continuation"]["successor_executed"] is False
    )
    record("swu-fcl-001-completed-and-joined", continuity_truth, receipt["closeout_join"])
    owner_receipt_path = REPO / joined[0]["receipt_ref"]["path"]
    owner_receipt = load(owner_receipt_path)
    owner_schema = load(
        REPO / ".agents/skills/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json"
    )
    owner_errors = sorted(
        Draft202012Validator(owner_schema).iter_errors(owner_receipt), key=lambda e: list(e.path)
    )
    record(
        "swu-fcl-001-historical-owner-closeout-residue-exposed",
        owner_receipt["schema_version"] == "invoke-refresh-closeout-receipt.v1"
        and joined[0]["receipt_ref"]["sha256"] == digest(owner_receipt_path)
        and bool(owner_errors),
        {
            "historical_schema_version": owner_receipt["schema_version"],
            "current_expected_schema_version": owner_schema["properties"]["schema_version"]["const"],
            "exact_sha256": digest(owner_receipt_path),
            "current_schema_error_count": len(owner_errors),
            "classification": "historical-compatibility-residue-not-rewritten",
        },
    )
    successor_receipts = [
        REPO
        / (
            "projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/"
            f"formalclaim-lean-evf/SWU-FCL-{index:03d}/RECEIPT.json"
        )
        for index in range(2, 15)
    ]
    record(
        "successors-uncompleted",
        all(not path.exists() for path in successor_receipts),
        {path.relative_to(REPO).as_posix(): path.exists() for path in successor_receipts},
    )

    report = load(RUN / "validation/wpra-current-run-2/work-pack-readiness-report-v2.json")
    record(
        "wpra-typed-repair-reduces-to-one-blocker",
        report["verdict"] == "block"
        and report["terminal_code"] == "BINDING_SELECTOR_UNRESOLVED"
        and len(report["blockers"]) == 1
        and report["blockers"][0]["binding_id"] == "joined-closeout-SWU-FCL-001",
        {"terminal_code": report["terminal_code"], "blockers": report["blockers"]},
    )
    record(
        "wpra-authority-ceiling",
        report["selected_unit"] is None
        and report["mutation_ready"] is False
        and report["authority_effect"] == "none"
        and report["configured_commands_executed"] is False,
        {
            "selected_unit": report["selected_unit"],
            "mutation_ready": report["mutation_ready"],
            "authority_effect": report["authority_effect"],
            "configured_commands_executed": report["configured_commands_executed"],
        },
    )

    legacy = load(RUN / "validation/probes-v2/legacy-flat/work-pack-readiness-report-v2.json")
    legacy_codes = [item["code"] for item in legacy["blockers"]]
    record(
        "legacy-flat-closeout-rejected",
        legacy_codes.count("MUTATION_EXECUTION_CONTRACT_MISSING") == 14,
        {"counts": {code: legacy_codes.count(code) for code in sorted(set(legacy_codes))}},
    )
    modern = load(RUN / "validation/probes-v2/modern-selector/work-pack-readiness-report-v2.json")
    record(
        "modern-selector-contract-contradiction-exposed",
        modern["terminal_code"] == "CONTINUITY_RECEIPT_MISSING"
        and modern["blockers"][0]["claim"].endswith(
            "closeout selector must be /lifecycle_owner_validation/status"
        ),
        {"terminal_code": modern["terminal_code"], "blockers": modern["blockers"]},
    )

    symlinks = [path.relative_to(RUN).as_posix() for path in RUN.rglob("*") if path.is_symlink()]
    record("run-root-has-no-symlinks", not symlinks, symlinks)
    whitespace = []
    for path in RUN.rglob("*"):
        if not path.is_file() or "__pycache__" in path.parts or path.suffix == ".pyc":
            continue
        try:
            lines = path.read_text().splitlines()
        except UnicodeDecodeError:
            continue
        for number, line in enumerate(lines, 1):
            if line.rstrip() != line:
                whitespace.append(f"{path.relative_to(RUN)}:{number}")
    record("run-root-whitespace", not whitespace, whitespace)

    result = {
        "schema_version": "invoke.refresh-proposal-validation/v1",
        "result": "pass" if all(item["status"] == "pass" for item in checks) else "fail",
        "check_count": len(checks),
        "checks": checks,
        "claim_ceiling": "proposal-evidence-only",
        "authority_effect": "none",
        "mutation_ready": False,
    }
    (RUN / "validation/VALIDATION-RESULT.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    return 0 if result["result"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
