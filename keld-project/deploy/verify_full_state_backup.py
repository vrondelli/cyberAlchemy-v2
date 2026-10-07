#!/usr/bin/env python3
"""Offline structural and integrity verifier for a decrypted KELD full-state backup."""

from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import stat
import sys
import urllib.parse


SCHEMA = "keld-full-state-backup/v1"
EXPECTED = {
    "BACKUP-METADATA",
    "SHA256SUMS",
    "commerce.db",
    "keycloak.dump",
    "keld_sessions.dump",
    ".env",
    "compose.staging-candidate.yaml",
    "keld.json",
}
HASHED = EXPECTED - {"SHA256SUMS"}
METADATA_KEYS = {
    "schema",
    "created_at",
    "consistency_mode",
    "app_image",
    "postgres_image",
    "keycloak_image",
}
IMAGE_ID = re.compile(r"(?:sha256:)?[0-9a-f]{64}")
CHECKSUM_LINE = re.compile(r"([0-9a-f]{64})  ([A-Za-z0-9_.-]+)")


class BackupVerificationError(RuntimeError):
    pass


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def regular_private_file(path: Path) -> None:
    if not path.is_file() or path.is_symlink():
        raise BackupVerificationError(f"backup-member-invalid:{path.name}")
    if stat.S_IMODE(path.stat().st_mode) != 0o600:
        raise BackupVerificationError(f"backup-member-mode-invalid:{path.name}")


def parse_metadata(path: Path) -> dict[str, str]:
    values = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" not in line:
            raise BackupVerificationError("backup-metadata-invalid")
        key, value = line.split("=", 1)
        if key in values:
            raise BackupVerificationError("backup-metadata-duplicate-key")
        values[key] = value
    if set(values) != METADATA_KEYS or values.get("schema") != SCHEMA:
        raise BackupVerificationError("backup-metadata-invalid")
    try:
        created = datetime.fromisoformat(values["created_at"].replace("Z", "+00:00"))
    except ValueError as error:
        raise BackupVerificationError("backup-created-at-invalid") from error
    if created.tzinfo is None or values["consistency_mode"] not in {"online", "quiesced"}:
        raise BackupVerificationError("backup-metadata-invalid")
    for name in ("app_image", "postgres_image", "keycloak_image"):
        if IMAGE_ID.fullmatch(values[name]) is None:
            raise BackupVerificationError(f"backup-image-id-invalid:{name}")
    return values


def verify_checksums(directory: Path) -> None:
    checksums = {}
    for line in (directory / "SHA256SUMS").read_text(encoding="utf-8").splitlines():
        match = CHECKSUM_LINE.fullmatch(line)
        if match is None or match.group(2) in checksums:
            raise BackupVerificationError("backup-checksum-manifest-invalid")
        checksums[match.group(2)] = match.group(1)
    if set(checksums) != HASHED:
        raise BackupVerificationError("backup-checksum-member-set-invalid")
    for name, expected in checksums.items():
        if sha256_file(directory / name) != expected:
            raise BackupVerificationError(f"backup-checksum-mismatch:{name}")


def verify_sqlite(path: Path) -> None:
    encoded = urllib.parse.quote(str(path), safe="/")
    database = sqlite3.connect(f"file:{encoded}?mode=ro&immutable=1", uri=True)
    try:
        if database.execute("PRAGMA integrity_check").fetchone() != ("ok",):
            raise BackupVerificationError("backup-commerce-integrity-failed")
    finally:
        database.close()


def verify(directory: Path) -> dict:
    if not directory.is_absolute() or not directory.is_dir() or directory.is_symlink():
        raise BackupVerificationError("backup-directory-invalid")
    if stat.S_IMODE(directory.stat().st_mode) != 0o700:
        raise BackupVerificationError("backup-directory-mode-invalid")
    members = {item.name for item in directory.iterdir()}
    if members != EXPECTED:
        raise BackupVerificationError("backup-member-set-invalid")
    for name in EXPECTED:
        regular_private_file(directory / name)
    metadata = parse_metadata(directory / "BACKUP-METADATA")
    verify_checksums(directory)
    verify_sqlite(directory / "commerce.db")
    for name in ("keycloak.dump", "keld_sessions.dump"):
        with (directory / name).open("rb") as source:
            if source.read(5) != b"PGDMP":
                raise BackupVerificationError(f"backup-postgres-dump-invalid:{name}")
    try:
        config = json.loads((directory / "keld.json").read_text(encoding="utf-8"))
    except (UnicodeError, json.JSONDecodeError) as error:
        raise BackupVerificationError("backup-keld-config-invalid") from error
    if not isinstance(config, dict):
        raise BackupVerificationError("backup-keld-config-invalid")
    return {
        "ok": True,
        "schema": SCHEMA,
        "createdAt": metadata["created_at"],
        "consistencyMode": metadata["consistency_mode"],
        "members": len(EXPECTED),
        "checksums": len(HASHED),
        "sqliteIntegrity": "ok",
        "postgresCatalogs": 2,
        "imageIds": "valid",
        "valuesPrinted": False,
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("backup", type=Path)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        print(json.dumps(verify(args.backup), separators=(",", ":")))
        return 0
    except (BackupVerificationError, OSError, sqlite3.DatabaseError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
