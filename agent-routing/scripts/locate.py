#!/usr/bin/env python3
"""Resolve user-cited repository names without changing files or authority."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from jsonschema import Draft202012Validator

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = PACKAGE_ROOT.parents[1]


def normalize(value: str) -> str:
    return " ".join(re.findall(r"[^\W_]+", value.casefold()))


def bounded_path(root: Path, value: str) -> Path:
    relative = Path(value)
    if relative.is_absolute() or ".." in relative.parts or "\\" in value:
        raise ValueError(f"unsafe repository path: {value}")
    if not relative.parts or any(part in {".git", "node_modules", "arcanum"} for part in relative.parts):
        raise ValueError(f"forbidden lookup source: {value}")
    path = (root / relative).resolve()
    resolved_relative = path.relative_to(root.resolve())
    if any(part in {".git", "node_modules", "arcanum"} for part in resolved_relative.parts):
        raise ValueError(f"forbidden resolved lookup source: {value}")
    return path


def index_errors(index: dict, root: Path = REPOSITORY_ROOT) -> list[str]:
    schema = json.loads((PACKAGE_ROOT / "schemas/agent-router.schema.json").read_text())
    schema["$ref"] = "#/$defs/projectIndex"
    errors = sorted(error.message for error in Draft202012Validator(schema).iter_errors(index))
    if errors:
        return errors
    ids = set()
    for entry in index["entries"]:
        if entry["entry_id"] in ids:
            errors.append(f"duplicate index entry: {entry['entry_id']}")
        ids.add(entry["entry_id"])
        source_paths = [source["path"] for source in entry["sources"]]
        if len(set(source_paths)) != len(source_paths) or set(source_paths) != set(entry["read_first"]):
            errors.append(f"entry sources must pin exactly read_first: {entry['entry_id']}")
        if any(not normalize(alias) for alias in entry["aliases"]):
            errors.append(f"empty normalized alias: {entry['entry_id']}")
        for value in [entry["root"], *source_paths]:
            # Validate lexical bounds globally; only selected entries touch sources.
            relative = Path(value)
            if relative.is_absolute() or ".." in relative.parts or "\\" in value or any(
                part in {".git", "node_modules", "arcanum"} for part in relative.parts
            ):
                errors.append(f"unsafe index path: {value}")
    return errors


def locate(query: str, index: dict, root: Path = REPOSITORY_ROOT) -> dict:
    result = {
        "query": query, "status": "not_evaluable", "matches": [], "errors": [],
        "authority_effect": "none", "claim_ceiling": "Source lookup only; no runtime selection or effect authority.",
    }
    result["errors"] = index_errors(index, root)
    if result["errors"]:
        return result
    key = normalize(query)
    if not key:
        result["errors"] = ["query has no name tokens"]
        return result
    for entry in sorted(index["entries"], key=lambda item: item["entry_id"]):
        names = [entry["entry_id"], entry["name"], *entry["aliases"], *entry["identity_refs"]]
        if key not in {normalize(name) for name in names}:
            continue
        match = {**entry, "source_status": "current", "source_errors": []}
        try:
            if not bounded_path(root, entry["root"]).is_dir():
                raise ValueError(f"missing source root: {entry['root']}")
        except (OSError, ValueError) as exc:
            match["source_errors"].append(str(exc))
        for source in entry["sources"]:
            try:
                actual = hashlib.sha256(bounded_path(root, source["path"]).read_bytes()).hexdigest()
                if actual != source["sha256"]:
                    match["source_errors"].append(f"source drift: {source['path']}")
            except (OSError, ValueError) as exc:
                match["source_errors"].append(f"source not evaluable: {source['path']}: {exc}")
        if match["source_errors"]:
            match["source_status"] = "not_evaluable"
        result["matches"].append(match)
    matches = result["matches"]
    if any(match["source_errors"] for match in matches):
        result["status"] = "not_evaluable"
    else:
        result["status"] = "not_found" if not matches else "resolved" if len(matches) == 1 else "ambiguous"
    result["next_action"] = {
        "resolved": "Announce and read the exact entry sources, then resume the intended objective route.",
        "ambiguous": "Present every candidate and request only the unresolved identity choice.",
        "not_found": "Perform bounded repository filename and entry-document discovery before asking for a path.",
        "not_evaluable": "Report exact source gaps; inspect the named target before proposing any index refresh.",
    }[result["status"]]
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("names", nargs="+", help="Cited names; quote each multi-word name")
    args = parser.parse_args()
    try:
        index = json.loads((PACKAGE_ROOT / "project-index.json").read_text())
        results = [locate(name, index) for name in args.names]
    except (OSError, ValueError) as exc:
        results = [{"status": "not_evaluable", "errors": [str(exc)], "authority_effect": "none"}]
    print(json.dumps({"results": results, "authority_effect": "none"}, indent=2, sort_keys=True))
    return 1 if any(result["status"] == "not_evaluable" for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
