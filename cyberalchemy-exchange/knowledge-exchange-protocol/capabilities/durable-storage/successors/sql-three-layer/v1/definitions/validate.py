#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main() -> int:
    errors = []
    candidate = json.loads((ROOT / "candidate.json").read_text())
    source = (ROOT / "DEFINITIONS.md").read_text()
    index = (ROOT / "DEFINITIONS-INDEX.md").read_text()
    ids = candidate["definition_ids"]
    found = re.findall(r"^## (DST3-D\d+) — ", source, re.MULTILINE)
    if found != ids:
        errors.append("definition source order or closure drift")
    for definition_id in ids:
        if index.count(f"| {definition_id} |") != 1:
            errors.append(f"index closure drift: {definition_id}")
    for predecessor in candidate["predecessors"]:
        path = (ROOT / predecessor["path"]).resolve()
        if not path.is_file() or sha(path) != predecessor["sha256"]:
            errors.append(f"predecessor digest drift: {predecessor['path']}")
    required = ["distinct failure domain", "not backup", "SQL-independent", "not yet trusted", "not restoration proof", "PostgreSQL is the first adapter"]
    for phrase in required:
        if phrase.lower() not in source.lower():
            errors.append(f"required semantic boundary missing: {phrase}")
    result = {
        "schema_version":"cav2-kep-dst-sql-three-layer-definition-validation/v1",
        "result":"PASS" if not errors else "BLOCK",
        "definition_source_sha256":sha(ROOT / "DEFINITIONS.md"),
        "definition_count":len(ids),
        "errors":errors,
        "authority_effect":"none",
        "external_effect":"none"
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1

if __name__ == "__main__":
    raise SystemExit(main())
