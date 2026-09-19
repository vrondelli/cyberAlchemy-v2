#!/usr/bin/env python3
"""Capture the exact planning-time state of all declared future material targets."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[7]
RUN = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-plan/20260824T165704Z-formalclaim-lean-evf-implementation")


def main() -> int:
    manifest = json.loads((REPO / RUN / "work-pack/SWU-MANIFEST.json").read_text())
    targets = []
    for unit in manifest["units"]:
        for raw in unit["material_writes"]:
            path = REPO / raw
            if path.is_file():
                data = path.read_bytes()
                state = {"state":"present-file","sha256":hashlib.sha256(data).hexdigest(),"size_bytes":len(data)}
            elif path.exists():
                state = {"state":"present-nonfile"}
            else:
                state = {"state":"absent-create-target"}
            targets.append({"swu_id":unit["swu_id"],"path":raw,**state})
    immutable_paths = [
        "projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/successor/define/SPEC.md",
        "projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/successor/design/SOURCE-CONTRACTS.md",
        "projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/successor/design/PLANNED-WITNESSES.json",
        "projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/owner-admission/RONDELLI-DESIGN-ACCEPTANCE.json",
        "domainspec-lean-formalization/lean-engineer/lean-toolchain",
        "domainspec-lean-formalization/lean-engineer/lake-manifest.json",
        "domainspec-lean-formalization/lean-formalization/SchemaInstance.lean",
        "domainspec-lean-formalization/lean-engineer/PermGuard.lean",
        "projects/domainspec-v2/authority/pre-merge/pre-merge-structural-approval.v1.schema.json",
        "projects/domainspec-v2/authority/pre-merge/validate_pre_merge_structural_approval.py",
        "projects/domainspec-v2/authority/pre-merge/test_validate_pre_merge_structural_approval.py",
        "projects/domainspec-v2/ontology/README.md"
    ]
    immutable = []
    for raw in immutable_paths:
        data = (REPO / raw).read_bytes()
        immutable.append({"path":raw,"sha256":hashlib.sha256(data).hexdigest(),"size_bytes":len(data)})
    document = {
        "schema_version":"domainspec-v2.target-baseline-inventory/v1",
        "work_pack_id":manifest["work_pack_id"],
        "capture_timing":"planning-time-discovery-only; refresh selected target at each Task Session",
        "targets":targets,
        "immutable_source_bindings":immutable,
        "summary":{"target_count":len(targets),"absent_create_targets":sum(t["state"]=="absent-create-target" for t in targets),"present_targets":sum(t["state"]!="absent-create-target" for t in targets)},
        "authority_effect":"none"
    }
    (REPO / RUN / "TARGET-BASELINE-INVENTORY.json").write_text(json.dumps(document,indent=2,sort_keys=True)+"\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
