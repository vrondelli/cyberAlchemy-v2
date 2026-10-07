#!/usr/bin/env python3
"""Evaluator-only join: do all r2 gold files survive the source projection?"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import tarfile


SOURCE_SHA = "8db116f8ee57a050ba609ac69dd40b70f864b1c8d46a4df421bc9e6c91f7c71d"
GOLD_SHA = "454c8d74fb30f4a0dcaeea4eb7fd2a0fdf8d77b3d46c0f568a86a3e74a90322d"
MAX_FILE_BYTES = 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--gold", required=True, type=Path)
    parser.add_argument("--archives", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (sha(args.source.read_bytes()) != SOURCE_SHA
            or sha(args.gold.read_bytes()) != GOLD_SHA or args.output.exists()):
        raise SystemExit("input-pin-drift-or-output-exists")
    source = json.loads(args.source.read_bytes())["results"]
    gold = json.loads(args.gold.read_bytes())["results"]
    if len(source) != len(gold) or len(source) != 24:
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, (src, label) in enumerate(zip(source, gold), 1):
        if (src["ordinal"] != ordinal or label["ordinal"] != ordinal
                or src["repo"] != label["repo"] or not src["code_projection_admissible"]
                or not label["gold_admissible"]):
            raise SystemExit("source-gold-identity-or-admission-drift")
        archive_path = args.archives / src["archive"]
        if sha(archive_path.read_bytes()) != src["archive_sha256"]:
            raise SystemExit("archive-hash-drift")
        root = f"{src['repo'].replace('/', '-')}-{src['commit'][:7]}"
        paths = [item["path"] for item in label["source_gold_paths"]]
        if not paths or len(paths) != len(set(paths)):
            raise SystemExit("gold-path-shape-drift")
        with tarfile.open(archive_path, "r:gz") as archive:
            members = {member.name: member for member in archive}
            checks = [{"path": path,
                       "projected": (root + "/" + path in members
                                     and members[root + "/" + path].isfile()
                                     and members[root + "/" + path].size <= MAX_FILE_BYTES)}
                      for path in paths]
        rows.append({"ordinal": ordinal, "image_tag": label["image_tag"],
                     "source_gold_paths": checks,
                     "all_projected": all(item["projected"] for item in checks)})
        print(json.dumps({"ordinal": ordinal, "gold_files": len(checks),
                          "all_projected": rows[-1]["all_projected"]}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-projection-gold-r2/v1",
               "source_sha256": SOURCE_SHA, "gold_sha256": GOLD_SHA,
               "script_sha256": sha(Path(__file__).read_bytes()),
               "source_side_exported_gold": False,
               "reserved_confirmation_opened": False, "model_calls": 0,
               "results": rows}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"receipt_sha256": sha(data),
                      "cases_projected": sum(row["all_projected"] for row in rows),
                      "gold_files_projected": sum(item["projected"] for row in rows
                                                  for item in row["source_gold_paths"])}), flush=True)


if __name__ == "__main__":
    main()
