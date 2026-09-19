#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import tarfile
from pathlib import Path


HERE = Path(__file__).resolve().parent
PLAN_ROOT = HERE.parent
DOMAIN_ROOT = next(path for path in PLAN_ROOT.parents if path.name == "domainspec-core")
SOURCE_ROOT = DOMAIN_ROOT / "projects/auth-foundation/implementation/authentication-https"
OUTPUT = HERE / "out"

SOURCE_DIRS = ("src", "scripts", "proxy", "themes", "node_modules")
SOURCE_FILES = ("compose.yaml", "package.json", "package-lock.json")
RUNTIME_SEEDS = ("tools", "browser-libs")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def selected_files() -> list[tuple[Path, str]]:
    selected: list[tuple[Path, str]] = []
    for directory in SOURCE_DIRS:
        for path in sorted((SOURCE_ROOT / directory).rglob("*")):
            if path.is_file():
                selected.append((path, path.relative_to(SOURCE_ROOT).as_posix()))
    for name in SOURCE_FILES:
        selected.append((SOURCE_ROOT / name, name))
    for directory in RUNTIME_SEEDS:
        for path in sorted((SOURCE_ROOT / ".runtime" / directory).rglob("*")):
            if path.is_file():
                selected.append((path, f"runtime-seed/{path.relative_to(SOURCE_ROOT / '.runtime').as_posix()}"))
    bridge = SOURCE_ROOT / ".runtime/auth-prototype-bridge"
    selected.append((bridge, "runtime-seed/auth-prototype-bridge"))
    return selected


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    files = selected_files()
    missing = [str(path) for path, _ in files if not path.is_file()]
    if missing:
        raise FileNotFoundError("missing bundle inputs: " + ", ".join(missing))
    manifest = {
        "schema_version": "auth.orodi-vps-bundle/v1-candidate",
        "source_root": str(SOURCE_ROOT),
        "files": [{"path": arc, "sha256": sha256(path), "size_bytes": path.stat().st_size} for path, arc in files],
        "excluded_private_runtime": True,
        "secret_values_included": False,
        "claim_class": "remote-isolated-staging-rehearsal",
        "authority_effect": "none",
    }
    manifest_bytes = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()
    release_id = hashlib.sha256(manifest_bytes).hexdigest()[:16]
    manifest["release_id"] = release_id
    manifest_bytes = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()
    manifest_path = OUTPUT / "MANIFEST.json"
    manifest_path.write_bytes(manifest_bytes)
    archive = OUTPUT / f"auth-foundation-candidate-{release_id}.tar.gz"
    with tarfile.open(archive, "w:gz", format=tarfile.PAX_FORMAT) as tar:
        for path, arc in files:
            tar.add(path, arcname=arc, recursive=False)
        tar.add(manifest_path, arcname="MANIFEST.json", recursive=False)
    receipt = {
        "schema_version": "auth.orodi-vps-bundle-result/v1-candidate",
        "status": "passed",
        "release_id": release_id,
        "archive": str(archive),
        "archive_sha256": sha256(archive),
        "manifest_sha256": sha256(manifest_path),
        "file_count": len(files),
        "secret_values_included": False,
        "authority_effect": "none",
    }
    (OUTPUT / "RESULT.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
