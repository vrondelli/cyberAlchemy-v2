from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


def _exact_file(base: Path, ref: dict[str, Any]) -> tuple[bool, str]:
    path = ref.get("path")
    if not isinstance(path, str) or path.startswith("/") or ".." in Path(path).parts:
        return False, "invalid-path"
    target = base / path
    if not target.is_file():
        return False, "missing"
    data = target.read_bytes()
    if len(data) != ref.get("size_bytes"):
        return False, "size-drift"
    if hashlib.sha256(data).hexdigest() != ref.get("sha256"):
        return False, "digest-drift"
    return True, "exact"


def evaluate_tde_compatibility(repo: Path, mapping: dict[str, Any]) -> dict[str, Any]:
    binding_ok, binding_reason = _exact_file(repo, mapping["runtime_binding"])
    bindings: dict[str, Any] = {}
    if binding_ok:
        bindings = json.loads((repo / mapping["runtime_binding"]["path"]).read_text())

    runtime_root = (repo / mapping.get("runtime_root", ".")).resolve()
    results = []
    for item in mapping["mappings"]:
        profile_ok, profile_reason = _exact_file(repo, item["profile"])
        runtime_checks = []
        for runtime_id in item["required_runtimes"]:
            record = bindings.get("runtimes", {}).get(runtime_id)
            if not binding_ok or not isinstance(record, dict):
                runtime_checks.append({"runtime_id": runtime_id, "status": "FAIL", "reason": "binding-unavailable"})
                continue
            runtime_path = record.get("path")
            target = runtime_root / runtime_path if isinstance(runtime_path, str) else runtime_root / "__invalid__"
            if not target.is_file():
                runtime_checks.append({"runtime_id": runtime_id, "status": "FAIL", "reason": "runtime-missing"})
                continue
            digest = hashlib.sha256(target.read_bytes()).hexdigest()
            exact = digest == record.get("sha256")
            runtime_checks.append({"runtime_id": runtime_id, "status": "PASS" if exact else "FAIL", "reason": "exact" if exact else "runtime-digest-drift"})

        eligible = profile_ok and binding_ok and all(check["status"] == "PASS" for check in runtime_checks)
        residue = []
        if not profile_ok:
            residue.append(f"profile-{profile_reason}")
        if not binding_ok:
            residue.append(f"runtime-binding-{binding_reason}")
        residue.extend(f"{check['runtime_id']}-{check['reason']}" for check in runtime_checks if check["status"] == "FAIL")
        results.append({
            "historical_layer": item["historical_layer"],
            "candidate_tier": item["candidate_tier"],
            "compatibility_state": "eligible_for_fresh_invocation" if eligible else "not_evaluable",
            "tier_granted": False,
            "profile_check": {"status": "PASS" if profile_ok else "FAIL", "reason": profile_reason},
            "runtime_checks": runtime_checks,
            "residue": sorted(set(residue)),
        })

    return {
        "schema_version": "evf.verification-tier-compatibility-result/v1",
        "mapping_id": mapping["mapping_id"],
        "runtime_binding_check": {"status": "PASS" if binding_ok else "FAIL", "reason": binding_reason},
        "mappings": results,
        "overall_state": "eligible_for_fresh_invocation" if all(item["compatibility_state"] == "eligible_for_fresh_invocation" for item in results) else "not_evaluable",
        "retroactive_verification": False,
        "authority_effect": "none",
    }
