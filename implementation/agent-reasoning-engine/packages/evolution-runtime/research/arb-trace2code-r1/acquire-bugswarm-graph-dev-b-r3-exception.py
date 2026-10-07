#!/usr/bin/env python3
"""Acquire only case-10 oversize archive; preserve the 23 r2 archives."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import tarfile
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = BASE / "graph-dev-b-r2/source-archives"
CANDIDATE = BASE / "graph-dev-b-r1/METADATA-COHORT-B-R2.json"
R2 = ROOT / "SOURCE-ARCHIVES-B-R2.json"
PINS = {"candidate": "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8",
        "r2": "9fb1ff37d24582cd9a506b05aab0ff22347d4ad233014cd0f53935f092e3b865"}
LIMIT = 512 * 1024 * 1024
COMMIT = "0bfcb26fee2785b7067b897bc1ec94e4e8806faf"
REPO = "mlflow/mlflow"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    result_path = ROOT / "SOURCE-ARCHIVES-B-R3.json"
    filename = f"10-{REPO.replace('/', '-')}-{COMMIT}.tar.gz"
    target = ROOT / filename
    if (result_path.exists() or target.exists() or
            sha(CANDIDATE.read_bytes()) != PINS["candidate"] or
            sha(R2.read_bytes()) != PINS["r2"]):
        raise SystemExit("input-pin-drift-or-output-exists")
    candidate = json.loads(CANDIDATE.read_bytes())
    r2 = json.loads(R2.read_bytes())
    cases, originals = candidate["development"], r2["results"]
    if (len(cases) != 24 or len(originals) != 24 or
            cases[9]["ordinal"] != 10 or cases[9]["repo"] != REPO or
            cases[9]["failure_commit"] != COMMIT or
            originals[9]["ordinal"] != 10 or originals[9]["status"] != "size-or-gzip-denial" or
            originals[9]["archive_bytes"] != 200 * 1024 * 1024 + 1 or
            sum(row["admissible"] for row in originals) != 23 or
            candidate["gold_paths_opened"] or candidate["reserved_confirmation_opened"]):
        raise SystemExit("exception-identity-or-posture-drift")
    for index, row in enumerate(originals, 1):
        if index == 10:
            continue
        path = ROOT / row["archive"]
        if (row["ordinal"] != index or not row["admissible"] or
                not path.is_file() or sha(path.read_bytes()) != row["archive_sha256"]):
            raise SystemExit(f"retained-archive-drift:{index}")
    url = f"https://codeload.github.com/{REPO}/legacy.tar.gz/{COMMIT}"
    try:
        with urlopen(Request(url, headers={"User-Agent": "ARE-G01-graph-dev-b-exception/3"}),
                     timeout=180) as response:
            blob = response.read(LIMIT + 1)
            status = response.status
    except (HTTPError, URLError, TimeoutError) as error:
        raise SystemExit("exception-fetch-failed:" + type(error).__name__)
    if status != 200 or len(blob) > LIMIT or not blob.startswith(b"\x1f\x8b"):
        raise SystemExit("exception-size-gzip-or-status-denial:" + str(len(blob)))
    fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(blob)
    try:
        with tarfile.open(target, "r:gz") as archive:
            members = archive.getmembers()
            roots = {item.name.split("/", 1)[0] for item in members}
            root_ok = roots == {f"{REPO.replace('/', '-')}-{COMMIT[:7]}"}
            regular_bytes = sum(item.size for item in members if item.isfile())
    except tarfile.TarError:
        root_ok, members, regular_bytes = False, [], 0
    if not root_ok or len(members) <= 1 or regular_bytes <= 0:
        raise SystemExit("exception-tar-root-or-content-denial")
    replacement = {"ordinal": 10, "repo": REPO, "commit": COMMIT,
                   "status": str(status), "admissible": True, "archive": filename,
                   "archive_bytes": len(blob), "archive_sha256": sha(blob),
                   "tar_root_matches_commit_prefix": True,
                   "members": len(members), "regular_member_bytes": regular_bytes}
    combined = [replacement if index == 10 else row
                for index, row in enumerate(originals, 1)]
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-b-source-archives-r3/v1",
               "candidate_sha256": PINS["candidate"],
               "prior_acquisition_sha256": PINS["r2"],
               "script_sha256": sha(Path(__file__).read_bytes()),
               "exception_ordinal": 10, "exception_cap_bytes": LIMIT,
               "provenance": "GitHub codeload HTTPS at exact failed commits",
               "gold_opened": False, "reserved_confirmation_opened": False,
               "model_calls": 0, "results": combined}
    data = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(result_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"archive_bytes": len(blob), "archive_sha256": sha(blob),
                      "regular_bytes": regular_bytes,
                      "admissible": sum(row["admissible"] for row in combined),
                      "receipt_sha256": sha(data)}))


if __name__ == "__main__":
    main()
