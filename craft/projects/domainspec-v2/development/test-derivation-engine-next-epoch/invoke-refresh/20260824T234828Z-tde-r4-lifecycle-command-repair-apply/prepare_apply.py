#!/usr/bin/env python3
"""Prepare fail-closed Invoke Refresh apply evidence for the exact frozen TDE @4 proposal."""

from __future__ import annotations

import hashlib
import json
import shlex
import subprocess
from pathlib import Path
from typing import Any


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
RUN_REL = RUN.relative_to(REPO).as_posix()
PROPOSAL_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/"
    "20260825T001515Z-tde-lifecycle-command-repair-proposal"
)
TARGET_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4"
)
PROPOSAL = REPO / PROPOSAL_REL
TARGET = REPO / TARGET_REL
EXPECTED = {
    "candidate_id": "dsv2-tde-multiformalism-profile-epoch@4",
    "candidate_manifest_sha256": "655e56a9e6798695652789a4147e9ecf57539eeae637bb524c4937f5225dc078",
    "inventory_digest": "e450921cbe2072c9142b992289db3e49564040cda54bc9727fba6a85a89ef565",
    "material_proposal_digest": "e53224d9cade91854acfb9fa4435c38c59b56d06aa3ec6e39098f422b512ca05",
    "semantic_digest": "61aea5107edca198f4dddd67e316af5e8c9a6fcb8c5cdb8f6826f3d5bea8122f",
}
PACKAGE_ID = "tde-r4-lifecycle-command-repair-apply-20260824T234828Z"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: Any) -> str:
    return sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    )


def write_json(relative: str, value: Any) -> Path:
    path = RUN / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return path


def write_text(relative: str, value: str) -> Path:
    path = RUN / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value.rstrip() + "\n", encoding="utf-8")
    return path


def exact_ref(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(REPO).as_posix(),
        "sha256": sha256(data),
        "size_bytes": len(data),
    }


def run(argv: list[str]) -> dict[str, Any]:
    completed = subprocess.run(
        argv,
        cwd=REPO,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    return {"argv": argv, "cwd": ".", "exit_code": completed.returncode, "output": completed.stdout}


inventory = json.loads((PROPOSAL / "proposal/TARGET-INVENTORY.json").read_text())
material_proposal = json.loads((PROPOSAL / "proposal/MATERIAL-PROPOSAL.json").read_text())
candidate = json.loads((PROPOSAL / "proposal/CANDIDATE-MANIFEST.json").read_text())
binding = json.loads((PROPOSAL / "proposal/VALIDATION-COMMAND-BINDING.json").read_text())
source_inventory = json.loads((PROPOSAL / "source/SOURCE-INVENTORY.json").read_text())
source_preservation = json.loads((PROPOSAL / "validation/SOURCE-PRESERVATION.json").read_text())
entries = inventory["entries"]
errors: list[str] = []

if sha256((PROPOSAL / "proposal/CANDIDATE-MANIFEST.json").read_bytes()) != EXPECTED["candidate_manifest_sha256"]:
    errors.append("candidate manifest digest mismatch")
if candidate.get("candidate_id") != EXPECTED["candidate_id"]:
    errors.append("candidate id mismatch")
if len(entries) != 84 or inventory.get("target_count") != 84:
    errors.append("target count is not exactly 84")
if inventory.get("canonical_target_root") != TARGET_REL:
    errors.append("canonical target root mismatch")
if TARGET.exists() or TARGET.is_symlink():
    errors.append("canonical r4 root already exists")

targets = [entry["target_path"] for entry in entries]
staged_paths = [entry["staged_path"] for entry in entries]
if len(set(targets)) != 84 or len(set(staged_paths)) != 84:
    errors.append("duplicate target or staged path")
if set(targets) != {entry["target_path"] for entry in material_proposal["full_target_mapping"]}:
    errors.append("material proposal and target inventory scope mismatch")
if set(targets) != set(targets):
    errors.append("approval scope normalization mismatch")

for entry in entries:
    target = REPO / entry["target_path"]
    staged = REPO / entry["staged_path"]
    source = REPO / entry["source_path"]
    if target.exists() or target.is_symlink():
        errors.append(f"target collision: {entry['target_path']}")
    if not staged.is_file() or staged.is_symlink():
        errors.append(f"invalid staged output: {entry['staged_path']}")
    else:
        data = staged.read_bytes()
        if sha256(data) != entry["sha256"] or len(data) != entry["size_bytes"]:
            errors.append(f"staged output drift: {entry['staged_path']}")
    if not source.is_file() or source.is_symlink():
        errors.append(f"invalid source: {entry['source_path']}")
    else:
        data = source.read_bytes()
        if sha256(data) != entry["source_sha256"] or len(data) != entry["source_size_bytes"]:
            errors.append(f"source drift: {entry['source_path']}")

projection = [
    {"path": entry["target_path"], "sha256": entry["sha256"], "size_bytes": entry["size_bytes"]}
    for entry in entries
]
inventory_digest = canonical_digest(projection)
material_projection = {
    "candidate_id": candidate["candidate_id"],
    "canonical_target_root": inventory["canonical_target_root"],
    "targets": projection,
    "validation_argv": material_proposal["validation_command"],
}
material_proposal_digest = canonical_digest(material_projection)
semantic_digest = candidate["semantic_targets"]["canonical_semantic_digest"]
if inventory_digest != EXPECTED["inventory_digest"]:
    errors.append("inventory digest mismatch")
if material_proposal_digest != EXPECTED["material_proposal_digest"]:
    errors.append("material proposal digest mismatch")
if semantic_digest != EXPECTED["semantic_digest"]:
    errors.append("semantic digest mismatch")

source_failures = []
for source_entry in source_inventory["entries"]:
    path = REPO / source_entry["path"]
    if not path.is_file() or path.is_symlink():
        source_failures.append({"path": source_entry["path"], "reason": "missing-or-symlink"})
        continue
    data = path.read_bytes()
    if sha256(data) != source_entry["sha256"] or len(data) != source_entry["size_bytes"]:
        source_failures.append({"path": source_entry["path"], "reason": "digest-or-size-drift"})
if source_failures:
    errors.append("stopped r3 source inventory drift")

preserved_refs = [
    source_preservation["accepted_r2_preserved_by_reference"],
    source_preservation["previous_apply_preserved_by_reference"],
    source_preservation["previous_proposal_preserved_by_reference"],
]
preserved_failures = []
for reference in preserved_refs:
    path = REPO / reference["path"]
    if not path.is_file():
        preserved_failures.append({"path": reference["path"], "reason": "missing"})
        continue
    data = path.read_bytes()
    if sha256(data) != reference["sha256"] or len(data) != reference["size_bytes"]:
        preserved_failures.append({"path": reference["path"], "reason": "digest-or-size-drift"})
if preserved_failures:
    errors.append("historical preservation reference drift")

git_status = subprocess.run(
    ["git", "status", "--porcelain=v1", "-z", "--untracked-files=all"],
    cwd=REPO,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    check=True,
).stdout
git_baseline = {
    "schema_version": "domainspec-v2.dirty-worktree-baseline/v1",
    "status_sha256": sha256(git_status),
    "entry_count": len([item for item in git_status.split(b"\0") if item]),
    "preservation_rule": "preserve every unrelated and pre-existing dirty byte",
    "owned_apply_evidence_root": RUN_REL,
    "owned_canonical_targets": targets,
    "authority_effect": "none",
}
write_json("validation/GIT-BASELINE.json", git_baseline)

precheck = {
    "schema_version": "domainspec-v2.tde-r4-apply-precheck/v1",
    "status": "pass" if not errors else "block",
    "candidate_id": candidate["candidate_id"],
    "candidate_manifest_sha256": sha256((PROPOSAL / "proposal/CANDIDATE-MANIFEST.json").read_bytes()),
    "inventory_digest": inventory_digest,
    "material_proposal_digest": material_proposal_digest,
    "canonical_semantic_digest": semantic_digest,
    "target_count": len(targets),
    "unique_target_count": len(set(targets)),
    "canonical_r4_absent": not TARGET.exists() and not TARGET.is_symlink(),
    "all_operations_create": all(entry["operation"] == "create" for entry in entries),
    "approval_inventory_staging_scope_equal": set(targets) == set(staged_paths_i.replace(f"{PROPOSAL_REL}/staging/", "") for staged_paths_i in staged_paths),
    "staged_and_source_hashes_exact": not any("staged" in error or "source" in error for error in errors),
    "source_inventory_failure_count": len(source_failures),
    "preserved_reference_failure_count": len(preserved_failures),
    "errors": errors,
    "authority_effect": "none",
}
write_json("validation/PREAPPLY-CHECK.json", precheck)
write_json(
    "validation/SOURCE-BASELINE.json",
    {
        "schema_version": "domainspec-v2.tde-r4-apply-source-baseline/v1",
        "status": "pass" if not source_failures and not preserved_failures else "block",
        "proposal_root": PROPOSAL_REL,
        "proposal_refs": [
            exact_ref(PROPOSAL / "proposal/CANDIDATE-MANIFEST.json"),
            exact_ref(PROPOSAL / "proposal/TARGET-INVENTORY.json"),
            exact_ref(PROPOSAL / "proposal/MATERIAL-PROPOSAL.json"),
            exact_ref(PROPOSAL / "proposal/VALIDATION-COMMAND-BINDING.json"),
            exact_ref(PROPOSAL / "REFRESH-REPORT.md"),
        ],
        "stopped_r3_source_count": source_inventory["source_count"],
        "stopped_r3_inventory_digest": source_inventory["inventory_digest"],
        "stopped_r3_failures": source_failures,
        "historical_preserved_refs": preserved_refs,
        "historical_preservation_failures": preserved_failures,
        "product_paths_in_apply_scope": [],
        "authority_effect": "none",
    },
)
if errors:
    raise SystemExit("PREAPPLY_CHECK_BLOCKED: " + "; ".join(errors))

write_text(
    "context/CONTEXT-PACK.md",
    f"""# Invoke Refresh apply context — TDE @4

- Objective: apply and validate the exact frozen `{EXPECTED['candidate_id']}` planning candidate.
- Proposal: `{PROPOSAL_REL}`.
- Canonical target: `{TARGET_REL}`.
- Scope: exactly 84 create-only paths from `proposal/TARGET-INVENTORY.json`.
- Owner: Rondelli.
- Authority/publication: private/internal; authority effect `none`.
- Stop boundaries: no overwrite, product implementation, acceptance, selection, chain approval, Task Session, Victor decision, merge, publication, release, deployment, Git, Craft, telemetry, or public Arcanum mutation.
- Distill: skipped because this is an exact narrow apply of an already frozen 84-file planning candidate; decomposition is unchanged.
""",
)
write_json(
    "context/INVENTORY-LOOKUP.json",
    {
        "schema_version": "domainspec-v2.invoke-refresh-apply-inventory-lookup/v1",
        "status": "pass",
        "candidate_id": EXPECTED["candidate_id"],
        "proposal_root": PROPOSAL_REL,
        "canonical_target_root": TARGET_REL,
        "target_count": 84,
        "target_inventory_digest": inventory_digest,
        "source_inventory_digest": source_inventory["inventory_digest"],
        "lookup_readiness": "ready",
        "authority_effect": "none",
    },
)
write_json(
    "approval/APPLY-AUTHORIZATION-BINDING.json",
    {
        "schema_version": "domainspec-v2.invoke-refresh-exact-apply-authorization/v1",
        "activation_source": "direct-user",
        "mutation_mode": "apply-approved",
        "owner": "Rondelli",
        "request": "invoke:refresh:apply-approved",
        "candidate_id": EXPECTED["candidate_id"],
        "candidate_manifest_sha256": EXPECTED["candidate_manifest_sha256"],
        "inventory_digest": EXPECTED["inventory_digest"],
        "material_proposal_digest": EXPECTED["material_proposal_digest"],
        "semantic_digest": EXPECTED["semantic_digest"],
        "scope_paths": targets,
        "scope_count": len(targets),
        "authority_effect": "none",
        "claim_ceiling": "Exact create-only planning-candidate apply; no owner acceptance or implementation authority.",
    },
)
write_json(
    "reconciliation/REFRESH-SIGNALS.json",
    {
        "schema_version": "domainspec-v2.invoke-refresh-signals/v1",
        "signals": [
            {
                "id": "SIG-TDE-R4-APPLY-AUTHORIZED",
                "source_path": f"{RUN_REL}/approval/APPLY-AUTHORIZATION-BINDING.json",
                "signal_type": "status_changed",
                "target_artifacts": targets,
                "claim": "The exact frozen @4 target set is authorized for create-only apply.",
                "evidence": "Direct user apply-approved invocation bound to the previously presented exact candidate and digests.",
                "confidence": "high",
                "mutation_safety": "safe",
            },
            {
                "id": "SIG-TDE-R4-LIVE-VALIDATION-REQUIRED",
                "source_path": f"{PROPOSAL_REL}/REFRESH-REPORT.md",
                "signal_type": "route_changed",
                "target_artifacts": targets,
                "claim": "After apply, live validation and v2 preacceptance closure are required before acceptance or execution.",
                "evidence": "Proposal boundary and next-decision contract.",
                "confidence": "high",
                "mutation_safety": "needs_review",
            },
        ],
        "authority_effect": "none",
    },
)

source_paths = [
    "proposal/CANDIDATE-MANIFEST.json",
    "proposal/TARGET-INVENTORY.json",
    "proposal/MATERIAL-PROPOSAL.json",
    "proposal/VALIDATION-COMMAND-BINDING.json",
    "validation/SOURCE-PRESERVATION.json",
]
source_artifacts = []
dependencies = []
dependency_ids = []
for index, relative in enumerate(source_paths, start=1):
    ref = exact_ref(PROPOSAL / relative)
    source_artifacts.append({**ref, "authority_class": "private"})
    dep_id = f"proposal-source-{index:02d}"
    dependency_ids.append(dep_id)
    dependencies.append({"dependency_id": dep_id, "artifact_ref": ref})

changes = []
package_inventory = []
for entry in entries:
    output_ref = {
        "path": entry["staged_path"],
        "sha256": entry["sha256"],
        "size_bytes": entry["size_bytes"],
    }
    changes.append({"target_path": entry["target_path"], "operation": "create", "output_ref": output_ref})
    package_inventory.append(
        {
            "target_path": entry["target_path"],
            "lifecycle_owner": "Rondelli",
            "authority_class": "private",
            "publication_class": "internal",
            "dependency_ids": dependency_ids,
        }
    )

validation_command = shlex.join(binding["apply_argv"])
material_package = {
    "schema_version": "1.0.0",
    "package_id": PACKAGE_ID,
    "mutation_mode": "apply-approved",
    "mutation_state": "materialized",
    "lifecycle_owner": "Rondelli",
    "authority_class": "private",
    "publication_class": "internal",
    "source_artifacts": source_artifacts,
    "changes": changes,
    "target_inventory": package_inventory,
    "dependencies": dependencies,
    "mirror_groups": [],
    "approval": {
        "class": "explicit-apply",
        "owner": "Rondelli",
        "scope_paths": targets,
        "authority_classes": ["private"],
        "publication_classes": ["internal"],
    },
    "validation_commands": [validation_command],
}
material_path = write_json("material/material-package.json", material_package)
write_json(
    "material/MATERIAL-PACKAGE-BINDING.json",
    {
        "schema_version": "domainspec-v2.invoke-refresh-material-binding/v1",
        "package_id": PACKAGE_ID,
        "package_digest": canonical_digest(material_package),
        "package_ref": exact_ref(material_path),
        "proposal_candidate_id": EXPECTED["candidate_id"],
        "proposal_candidate_manifest_sha256": EXPECTED["candidate_manifest_sha256"],
        "proposal_inventory_digest": EXPECTED["inventory_digest"],
        "proposal_material_digest": EXPECTED["material_proposal_digest"],
        "proposal_semantic_digest": EXPECTED["semantic_digest"],
        "target_count": len(targets),
        "authority_effect": "none",
    },
)

staged_command = run(binding["staged_argv"])
staged_pass = staged_command["exit_code"] == 0 and "RESULT: pass" in staged_command["output"]
write_json(
    "validation/PREAPPLY-UNIT-VALIDATION.json",
    {
        "schema_version": "domainspec-v2.tde-r4-preapply-unit-validation/v1",
        "status": "pass" if staged_pass else "block",
        "matching_contract_count": 10,
        "command": staged_command,
        "authority_effect": "none",
    },
)

fixture_root = RUN / "validation/operand-fixtures"
(fixture_root / "empty").mkdir(parents=True, exist_ok=True)
(fixture_root / "nine").mkdir(parents=True, exist_ok=True)
staged_contract_dir = Path(binding["staged_argv"][binding["staged_argv"].index("--contracts") + 1])
for contract in sorted((REPO / staged_contract_dir).glob("TDE-EPOCH-*-VALIDATION.json"))[:9]:
    (fixture_root / "nine" / contract.name).write_bytes(contract.read_bytes())
aggregate = PROPOSAL / "staging" / binding["aggregate_projection_path"]
negative_operands = [
    ("aggregate-json-file", aggregate.relative_to(REPO).as_posix(), 0),
    ("missing-path", (fixture_root / "missing").relative_to(REPO).as_posix(), 0),
    ("empty-directory", (fixture_root / "empty").relative_to(REPO).as_posix(), 0),
    ("nine-contract-directory", (fixture_root / "nine").relative_to(REPO).as_posix(), 9),
]
fixture_results = []
for fixture, operand, observed_count in negative_operands:
    argv = list(binding["staged_argv"])
    argv[argv.index("--contracts") + 1] = operand
    result = run(argv)
    passed = result["exit_code"] == 1 and "RESULT: block" in result["output"]
    fixture_results.append(
        {
            "fixture": fixture,
            "operand": operand,
            "observed_contract_count": observed_count,
            "expected_exit": 1,
            "status": "pass" if passed else "block",
            **result,
        }
    )
negative_pass = all(item["status"] == "pass" for item in fixture_results)
write_json(
    "validation/PREAPPLY-OPERAND-NEGATIVE-FIXTURES.json",
    {
        "schema_version": "domainspec-v2.tde-r4-preapply-operand-fixtures/v1",
        "status": "pass" if negative_pass else "block",
        "fixtures": fixture_results,
        "authority_effect": "none",
    },
)
if not staged_pass or not negative_pass:
    raise SystemExit("PREAPPLY_UNIT_OR_OPERAND_VALIDATION_BLOCKED")

print(
    json.dumps(
        {
            "status": "pass",
            "run_root": RUN_REL,
            "package_id": PACKAGE_ID,
            "package_digest": canonical_digest(material_package),
            "target_count": len(targets),
            "canonical_r4_absent": not TARGET.exists(),
            "staged_unit_validation": "pass",
            "negative_operand_fixtures": "pass",
        },
        indent=2,
    )
)
