#!/usr/bin/env python3
"""Independent r67 direct-blob label admission from pinned r66 archives."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import tarfile

R66_SHA = "ec41ccd36f719d642e5e57c8d762d4281d32e1ab525a087492ab1ea786082bac"
MAX_FILE = 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()


def write_once(path: Path, data: object) -> None:
    encoded = (json.dumps(data, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)


def code_path(path: str) -> bool:
    parts = PurePosixPath(path).parts
    if not parts or path.startswith("/") or ".." in parts or ".git" in parts or not path.endswith(".py"):
        return False
    lowered = [part.lower() for part in parts]
    base = lowered[-1]
    return not (any(part in ("test", "tests", "testing", "testdata", "fixtures", "examples", "docs")
                    for part in lowered[:-1]) or base.startswith("test_") or base.endswith("_test.py"))


def read_tree(path: Path, commit: str) -> tuple[dict[str, str], int, str | None]:
    blobs, total, root = {}, 0, None
    try:
        with tarfile.open(path, "r:gz") as archive:
            for entry in archive:
                pieces = PurePosixPath(entry.name).parts
                if not pieces or entry.name.startswith("/") or ".." in pieces:
                    return {}, 0, "unsafe-path"
                if root is None:
                    root = pieces[0]
                    if not root.endswith(commit):
                        return {}, 0, "root-commit-mismatch"
                if pieces[0] != root:
                    return {}, 0, "mixed-roots"
                if not entry.isfile():
                    continue
                relative = "/".join(pieces[1:])
                if not relative.endswith(".py"):
                    continue
                if entry.size > MAX_FILE:
                    return {}, 0, "file-too-large"
                total += entry.size
                if total > MAX_TOTAL:
                    return {}, total, "projection-too-large"
                stream = archive.extractfile(entry)
                if stream is None:
                    return {}, total, "unreadable-member"
                content = stream.read(MAX_FILE + 1)
                if len(content) != entry.size or relative in blobs:
                    return {}, total, "file-invalid-or-duplicate"
                blobs[relative] = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
    except (tarfile.TarError, OSError, EOFError):
        return {}, 0, "bad-archive"
    return blobs, total, None if blobs else "empty-python-tree"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--r66", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    receipt = args.r66 / "EVALUATOR-RESULT.json"
    if args.output.exists() or digest(receipt) != R66_SHA:
        raise SystemExit("output-exists-or-r66-drift")
    prior = json.loads(receipt.read_bytes())
    if prior["attempted"] != 26 or len(prior["results"]) != 26:
        raise SystemExit("r66-denominator-drift")
    args.output.mkdir(mode=0o700, parents=True)
    write_once(args.output / "R67-FREEZE.json", {
        "schema_version": "are.g01-r67-direct-label-freeze/v1",
        "r66_result_sha256": R66_SHA,
        "protocol_sha256": digest(Path(__file__).with_name("R67-DIRECT-LABEL-PROTOCOL.md")),
        "script_sha256": digest(Path(__file__)),
        "cases": 26, "network_calls": 0, "model_calls": 0,
        "rankings_opened": False, "scores_computed": False,
        "gold_export_to_source_side": False,
    })
    rows = []
    for ordinal, case in enumerate(prior["results"], 1):
        if case["ordinal"] != ordinal:
            raise SystemExit("r66-order-drift")
        tree = {}
        summaries = {}
        for side, commit, dirname in (("failed", case["failed_commit"], "source-only-failed-archives"),
                                      ("passed", case["passed_commit"], "evaluator-only-passed-archives")):
            path = args.r66 / dirname / f"{ordinal:02d}-{commit}.tar.gz"
            expected = case["archives"][side]["archive_sha256"]
            if not expected or digest(path) != expected:
                raise SystemExit(f"archive-drift-{ordinal}-{side}")
            tree[side], size, error = read_tree(path, commit)
            summaries[side] = {"sha256": expected, "python_files": len(tree[side]),
                               "python_bytes": size, "error": error}
        changed = sorted(path for path, oid in tree["failed"].items()
                         if code_path(path) and tree["passed"].get(path) != oid)
        added = sorted(path for path in tree["passed"] if code_path(path) and path not in tree["failed"])
        reason = next((summaries[side]["error"] for side in ("failed", "passed")
                       if summaries[side]["error"]), None)
        if reason is None and (not 1 <= len(changed) <= 3 or added):
            reason = "direct-tree-label-shape"
        row = {"ordinal": ordinal, "image_tag": case["image_tag"], "repo": case["repo"],
               "failed_commit": case["failed_commit"], "passed_commit": case["passed_commit"],
               "direct_old_source_paths": changed, "direct_added_source_paths": added,
               "web_diff_old_source_paths": case["web_diff_old_source_paths"],
               "web_diff_equal": changed == case["web_diff_old_source_paths"],
               "archives": summaries, "admissible": reason is None, "reason": reason,
               "gold_export_to_source_side": False}
        write_once(args.output / f"R67-LABEL-{ordinal:02d}.json", row)
        rows.append(row)
        print(json.dumps({"ordinal": ordinal, "admissible": row["admissible"],
                          "web_diff_equal": row["web_diff_equal"]}), flush=True)
    selected = [row for row in rows if row["admissible"]][:24]
    write_once(args.output / "R67-EVALUATOR-RESULT.json", {
        "schema_version": "are.g01-r67-direct-label-result/v1", "attempted": 26,
        "admissible": sum(row["admissible"] for row in rows),
        "web_diff_mismatches": sum(not row["web_diff_equal"] for row in rows),
        "selected_24": len(selected) == 24,
        "selected_original_ordinals": [row["ordinal"] for row in selected],
        "results": rows, "network_calls": 0, "model_calls": 0,
        "rankings_opened": False, "scores_computed": False,
        "gold_export_to_source_side": False,
    })
    if len(selected) == 24:
        write_once(args.output / "R67-SOURCE-COHORT.json", {
            "schema_version": "are.g01-r67-source-cohort/v1", "cases": 24,
            "rows": [{"ordinal": ordinal, "image_tag": row["image_tag"],
                      "repo": row["repo"], "failed_commit": row["failed_commit"],
                      "failed_archive_sha256": row["archives"]["failed"]["sha256"],
                      "failed_archive": str(args.r66 / "source-only-failed-archives" /
                                            f"{row['ordinal']:02d}-{row['failed_commit']}.tar.gz")}
                     for ordinal, row in enumerate(selected, 1)],
            "gold_paths_opened": False, "passing_content_opened": False,
            "model_calls": 0,
        })


if __name__ == "__main__":
    main()
