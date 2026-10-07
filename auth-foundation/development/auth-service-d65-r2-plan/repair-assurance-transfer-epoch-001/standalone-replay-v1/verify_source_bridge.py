#!/usr/bin/env python3
"""Bind archived W5 source bytes to this standalone checkout, without replay claims."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
from pathlib import Path


HERE = Path(__file__).resolve().parent
W5 = HERE.parent
REPOSITORY = W5.parents[3]
MANIFEST = W5 / "INPUT-CANDIDATE.json"
ARCHIVED_RESULT = W5 / "PRODUCT-TEST-RESULT.json"
CURRENT_TECHNICAL = REPOSITORY / "auth-foundation/implementation/current-evidence-successor-v1/binding.json"
BINDING = HERE / "binding.json"
PREFIXES = {
    "projects/auth-foundation/": "auth-foundation/",
    "projects/domainspec-v2/": "craft/projects/domainspec-v2/",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def map_path(logical: str) -> str:
    if not isinstance(logical, str) or logical.startswith("/") or any(part in ("", ".", "..") for part in logical.split("/")):
        raise ValueError(f"unsafe W5 logical path: {logical}")
    matches = [(old, new) for old, new in PREFIXES.items() if logical.startswith(old)]
    if len(matches) != 1:
        raise ValueError(f"W5 path outside declared standalone mapping: {logical}")
    old, new = matches[0]
    return new + logical[len(old):]


def verify_file(row: dict) -> dict:
    if set(row) != {"path", "sha256", "bytes"}:
        raise ValueError("W5 source row has unexpected fields")
    local = map_path(row["path"])
    path = (REPOSITORY / local).resolve()
    if not path.is_relative_to(REPOSITORY) or not path.is_file():
        raise ValueError(f"W5 mapped source missing or escaping: {local}")
    data = path.read_bytes()
    if len(data) != row["bytes"] or sha256(data) != row["sha256"]:
        raise ValueError(f"W5 mapped source bytes differ: {local}")
    return {"historical_path": row["path"], "standalone_path": local, "sha256": row["sha256"]}


def expected_binding() -> dict:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    payload = {key: value for key, value in manifest.items() if key != "input_digest"}
    if sha256(canonical(payload)) != manifest["input_digest"]:
        raise ValueError("archived W5 input manifest identity differs")
    rows = [verify_file(row) for row in manifest["files"]]
    if len(rows) != 222 or len({row["standalone_path"] for row in rows}) != len(rows):
        raise ValueError("W5 mapped source denominator changed or duplicates exist")
    result = json.loads(ARCHIVED_RESULT.read_text(encoding="utf-8"))
    if result["status"] != "pass" or result["product_approval"] != "not-requested":
        raise ValueError("archived W5 result posture changed")
    return {
        "schema_version": "auth-w5.standalone-source-bridge/v1-candidate",
        "historical_input_manifest_sha256": sha256(MANIFEST.read_bytes()),
        "historical_input_digest": manifest["input_digest"],
        "historical_product_result_sha256": sha256(ARCHIVED_RESULT.read_bytes()),
        "historical_candidate_digest": result["candidate_digest"],
        "current_technical_binding_sha256": sha256(CURRENT_TECHNICAL.read_bytes()),
        "mapped_source_count": len(rows),
        "mapped_sources_sha256": sha256(canonical(rows)),
        "path_mapping": PREFIXES,
        "source_result": "exact-local-bytes-match",
        "w5_product_replay": "not_performed",
        "product_approval": "not-requested",
        "authority_effect": "none",
        "claim_limit": "Only the 222 declared historical repository source bytes map exactly into this standalone checkout; host tools, EVF, Lean, Zig, fresh candidate identity, and 48-check W5 replay remain unverified.",
    }


def host_gaps() -> dict:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    absent_archived = sorted(row["name"] for row in manifest["host_tool_entrypoints"] if "path" in row and not Path(row["path"]).is_file())
    unavailable_current = [name for name in ("lean", "elan", "zig") if shutil.which(name) is None]
    evf_dir = os.environ.get("AUTH_EVF_BIN")
    evf_available = bool(evf_dir and (Path(evf_dir) / "evf-run").is_file() and (Path(evf_dir) / "evf-independent-verifier").is_file())
    lean_provider_available = bool(evf_dir and (Path(evf_dir) / "evf-provider-lean").is_file())
    return {"absent_archived_tool_names": absent_archived, "unavailable_current_tool_names": unavailable_current, "evf_binary_pair_available": evf_available, "evf_lean_provider_available": lean_provider_available}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true")
    args = parser.parse_args()
    expected = expected_binding()
    if args.print_expected:
        print(json.dumps(expected, indent=2))
    else:
        if json.loads(BINDING.read_text(encoding="utf-8")) != expected:
            raise ValueError("W5 standalone source bridge binding differs")
        print(json.dumps({"status": "source-bridge-pass", "mapped_source_count": expected["mapped_source_count"], "w5_product_replay": "not_performed", "host_gaps": host_gaps(), "authority_effect": "none"}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, KeyError, TypeError, ValueError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
