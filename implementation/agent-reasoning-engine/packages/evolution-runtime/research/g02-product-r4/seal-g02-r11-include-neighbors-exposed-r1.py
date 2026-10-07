#!/usr/bin/env python3
"""Source-only direct include graph around ARE-delivered C++ files in r11."""

import argparse
import hashlib
import json
import os
import posixpath
import re
import subprocess
from collections import defaultdict
from pathlib import Path


PRIOR_SEAL_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
INCLUDE = re.compile(rb'^\s*#\s*include\s*[<"]([^>"]+)[>"]', re.MULTILINE)
SOURCE_EXTS = {".c", ".cc", ".cpp", ".cxx", ".h", ".hh", ".hpp", ".hxx"}
MAX_PARSE_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def resolve(include, source, tracked):
    names = (include, posixpath.join(posixpath.dirname(source), include),
             posixpath.join("include", include), posixpath.join("single_include", include))
    for name in names:
        path = posixpath.normpath(name)
        if not path.startswith("../") and path != ".." and not path.startswith("/") and path in tracked:
            return path
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.prior_seal.read_bytes()) != PRIOR_SEAL_SHA256:
        raise SystemExit("source-only prior seal drift")
    prior = json.loads(args.prior_seal.read_text())
    source_rows = [row for row in prior["rows"] if row["source"] == "Multi"]
    if [row["ordinal"] for row in source_rows] != [4, 8, 12]:
        raise SystemExit("unexpected exposed Multi cohort")
    rows = []
    for row in source_rows:
        ordinal = row["ordinal"]
        root = Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        base = root / "sources/session/base"
        git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
        if subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip() != row["base_commit"]:
            raise ValueError("base commit drift")
        tracked = {item.decode("utf-8", "surrogateescape") for item in
                   subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0") if item}
        delivered = set(row["delivered_paths"])
        edges = set()
        parsed = 0
        skipped_large = 0
        for source in sorted(tracked):
            if Path(source).suffix.casefold() not in SOURCE_EXTS:
                continue
            file = base / source
            if not file.is_file() or file.is_symlink():
                continue
            data = file.read_bytes()
            if len(data) > MAX_PARSE_BYTES:
                skipped_large += 1
                continue
            parsed += 1
            for match in INCLUDE.finditer(data):
                include = match.group(1).decode("utf-8", "replace")
                target = resolve(include, source, tracked)
                if target and target != source:
                    edges.add((source, target))
        candidates = defaultdict(lambda: {"included_by_delivered": set(), "includes_delivered": set()})
        for source, target in edges:
            if source in delivered and target not in delivered:
                candidates[target]["included_by_delivered"].add(source)
            if target in delivered and source not in delivered:
                candidates[source]["includes_delivered"].add(target)
        items = []
        for path, links in sorted(candidates.items()):
            file = base / path
            if Path(path).suffix.casefold() not in SOURCE_EXTS or not file.is_file() or file.is_symlink():
                continue
            items.append({"path": path, "bytes": file.stat().st_size,
                          "included_by_delivered": sorted(links["included_by_delivered"]),
                          "includes_delivered": sorted(links["includes_delivered"])})
        rows.append({"ordinal": ordinal, "instance_id": row["instance_id"],
                     "repo": row["repo"], "base_commit": row["base_commit"],
                     "issue_sha256": row["issue_sha256"],
                     "delivered_paths": row["delivered_paths"],
                     "tracked_files": len(tracked), "parsed_cpp_files": parsed,
                     "skipped_large_cpp_files": skipped_large,
                     "resolved_edges": len(edges), "candidates": items})
    output = {"schema_version": "g02.r11-include-neighbors-exposed-seal/v1",
              "posture": "source-only-exposed-development-no-gold-dsh-or-score",
              "prior_seal_sha256": PRIOR_SEAL_SHA256,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "graph_rule": "direct resolved C/C++ include edges; tracked regular source files <=262144 bytes parsed; neighbors of ARE-delivered paths only",
              "rows": rows,
              "claim_ceiling": "Candidate-pool diagnostic only; no read selection, native score, cost, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"rows": len(rows), "candidates": [len(row["candidates"]) for row in rows],
                      "resolved_edges": [row["resolved_edges"] for row in rows],
                      "seal_sha256": sha(data)}))


if __name__ == "__main__":
    main()
