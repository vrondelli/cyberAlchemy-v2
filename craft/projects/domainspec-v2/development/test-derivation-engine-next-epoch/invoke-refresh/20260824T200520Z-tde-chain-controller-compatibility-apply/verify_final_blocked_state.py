#!/usr/bin/env python3
"""Verify the final blocked apply evidence without changing governed bytes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path.cwd().resolve()
RUN_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-refresh/20260824T200520Z-tde-chain-controller-compatibility-apply"
)
TARGET_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
RUN = ROOT / RUN_REL
TARGET = ROOT / TARGET_REL


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    package = load_json(RUN / "material/material-package.json")
    receipt = load_json(RUN / "material/material-package-receipt.json")
    report = load_json(RUN / "refresh-report.json")
    helper = load_json(RUN / "HELPER-RECEIPT.json")
    baseline = load_json(RUN / "baseline/PREAPPLY-BASELINE.json")
    failures: list[str] = []

    json_count = 0
    for root in (RUN, TARGET):
        for path in root.rglob("*.json"):
            json_count += 1
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError) as error:
                failures.append(f"JSON parse: {path.relative_to(ROOT)}: {error}")

    markdown_count = 0
    for root in (RUN, TARGET):
        for path in root.rglob("*.md"):
            markdown_count += 1
            payload = path.read_bytes()
            text = payload.decode("utf-8")
            if not payload.endswith(b"\n") or payload.endswith(b"\n\n"):
                failures.append(f"Markdown EOF: {path.relative_to(ROOT)}")
            if any(line.endswith(" ") or line.endswith("\t") for line in text.splitlines()):
                failures.append(f"Markdown trailing whitespace: {path.relative_to(ROOT)}")

    symlinks = sorted(
        str(path.relative_to(ROOT))
        for root in (RUN, TARGET)
        for path in root.rglob("*")
        if path.is_symlink()
    )
    if symlinks:
        failures.append("symlinks present")

    changes = package["changes"]
    live_files = {
        str(path.relative_to(ROOT))
        for path in TARGET.rglob("*")
        if path.is_file() and not path.is_symlink()
    }
    expected_files = {item["target_path"] for item in changes}
    if len(changes) != 84 or live_files != expected_files:
        failures.append("live 84-path set differs")
    for change in changes:
        target_payload = (ROOT / change["target_path"]).read_bytes()
        staged_payload = (ROOT / change["output_ref"]["path"]).read_bytes()
        if (
            target_payload != staged_payload
            or sha256_bytes(target_payload) != change["output_ref"]["sha256"]
            or len(target_payload) != change["output_ref"]["size_bytes"]
        ):
            failures.append(f"live/staged mismatch: {change['target_path']}")

    canonical_package_digest = sha256_bytes(
        json.dumps(package, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    if canonical_package_digest != receipt["packageDigest"]:
        failures.append("material package canonical digest differs from receipt")
    if report.get("mutationReady") is not False or report.get("phaseStatus") != "block":
        failures.append("Refresh report does not preserve blocked non-mutation-ready state")
    if helper.get("mutation_ready") is not False or helper.get("status") != "blocked":
        failures.append("helper receipt does not preserve blocked non-mutation-ready state")
    if (RUN / "validation/controller-probe-state").exists():
        failures.append("controller probe created persistent state")
    if (TARGET / "acceptance").exists():
        failures.append("canonical @3 contains an acceptance directory")

    preservation_count = 0
    for entry in baseline["preserved_source_checks"] + [
        {"path": item["path"], "before_sha256": item["sha256"]}
        for item in baseline["proposal_bindings"]
    ]:
        preservation_count += 1
        path = ROOT / entry["path"]
        current_sha = sha256_bytes(path.read_bytes()) if path.is_file() and not path.is_symlink() else None
        if current_sha != entry["before_sha256"]:
            failures.append(f"protected source drift: {entry['path']}")

    required_hashes = {
        "LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json": "70284dd51723d727daad1edee78493e71a4a5ebca7e80c832c32d095efeda3eb",
        "governance-defect-sidecar/STAGED-REPAIR-CANDIDATE.json": "cdccf67844398ce759878754eb6059166d682808603c8a327d666a34a4f858b8",
    }
    for relative, expected_sha in required_hashes.items():
        if sha256_bytes((RUN / relative).read_bytes()) != expected_sha:
            failures.append(f"joined sidecar binding drift: {relative}")

    result = {
        "schema_version": "domainspec-v2.invoke-refresh-final-blocked-state-validation/v1",
        "status": "pass" if not failures else "fail",
        "validated_state": "blocked-apply-evidence-consistent",
        "target_file_count": len(live_files),
        "target_bytes_equal_staged": not any("live/staged mismatch" in item for item in failures),
        "json_document_count": json_count,
        "markdown_document_count": markdown_count,
        "symlinks": symlinks,
        "protected_source_count": preservation_count,
        "material_package_digest": canonical_package_digest,
        "refresh_phase_status": report.get("phaseStatus"),
        "mutation_ready": report.get("mutationReady"),
        "acceptance_created": (TARGET / "acceptance").exists(),
        "controller_state_created": (RUN / "validation/controller-probe-state").exists(),
        "failures": failures,
        "authority_effect": "none",
        "claim_ceiling": "Internal consistency of the stopped apply evidence only; this is not acceptance, selection, execution, or mutation admission.",
    }
    path = RUN / "validation/FINAL-BLOCKED-STATE-VALIDATION.json"
    path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"status": result["status"], "failures": len(failures), "target_file_count": len(live_files)}, sort_keys=True))
    raise SystemExit(0 if not failures else 1)


if __name__ == "__main__":
    main()
