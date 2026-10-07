#!/usr/bin/env python3
"""Extract bounded existing-source path hints from full public buggy logs, no gold."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import re
import tarfile


ARCHIVE_SHA256 = "8b242a0a62b91002fedaff64e112ba8b761d15e805d4635098f51b173fff5548"
PREFIX = "BugsInPy-316b95e2353ecda832bad9b42f86fa7c2fcec8ac/"
PATH_RE = re.compile(r"(?<![A-Za-z0-9_])[/A-Za-z0-9_.\\-]+\.py\b")


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def is_test_path(path: str) -> bool:
    parts = pathlib.PurePosixPath(path).parts
    return any(part in {"test", "tests", "testing"} for part in parts) or \
        parts[-1].startswith("test_") or parts[-1].endswith("_test.py")


def hints(log: str, universe: list[str]) -> list[dict]:
    by_basename: dict[str, list[str]] = collections.defaultdict(list)
    for path in universe:
        if path.endswith(".py") and not is_test_path(path):
            by_basename[pathlib.PurePosixPath(path).name].append(path)
    occurrences: dict[str, list[int]] = collections.defaultdict(list)
    for match in PATH_RE.finditer(log):
        token = match.group().replace("\\", "/")
        basename = pathlib.PurePosixPath(token).name
        options = by_basename.get(basename, [])
        if not options:
            continue
        exact_suffix = [path for path in options if token.endswith(path) or path.endswith(token)]
        if exact_suffix:
            length = max(len(path) for path in exact_suffix)
            resolved = [path for path in exact_suffix if len(path) == length]
        else:
            resolved = options if len(options) == 1 else []
        if len(resolved) == 1:
            occurrences[resolved[0]].append(match.start())
    ranked = sorted(occurrences, key=lambda path: (-len(occurrences[path]),
                                                   min(occurrences[path]), path))
    return [{"path": path, "mentions": len(occurrences[path]),
             "first_offset": min(occurrences[path])} for path in ranked[:4]]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("archive", "freeze", "are-rankings", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.archive) != ARCHIVE_SHA256:
        raise SystemExit("output exists or archive drift")
    cohort = json.loads(args.freeze.read_text())["selected"]
    ranked = {row["id"]: row for row in
              (json.loads(line) for line in args.are_rankings.read_text().splitlines())}
    if len(cohort) != len(ranked) or len(cohort) < 1:
        raise SystemExit("cohort denominator drift")
    output = []
    with tarfile.open(args.archive, "r:gz") as archive:
        for item in cohort:
            case = f"{item['repo']}/{item['bugid']}"
            base = ranked[case]
            if item["buggy_commit_id"] != base["base_commit"]:
                raise SystemExit("commit drift")
            name = PREFIX + f"projects/{item['repo']}/bugs/{item['bugid']}/bug_buggy.txt"
            stream = archive.extractfile(name)
            if stream is None:
                raise SystemExit("missing buggy log")
            raw = stream.read()
            if hashlib.sha256(raw).hexdigest() != item["buggy_log_sha256"]:
                raise SystemExit("buggy log digest drift")
            found = hints(raw.decode("utf-8", errors="replace"), base["ranked_files"])
            output.append({"id": case, "repo": item["repo"],
                           "base_commit": item["buggy_commit_id"],
                           "hints": found, "hint_count": len(found)})
    args.output.mkdir(parents=True)
    path = args.output / "LOG-PATH-HINTS.jsonl"
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output))
    seal = {"schema": "are.g01-bugsinpy-log-path-hints-r1/v1",
            "status": "source-only-before-evaluator-join",
            "archive_sha256": ARCHIVE_SHA256, "freeze_sha256": digest(args.freeze),
            "are_rankings_sha256": digest(args.are_rankings),
            "hints_sha256": digest(path), "cases": len(output),
            "cases_with_hints": sum(bool(row["hints"]) for row in output),
            "gold_opened": False, "model_calls": 0}
    (args.output / "SOURCE-SEAL.json").write_text(json.dumps(seal, indent=2, sort_keys=True) + "\n")
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
