#!/usr/bin/env python3
"""Verify separate current-CLI Auth targets without rewriting historical D65 targets."""

from __future__ import annotations

import copy
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


SCRIPT = Path(__file__).resolve()
IMPLEMENTATION = SCRIPT.parents[1]
REPOSITORY = SCRIPT.parents[3]
SUCCESSOR = IMPLEMENTATION / "current-runtime-successor-v1"
BINDING = SUCCESSOR / "binding.json"
CLI = REPOSITORY / "craft/projects/domainspec-v2/impl/cli/src/cli/main.ts"
TSX = REPOSITORY / "craft/projects/domainspec-v2/impl/cli/node_modules/tsx/dist/cli.mjs"
NODE = shutil.which("node")
CASES = {
    "standard": ("operation-source", "standard-runtime", "auth-exact-permission:authorize",
                 ".domainspec/instantiations/auth-exact-permission.authorize.json", ()),
    "command-boundary": ("command-boundary-source", "command-boundary-runtime",
                         "auth-command-boundary:admit-authorization-command",
                         ".domainspec/instantiations/auth-command-boundary.admit-authorization-command.json", ()),
    "trusted-input": ("trusted-input-source", "trusted-input-runtime",
                      "trusted-input-resolution:resolve-trusted-inputs",
                      ".domainspec/instantiations/trusted-input-resolution.resolve-trusted-inputs.json",
                      ("--integration-profile", "provider-neutral-v1", "--integration-binding-set", "trusted-input-sqlite")),
}
TARGET_FIELDS = {"id", "historical_receipt_file_sha256", "historical_receipt_sha256",
                 "current_receipt_file_sha256", "current_receipt_sha256", "plan_sha256"}
BINDING_FIELDS = {"schema_version", "binding_id", "historical_relationship_authority_sha256",
                  "current_relationship_authority_sha256", "authority_delta", "targets",
                  "historical_targets_mutated", "current_target_status", "runtime_guarantees_observed",
                  "authority_effect", "claim_ceiling"}
DIGEST = re.compile(r"^[a-f0-9]{64}$")


class ValidationFailure(Exception):
    pass


def require(condition: bool, code: str) -> None:
    if not condition:
        raise ValidationFailure(code)


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def load(path: Path) -> dict:
    value = json.loads(path.read_bytes())
    require(isinstance(value, dict), "JSON_OBJECT_REQUIRED")
    return value


def temporary_root() -> Path:
    for name in (os.environ.get("TMPDIR"), "/tmp", "/var/tmp"):
        if name and Path(name).is_dir() and shutil.disk_usage(name).free >= 256 * 1024 * 1024:
            return Path(name)
    raise ValidationFailure("TEMP_SPACE_UNAVAILABLE")


def run_cli(args: list[str], temp_root: Path) -> dict:
    require(NODE is not None and TSX.is_file() and CLI.is_file(), "CURRENT_CLI_UNAVAILABLE")
    env = dict(os.environ, TMPDIR=str(temp_root), TMP=str(temp_root), TEMP=str(temp_root))
    result = subprocess.run([NODE, str(TSX), str(CLI), *args], cwd=REPOSITORY, env=env,
                            text=True, capture_output=True, timeout=120, check=False)
    require(result.returncode == 0, f"CURRENT_CLI_FAILED:{result.stderr[-400:] or result.stdout[-400:]}")
    try:
        value = json.loads(result.stdout)
    except ValueError as error:
        raise ValidationFailure("CURRENT_CLI_NON_JSON") from error
    require(isinstance(value, dict), "CURRENT_CLI_NON_OBJECT")
    return value


def tree_digests(root: Path, receipt_relative: str) -> dict[str, str]:
    require(root.is_dir() and not root.is_symlink(), "TARGET_MISSING_OR_SYMLINK")
    files = {}
    for path in sorted(root.rglob("*")):
        require(not path.is_symlink(), "TARGET_SYMLINK")
        if path.is_file():
            relative = path.relative_to(root).as_posix()
            if relative != receipt_relative:
                files[relative] = sha256(path.read_bytes())
    return files


def compare_receipts(historical: dict, current: dict, old_authority: str,
                     new_authority: str, old_self: str, new_self: str, plan: str) -> None:
    require(historical.get("semantic_contract", {}).get("relationship_authority_sha256") == old_authority,
            "HISTORICAL_AUTHORITY_DRIFT")
    require(current.get("semantic_contract", {}).get("relationship_authority_sha256") == new_authority,
            "CURRENT_AUTHORITY_DRIFT")
    require(historical.get("receipt_sha256") == old_self and current.get("receipt_sha256") == new_self,
            "RECEIPT_SELF_DIGEST_DRIFT")
    require(historical.get("plan_sha256") == plan and current.get("plan_sha256") == plan,
            "PLAN_DIGEST_DRIFT")
    normalized = copy.deepcopy(current)
    normalized["semantic_contract"]["relationship_authority_sha256"] = old_authority
    normalized["receipt_sha256"] = old_self
    require(normalized == historical, "UNSELECTED_RECEIPT_DELTA")


def verify() -> dict:
    binding = load(BINDING)
    require(set(binding) == BINDING_FIELDS
            and binding.get("schema_version") == "auth-foundation.current-runtime-receipt-successor/v1-candidate"
            and binding.get("binding_id") == "AUTH-CURRENT-CLI-RECEIPTS-001"
            and binding.get("historical_targets_mutated") is False
            and binding.get("current_target_status") == "candidate-current-cli-observable"
            and binding.get("runtime_guarantees_observed") is False
            and binding.get("authority_effect") == "none", "BINDING_CLAIM_DRIFT")
    old_authority = binding.get("historical_relationship_authority_sha256")
    new_authority = binding.get("current_relationship_authority_sha256")
    require(isinstance(old_authority, str) and DIGEST.fullmatch(old_authority) is not None
            and isinstance(new_authority, str) and DIGEST.fullmatch(new_authority) is not None
            and old_authority != new_authority, "AUTHORITY_BINDING_INVALID")
    relationship_source = REPOSITORY / "craft/projects/domainspec-v2/definitions/relationships/relationships.yml"
    require(sha256(relationship_source.read_bytes()) == new_authority, "CURRENT_AUTHORITY_SOURCE_DRIFT")
    rows = binding.get("targets")
    require(isinstance(rows, list) and len(rows) == len(CASES)
            and [row.get("id") for row in rows if isinstance(row, dict)] == list(CASES), "TARGET_SET_DRIFT")
    temp_root = temporary_root()
    results = []
    with tempfile.TemporaryDirectory(prefix="auth-current-receipt-replay-", dir=temp_root) as directory:
        for row in rows:
            require(set(row) == TARGET_FIELDS and all(isinstance(row[field], str) and DIGEST.fullmatch(row[field])
                    for field in TARGET_FIELDS - {"id"}), "TARGET_BINDING_INVALID")
            target_id = row["id"]
            source_name, historical_name, node, receipt_relative, extra = CASES[target_id]
            historical_root = IMPLEMENTATION / historical_name
            current_root = SUCCESSOR / target_id
            historical_receipt_path = historical_root / receipt_relative
            current_receipt_path = current_root / receipt_relative
            require(sha256(historical_receipt_path.read_bytes()) == row["historical_receipt_file_sha256"],
                    f"HISTORICAL_RECEIPT_FILE_DRIFT:{target_id}")
            require(sha256(current_receipt_path.read_bytes()) == row["current_receipt_file_sha256"],
                    f"CURRENT_RECEIPT_FILE_DRIFT:{target_id}")
            historical = load(historical_receipt_path)
            current = load(current_receipt_path)
            relationships = historical.get("semantic_contract", {}).get("relationships", [])
            require(isinstance(relationships, list) and all(isinstance(item, dict)
                    and item.get("relationship") in {"reads", "enforces"} for item in relationships),
                    f"AUTH_RELATIONSHIP_SCOPE_DRIFT:{target_id}")
            compare_receipts(historical, current, old_authority, new_authority,
                             row["historical_receipt_sha256"], row["current_receipt_sha256"], row["plan_sha256"])
            historical_files = tree_digests(historical_root, receipt_relative)
            current_files = tree_digests(current_root, receipt_relative)
            inventory = {item["relative_path"]: item["sha256"] for item in current["artifacts"]}
            require(historical_files == current_files == inventory,
                    f"GENERATED_ARTIFACT_DRIFT:{target_id}")
            for run in range(2):
                probe = Path(directory) / f"{target_id}-{run}"
                created = run_cli(["instantiate", str(IMPLEMENTATION / source_name), "--node", node,
                                   "--language", "rust", "--target-root", str(probe), *extra], temp_root)
                require(created.get("result") == "pass" and created.get("observation", {}).get("result") == "pass"
                        and created.get("receipt_sha256") == row["current_receipt_sha256"],
                        f"CURRENT_REPLAY_DRIFT:{target_id}:{run}")
                require(sha256((probe / receipt_relative).read_bytes()) == row["current_receipt_file_sha256"]
                        and tree_digests(probe, receipt_relative) == current_files,
                        f"CURRENT_REPLAY_BYTES_DRIFT:{target_id}:{run}")
            observed = run_cli(["receipt", str(current_root)], temp_root)
            require(observed.get("observation", {}).get("result") == "pass"
                    and observed["observation"].get("receipt_sha256") == row["current_receipt_sha256"],
                    f"CURRENT_TARGET_OBSERVATION_FAILED:{target_id}")
            results.append({"id": target_id, "historical_receipt_preserved": True,
                            "current_target_observed": True, "artifact_count": len(current_files),
                            "plan_sha256": row["plan_sha256"], "current_receipt_sha256": row["current_receipt_sha256"]})
    return {"status": "pass", "binding_id": binding["binding_id"], "targets": results,
            "runtime_guarantees_observed": False, "authority_effect": "none",
            "claim_ceiling": binding["claim_ceiling"]}


if __name__ == "__main__":
    try:
        print(json.dumps(verify(), indent=2))
    except (ValidationFailure, OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
