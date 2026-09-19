from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


BRIDGE_ROOT = Path(__file__).resolve().parents[1]
DOMAINSPEC_ROOT = next(p for p in BRIDGE_ROOT.parents if p.name == "domainspec-core")
UMBRELLA_ROOT = DOMAINSPEC_ROOT.parent
TIER_ROOT = UMBRELLA_ROOT / "cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/verification-tier-enforcement-candidate-v1"


def _load_kernel():
    path = TIER_ROOT / "evf_tiers/kernel.py"
    spec = importlib.util.spec_from_file_location("auth_bridge_evf_tier_kernel", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("tier-kernel-load-failed")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


KERNEL = _load_kernel()


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _exact_ref(path: Path, relative: str) -> dict[str, Any]:
    data = path.read_bytes()
    return {"path": relative, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


def _write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")


def _validate_bound_ref(ref: dict[str, Any]) -> Path:
    target = UMBRELLA_ROOT / ref["path"]
    if not target.is_file():
        raise RuntimeError(f"bound-ref-missing:{ref['path']}")
    if target.stat().st_size != ref["size_bytes"] or _sha(target) != ref["sha256"]:
        raise RuntimeError(f"bound-ref-drift:{ref['path']}")
    return target


def _validate_evidence(path: Path, expected_payload: str) -> dict[str, Any]:
    evidence = json.loads(path.read_text())
    stage_ids = [item.get("stage_id") for item in evidence.get("stage_receipts", [])]
    expected_stages = [f"S{i}" for i in range(13)]
    checks = (
        evidence.get("aggregate_state") == "passed"
        and evidence.get("all_required_stages_present") is True
        and stage_ids == expected_stages
        and all(item.get("state") == "passed" for item in evidence["stage_receipts"])
        and evidence.get("verification_receipt", {}).get("verdict") == "passed"
        and evidence.get("evidence_payload_digest") == expected_payload
    )
    if not checks:
        raise RuntimeError(f"raw-evidence-invalid:{path}")
    return evidence


def _validate_profile_subject_binding(evidence: dict[str, Any], subject_ref: dict[str, Any]) -> None:
    profile_ref = evidence.get("profile_ref", {})
    profile_path = profile_ref.get("path")
    if not isinstance(profile_path, str):
        raise RuntimeError("evidence-profile-ref-invalid")
    target = DOMAINSPEC_ROOT / profile_path
    if not target.is_file() or target.stat().st_size != profile_ref.get("size_bytes") or _sha(target) != profile_ref.get("sha256"):
        raise RuntimeError("evidence-profile-binding-drift")
    profile = json.loads(target.read_text())
    domainspec_subject_path = str(Path(subject_ref["path"]).relative_to("domainspec-core"))
    expected = {
        "path": domainspec_subject_path,
        "sha256": subject_ref["sha256"],
        "size_bytes": subject_ref["size_bytes"],
    }
    bindings = profile.get("binding_refs", [])
    if not any(all(item.get(key) == value for key, value in expected.items()) and item.get("current") is True for item in bindings):
        raise RuntimeError("profile-does-not-bind-tier-subject")


def _run_verifier(verifier: Path, evidence: Path, timeout: int) -> tuple[dict[str, Any], str]:
    completed = subprocess.run(
        [str(verifier), "--repo-root", str(DOMAINSPEC_ROOT), "--evidence", str(evidence)],
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(f"verifier-failed:{completed.returncode}:{completed.stderr.strip()}")
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("verifier-output-invalid") from exc
    if result.get("verdict") != "passed" or result.get("aggregate_state") != "passed":
        raise RuntimeError("verifier-non-pass")
    if result.get("verified_stage_ids") != [f"S{i}" for i in range(13)]:
        raise RuntimeError("verifier-stage-denominator-invalid")
    return result, completed.stderr


def _receipt(provider_id: str, route_id: str, group: str, version: str, subject_sha: str, bounds_digest: str) -> dict[str, Any]:
    receipt = {
        "schema_version": "evf.verification-tier-provider-receipt/v1",
        "receipt_kind": "provider-evidence",
        "provider_id": provider_id,
        "provider_version": version,
        "capability": "executable-evaluation",
        "route_id": route_id,
        "independence_group": group,
        "property_id": "auth.exact-fail-closed-authorization",
        "obligation_id": "auth.allow-iff-all-trusted-predicates-pass",
        "subject_sha256": subject_sha,
        "bounds_digest": bounds_digest,
        "normalized_outcome": "no-counterexample",
        "observation_count": 1,
        "fresh": True,
        "raw_evidence_valid": True,
        "exact_bindings": True,
        "execution_state": "completed",
        "fixture": False,
    }
    receipt["payload_digest"] = KERNEL.digest_value(receipt)
    return receipt


CONTROL_MAP = {
    "subject": "stale-rust-projection",
    "denominator": "denominator-drift",
    "evidence": "malformed-provider-output",
    "execution": "provider-crash",
}


def _controls(hostile: dict[str, Any], mutation: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    observed = {item["id"]: item for item in hostile.get("observations", [])}
    controls = []
    bindings = {}
    for kind, observation_id in CONTROL_MAP.items():
        item = observed.get(observation_id)
        detected = bool(item and item.get("state") == "pass")
        controls.append({"control_id": observation_id, "class": kind, "expected_non_success": True, "detected": detected})
        bindings[kind] = {"source": "HOSTILE-CONTROLS.json", "observation_id": observation_id, "detected": detected}
    killed = [item for item in mutation.get("observations", []) if item.get("state") == "killed-for-declared-cause" and item.get("neutral_passed") is True]
    oracle_detected = mutation.get("status") == "pass" and len(killed) == len(mutation.get("denominator", [])) and len(killed) > 0
    controls.append({"control_id": "auth-behavioral-mutant-oracles", "class": "oracle", "expected_non_success": True, "detected": oracle_detected})
    bindings["oracle"] = {"source": "MUTATION-RESULT.json", "killed": len(killed), "denominator": len(mutation.get("denominator", [])), "detected": oracle_detected}
    if not all(item["detected"] for item in controls):
        raise RuntimeError("v2-control-class-not-detected")
    return controls, bindings


def run_bridge(output: Path, timeout_seconds: int = 60) -> dict[str, Any]:
    output.mkdir(parents=True, exist_ok=False)
    bindings = json.loads((BRIDGE_ROOT / "source-bindings.json").read_text())
    refs = {name: _validate_bound_ref(ref) for name, ref in bindings["refs"].items()}
    verifier = Path(bindings["verifier"]["path"])
    if not verifier.is_file() or verifier.stat().st_size != bindings["verifier"]["size_bytes"] or _sha(verifier) != bindings["verifier"]["sha256"]:
        raise RuntimeError("verifier-binding-drift")

    executable = _validate_evidence(refs["executable_evidence"], "b38ae49ae8a441260852f8659753513e83c06549ae84fea7c774b05c6794caae")
    theorem = _validate_evidence(refs["theorem_evidence"], "0d3fa72d32204ba7e29d579b84527b4fd89a259b4a71cf2cf8033b5311a9d4a3")
    _validate_profile_subject_binding(executable, bindings["refs"]["subject"])
    _validate_profile_subject_binding(theorem, bindings["refs"]["subject"])
    executable_run, executable_stderr = _run_verifier(verifier, refs["executable_evidence"], timeout_seconds)
    theorem_run, theorem_stderr = _run_verifier(verifier, refs["theorem_evidence"], timeout_seconds)
    _write_json(output / "executable-verifier.json", executable_run)
    (output / "executable-verifier.stderr.log").write_text(executable_stderr)
    _write_json(output / "theorem-verifier.json", theorem_run)
    (output / "theorem-verifier.stderr.log").write_text(theorem_stderr)

    hostile = json.loads(refs["hostile_controls"].read_text())
    mutation = json.loads(refs["mutation_result"].read_text())
    controls, control_bindings = _controls(hostile, mutation)
    _write_json(output / "CONTROL-BINDINGS.json", control_bindings)

    property_rel = str((BRIDGE_ROOT / "property.json").relative_to(UMBRELLA_ROOT))
    bounds = {"denominator": 1, "timeout_seconds": timeout_seconds, "max_output_bytes": 1_048_576}
    bounds["digest"] = KERNEL.digest_value(bounds)
    base = {
        "schema_version": "evf.verification-tier-invocation/v1",
        "request_id": "auth-foundation-exact-fail-closed-authorization",
        "requested_tier": "V0",
        "profile": {"path": bindings["refs"]["tier_profile"]["path"], "sha256": bindings["refs"]["tier_profile"]["sha256"], "profile_id": "evf.core.verification-tiers.v0-v2", "profile_version": "1"},
        "property": {"property_id": "auth.exact-fail-closed-authorization", "meaning_owner": "Auth Foundation product contracts candidate", "obligation_id": "auth.allow-iff-all-trusted-predicates-pass", "traits": ["executable-implementation"], "definition_ref": _exact_ref(BRIDGE_ROOT / "property.json", property_rel)},
        "subject": bindings["refs"]["subject"],
        "bounds": bounds,
        "providers": [],
        "controls": [],
        "effect_ceiling": "read-only-isolated-verification",
    }
    version = f"sha256:{bindings['verifier']['sha256']}"
    rust_receipt = _receipt("auth-evf-independent-verifier", "auth-executable-rust", "auth-rust-executable", version, base["subject"]["sha256"], bounds["digest"])
    lean_receipt = _receipt("auth-evf-independent-verifier", "auth-theorem-lean", "auth-lean-typechecker", version, base["subject"]["sha256"], bounds["digest"])

    tier_results = {}
    for tier in ("V0", "V1", "V2"):
        invocation = json.loads(json.dumps(base))
        invocation["requested_tier"] = tier
        invocation["providers"] = [rust_receipt] if tier == "V0" else [rust_receipt, lean_receipt]
        invocation["controls"] = controls if tier == "V2" else []
        result = KERNEL.evaluate(UMBRELLA_ROOT, TIER_ROOT, invocation)
        _write_json(output / f"{tier}-INVOCATION.json", invocation)
        _write_json(output / f"{tier}-RESULT.json", result)
        tier_results[tier] = result

    passed = all(tier_results[t]["contract_state"] == "satisfied" and tier_results[t]["verified_tier"] == t for t in ("V0", "V1", "V2"))
    provider_bindings = {
        "executable": {"raw_evidence_sha256": _sha(refs["executable_evidence"]), "payload_digest": executable["evidence_payload_digest"], "fresh_verifier_output": "executable-verifier.json", "provider_receipt_digest": rust_receipt["payload_digest"]},
        "theorem": {"raw_evidence_sha256": _sha(refs["theorem_evidence"]), "payload_digest": theorem["evidence_payload_digest"], "fresh_verifier_output": "theorem-verifier.json", "provider_receipt_digest": lean_receipt["payload_digest"], "capability_mapping": "Lean-backed route observed as executable-evaluation; no V3 theorem-completeness claim"},
    }
    _write_json(output / "PROVIDER-BINDINGS.json", provider_bindings)
    result = {
        "schema_version": "auth.verification-tier-bridge-result/v1-candidate",
        "status": "pass" if passed else "fail",
        "property_id": "auth.exact-fail-closed-authorization",
        "verified_tiers": [t for t in ("V0", "V1", "V2") if tier_results[t]["verified_tier"] == t],
        "fresh_verifier_runs": 2,
        "source_evidence_routes": ["auth-executable-rust", "auth-theorem-lean"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "authority_effect": "none",
        "product_approval": "not-granted",
        "runtime_admission": "not-granted",
        "release_admission": "not-granted",
        "claim_ceiling": "Exact Auth property and bound source evidence through candidate EVF V0-V2 enforcement only."
    }
    _write_json(output / "RESULT.json", result)
    artifacts = []
    for path in sorted(output.iterdir()):
        if path.is_file() and path.name != "ARTIFACTS.sha256":
            artifacts.append(f"{_sha(path)}  {path.name}")
    (output / "ARTIFACTS.sha256").write_text("\n".join(artifacts) + "\n")
    if not passed:
        raise RuntimeError("verification-tier-bridge-failed")
    return result
