#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[5]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    profile = json.loads((ROOT / "profile.json").read_text())
    capability = json.loads((ROOT / "product-capability.json").read_text())
    source = profile["specializes_conceptual_model"]
    if sha(REPO / source["resolved_private_mirror"]) != source["sha256"]:
        errors.append("parent Residuality source drift")
    if source["version"] != "0.1.0" or profile["authority_effect"] != "none":
        errors.append("specialization provenance or authority drift")
    if capability["status"] != "prototype-candidate-unapproved" or capability["authority_effect"] != "none":
        errors.append("product capability status inflation")
    for stage in profile["d65_provenance"]:
        refs = stage.get("paths", [stage] if stage.get("path") else [])
        for ref in refs:
            path, expected = ref.get("path"), ref.get("sha256")
            if expected and sha(REPO / path) != expected:
                errors.append(f"D65 source drift: {path}")
        if stage.get("existing_carrier_path") and sha(REPO / stage["existing_carrier_path"]) != stage["existing_carrier_sha256"]:
            errors.append(f"D65 source drift: {stage['existing_carrier_path']}")
    required = {"reachability", "stable path identity", "safety and liveness", "closure", "provider adequacy", "digests", "joins", "readiness"}
    if not required.issubset(set(profile["ownership"]["evf"])):
        errors.append("EVF ownership mapping incomplete")
    adapter = subprocess.run(
        [sys.executable, str(ROOT / "adapters/candidate_013.py"), "--check"],
        cwd=REPO, text=True, capture_output=True, timeout=60, check=False,
    )
    if adapter.returncode != 0:
        errors.append("candidate-013 adapter replay: " + (adapter.stdout + adapter.stderr).strip())
    try:
        from jsonschema import Draft202012Validator
        schema = json.loads((ROOT / "contracts/residual-path-evaluation.v1.schema.json").read_text())
        receipt = json.loads((ROOT / "generated/candidate-013-residual-path-receipt.json").read_text())
        Draft202012Validator(schema).validate(receipt)
        if receipt["aggregate_readiness"] != "BLOCK":
            errors.append("candidate-013 readiness unexpectedly inflated")
        if receipt["coverage"]["specification_closed_paths"] != 15:
            errors.append("candidate-013 specification closure drift")
    except Exception as exc:
        errors.append(f"EVF receipt schema/replay failure: {exc}")
    print(json.dumps({
        "result": "PASS" if not errors else "BLOCK",
        "candidate_013_readiness": receipt.get("aggregate_readiness", "unknown") if "receipt" in locals() else "unknown",
        "errors": errors,
        "authority_effect": "none"
    }, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
