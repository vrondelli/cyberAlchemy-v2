#!/usr/bin/env python3
"""Seal source-only direct Python import neighbors of ARE-delivered r11 files."""

import argparse
import ast
import hashlib
import json
import os
import subprocess
from collections import defaultdict
from pathlib import Path


PRIOR_SEAL_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
MAX_PARSE_BYTES = 262144
IMPORT_ROOTS = ("", "lib/", "src/")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def module_paths(name, tracked):
    if not name or any(not part.isidentifier() for part in name.split(".")):
        return set()
    stem = name.replace(".", "/")
    return {candidate for prefix in IMPORT_ROOTS for candidate in
            (prefix + stem + ".py", prefix + stem + "/__init__.py") if candidate in tracked}


def package_parts(source):
    parts = list(Path(source).parts)
    if parts[0] in ("lib", "src"):
        parts.pop(0)
    if parts[-1] == "__init__.py":
        return parts[:-1]
    return parts[:-1]


def imported_modules(tree, source):
    package = package_parts(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                if node.level > len(package):
                    continue
                root = package[:len(package) - node.level + 1]
                name = ".".join(root + (node.module.split(".") if node.module else []))
            else:
                name = node.module or ""
            if name:
                yield name
            for alias in node.names:
                if alias.name != "*":
                    yield name + "." + alias.name if name else alias.name


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    prior_bytes = args.prior_seal.read_bytes()
    if sha(prior_bytes) != PRIOR_SEAL_SHA256:
        raise SystemExit("source-only prior seal drift")
    prior = json.loads(prior_bytes)
    source_rows = [row for row in prior["rows"] if row["source"] != "Multi"]
    if [row["ordinal"] for row in source_rows] != [1, 2, 3, 5, 6, 7, 9, 10, 11]:
        raise SystemExit("unexpected exposed Python cohort")
    rows = []
    for row in source_rows:
        ordinal = row["ordinal"]
        base = Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw/sources/session/base"
        git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
        if subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip() != row["base_commit"]:
            raise SystemExit(f"base commit drift: {ordinal}")
        tracked = {item.decode("utf-8", "surrogateescape") for item in
                   subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0") if item}
        delivered = set(row["delivered_paths"])
        edges = set()
        parsed = skipped_large = parse_errors = 0
        for source in sorted(path for path in tracked if path.endswith(".py")):
            file = base / source
            if not file.is_file() or file.is_symlink():
                continue
            size = file.stat().st_size
            if size > MAX_PARSE_BYTES:
                skipped_large += 1
                continue
            try:
                tree = ast.parse(file.read_bytes(), filename=source)
            except (SyntaxError, UnicodeError, ValueError):
                parse_errors += 1
                continue
            parsed += 1
            for name in set(imported_modules(tree, source)):
                for target in module_paths(name, tracked):
                    if target != source:
                        edges.add((source, target))
        candidates = defaultdict(lambda: {"imported_by_delivered": set(), "imports_delivered": set()})
        for source, target in edges:
            if source in delivered and target not in delivered:
                candidates[target]["imported_by_delivered"].add(source)
            if target in delivered and source not in delivered:
                candidates[source]["imports_delivered"].add(target)
        items = []
        for path, links in sorted(candidates.items()):
            file = base / path
            if not file.is_file() or file.is_symlink():
                continue
            items.append({"path": path, "bytes": file.stat().st_size,
                          "imported_by_delivered": sorted(links["imported_by_delivered"]),
                          "imports_delivered": sorted(links["imports_delivered"])})
        rows.append({"ordinal": ordinal, "instance_id": row["instance_id"],
                     "repo": row["repo"], "base_commit": row["base_commit"],
                     "issue_sha256": row["issue_sha256"], "delivered_paths": row["delivered_paths"],
                     "tracked_files": len(tracked), "parsed_python_files": parsed,
                     "skipped_large_python_files": skipped_large, "parse_errors": parse_errors,
                     "resolved_edges": len(edges), "candidates": items})
    output = {"schema_version": "g02.r11-python-import-neighbors-exposed-seal/v1",
              "posture": "source-only-exposed-development-no-gold-dsh-or-score",
              "prior_seal_sha256": PRIOR_SEAL_SHA256,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "graph_rule": "direct resolved Python AST imports in tracked regular files <=262144 bytes; exact module paths under repository root, lib, or src; one-hop neighbors of ARE-delivered files",
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
