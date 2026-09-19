#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any

from ts004_scope import TARGETS


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = HERE.relative_to(ROOT).as_posix()
READINESS = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/016-ts004-readiness"
)
WORK_PACK = "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"
TASK = "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md"
MANIFEST = "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json"
DEPENDENCY = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-003.json"
RECEIPT_TARGET = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-004.json"


def canonical_digest(value: Any) -> str:
    data = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(data).hexdigest()


def exact_ref(path: str, *, authority: bool = False) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    result: dict[str, Any] = {
        "path": path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }
    if authority:
        result["authority_class"] = "private"
    return result


def admission_ref(path: str) -> dict[str, Any]:
    item = exact_ref(path)
    return {"path": item["path"], "sha256": item["sha256"], "sizeBytes": item["size_bytes"]}


def staged_ref(target: str) -> dict[str, Any]:
    return exact_ref(f"{BASE}/staged/{target}")


def target_baseline(target: str, *, admission_shape: bool = False) -> dict[str, Any]:
    return {
        "path": target,
        "state": "absent",
        "sha256": None,
        "sizeBytes" if admission_shape else "size_bytes": None,
    }


manifest = json.loads((ROOT / MANIFEST).read_text(encoding="utf-8"))
swu = manifest["swus"][11]
if swu["swu_id"] != "SWU-APE-ENUM-TS-004":
    raise SystemExit("TS004 manifest index drift")
contracts = swu["validation_contracts"]
selection_path = f"{READINESS}/selection-receipt.json"
selection = json.loads((ROOT / selection_path).read_text(encoding="utf-8"))
for target in TARGETS:
    if (ROOT / target).exists():
        raise SystemExit(f"TS004 target baseline must be absent: {target}")

revision = subprocess.run(
    ["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True
).stdout.strip()
context = {
    "schema_version": "ape.context-pack.v1",
    "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "swu_id": "SWU-APE-ENUM-TS-004",
    "mode": "lean",
    "strict_coverage": True,
    "session_evidence": True,
    "repository_revision": revision,
    "execution_contract": {
        "writeProfile": "material-bound",
        "materialWrites": TARGETS,
        "executionOutputs": [RECEIPT_TARGET],
        "allowedWrites": [*TARGETS, RECEIPT_TARGET],
        "validationCommands": [item["command_id"] for item in contracts],
        "lifecycleOwner": "projects/domainspec-v2",
        "authorityClass": "private",
        "publicationClass": "internal",
    },
    "selection_receipt": exact_ref(selection_path),
    "immutable_inputs": [
        exact_ref(path)
        for path in [WORK_PACK, TASK, MANIFEST, *swu["pre_execution_inputs"]]
    ],
    "target_baselines": [target_baseline(target) for target in TARGETS],
    "admitted_delta_classes": swu["admitted_delta_classes"],
    "obligations": [
        {"id": "TS004-O1", "status": "covered", "summary": "Execute the complete TypeScript ontology-to-finding proof with reachable raw artifacts.", "evidence": ["staged execution receipt", "runner"]},
        {"id": "TS004-O2", "status": "covered", "summary": "Kill all twelve non-positive cases for their exact declared causes.", "evidence": ["staged mutation receipt", "TS003 denominator"]},
        {"id": "TS004-O3", "status": "covered", "summary": "Recompose twice and require byte-identical normalized artifacts.", "evidence": ["staged replay receipt", "focused trust test"]},
        {"id": "TS004-O4", "status": "covered", "summary": "Bind the passing proof and scenario readiness into one content-addressed frozen observation contract.", "evidence": ["FROZEN-OBSERVATION.json", "scenario readiness receipt"]},
        {"id": "TS004-O5", "status": "covered", "summary": "Keep BTE provider adoption owner-gated while its current provider and scenario contracts regress green.", "evidence": ["scenario checker", "BTE proof-engine regression"]},
    ],
    "selected_sources": [
        {"path": TASK, "selectors": ["SWU-APE-ENUM-TS-004"], "obligations": ["TS004-O1", "TS004-O2", "TS004-O3", "TS004-O4", "TS004-O5"]},
        {"path": MANIFEST, "selectors": ["/swus/11"], "obligations": ["TS004-O1", "TS004-O5"]},
        {"path": DEPENDENCY, "selectors": ["/acceptance_accounting"], "obligations": ["TS004-O1", "TS004-O4"]},
    ],
    "write_scope": swu["write_scope"],
    "claim_ceiling": "TypeScript Enum trust proof and frozen observation contract only; no BTE provider adoption, cross-language parity, promotion, publication, release, deployment, or production authority.",
}
(HERE / "context-pack.json").write_text(json.dumps(context, indent=2, sort_keys=True) + "\n", encoding="utf-8")

package = {
    "schema_version": "1.0.0",
    "package_id": "ape-ts004-trust-proof-20260806T024000Z",
    "mutation_mode": "apply-approved",
    "mutation_state": "materialized",
    "lifecycle_owner": "projects/domainspec-v2",
    "authority_class": "private",
    "publication_class": "internal",
    "source_artifacts": [exact_ref(TASK, authority=True), exact_ref(WORK_PACK, authority=True), {**exact_ref(f"{BASE}/context-pack.json"), "authority_class": "private"}],
    "changes": [
        {"target_path": target, "operation": "create", "output_ref": staged_ref(target)}
        for target in TARGETS
    ],
    "target_inventory": [
        {"target_path": target, "lifecycle_owner": "projects/domainspec-v2", "authority_class": "private", "publication_class": "internal", "dependency_ids": ["SWU-APE-ENUM-TS-003"]}
        for target in TARGETS
    ],
    "dependencies": [{"dependency_id": "SWU-APE-ENUM-TS-003", "artifact_ref": exact_ref(DEPENDENCY)}],
    "mirror_groups": [],
    "approval": {"class": "explicit-apply", "owner": "projects/domainspec-v2", "scope_paths": TARGETS, "authority_classes": ["private"], "publication_classes": ["internal"]},
    "validation_commands": [item["command_id"] for item in contracts],
    "plan_binding": {
        "task_id": "TASK-APE-L1-ENUM-TYPESCRIPT",
        "swu_id": "SWU-APE-ENUM-TS-004",
        "plan_epoch_id": selection["planEpochId"],
        "unit_contract_digest": selection["unitContractDigest"],
        "selection_receipt_digest": exact_ref(selection_path)["sha256"],
        "attempt_id": "task-session-ape-ts004-goal-20260806T024000Z",
        "validation_contract_digest": canonical_digest(contracts),
        "validation_contracts": contracts,
        "target_baselines": [target_baseline(target) for target in TARGETS],
    },
}
material_path = HERE / "material-package.json"
material_path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")
material_receipt_path = HERE / "material-receipt.json"
subprocess.run(
    ["python3", ".agents/skills/invoke/scripts/material_package_validator.py", "--root", ".", "--schema-dir", "arcanum/spells/invoke/schemas", "--output", material_receipt_path.relative_to(ROOT).as_posix(), material_path.relative_to(ROOT).as_posix()],
    cwd=ROOT,
    check=True,
)

request = {
    "schemaVersion": "1.2.0",
    "admissionProfile": "plan-once-selected-unit",
    "executionMode": "routed-mutation",
    "taskId": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "swuId": "SWU-APE-ENUM-TS-004",
    "controlArtifacts": [
        {**admission_ref(TASK), "role": "task-contract", "authorityClass": "private"},
        {**admission_ref(WORK_PACK), "role": "work-pack", "authorityClass": "private"},
        {**admission_ref(f"{BASE}/context-pack.json"), "role": "context-pack", "authorityClass": "private"},
    ],
    "dependencyFrontier": [{"dependencyId": "SWU-APE-ENUM-TS-003", "artifactRef": admission_ref(DEPENDENCY)}],
    "materialPackage": admission_ref(f"{BASE}/material-package.json"),
    "materialReceipt": admission_ref(f"{BASE}/material-receipt.json"),
    "producerReceiptSchema": admission_ref("arcanum/spells/invoke/schemas/material-package-receipt.schema.json"),
    "materialWrites": TARGETS,
    "executionOutputs": [RECEIPT_TARGET],
    "allowedWrites": [*TARGETS, RECEIPT_TARGET],
    "validationCommands": [item["command_id"] for item in contracts],
    "lifecycleOwner": "projects/domainspec-v2",
    "authorityClass": "private",
    "publicationClass": "internal",
    "planAdmission": {
        "planManifest": admission_ref(f"{READINESS}/run-1/plan-semantic-manifest.json"),
        "planManifestSchema": admission_ref("arcanum/spells/work-pack-readiness-audit/schemas/plan-semantic-manifest.schema.json"),
        "selectionReceipt": admission_ref(selection_path),
        "selectionReceiptSchema": admission_ref("arcanum/spells/work-pack-readiness-audit/schemas/selection-receipt.schema.json"),
        "planEpochId": package["plan_binding"]["plan_epoch_id"],
        "unitContractDigest": package["plan_binding"]["unit_contract_digest"],
        "attemptId": package["plan_binding"]["attempt_id"],
        "targetBaselines": [target_baseline(target, admission_shape=True) for target in TARGETS],
        "structuredValidationContracts": contracts,
        "validationContractDigest": package["plan_binding"]["validation_contract_digest"],
    },
}
request_path = HERE / "mutation-admission-request.json"
request_path.write_text(json.dumps(request, indent=2) + "\n", encoding="utf-8")
subprocess.run(
    ["python3", ".agents/skills/task-session/scripts/verify-mutation-readiness.py", request_path.relative_to(ROOT).as_posix(), "--repository-root", ".", "--request-schema", "arcanum/arcana/task-session/schemas/mutation-admission-request.schema.json", "--receipt-schema", "arcanum/arcana/task-session/schemas/mutation-admission-receipt.schema.json", "--output", (HERE / "mutation-admission-receipt.json").relative_to(ROOT).as_posix()],
    cwd=ROOT,
    check=True,
)
