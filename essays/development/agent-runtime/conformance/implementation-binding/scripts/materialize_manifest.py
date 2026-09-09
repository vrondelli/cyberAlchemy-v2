#!/usr/bin/env python3
"""Materialize the exact implementation file manifest; never touches implementation bytes."""
import hashlib
import json
from pathlib import Path

package = Path(__file__).resolve().parent.parent
repo = package.parents[5]
implementation = repo / "cyberAlchemy-v2/essays/development/agent-runtime/implementation"


def excluded(path: Path) -> bool:
    relative = path.relative_to(implementation)
    parts = set(relative.parts)
    return bool(
        parts.intersection({"target", ".git", "node_modules", "gen"})
        or path.name in {".DS_Store"}
        or path.suffix in {".db", ".sqlite", ".sqlite3", ".tmp", ".swp"}
    )


files = []
for path in sorted(p for p in implementation.rglob("*") if p.is_file() and not excluded(p)):
    data = path.read_bytes()
    files.append(
        {
            "path": path.relative_to(implementation).as_posix(),
            "size_bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
        }
    )

output = {
    "schema_version": "cav2.essays.agent-runtime.implementation-manifest/v1",
    "implementation_root": "cyberAlchemy-v2/essays/development/agent-runtime/implementation",
    "exclusions": ["target/**", "node_modules/**", "desktop/src-tauri/gen/**", "*.db", "*.sqlite", "*.sqlite3", "*.tmp", "*.swp", ".DS_Store"],
    "files": files,
    "file_count": len(files),
    "authority_effect": "none",
}
(package / "IMPLEMENTATION-MANIFEST.json").write_text(json.dumps(output, indent=2, sort_keys=True) + "\n")
