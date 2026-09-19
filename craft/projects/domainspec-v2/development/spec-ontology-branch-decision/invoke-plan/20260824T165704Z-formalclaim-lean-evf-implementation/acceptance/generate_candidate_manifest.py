#!/usr/bin/env python3
"""Freeze the exact acceptance-bound Plan bytes without self-reference."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

RUN = Path(__file__).resolve().parents[1]


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def classify(path: Path) -> tuple[str, str]:
    raw = path.as_posix()
    if raw.startswith("work-pack/shared/validation-contracts/"):
        return "swu-validation-contract", "task-session"
    if raw.startswith("work-pack/tasks/"):
        return "split-task-contract", "invoke"
    if raw.startswith("work-pack/waves/"):
        return "split-wave-contract", "invoke"
    if raw.startswith("readiness/") or raw == "IMPLEMENTATION-READINESS-PREFLIGHT.json":
        return "readiness-evidence", "work-pack-readiness-audit"
    if raw.startswith("distill/"):
        return "distill-validation", "distill"
    if raw.startswith("validation/") or raw.endswith("-VALIDATION.json"):
        return "plan-validation-evidence", "invoke"
    if raw.startswith("context/") or raw.startswith("inventory/"):
        return "planning-context", "context-builder"
    if raw.startswith("implementation-details/"):
        return "implementation-detail-contract", "invoke"
    return "plan-contract", "invoke"


def main() -> int:
    excluded = {"HELPER-RECEIPT.json"}
    targets = []
    for path in sorted(RUN.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(RUN)
        if rel.parts[0] == "acceptance" or rel.as_posix() in excluded:
            continue
        data = path.read_bytes()
        artifact_class, owner = classify(rel)
        targets.append({"path":rel.as_posix(),"sha256":digest(data),"size_bytes":len(data),"class":artifact_class,"owner":owner})
    digest_input = [{"path":t["path"],"sha256":t["sha256"],"size_bytes":t["size_bytes"]} for t in targets]
    payload = json.dumps(sorted(digest_input,key=lambda x:x["path"]),sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    package_digest = digest(payload)
    inventory = {
        "schema_version":"invoke.acceptance-target-inventory/v1",
        "candidate_id":"DS-FORMALCLAIM-LEAN-EVF-PLAN@20260824T165704Z",
        "binding_kind":"raw-sha256-exact-bytes",
        "package_digest_algorithm":"sha256(canonical-json(sorted array of path, sha256, size_bytes))",
        "package_digest":package_digest,
        "targets":targets,
        "target_count":len(targets),
        "excluded_support_artifacts":["acceptance/* self-referential acceptance support", "HELPER-RECEIPT.json parent rejoin evidence"],
        "authority_effect":"none"
    }
    inv_path = RUN / "acceptance/TARGET-INVENTORY.json"
    inv_path.write_text(json.dumps(inventory,indent=2,sort_keys=True)+"\n")
    inv_data = inv_path.read_bytes()
    preflight = json.loads((RUN / "IMPLEMENTATION-READINESS-PREFLIGHT.json").read_text())
    report_path = RUN / "readiness/final-audit-output/work-pack-readiness-report-v2.json"
    manifest = {
        "schema_version":"invoke.acceptance-candidate-manifest/v1",
        "candidate_id":"DS-FORMALCLAIM-LEAN-EVF-PLAN@20260824T165704Z",
        "candidate_status":"plan-authored-and-validated-pending-rondelli-exact-acceptance",
        "design_source_candidate":"dsv2-formalclaim-multiformalism-lean-extension@3",
        "design_source_digest":"e7e6e24c088824b158df4b8604ea852dc8df0c02f4f21977b34fc1733d0534d0",
        "package_root":"./",
        "target_inventory":"acceptance/TARGET-INVENTORY.json",
        "target_inventory_sha256":digest(inv_data),
        "target_inventory_size_bytes":len(inv_data),
        "target_count":len(targets),
        "package_digest_algorithm":inventory["package_digest_algorithm"],
        "package_digest":package_digest,
        "acceptance_subject":"Exact 14-unit L0-L3 execution candidate for FormalClaim schemas, Lean provider runtime, translation validator, adversarial fixtures, EVF adapter, runtime-conformance binding, candidate migration, integrated replay, and C12 pre-merge preparation.",
        "required_plan_acceptance_owner":"Rondelli",
        "required_plan_owner_response":"direct exact-candidate acceptance recorded as acceptance/RONDELLI-PLAN-ACCEPTANCE.json",
        "plan_acceptance_status":"unapproved",
        "victor_plan_gate":False,
        "victor_future_role":"Structural verifier of the exact frozen merge candidate immediately before merge only; validator does not authenticate him and merge owner separately confirms the direct response.",
        "readiness": {
            "wpra_verdict":"pass",
            "wpra_report_sha256":digest(report_path.read_bytes()),
            "implementation_readiness_status":preflight["status"],
            "implementation_readiness_code":preflight["code"],
            "mutation_ready":preflight["mutation_ready"],
            "reusable_for_execution":preflight["reusable_for_execution"]
        },
        "responses":[],
        "acceptance_receipt":None,
        "authority_effect":"none",
        "claim_ceiling":"Exact bytes are a validated Plan candidate only. They do not select or execute a SWU, admit mutation or provider runtime, prove a theorem, establish runtime conformance or business truth, discharge an obligation, promote ontology, merge, publish, release, deploy, or establish production readiness."
    }
    (RUN / "acceptance/CANDIDATE-MANIFEST.json").write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"target_count":len(targets),"package_digest":package_digest,"target_inventory_sha256":digest(inv_data)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
