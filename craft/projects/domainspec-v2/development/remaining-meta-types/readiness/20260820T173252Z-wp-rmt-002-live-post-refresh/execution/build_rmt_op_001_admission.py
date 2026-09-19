#!/usr/bin/env python3
"""Build and validate the pre-write Task Session admission for RMT-OP-001."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[7]
ATTEMPT_ID = "rmt-op-001-20260820T180000Z"
ATTEMPT = ROOT / ".task-session/runs" / ATTEMPT_ID
STAGED_REL = Path(
    ".task-session/runs"
) / ATTEMPT_ID / "staged/projects/domainspec-v2/development/remaining-meta-types/active-types/operation/admission"
LIVE_DIR_REL = Path(
    "projects/domainspec-v2/development/remaining-meta-types/active-types/operation/admission"
)
PLAN_REL = Path(
    "projects/domainspec-v2/development/refinement-runs/"
    "20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
)
READINESS_REL = Path(
    "projects/domainspec-v2/development/remaining-meta-types/readiness/"
    "20260820T173252Z-wp-rmt-002-live-post-refresh"
)

TASK_SESSION = ROOT / "arcanum/arcana/task-session"
INVOKE = ROOT / "arcanum/spells/invoke"
READINESS = ROOT / "arcanum/spells/work-pack-readiness-audit"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load module: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


ADMISSION = load_module(
    "rmt_op_001_task_session_admission",
    TASK_SESSION / "scripts/verify-mutation-readiness.py",
)
MATERIAL = load_module(
    "rmt_op_001_material_package",
    INVOKE / "scripts/material_package_validator.py",
)


def canonical_digest(value) -> str:
    return hashlib.sha256(
        json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode(
            "utf-8"
        )
    ).hexdigest()


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def exact_ref(relative: str, *, camel: bool = True) -> dict:
    path = ROOT / relative
    content = path.read_bytes()
    return {
        "path": relative,
        "sha256": hashlib.sha256(content).hexdigest(),
        "sizeBytes" if camel else "size_bytes": len(content),
    }


def main() -> int:
    live_dir = ROOT / LIVE_DIR_REL
    if live_dir.exists():
        raise RuntimeError(f"live target must be absent before admission: {LIVE_DIR_REL}")

    staged_dir = ROOT / STAGED_REL
    staged_names = [
        "admission.json",
        "source-inventory.json",
        "validate-admission.mjs",
    ]
    if sorted(path.name for path in staged_dir.iterdir()) != sorted(staged_names):
        raise RuntimeError("staged material inventory is not the exact three-file set")

    material_writes = [
        (LIVE_DIR_REL / name).as_posix() for name in staged_names
    ]
    execution_outputs = [(LIVE_DIR_REL / "RECEIPT.json").as_posix()]
    allowed_writes = material_writes + execution_outputs

    contracts = json.loads((ROOT / PLAN_REL / "SWU-CONTRACTS.json").read_text())
    contract = next(item for item in contracts["contracts"] if item["swu_id"] == "RMT-OP-001")
    structured_validation = [
        {
            "command_id": item["command_id"],
            "argv": item["argv"],
            "cwd": item["cwd"],
            "timeout_seconds": item["timeout_seconds"],
            "max_output_bytes": item["max_output_bytes"],
        }
        for item in contract["validation_contracts"]
    ]
    validation_commands = contract["verification"]["commands"]
    validation_digest = canonical_digest(structured_validation)

    selection_rel = (
        READINESS_REL / "execution/selection-receipt.json"
    ).as_posix()
    manifest_rel = (
        READINESS_REL / "audit-2/plan-semantic-manifest.json"
    ).as_posix()
    selection = json.loads((ROOT / selection_rel).read_text())
    manifest = json.loads((ROOT / manifest_rel).read_text())
    if selection["selectionVerdict"] != "select" or selection["swuId"] != "RMT-OP-001":
        raise RuntimeError("selection receipt does not select RMT-OP-001")
    if selection["manifestDigest"] != exact_ref(manifest_rel)["sha256"]:
        raise RuntimeError("selection receipt no longer binds the semantic manifest")
    if manifest["plan_epoch_id"] != selection["planEpochId"]:
        raise RuntimeError("selection and semantic manifest epochs differ")
    if manifest["unit_contract_digests"].get("RMT-OP-001") != selection["unitContractDigest"]:
        raise RuntimeError("selection and semantic manifest unit digests differ")

    target_baselines_camel = [
        {"path": path, "state": "absent", "sha256": None, "sizeBytes": None}
        for path in material_writes
    ]
    target_baselines_snake = [
        {"path": path, "state": "absent", "sha256": None, "size_bytes": None}
        for path in material_writes
    ]

    context_rel = (
        Path(".task-session/runs") / ATTEMPT_ID / "context-pack.json"
    ).as_posix()
    context = {
        "schema_version": "domainspec.wp-rmt-002-task-session-context/v1",
        "work_pack_id": "WP-RMT-002",
        "task_id": "TASK-RMT-OP",
        "swu_id": "RMT-OP-001",
        "attempt_id": ATTEMPT_ID,
        "strict_coverage": True,
        "selection": {
            "plan_epoch_id": selection["planEpochId"],
            "unit_contract_digest": selection["unitContractDigest"],
            "selection_receipt_sha256": exact_ref(selection_rel)["sha256"],
        },
        "execution_contract": {
            "writeProfile": "material-bound",
            "materialWrites": material_writes,
            "executionOutputs": execution_outputs,
            "allowedWrites": allowed_writes,
            "validationCommands": validation_commands,
            "lifecycleOwner": contract["lifecycle_owner"],
            "authorityClass": contract["authority_class"],
            "publicationClass": contract["publication_class"],
        },
        "claim_ceiling": "candidate-local admission material only; authority effect none",
        "authority_effect": "none",
    }
    write_json(ROOT / context_rel, context)

    control_specs = [
        ((PLAN_REL / "tasks/TASK-RMT-OP.md").as_posix(), "task-contract"),
        ((PLAN_REL / "WORK-PACK.md").as_posix(), "work-pack"),
        (context_rel, "context-pack"),
    ]
    controls = [
        {
            **exact_ref(path),
            "role": role,
            "authorityClass": "private",
        }
        for path, role in control_specs
    ]

    plan_binding = {
        "task_id": "TASK-RMT-OP",
        "swu_id": "RMT-OP-001",
        "plan_epoch_id": selection["planEpochId"],
        "unit_contract_digest": selection["unitContractDigest"],
        "selection_receipt_digest": exact_ref(selection_rel)["sha256"],
        "attempt_id": ATTEMPT_ID,
        "validation_contract_digest": validation_digest,
        "validation_contracts": structured_validation,
        "target_baselines": target_baselines_snake,
    }

    package = {
        "schema_version": "1.0.0",
        "package_id": f"WP-RMT-002-RMT-OP-001-{ATTEMPT_ID}",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": contract["lifecycle_owner"],
        "authority_class": contract["authority_class"],
        "publication_class": contract["publication_class"],
        "source_artifacts": [
            {
                "path": item["path"],
                "sha256": item["sha256"],
                "size_bytes": item["sizeBytes"],
                "authority_class": item["authorityClass"],
            }
            for item in controls
        ],
        "changes": [
            {
                "target_path": target,
                "operation": "create",
                "output_ref": exact_ref(
                    (STAGED_REL / Path(target).name).as_posix(), camel=False
                ),
            }
            for target in material_writes
        ],
        "target_inventory": [
            {
                "target_path": target,
                "lifecycle_owner": contract["lifecycle_owner"],
                "authority_class": contract["authority_class"],
                "publication_class": contract["publication_class"],
                "dependency_ids": [],
            }
            for target in material_writes
        ],
        "dependencies": [],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": contract["lifecycle_owner"],
            "scope_paths": material_writes,
            "authority_classes": [contract["authority_class"]],
            "publication_classes": [contract["publication_class"]],
        },
        "validation_commands": validation_commands,
        "plan_binding": plan_binding,
    }

    package_rel = (
        Path(".task-session/runs") / ATTEMPT_ID / "material-package.json"
    ).as_posix()
    material_receipt_rel = (
        Path(".task-session/runs") / ATTEMPT_ID / "material-package-receipt.json"
    ).as_posix()
    write_json(ROOT / package_rel, package)
    package_schema = json.loads(
        (INVOKE / "schemas/material-package.schema.json").read_text()
    )
    material_receipt_schema = json.loads(
        (INVOKE / "schemas/material-package-receipt.schema.json").read_text()
    )
    material_receipt = MATERIAL.validate_material_package(
        package, ROOT, package_schema, material_receipt_schema
    )
    if material_receipt["patchVerdict"] != "pass":
        raise RuntimeError(f"material package rejected: {material_receipt['reasons']}")
    write_json(ROOT / material_receipt_rel, material_receipt)

    plan_schema_rel = (
        Path("arcanum/spells/work-pack-readiness-audit/schemas/")
        / "plan-semantic-manifest.schema.json"
    ).as_posix()
    selection_schema_rel = (
        Path("arcanum/spells/work-pack-readiness-audit/schemas/")
        / "selection-receipt.schema.json"
    ).as_posix()
    producer_receipt_schema_rel = (
        Path("arcanum/spells/invoke/schemas/")
        / "material-package-receipt.schema.json"
    ).as_posix()

    request = {
        "schemaVersion": "1.2.0",
        "admissionProfile": "plan-once-selected-unit",
        "executionMode": "routed-mutation",
        "taskId": "TASK-RMT-OP",
        "swuId": "RMT-OP-001",
        "controlArtifacts": controls,
        "dependencyFrontier": [],
        "materialPackage": exact_ref(package_rel),
        "materialReceipt": exact_ref(material_receipt_rel),
        "producerReceiptSchema": exact_ref(producer_receipt_schema_rel),
        "materialWrites": material_writes,
        "executionOutputs": execution_outputs,
        "allowedWrites": allowed_writes,
        "validationCommands": validation_commands,
        "lifecycleOwner": contract["lifecycle_owner"],
        "authorityClass": contract["authority_class"],
        "publicationClass": contract["publication_class"],
        "planAdmission": {
            "planManifest": exact_ref(manifest_rel),
            "planManifestSchema": exact_ref(plan_schema_rel),
            "selectionReceipt": exact_ref(selection_rel),
            "selectionReceiptSchema": exact_ref(selection_schema_rel),
            "planEpochId": selection["planEpochId"],
            "unitContractDigest": selection["unitContractDigest"],
            "attemptId": ATTEMPT_ID,
            "targetBaselines": target_baselines_camel,
            "structuredValidationContracts": structured_validation,
            "validationContractDigest": validation_digest,
        },
    }
    request_rel = (
        Path(".task-session/runs") / ATTEMPT_ID / "mutation-admission-request.json"
    ).as_posix()
    admission_receipt_rel = (
        Path(".task-session/runs") / ATTEMPT_ID / "mutation-admission-receipt.json"
    ).as_posix()
    write_json(ROOT / request_rel, request)

    request_schema = json.loads(
        (TASK_SESSION / "schemas/mutation-admission-request.schema.json").read_text()
    )
    admission_receipt_schema = json.loads(
        (TASK_SESSION / "schemas/mutation-admission-receipt.schema.json").read_text()
    )
    admission_receipt = ADMISSION.resolve_mutation_admission(
        request, ROOT, request_schema
    )
    receipt_errors = sorted(
        error.message
        for error in Draft202012Validator(admission_receipt_schema).iter_errors(
            admission_receipt
        )
    )
    if receipt_errors:
        raise RuntimeError(f"mutation admission receipt schema errors: {receipt_errors}")
    write_json(ROOT / admission_receipt_rel, admission_receipt)
    if not (
        admission_receipt["admissionVerdict"] == "admit"
        and admission_receipt["mutationReady"] is True
        and admission_receipt["reasons"] == []
    ):
        raise RuntimeError(
            "mutation admission blocked: " + "; ".join(admission_receipt["reasons"])
        )

    print(
        json.dumps(
            {
                "result": "pass",
                "swu_id": "RMT-OP-001",
                "attempt_id": ATTEMPT_ID,
                "material_package": exact_ref(package_rel),
                "material_receipt": exact_ref(material_receipt_rel),
                "mutation_request": exact_ref(request_rel),
                "mutation_admission_receipt": exact_ref(admission_receipt_rel),
                "material_writes": material_writes,
                "execution_outputs": execution_outputs,
                "authority_effect": "none",
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
