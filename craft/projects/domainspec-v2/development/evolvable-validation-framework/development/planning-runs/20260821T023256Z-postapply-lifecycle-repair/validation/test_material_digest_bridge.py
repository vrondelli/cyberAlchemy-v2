#!/usr/bin/env python3
"""Exercise the EVF pre-apply material digest bridge with a forged digest."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


RUN = (
    "projects/domainspec-v2/development/evolvable-validation-framework/"
    "development/planning-runs/20260821T023256Z-postapply-lifecycle-repair"
)
INVENTORY = f"{RUN}/CANDIDATE-INVENTORY.json"
VALIDATOR = f"{RUN}/validation/validate_projected_postapply_lifecycle.py"
FORGED_DIGEST = "f" * 64


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: object) -> str:
    payload = json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return sha256(payload)


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode("utf-8")


def exact_ref(relative: str, data: bytes) -> dict[str, Any]:
    return {"path": relative, "sha256": sha256(data), "size_bytes": len(data)}


def write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def relative(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root).as_posix()


def invoke(
    root: Path,
    validator: Path,
    output: Path,
    review: Path,
    acceptance: Path,
    package: Path,
    material_root: Path,
    receipt: Path,
    handoff: Path,
) -> tuple[int, dict[str, Any], str]:
    command = [
        sys.executable,
        str(validator),
        "--repo-root",
        str(root),
        "--phase",
        "pre-apply",
        "--output",
        relative(root, output),
        "--independent-review",
        relative(root, review),
        "--owner-acceptance",
        relative(root, acceptance),
        "--material-package",
        relative(root, package),
        "--material-root",
        relative(root, material_root),
        "--material-receipt",
        relative(root, receipt),
        "--handoff-receipt",
        relative(root, handoff),
    ]
    completed = subprocess.run(
        command,
        cwd=root,
        check=False,
        capture_output=True,
        text=True,
    )
    result = json.loads(output.read_text(encoding="utf-8"))
    return completed.returncode, result, " ".join(command)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    root = Path(args.repo_root).resolve()
    output = Path(args.output)
    if not output.is_absolute():
        output = root / output
    validator = root / VALIDATOR
    inventory_data = (root / INVENTORY).read_bytes()
    inventory = json.loads(inventory_data.decode("utf-8"))
    candidate_digest = inventory["package_digest"]
    target_rows = inventory["targets"]
    target_paths = [row["canonical_path"] for row in target_rows]
    validation_dir = root / RUN / "validation"

    with tempfile.TemporaryDirectory(
        prefix=".material-digest-regression-", dir=validation_dir
    ) as temporary:
        temp = Path(temporary)
        material_root = temp / "material-root"
        sources_root = material_root / "sources"
        outputs_root = material_root / "outputs"

        review = {
            "schema_version": "evf.synthetic-independent-review/v1",
            "review_id": "SYNTHETIC-MATERIAL-DIGEST-BRIDGE",
            "verdict": "pass",
            "blocking_defects": [],
            "candidate_binding": {"package_digest": candidate_digest},
            "authority_effect": "none",
        }
        review_data = json_bytes(review)
        review_path = temp / "review.json"
        write_bytes(review_path, review_data)

        acceptance = {
            "schema_version": "evf.synthetic-owner-acceptance/v1",
            "decision": "exact-byte-package-accepted",
            "accepted_package_digest": candidate_digest,
            "review_receipt": {
                "sha256": sha256(review_data),
                "size_bytes": len(review_data),
            },
            "authority_effect": "none",
        }
        acceptance_data = json_bytes(acceptance)
        acceptance_path = temp / "acceptance.json"
        write_bytes(acceptance_path, acceptance_data)

        source_payloads = {
            "sources/CANDIDATE-INVENTORY.json": inventory_data,
            "sources/review.json": review_data,
            "sources/acceptance.json": acceptance_data,
        }
        for source_relative, source_data in source_payloads.items():
            write_bytes(material_root / source_relative, source_data)

        changes: list[dict[str, Any]] = []
        for row in target_rows:
            canonical_path = row["canonical_path"]
            postimage_ref = row["postimage"]
            postimage_data = (root / postimage_ref["path"]).read_bytes()
            output_relative = f"outputs/{canonical_path}"
            write_bytes(outputs_root / canonical_path, postimage_data)
            changes.append(
                {
                    "target_path": canonical_path,
                    "output_ref": exact_ref(output_relative, postimage_data),
                }
            )

        package = {
            "schema_version": "evf.synthetic-material-package/v1",
            "package_id": "EVF-MATERIAL-DIGEST-BRIDGE-REGRESSION",
            "source_artifacts": [
                exact_ref(source_relative, source_data)
                for source_relative, source_data in source_payloads.items()
            ],
            "changes": changes,
            "approval": {"scope_paths": target_paths},
        }
        package_data = json_bytes(package)
        package_path = temp / "MATERIAL-PACKAGE.json"
        write_bytes(package_path, package_data)
        material_digest = canonical_digest(package)

        def receipt_for(declared_digest: str) -> dict[str, Any]:
            return {
                "schemaVersion": "1.0.0",
                "packageId": package["package_id"],
                "patchVerdict": "pass",
                "mutationHandoff": "ready",
                "packageDigest": declared_digest,
                "validatedPaths": target_paths,
                "dependencyResult": "pass",
                "ownerBoundaryResult": "pass",
                "publicationBoundaryResult": "pass",
                "reasons": [],
            }

        def handoff_for(
            declared_digest: str, receipt_data: bytes
        ) -> dict[str, Any]:
            return {
                "phaseStatus": "pass",
                "handoffStatus": "ready",
                "mutationReady": True,
                "blockers": [],
                "materialPackage": {
                    "packageId": package["package_id"],
                    "packageDigest": declared_digest,
                    "expectedPackageDigest": declared_digest,
                    "validatedPaths": target_paths,
                },
                "materialReceiptBinding": {
                    "actualSha256": sha256(receipt_data),
                    "expectedSha256": sha256(receipt_data),
                    "currentPackageRevalidated": True,
                    "receiptMatchesCurrentValidation": True,
                },
            }

        receipt_path = temp / "MATERIAL-RECEIPT.json"
        handoff_path = temp / "MATERIAL-HANDOFF.json"
        valid_receipt_data = json_bytes(receipt_for(material_digest))
        write_bytes(receipt_path, valid_receipt_data)
        write_bytes(
            handoff_path,
            json_bytes(handoff_for(material_digest, valid_receipt_data)),
        )
        valid_output = temp / "valid-result.json"
        valid_code, valid_result, valid_command = invoke(
            root,
            validator,
            valid_output,
            review_path,
            acceptance_path,
            package_path,
            material_root,
            receipt_path,
            handoff_path,
        )

        forged_receipt_data = json_bytes(receipt_for(FORGED_DIGEST))
        write_bytes(receipt_path, forged_receipt_data)
        write_bytes(
            handoff_path,
            json_bytes(handoff_for(FORGED_DIGEST, forged_receipt_data)),
        )
        forged_output = temp / "forged-result.json"
        forged_code, forged_result, forged_command = invoke(
            root,
            validator,
            forged_output,
            review_path,
            acceptance_path,
            package_path,
            material_root,
            receipt_path,
            handoff_path,
        )

        temporary_relative = relative(root, temp)
        stable_temporary = f"{RUN}/validation/<temporary>"
        valid_command = valid_command.replace(temporary_relative, stable_temporary)
        forged_command = forged_command.replace(temporary_relative, stable_temporary)

        expected_failure = "PREAPPLY_MATERIAL_PACKAGE_DIGEST_MISMATCH"
        passed = (
            valid_code == 0
            and valid_result.get("verdict") == "pass"
            and forged_code == 1
            and forged_result.get("verdict") == "fail"
            and expected_failure in forged_result.get("failures", [])
        )
        result = {
            "schema_version": "evf.material-digest-bridge-regression/v1",
            "run_id": "20260821T023256Z-postapply-lifecycle-repair",
            "verdict": "pass" if passed else "fail",
            "candidate_package_digest": candidate_digest,
            "material_package_file_sha256": sha256(package_data),
            "computed_material_package_digest": material_digest,
            "valid_case": {
                "command": valid_command,
                "exit_code": valid_code,
                "verdict": valid_result.get("verdict"),
                "failures": valid_result.get("failures"),
            },
            "forged_case": {
                "mutation": (
                    "material package unchanged; receipt and handoff declare a "
                    "different internally consistent material digest"
                ),
                "forged_digest": FORGED_DIGEST,
                "command": forged_command,
                "exit_code": forged_code,
                "verdict": forged_result.get("verdict"),
                "failures": forged_result.get("failures"),
                "expected_failure": expected_failure,
            },
            "temporary_material_removed_after_run": True,
            "authority_effect": "none",
            "release_admission": "not-granted",
        }

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_output = output.with_name(output.name + ".tmp")
    if temporary_output.exists() or temporary_output.is_symlink():
        raise RuntimeError(f"temporary output collision: {temporary_output}")
    temporary_output.write_bytes(json_bytes(result))
    os.replace(temporary_output, output)
    return 0 if result["verdict"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
