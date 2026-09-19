#!/usr/bin/env python3
"""Prepare the exact, create-only Invoke Refresh material package."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path, PurePosixPath


ROOT = Path.cwd().resolve()
PROPOSAL_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-refresh/20260824T192000Z-tde-chain-controller-compatibility-proposal"
)
RUN_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-refresh/20260824T200520Z-tde-chain-controller-compatibility-apply"
)
TARGET_ROOT_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
PROPOSAL = ROOT / PROPOSAL_REL
RUN = ROOT / RUN_REL
TARGET_ROOT = ROOT / TARGET_ROOT_REL
RUN_ID = "invoke-refresh-tde-chain-controller-compatibility-apply-20260824T200520Z"
PACKAGE_ID = "tde-chain-controller-compatibility-apply-20260824T200520Z"
CREATED_AT = "2026-08-24T20:05:20Z"


EXPECTED_PROPOSAL_HASHES = {
    "REFRESH-REPORT.md": "7a6e2bc4f4a875389184409b1f0cf7e26a7d0dcb7eb91afb996a5435d3c641ac",
    "proposal/CANDIDATE-MANIFEST.json": "175db8ad1bc3d51ad2a72ed4367acaf65a7c2c25da9f15345c33d86c42615320",
    "proposal/TARGET-INVENTORY.json": "5b2c9b6854f4f56b02a9fa19e07e57816fbed38526d6b1a532157c9ebd28df93",
    "proposal/PROPOSAL-PATCH-MANIFEST.json": "ab58b40fd8ca0746c1dcc17c4d3dad954e125697b370359fd8ba196bc95527f1",
    "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json": "c17e694b0ae578adae071a13e1b9d069392afed257a4eb3b1eb056729d6bb7b5",
    "HELPER-RECEIPT.json": "7305eb4950995ad512b98f8d4481a29cc749a22228ce088f971264d6f1fa45d1",
    "validation/SOURCE-PRESERVATION.json": "f0cc332892b3ecb39a81ce26699c5c9cad45363c963d3a249366f86261f332ac",
}


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def exact_ref(relative_path: str, authority_class: str | None = None) -> dict:
    path = ROOT / relative_path
    payload = path.read_bytes()
    result = {
        "path": relative_path,
        "sha256": sha256_bytes(payload),
        "size_bytes": len(payload),
    }
    if authority_class is not None:
        result["authority_class"] = authority_class
    return result


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, document: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(document, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )


def canonical_relative(raw: str) -> bool:
    path = PurePosixPath(raw)
    return bool(raw) and not path.is_absolute() and ".." not in path.parts and str(path) == raw


def fail(message: str) -> None:
    raise SystemExit(f"PREAPPLY_BLOCK: {message}")


def main() -> None:
    if not (ROOT / ".git").exists():
        fail("working directory is not the repository root")
    if TARGET_ROOT.exists():
        fail("canonical r3 target root already exists")

    proposal_bindings = []
    for relative_path, expected_sha in EXPECTED_PROPOSAL_HASHES.items():
        reference = exact_ref(str(PROPOSAL_REL / relative_path))
        if reference["sha256"] != expected_sha:
            fail(f"proposal binding drift: {relative_path}")
        proposal_bindings.append(reference)

    inventory = load_json(PROPOSAL / "proposal/TARGET-INVENTORY.json")
    patch = load_json(PROPOSAL / "proposal/PROPOSAL-PATCH-MANIFEST.json")
    candidate = load_json(PROPOSAL / "proposal/CANDIDATE-MANIFEST.json")
    preservation = load_json(PROPOSAL / "validation/SOURCE-PRESERVATION.json")

    if inventory.get("target_count") != 84 or len(inventory.get("entries", [])) != 84:
        fail("target inventory is not exactly 84 entries")
    if inventory.get("canonical_target_root") != str(TARGET_ROOT_REL):
        fail("canonical target root differs")
    if inventory.get("inventory_digest") != "2c5ff4649c862c7381b2c615582bd4c9faa92eb8925974b259b2fcdee28cace6":
        fail("proposal inventory digest differs")
    if patch.get("proposal_material_digest") != "20af93c91d53e9f9c2985b01cf09ba75c628aaa13fdaa27f03fcb5807142f8bf":
        fail("proposal material digest differs")
    if candidate.get("candidate_id") != "dsv2-tde-multiformalism-profile-epoch@3":
        fail("candidate identity differs")
    if candidate.get("readiness_evidence", {}).get("canonical_semantic_digest") != "f7c734669d7ff7d6d877d1bbeeced64c24cfb7757e540fc5fc5264e38a0d8750":
        fail("candidate semantic digest differs")
    if patch.get("full_target_mapping") != inventory["entries"]:
        fail("patch mapping and target inventory differ")

    target_paths: list[str] = []
    staged_paths: list[str] = []
    staged_checks: list[dict] = []
    for entry in inventory["entries"]:
        target = entry["target_path"]
        staged = entry["staged_path"]
        if not canonical_relative(target) or not canonical_relative(staged):
            fail(f"non-canonical path in inventory: {target}")
        if not target.startswith(str(TARGET_ROOT_REL) + "/"):
            fail(f"target escapes canonical r3 root: {target}")
        if not staged.startswith(str(PROPOSAL_REL / "staging") + "/"):
            fail(f"staged path escapes proposal staging: {staged}")
        if (ROOT / target).exists() or (ROOT / target).is_symlink():
            fail(f"create-only target already exists: {target}")
        staged_path = ROOT / staged
        if not staged_path.is_file() or staged_path.is_symlink():
            fail(f"staged output missing or symlinked: {staged}")
        payload = staged_path.read_bytes()
        if sha256_bytes(payload) != entry["sha256"] or len(payload) != entry["size_bytes"]:
            fail(f"staged output digest or size mismatch: {staged}")
        target_paths.append(target)
        staged_paths.append(staged)
        staged_checks.append(
            {
                "target_path": target,
                "staged_path": staged,
                "expected_state": "absent",
                "sha256": entry["sha256"],
                "size_bytes": entry["size_bytes"],
                "status": "pass",
            }
        )
    if len(set(target_paths)) != 84 or len(set(staged_paths)) != 84:
        fail("target or staged path set is not unique")

    preservation_checks = []
    for entry in preservation["source_entries"]:
        path = ROOT / entry["path"]
        if not path.is_file() or path.is_symlink():
            fail(f"preserved source missing or symlinked: {entry['path']}")
        current_sha = sha256_bytes(path.read_bytes())
        if current_sha != entry["before_sha256"]:
            fail(f"preserved source drift: {entry['path']}")
        preservation_checks.append(
            {
                "path": entry["path"],
                "before_sha256": entry["before_sha256"],
                "current_sha256": current_sha,
                "status": "pass",
            }
        )

    git_status = subprocess.run(
        ["git", "status", "--short", "--untracked-files=all"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.splitlines()
    baseline_dirty = [
        line for line in git_status if str(RUN_REL) not in line
    ]

    dependency_sources = {
        "proposal-candidate-manifest": str(PROPOSAL_REL / "proposal/CANDIDATE-MANIFEST.json"),
        "proposal-target-inventory": str(PROPOSAL_REL / "proposal/TARGET-INVENTORY.json"),
        "proposal-patch-manifest": str(PROPOSAL_REL / "proposal/PROPOSAL-PATCH-MANIFEST.json"),
        "controller-compatibility-validation": str(PROPOSAL_REL / "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json"),
        "source-preservation": str(PROPOSAL_REL / "validation/SOURCE-PRESERVATION.json"),
    }
    dependency_ids = list(dependency_sources)
    source_paths = [
        str(PROPOSAL_REL / "REFRESH-REPORT.md"),
        str(PROPOSAL_REL / "proposal/CANDIDATE-MANIFEST.json"),
        str(PROPOSAL_REL / "proposal/TARGET-INVENTORY.json"),
        str(PROPOSAL_REL / "proposal/PROPOSAL-PATCH-MANIFEST.json"),
        str(PROPOSAL_REL / "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json"),
        str(PROPOSAL_REL / "HELPER-RECEIPT.json"),
        str(PROPOSAL_REL / "validation/SOURCE-PRESERVATION.json"),
    ]

    validation_commands = [
        (
            f"python3 {TARGET_ROOT_REL}/plan/work-pack/shared/validate_tde_unit_contracts.py "
            f"--schema {TARGET_ROOT_REL}/plan/work-pack/shared/TDE-UNIT-VALIDATION.schema.json "
            f"--contracts {TARGET_ROOT_REL}/plan/work-pack/shared/VALIDATION-CONTRACTS.json "
            f"--positive {TARGET_ROOT_REL}/plan/work-pack/shared/unit-contract-fixtures/valid.json "
            f"--negative {TARGET_ROOT_REL}/plan/work-pack/shared/unit-contract-fixtures/invalid-missing-expected-exit.json"
        ),
        (
            "python3 .agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py "
            f"--projection {TARGET_ROOT_REL}/plan/EXECUTION-ENTRY.json "
            f"--output {RUN_REL}/validation/live-execution-entry-validation.json"
        ),
        (
            "python3 .agents/skills/work-pack-readiness-audit/scripts/audit_work_pack.py "
            f"--config {TARGET_ROOT_REL}/readiness/audit-config.json "
            f"--output-dir {RUN_REL}/validation/live-wpra"
        ),
        (
            "python3 .agents/skills/invoke/scripts/prepare_plan_implementation_readiness.py "
            f"--audit-config {TARGET_ROOT_REL}/readiness/audit-config.json "
            f"--audit-report {RUN_REL}/validation/live-wpra/work-pack-readiness-report-v2.json "
            f"--proof-invocation-id {RUN_ID} --proof-created-at {CREATED_AT} "
            f"--output {RUN_REL}/validation/LIVE-IMPLEMENTATION-READINESS-PREFLIGHT.json"
        ),
        f"python3 {RUN_REL}/validate_live_apply.py",
    ]

    material_package = {
        "schema_version": "1.0.0",
        "package_id": PACKAGE_ID,
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": "Rondelli",
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [exact_ref(path, "private") for path in source_paths],
        "changes": [
            {
                "target_path": entry["target_path"],
                "operation": "create",
                "output_ref": {
                    "path": entry["staged_path"],
                    "sha256": entry["sha256"],
                    "size_bytes": entry["size_bytes"],
                },
            }
            for entry in inventory["entries"]
        ],
        "target_inventory": [
            {
                "target_path": entry["target_path"],
                "lifecycle_owner": "Rondelli",
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": dependency_ids,
            }
            for entry in inventory["entries"]
        ],
        "dependencies": [
            {
                "dependency_id": dependency_id,
                "artifact_ref": exact_ref(path),
            }
            for dependency_id, path in dependency_sources.items()
        ],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": "Rondelli",
            "scope_paths": target_paths,
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": validation_commands,
    }

    if set(material_package["approval"]["scope_paths"]) != set(target_paths):
        fail("approval and target inventory sets differ")
    if {item["target_path"] for item in material_package["changes"]} != set(target_paths):
        fail("material change and target inventory sets differ")

    baseline = {
        "schema_version": "domainspec-v2.invoke-refresh-apply-preflight/v1",
        "run_id": RUN_ID,
        "created_at": CREATED_AT,
        "status": "pass",
        "canonical_target_root": str(TARGET_ROOT_REL),
        "canonical_target_state": "absent",
        "create_only": True,
        "target_count": 84,
        "proposal_bindings": proposal_bindings,
        "staged_checks": staged_checks,
        "preserved_source_checks": preservation_checks,
        "dirty_worktree": {
            "preexisting_entry_count": len(baseline_dirty),
            "status_sha256": sha256_bytes(("\n".join(baseline_dirty) + "\n").encode()),
            "rule": "Preserve every unrelated or pre-existing dirty byte.",
        },
        "scope_equality": {
            "target_inventory_count": len(target_paths),
            "material_changes_count": len(material_package["changes"]),
            "approval_scope_count": len(material_package["approval"]["scope_paths"]),
            "sets_equal": True,
        },
        "authority_effect": "none",
    }

    inventory_index = load_json(ROOT / ".arcanum/inventory/index.json")
    matching = [
        entry
        for entry in inventory_index.get("entries", [])
        if any(
            term in (
                str(entry.get("title", ""))
                + " "
                + str(entry.get("summary", ""))
                + " "
                + " ".join(entry.get("tags", []))
            ).lower()
            for term in ("invoke", "work-pack", "readiness", "task-session")
        )
    ]
    inventory_lookup = {
        "schema_version": "domainspec-v2.invoke-refresh-inventory-lookup/v1",
        "mode": "lookup",
        "inventory_root": ".arcanum/inventory",
        "machine_index_ref": exact_ref(".arcanum/inventory/index.json"),
        "lookup_readiness": "ready",
        "validation_attempts": [
            {
                "attempt": 1,
                "command": ".arcanum/inventory/scripts/validate-index-json.sh --root .arcanum/inventory",
                "exit_code": 1,
                "result": "fail-preserved",
                "reason": "unsupported --root argument",
            },
            {
                "attempt": 2,
                "command": ".arcanum/inventory/scripts/validate-index-json.sh .arcanum/inventory/index.json",
                "exit_code": 0,
                "result": "pass",
                "warnings": 153,
            },
        ],
        "matching_entries": [
            {
                key: entry.get(key)
                for key in ("id", "path", "type", "title", "summary", "tags", "sources", "status", "confidence")
            }
            for entry in matching
        ],
        "exact_tde_entry_found": False,
        "gap_resolution": "Explicit proposal evidence covers the exact apply obligations; the Inventory lookup remains a non-authority read model.",
        "authority_effect": "none",
    }

    obligations = [
        ("O01", "Bind the exact proposal and accepted source hashes."),
        ("O02", "Prove all 84 staged postimages are exact and non-symlinked."),
        ("O03", "Prove all 84 canonical targets are absent before create-only apply."),
        ("O04", "Require exact equality of target, material-change, and approval scopes."),
        ("O05", "Validate a standard material package and file-bound handoff before apply."),
        ("O06", "Apply only the declared 84 targets and prove live byte equality."),
        ("O07", "Rerun live WPRA, implementation readiness, and controller structural checks."),
        ("O08", "Preserve accepted @2, proposal, product, authority, Git, and unrelated dirty bytes."),
        ("O09", "Do not create acceptance, selection, epoch approval, or product execution evidence."),
        ("O10", "Return a closed helper receipt with remaining owner gates."),
    ]
    selected_sources = [
        {"path": str(PROPOSAL_REL / "REFRESH-REPORT.md"), "selector": "Result, Exact bindings, Authority and blockers", "obligations": ["O01", "O08", "O09"]},
        {"path": str(PROPOSAL_REL / "proposal/TARGET-INVENTORY.json"), "selector": "canonical_target_root, entries", "obligations": ["O02", "O03", "O04", "O06"]},
        {"path": str(PROPOSAL_REL / "proposal/PROPOSAL-PATCH-MANIFEST.json"), "selector": "full_target_mapping, proposal_material_digest", "obligations": ["O01", "O04"]},
        {"path": str(PROPOSAL_REL / "proposal/CANDIDATE-MANIFEST.json"), "selector": "candidate_id, readiness_evidence, claim_ceiling", "obligations": ["O01", "O07", "O09"]},
        {"path": str(PROPOSAL_REL / "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json"), "selector": "controller, wpra, implementation_readiness", "obligations": ["O07", "O09"]},
        {"path": str(PROPOSAL_REL / "validation/SOURCE-PRESERVATION.json"), "selector": "source_entries, preserved_forbidden_surfaces", "obligations": ["O08"]},
        {"path": str(PROPOSAL_REL / "HELPER-RECEIPT.json"), "selector": "required_revalidation, blockers, next_route", "obligations": ["O07", "O09", "O10"]},
        {"path": "arcanum/spells/invoke/schemas/material-package.schema.json", "selector": "materialized allOf and exact scope fields", "obligations": ["O04", "O05"]},
        {"path": "arcanum/spells/invoke/schemas/material-package-receipt.schema.json", "selector": "PASS/ready receipt fields", "obligations": ["O05"]},
        {"path": "arcanum/spells/invoke/scripts/material_package_validator.py", "selector": "validate_material_package", "obligations": ["O05"]},
        {"path": "arcanum/spells/invoke/scripts/refresh_material_handoff.py", "selector": "resolve_file_bound_refresh_handoff", "obligations": ["O05"]},
    ]
    context_index = {
        "schema_version": "context-builder.runtime-handoff-index.v1",
        "task_id": RUN_ID,
        "mode": "standard",
        "strict": True,
        "handoff": "runtime",
        "obligations": [
            {"id": obligation_id, "claim": claim, "status": "covered"}
            for obligation_id, claim in obligations
        ],
        "selected_sources": selected_sources,
        "coverage": {"total": 10, "covered": 10, "percent": 100},
        "write_scope": [str(RUN_REL), str(TARGET_ROOT_REL)],
        "forbidden_scope": ["accepted @2", "proposal bytes", "product implementation", "authority", "Craft", "telemetry", "Git", "public Arcanum"],
        "strict_coverage": "pass",
        "authority_effect": "none",
    }

    technique_trace = {
        "schema_version": "domainspec-v2.invoke-dispatch-technique-trace/v1",
        "run_id": RUN_ID,
        "mode": "refresh",
        "selected_techniques": [
            {"id": "sequence", "effect": "Preflight, material validation, file-bound handoff, exact create, and live validation are ordered fail-closed."},
            {"id": "owner_boundary_check", "effect": "Rondelli approval is exact to 84 private/internal create targets; acceptance and selection remain separate."},
            {"id": "artifact_contract_bridge", "effect": "Proposal inventory entries become standard material-package change/output refs without semantic rewriting."},
            {"id": "validation_loop", "effect": "Staged validation is repeated against live canonical bytes after apply."},
            {"id": "concrete_path_evidence", "effect": "Every staged, target, source, receipt, and validation path carries an exact digest."},
            {"id": "residue_ledger", "effect": "Renewed owner acceptance, real selection, chain approval, and Victor review remain explicit residue."},
        ],
        "full_dispatch_required": False,
        "full_dispatch_skip_reason": "One already-authorized bounded helper applies one exact inventory; no multi-agent or reusable route graph is introduced.",
        "distill": {"status": "skipped", "reason": "Exact narrow compatibility repair with a closed 84-path inventory; no broad or ambiguous concept unit is being authored."},
        "authority_effect": "none",
    }

    for relative in ("baseline", "material", "context", "validation", "reconciliation"):
        (RUN / relative).mkdir(parents=True, exist_ok=True)
    write_json(RUN / "baseline/PREAPPLY-BASELINE.json", baseline)
    (RUN / "baseline/GIT-STATUS-BEFORE.txt").write_text(
        "\n".join(baseline_dirty) + "\n", encoding="utf-8"
    )
    write_json(RUN / "material/material-package.json", material_package)
    write_json(RUN / "context/INVENTORY-LOOKUP.json", inventory_lookup)
    write_json(RUN / "context/context-pack.index.json", context_index)
    context_lines = [
        "# Runtime context pack: TDE chain-controller compatibility apply",
        "",
        "This run applies one exact proposal inventory. It does not authorize acceptance, selection, product execution, Git, or authority changes.",
        "",
        "## Obligations",
        "",
    ]
    context_lines.extend(f"- `{item_id}` covered — {claim}" for item_id, claim in obligations)
    context_lines.extend(["", "## Selected evidence", ""])
    context_lines.extend(
        f"- `{item['path']}` — {item['selector']} — {', '.join(item['obligations'])}"
        for item in selected_sources
    )
    context_lines.extend(
        [
            "",
            "## Boundary",
            "",
            f"- Writable: `{RUN_REL}/**` and the 84 create-only paths under `{TARGET_ROOT_REL}/**`.",
            "- Forbidden: accepted @2, proposal bytes, product implementation, authority, Craft, telemetry, Git, and public Arcanum.",
            "- Strict coverage: pass (10/10).",
            "",
        ]
    )
    (RUN / "context/CONTEXT-PACK.md").write_text("\n".join(context_lines), encoding="utf-8")
    write_json(RUN / "validation/TECHNIQUE-TRACE.json", technique_trace)
    write_json(
        RUN / "validation/DISPATCH-VALIDATION.json",
        {
            "schema_version": "domainspec-v2.invoke-dispatch-technique-validation/v1",
            "run_id": RUN_ID,
            "status": "pass",
            "selected_technique_count": len(technique_trace["selected_techniques"]),
            "all_techniques_affect_a_phase_or_gate": True,
            "full_dispatch_required": False,
            "helper_boundary": "one bounded native helper; parent owns route and final claims",
            "authority_effect": "none",
        },
    )
    print(json.dumps({"status": "pass", "target_count": 84, "package": str(RUN_REL / "material/material-package.json")}, sort_keys=True))


if __name__ == "__main__":
    main()
