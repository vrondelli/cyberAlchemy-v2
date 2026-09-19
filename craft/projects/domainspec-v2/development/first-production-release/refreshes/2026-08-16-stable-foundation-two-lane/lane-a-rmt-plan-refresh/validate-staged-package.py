#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


EXPECTED_PATHS = [
    "WORK-PACK.md",
    "IMPLEMENTATION-LAYERING.md",
    "EXECUTION-PACK.md",
    "DISTILL-PLAN-VALIDATION.md",
    "PLAN-TRANSPORT.md",
    "GAP-LEDGER.md",
    "SWU-MANIFEST.json",
    "SWU-CONTRACTS.json",
    "HOSTILE-CATALOGUE.json",
    "RELATION-CONTRACTS.json",
    "WRITE-SCOPE-BASELINE.json",
    "VALIDATION-RESULT.json",
    "EXECUTION-ENTRY.json",
    "EXECUTION-ENTRY-VALIDATION.json",
    "validate-work-pack.mjs",
    "tasks/TASK-RMT-OP.md",
    "tasks/TASK-RMT-EVENT.md",
    "tasks/TASK-RMT-SM.md",
    "tasks/TASK-RMT-WF.md",
    "waves/W0-OPERATION.md",
    "waves/W2-MAPPING-EVENT.md",
    "waves/W3-STATE-MACHINE-WORKFLOW.md",
]

EXPECTED_EPOCH = "WP-RMT-002/S1/2026-08-16"
EXPECTED_DECISION_SHA256 = (
    "2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9"
)
EXPECTED_CONTRACT_DIGEST = (
    "75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7"
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fail(code: str, detail: object) -> None:
    raise RuntimeError(f"{code}:{detail}")


def canonical_json(value: object) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def main() -> int:
    repo_root = Path(sys.argv[1] if len(sys.argv) > 1 else Path.cwd()).resolve()
    package_root = Path(__file__).resolve().parent
    manifest_path = package_root / "STAGED-TARGET-MANIFEST.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    live_root = repo_root / manifest["live_target_root"]
    staged_root = repo_root / manifest["staging_root"]

    if manifest["mode"] != "invoke-refresh-proposal-only":
        fail("MODE", manifest["mode"])
    if manifest["phase_status"] != "pass" or manifest["handoff_status"] != "gated":
        fail("PHASE_HANDOFF", [manifest["phase_status"], manifest["handoff_status"]])
    if manifest["mutation_ready"] is not False:
        fail("MUTATION_READY", manifest["mutation_ready"])
    epoch = manifest["semantic_plan_epoch"]
    if (
        epoch["epoch_id"] != EXPECTED_EPOCH
        or epoch["decision_sha256"] != EXPECTED_DECISION_SHA256
        or epoch["contract_digest"] != EXPECTED_CONTRACT_DIGEST
    ):
        fail("SEMANTIC_EPOCH", epoch)

    targets = manifest["targets"]
    if manifest["target_count"] != 22 or len(targets) != 22:
        fail("TARGET_COUNT", len(targets))
    if [row["plan_relative_path"] for row in targets] != EXPECTED_PATHS:
        fail("TARGET_ORDER_OR_SET", [row["plan_relative_path"] for row in targets])

    staged_files = sorted(
        path.relative_to(staged_root).as_posix()
        for path in staged_root.rglob("*")
        if path.is_file()
    )
    if staged_files != sorted(EXPECTED_PATHS):
        fail("STAGED_TREE_SET", staged_files)

    inventory_rows: list[str] = []
    json_count = 0
    changed_count = 0
    live_total = 0
    staged_total = 0
    for expected_ordinal, row in enumerate(targets, start=1):
        rel = row["plan_relative_path"]
        live_path = repo_root / row["live_path"]
        staged_path = repo_root / row["staged_path"]
        if row["ordinal"] != expected_ordinal:
            fail("ORDINAL", [rel, row["ordinal"]])
        if live_path != live_root / rel or staged_path != staged_root / rel:
            fail("PATH_BINDING", rel)
        if live_path.is_symlink() or staged_path.is_symlink():
            fail("SYMLINK", rel)
        live_bytes = live_path.read_bytes()
        staged_bytes = staged_path.read_bytes()
        live_total += len(live_bytes)
        staged_total += len(staged_bytes)
        live_sha = sha256(live_bytes)
        staged_sha = sha256(staged_bytes)
        if row["baseline"] != {"sha256": live_sha, "size_bytes": len(live_bytes)}:
            fail("LIVE_BASELINE_DRIFT", rel)
        if row["staged"] != {"sha256": staged_sha, "size_bytes": len(staged_bytes)}:
            fail("STAGED_HASH_DRIFT", rel)
        changed = live_bytes != staged_bytes
        if changed != row["changed"]:
            fail("CHANGE_CLASSIFICATION", rel)
        changed_count += int(changed)
        if not row["change_classifications"] or not row["source_signals"]:
            fail("UNCLASSIFIED_CHANGE", rel)
        if not staged_bytes.endswith(b"\n") or b"\r" in staged_bytes:
            fail("TEXT_HYGIENE", rel)
        for line_number, line in enumerate(staged_bytes.decode("utf-8").splitlines(), 1):
            if line.rstrip(" \t") != line:
                fail("TRAILING_WHITESPACE", f"{rel}:{line_number}")
        if rel.endswith(".json"):
            json.loads(staged_bytes)
            json_count += 1
        inventory_rows.append(
            f"{expected_ordinal:02d}\t{live_sha}\t{len(live_bytes)}\t"
            f"{staged_sha}\t{len(staged_bytes)}\t{row['live_path']}\t"
            f"{row['staged_path']}\n"
        )

    if changed_count != manifest["changed_target_count"]:
        fail("CHANGED_COUNT", changed_count)
    if live_total != manifest["live_total_size_bytes"]:
        fail("LIVE_TOTAL", live_total)
    if staged_total != manifest["staged_total_size_bytes"]:
        fail("STAGED_TOTAL", staged_total)
    inventory_digest = sha256("".join(inventory_rows).encode("utf-8"))
    if inventory_digest != manifest["inventory_sha256"]:
        fail("INVENTORY_DIGEST", inventory_digest)

    node_check = subprocess.run(
        ["node", "--check", str(staged_root / "validate-work-pack.mjs")],
        cwd=repo_root,
        text=True,
        capture_output=True,
    )
    if node_check.returncode != 0:
        fail("NODE_CHECK", node_check.stderr)

    entry = json.loads((staged_root / "EXECUTION-ENTRY.json").read_text())
    route_digest = sha256(canonical_json(entry["execution_policy"]["allowed_routes"]))
    if route_digest != entry["execution_policy"]["allowed_routes_digest"]:
        fail("ROUTE_DIGEST", route_digest)
    route = entry["execution_policy"]["allowed_routes"][0]
    if len(route["required_inputs"]) != 43 or len(set(route["required_inputs"])) != 43:
        fail("ROUTE_INPUTS", len(route["required_inputs"]))
    if entry["frontier"] != ["RMT-OP-001"]:
        fail("FRONTIER", entry["frontier"])
    if entry["execution_entry"]["selected_unit"] is not None:
        fail("SELECTED_UNIT", entry["execution_entry"]["selected_unit"])
    if entry["execution_entry"]["route_id"] is not None:
        fail("ROUTE_ID", entry["execution_entry"]["route_id"])
    if entry["authority_effect"] != "none":
        fail("AUTHORITY", entry["authority_effect"])

    with tempfile.TemporaryDirectory(prefix="wp-rmt-002-s1-overlay-") as raw:
        overlay = Path(raw) / "plan"
        shutil.copytree(live_root, overlay)
        for rel in EXPECTED_PATHS:
            target = overlay / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(staged_root / rel, target)
        env = os.environ.copy()
        env["WP_RMT_LOGICAL_PLAN_ROOT"] = str(live_root)
        validator = subprocess.run(
            ["node", str(overlay / "validate-work-pack.mjs"), str(repo_root)],
            cwd=repo_root,
            env=env,
            text=True,
            capture_output=True,
        )
        if validator.returncode != 0:
            fail("STAGED_OVERLAY_VALIDATOR", validator.stderr or validator.stdout)
        validator_result = json.loads(validator.stdout)

    stored_result = json.loads((staged_root / "VALIDATION-RESULT.json").read_text())
    if validator_result != stored_result:
        fail("STORED_VALIDATION_STALE", "VALIDATION-RESULT.json")
    if validator_result["result"] != "pass":
        fail("PLAN_VALIDATION", validator_result["result"])
    if validator_result["semantic_plan_epoch"]["fault_matrix"] != "8/8":
        fail("FAULT_MATRIX", validator_result["semantic_plan_epoch"])
    if validator_result["hostile_catalogue"]["s1_cross_boundary_controls"] != "16/16":
        fail("S1_HOSTILES", validator_result["hostile_catalogue"])

    output = {
        "schema_version": "domainspec.invoke-refresh-staged-validation/v1",
        "result": "pass",
        "package_id": manifest["package_id"],
        "mode": manifest["mode"],
        "phase_status": manifest["phase_status"],
        "handoff_status": manifest["handoff_status"],
        "mutation_ready": manifest["mutation_ready"],
        "target_inventory": {
            "count": len(targets),
            "changed": changed_count,
            "inventory_sha256": inventory_digest,
            "live_baselines_unchanged": True,
            "staged_hashes_match": True,
        },
        "syntax_and_hygiene": {
            "json_documents": json_count,
            "json_parse": "pass",
            "node_check": "pass",
            "final_newline": "22/22",
            "trailing_whitespace": "0",
        },
        "plan_validation": {
            "result": validator_result["result"],
            "semantic_epoch": EXPECTED_EPOCH,
            "semantic_contract_digest": EXPECTED_CONTRACT_DIGEST,
            "types": validator_result["graph"]["types"],
            "swus": validator_result["graph"]["swus"],
            "write_scopes": validator_result["write_scope_baseline"]["exact_absent_paths"],
            "affected_contracts": validator_result["semantic_plan_epoch"]["affected_swu_contracts"],
            "fault_matrix": validator_result["semantic_plan_epoch"]["fault_matrix"],
            "s1_controls": validator_result["hostile_catalogue"]["s1_cross_boundary_controls"],
            "route_inputs": validator_result["execution_entry"]["self_contained_route_inputs"],
            "allowed_routes_digest": route_digest,
            "frontier": entry["frontier"],
            "selected_unit": None,
            "route_id": None,
            "authority_effect": "none",
            "stdout_sha256": sha256((json.dumps(validator_result, indent=2) + "\n").encode()),
        },
        "boundaries": {
            "live_targets_changed": False,
            "apply_authorized": False,
            "implementation_selected": False,
            "implementation_executed": False,
            "independent_review_complete": False,
            "owner_acceptance_complete": False,
            "production_or_release_authorized": False,
        },
        "next_gate": "independent exact-byte plan review and owner acceptance; apply remains separately unauthorized",
        "authority_effect": "none",
    }
    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"VALIDATION=block\nERROR={error}", file=sys.stderr)
        raise SystemExit(1)
