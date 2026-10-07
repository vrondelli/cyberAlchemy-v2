#!/usr/bin/env python3
"""Validate all 24 second-development archives for safe code projection."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import tarfile


BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = BASE / "graph-dev-b-r2/source-archives"
CANDIDATE = BASE / "graph-dev-b-r1/METADATA-COHORT-B-R2.json"
ACQUISITION = ROOT / "SOURCE-ARCHIVES-B-R3.json"
PINS = {"candidate": "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8",
        "acquisition": "056cc06b538d6560f3e3a0e37c2ae9ed874d109cb6e167a0092774dbb8e0e77d"}
MAX_FILE_BYTES = 1024 * 1024
MAX_PROJECTED_BYTES = 64 * 1024 * 1024


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def main() -> None:
    output = ROOT / "SOURCE-ARCHIVES-VALIDATED-B-R3.json"
    if (output.exists() or digest(CANDIDATE) != PINS["candidate"] or
            digest(ACQUISITION) != PINS["acquisition"]):
        raise SystemExit("input-pin-drift-or-output-exists")
    candidate = json.loads(CANDIDATE.read_bytes())
    acquired = json.loads(ACQUISITION.read_bytes())["results"]
    cases = candidate["development"]
    if len(cases) != 24 or len(acquired) != 24:
        raise SystemExit("denominator-drift")
    results = []
    for ordinal, (row, source) in enumerate(zip(cases, acquired), 1):
        repo, commit = row["repo"], row["failure_commit"]
        if (row["ordinal"] != ordinal or source["ordinal"] != ordinal or
                source["repo"] != repo or source["commit"] != commit or
                not source["admissible"]):
            raise SystemExit(f"archive-identity-drift:{ordinal}")
        name = source["archive"]
        path = ROOT / name
        if (name != f"{ordinal:02d}-{repo.replace('/', '-')}-{commit}.tar.gz" or
                not path.is_file() or path.stat().st_mode & 0o077 or
                digest(path) != source["archive_sha256"]):
            raise SystemExit(f"archive-path-hash-or-permission:{ordinal}")
        root = f"{repo.replace('/', '-')}-{commit[:7]}"
        extension = ".py" if row["language"] == "Python" else ".java"
        code_files, code_bytes, skipped_large, unsafe = 0, 0, 0, False
        with tarfile.open(path, "r:gz") as archive:
            for item in archive:
                parts = PurePosixPath(item.name).parts
                if (not parts or parts[0] != root or ".." in parts or
                        "\\" in item.name or item.name.startswith("/")):
                    unsafe = True
                    break
                if not item.isfile() or len(parts) < 2 or not item.name.endswith(extension):
                    continue
                if item.size > MAX_FILE_BYTES:
                    skipped_large += 1
                    continue
                code_files += 1
                code_bytes += item.size
        valid = not unsafe and code_files > 0 and code_bytes <= MAX_PROJECTED_BYTES
        results.append({"ordinal": ordinal, "repo": repo, "commit": commit,
                        "archive": name, "archive_bytes": path.stat().st_size,
                        "archive_sha256": source["archive_sha256"],
                        "code_files": code_files, "code_member_bytes": code_bytes,
                        "skipped_over_1m_code_files": skipped_large,
                        "unsafe_path": unsafe, "code_projection_admissible": valid})
        print(json.dumps({"ordinal": ordinal, "code_files": code_files,
                          "code_bytes": code_bytes, "projection_admissible": valid}),
              flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-b-source-validation-r3/v1",
               "candidate_sha256": PINS["candidate"],
               "acquisition_sha256": PINS["acquisition"],
               "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               "source_rule": "Exact failing-commit .py/.java regular files <=1 MiB each; <=64 MiB total per case; no unsafe path; no gold",
               "gold_opened": False, "reserved_confirmation_opened": False,
               "model_calls": 0, "results": results}
    data = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "admissible": sum(row["code_projection_admissible"] for row in results)}))


if __name__ == "__main__":
    main()
