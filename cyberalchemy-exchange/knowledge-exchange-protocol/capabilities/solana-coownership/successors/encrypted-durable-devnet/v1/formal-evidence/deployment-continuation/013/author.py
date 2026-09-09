#!/usr/bin/env python3
"""Author candidate-013 EVF evidence from semantic obligation coverage."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CLAIMS = ROOT / "claims.json"
GENERATED = ROOT / "generated"
LEAN = Path(os.environ.get("CA2_LEAN_BIN", "/home/vrondelli/.elan/bin/lean"))


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def execute(command: list[str], cwd: Path, timeout: int = 120) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
        env={**os.environ, "LC_ALL": "C", "TZ": "UTC"},
    )


def load_exact(relative: str, expected: str) -> dict[str, object]:
    path = (ROOT / relative).resolve()
    require(path.is_file(), f"missing selected dependency: {relative}")
    require(sha_file(path) == expected, f"selected dependency drift: {relative}")
    return json.loads(path.read_text())


def validate_selected_dependencies(document: dict[str, object]) -> None:
    dependencies = document["selected_dependencies"]
    binding = load_exact(dependencies["implementation_binding_path"], dependencies["implementation_binding_sha256"])
    preacceptance = load_exact(dependencies["preacceptance_path"], dependencies["preacceptance_sha256"])
    plan = load_exact(dependencies["continuation_plan_path"], dependencies["continuation_plan_sha256"])
    envelope_path = (ROOT / dependencies["continuation_envelope_path"]).resolve()
    validation_path = (ROOT / dependencies["continuation_validation_path"]).resolve()
    require(envelope_path.is_file(), "missing continuation envelope")
    require(validation_path.is_file(), "missing continuation validation")
    envelope = json.loads(envelope_path.read_text())
    validation = json.loads(validation_path.read_text())

    expected_binding = dependencies["binding_material_digest"]
    expected_packet = dependencies["continuation_packet_digest"]
    require(preacceptance["candidate"]["binding_material_digest"] == expected_binding, "binding digest drift")
    require(envelope["candidate_binding_digest"] == expected_binding, "envelope binding drift")
    require(validation["candidate_binding_digest"] == expected_binding, "validation binding drift")
    require(validation["continuation_packet_digest"] == expected_packet, "validation packet drift")
    require(sha_file(envelope_path) == expected_packet, "continuation packet digest drift")
    require(validation["result"] == "PASS_BOUNDED_NO_EFFECT", "continuation validation is not positive")

    progress = plan["derived_progress"]
    contract = binding["continuation_contract"]
    exact_values = {
        "first_unwritten_chunk_index": 56,
        "remaining_write_submissions": 72,
        "final_deploy_submissions": 1,
        "exact_additional_deployment_submissions": 73,
        "replayed_predecessor_submissions": 0,
        "protocol_submissions": 0,
    }
    for key, value in exact_values.items():
        require(progress[key] == value, f"plan value drift: {key}")
        require(contract[key] == value, f"binding value drift: {key}")
    require(progress["finalized_write_range_inclusive"] == [0, 55], "finalized prefix drift")
    require(progress["total_sbf_chunks"] == 128, "SBF chunk count drift")
    require(
        plan["predecessor_trial"]["packet_digest"]
        == "9455a345e5b0840e6d8d3e051f746bae05ff59924020a515b19cfab330ecbdbc",
        "predecessor packet digest drift",
    )


def lean_once(projection: dict[str, object]) -> dict[str, object]:
    source = ROOT / projection["source_path"]
    text = source.read_text()
    require(not re.search(r"^\s*axiom\s", text, re.MULTILINE), "Lean source contains axiom")
    require("sorry" not in text, "Lean source contains sorry")
    require(not re.search(r"^\s*unsafe\s", text, re.MULTILINE), "Lean source contains unsafe")
    completed = execute([str(LEAN), source.name], source.parent)
    return {
        "result": "PASS_BOUNDED" if completed.returncode == 0 else "NON_PASS",
        "exit_code": completed.returncode,
        "stdout_sha256": sha_bytes(completed.stdout.encode()),
        "stderr_sha256": sha_bytes(completed.stderr.encode()),
        "source_sha256": sha_file(source),
        "config_sha256": sha_file(ROOT / projection["config_path"]),
        "no_axiom": True,
        "no_sorry": True,
        "no_unsafe": True,
    }


def run_lean(projection: dict[str, object]) -> dict[str, object]:
    executions = []
    for ordinal in (1, 2):
        result = lean_once(projection)
        executions.append({
            "ordinal": ordinal,
            "result_digest": sha_bytes(canonical(result)),
            "result": result,
        })
    deterministic = executions[0]["result_digest"] == executions[1]["result_digest"]
    pinned = (
        executions[0]["result"]["source_sha256"] == projection["source_sha256"]
        and executions[0]["result"]["config_sha256"] == projection["config_sha256"]
    )
    passed = deterministic and pinned and all(item["result"]["result"] == "PASS_BOUNDED" for item in executions)
    return {
        "schema_version": "cav2-kep-deployment-continuation-provider-receipt/v3",
        "provider_id": projection["provider_id"],
        "projection_scope": projection["projection_scope"],
        "source_path": projection["source_path"],
        "source_sha256": executions[0]["result"]["source_sha256"],
        "config_path": projection["config_path"],
        "config_sha256": executions[0]["result"]["config_sha256"],
        "execution_count": 2,
        "executions": executions,
        "two_run_determinism": deterministic,
        "pinned_projection": pinned,
        "status": "PASS_BOUNDED" if passed else "BLOCK",
        "authority_effect": "none",
    }


def evaluate_obligation_coverage(
    obligations: list[dict[str, object]],
    claims: list[dict[str, object]],
    provider_results: dict[str, dict[str, object]],
) -> dict[str, object]:
    claims_by_id = {claim["claim_id"]: claim for claim in claims}
    results = []
    undischargeable: list[str] = []
    for obligation in obligations:
        issues: list[str] = []
        evidence = obligation.get("evidence_refs", [])
        if not evidence:
            issues.append("no-evidence-reference")
        for reference in evidence:
            claim = claims_by_id.get(reference.get("claim_id"))
            if claim is None:
                issues.append(f"missing-claim:{reference.get('claim_id')}")
                continue
            provider = claim.get("provider")
            provider_result = provider_results.get(provider)
            if provider_result is None:
                issues.append(f"missing-projection-for-claim:{claim['claim_id']}")
            elif provider_result.get("status") != "PASS_BOUNDED":
                issues.append(f"non-passing-projection-for-claim:{claim['claim_id']}")
            missing_theorems = sorted(set(reference.get("theorems", [])) - set(claim.get("theorems", [])))
            issues.extend(f"unmapped-theorem:{name}" for name in missing_theorems)
        status = "discharged" if not issues else "undischarged"
        if issues:
            undischargeable.append(obligation["obligation_id"])
        results.append({
            "obligation_id": obligation["obligation_id"],
            "status": status,
            "evidence_refs": evidence,
            "adequacy": obligation["adequacy"],
            "issues": issues,
        })
    unique_ids = {item["obligation_id"] for item in obligations}
    if len(unique_ids) != len(obligations):
        undischargeable.append("duplicate-obligation-id")
    complete = not undischargeable and bool(obligations)
    return {
        "status": "PASS_BOUNDED" if complete else "BLOCK",
        "complete": complete,
        "required_obligation_count": len(obligations),
        "discharged_obligation_count": sum(item["status"] == "discharged" for item in results),
        "undischarged_obligations": undischargeable,
        "obligations": results,
    }


def build() -> dict[Path, bytes]:
    document = json.loads(CLAIMS.read_text())
    validate_selected_dependencies(document)
    projections = document["provider_projections"]
    require(len(projections) == 1, "candidate 013 minimal provider projection set drift")
    projection = projections[0]
    require(projection["provider_id"] == "lean", "unsupported candidate-local provider projection")

    source_text = (ROOT / projection["source_path"]).read_text()
    for claim in document["claims"]:
        require(claim["provider"] == "lean", f"unsupported claim provider: {claim['claim_id']}")
        for theorem in claim["theorems"]:
            require(re.search(rf"^theorem\s+{re.escape(theorem)}\b", source_text, re.MULTILINE) is not None, f"missing Lean theorem: {theorem}")

    lean_receipt = run_lean(projection)
    provider_results = {"lean": lean_receipt}
    coverage = evaluate_obligation_coverage(document["required_obligations"], document["claims"], provider_results)
    residues = document["aggregate_residues"]
    aggregate_status = "BLOCK" if not coverage["complete"] else ("not_evaluable" if residues else "PASS_BOUNDED")

    version_result = execute([str(LEAN), "--version"], ROOT, timeout=30)
    version = (version_result.stdout + version_result.stderr).strip().splitlines()[0]
    runtime_binding = {
        "tool": "Lean",
        "version": version,
        "binary_sha256": sha_file(LEAN.resolve()),
        "source_path": projection["source_path"],
        "config_path": projection["config_path"],
    }

    files: dict[Path, bytes] = {
        GENERATED / "provider-receipts" / "lean.json": canonical(lean_receipt),
    }
    for claim in document["claims"]:
        claim_digest = sha_bytes(canonical(claim))
        formal_claim = {
            "schema_version": "domainspec-v2.formal-claim-source-payload/v2",
            "claim": claim,
            "canonical_proposition_digest": claim_digest,
            "selected_dependencies": document["selected_dependencies"],
            "projection": {
                "provider_id": "lean",
                "preservation_binding": {
                    "claim_digest": claim_digest,
                    "semantic_identity": claim["semantic_identity"],
                    "provider_source_sha256": lean_receipt["source_sha256"],
                    "relation": "bounded_projection_of_canonical_proposition",
                },
                "runtime_binding": runtime_binding,
                "provider_receipt": lean_receipt,
            },
            "implementation_preservation": residues[0],
            "finalized_devnet_observation": residues[1],
            "claim_ceiling": document["claim_ceiling"],
            "authority_effect": "none",
        }
        files[GENERATED / f"{claim['claim_id'].lower()}.formal-claim.json"] = canonical(formal_claim)

    aggregate = {
        "schema_version": "cav2-kep-deployment-continuation-aggregate-receipt/v3",
        "claim_set_id": document["claim_set_id"],
        "claims_sha256": sha_file(CLAIMS),
        "binding_material_digest": document["selected_dependencies"]["binding_material_digest"],
        "continuation_packet_digest": document["selected_dependencies"]["continuation_packet_digest"],
        "claim_count": len(document["claims"]),
        "provider_selection": document["provider_selection"],
        "provider_results": {
            "lean": {
                "status": lean_receipt["status"],
                "two_run_determinism": lean_receipt["two_run_determinism"],
                "pinned_projection": lean_receipt["pinned_projection"],
                "source_sha256": lean_receipt["source_sha256"],
                "config_sha256": lean_receipt["config_sha256"],
            }
        },
        "formal_obligation_coverage": coverage,
        "residues": residues,
        "status": aggregate_status,
        "authority_effect": "none",
        "claim_ceiling": document["claim_ceiling"],
    }
    files[GENERATED / "provider-receipt.json"] = canonical(aggregate)
    return files


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        files = build()
        if args.check:
            mismatches = [str(path) for path, data in files.items() if not path.is_file() or path.read_bytes() != data]
            if mismatches:
                print("generated EVF evidence drift:")
                print("\n".join(mismatches))
                return 1
            receipt = json.loads(files[GENERATED / "provider-receipt.json"])
            print(f"candidate 013 EVF evidence deterministic: {receipt['status']}")
            return 0
        for path, data in files.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        receipt = json.loads(files[GENERATED / "provider-receipt.json"])
        print(f"candidate 013 EVF evidence authored: {receipt['status']}")
        return 0
    except (OSError, ValueError, KeyError, StopIteration, json.JSONDecodeError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({"result": "BLOCK", "error": str(exc), "authority_effect": "none"}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
