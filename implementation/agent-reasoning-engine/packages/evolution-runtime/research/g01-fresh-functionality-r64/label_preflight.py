#!/usr/bin/env python3
"""Evaluator-isolated old-side label preflight; no ranking or provider access."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

SOURCE_SHA = "877b040f027375c61af9e23666d3429a4af810e08fac29b359d63e7cd35be30e"
RAW_SHA = "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"
MAX_COMPARE = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save(path: Path, value: object) -> None:
    data = (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def fetch(url: str, method: str, limit: int) -> tuple[int, bytes, dict]:
    request = Request(url, method=method,
                      headers={"Accept": "application/vnd.github+json",
                               "User-Agent": "ARE-G01-r64-label-preflight/1"})
    try:
        with urlopen(request, timeout=40) as response:
            return response.status, response.read(limit + 1), dict(response.headers)
    except HTTPError as error:
        return error.code, error.read(min(limit, 65536)), dict(error.headers)
    except (URLError, TimeoutError):
        return 0, b"", {}


def source_path(value: object) -> bool:
    if not isinstance(value, str) or not value or "\\" in value:
        return False
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or ".git" in path.parts or not value.endswith(".py"):
        return False
    parts = [part.lower() for part in path.parts]
    base = parts[-1]
    return not (any(part in ("test", "tests", "testing", "testdata", "fixtures",
                             "examples", "docs") for part in parts[:-1])
                or base.startswith("test_") or base.endswith("_test.py"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--raw", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.source.read_bytes()) != SOURCE_SHA or sha(args.raw.read_bytes()) != RAW_SHA:
        raise SystemExit("output-exists-or-input-drift")
    source = json.loads(args.source.read_bytes())
    raw = {row["image_tag"]: row for row in json.loads(args.raw.read_bytes())}
    if source["attempted"] != 30 or source["exact_commit_available"] != 28 or len(raw) != 4388:
        raise SystemExit("population-drift")
    candidates = [row for row in source["results"] if row["exact"]]
    args.output.mkdir(parents=True, mode=0o700)
    save(args.output / "LABEL-FREEZE.json", {
        "schema_version": "are.g01-r64-label-freeze/v1", "source_result_sha256": SOURCE_SHA,
        "raw_sha256": RAW_SHA, "script_sha256": sha(Path(__file__).read_bytes()),
        "rule": "All 28 exact-source rows in source order; require complete GitHub compare from exact failed base to exact passed head, at least one non-test old-side Python source file, and every changed non-test Python source path present at failed commit",
        "automatic_retries": 0, "maximum_compare_requests": 28,
        "source_rankings_opened": False, "scores_computed": False,
        "gold_export_to_source_side": False, "model_calls": 0,
    })
    results = []
    for ordinal, case in enumerate(candidates, 1):
        meta = raw[case["image_tag"]]
        failed = case["failed_commit"]
        passed = meta["passed_job"]["trigger_sha"]
        if meta["repo"] != case["repo"] or meta["failed_job"]["trigger_sha"] != failed:
            raise SystemExit("case-identity-drift")
        url = (f"https://api.github.com/repos/{quote(case['repo'], safe='/')}/compare/"
               f"{quote(failed, safe='')}...{quote(passed, safe='')}")
        status, body, headers = fetch(url, "GET", MAX_COMPARE)
        document = None
        if status == 200 and len(body) <= MAX_COMPARE:
            try:
                document = json.loads(body)
            except ValueError:
                pass
        identity = bool(isinstance(document, dict) and
                        document.get("base_commit", {}).get("sha") == failed and
                        document.get("head_commit", {}).get("sha") == passed)
        files = document.get("files") if isinstance(document, dict) else None
        complete = identity and isinstance(files, list) and len(files) < 300 and not headers.get("Link")
        paths = []
        added_source = []
        old_missing = []
        if complete:
            for item in files:
                path = item.get("previous_filename", item.get("filename"))
                if not source_path(path):
                    continue
                if item.get("status") == "added":
                    added_source.append(path)
                    continue
                old_url = (f"https://raw.githubusercontent.com/{quote(case['repo'], safe='/')}/"
                           f"{quote(failed, safe='')}/{quote(path, safe='/')}")
                old_status, _, _ = fetch(old_url, "HEAD", 0)
                if old_status == 200:
                    paths.append(path)
                else:
                    old_missing.append({"path": path, "status": old_status})
        reason = None
        if not complete:
            reason = "compare-incomplete-or-diverged" if status == 200 else f"compare-http-{status}"
        elif added_source:
            reason = "added-source-file"
        elif old_missing:
            reason = "old-side-source-missing"
        elif not paths:
            reason = "no-old-side-source-label"
        result = {"ordinal": ordinal, "source_ordinal": case["ordinal"],
                  "image_tag": case["image_tag"], "repo": case["repo"],
                  "failed_commit": failed, "passed_commit": passed,
                  "compare_http_status": status, "compare_sha256": sha(body),
                  "compare_identity": identity, "complete_file_list": complete,
                  "changed_file_count": len(files) if isinstance(files, list) else None,
                  "source_gold_paths": sorted(set(paths)) if complete else None,
                  "added_source_paths": sorted(set(added_source)) if complete else None,
                  "old_source_missing": old_missing if complete else None,
                  "admissible": reason is None, "reason": reason,
                  "rate_remaining": headers.get("X-RateLimit-Remaining"),
                  "gold_export_to_source_side": False}
        save(args.output / f"LABEL-{ordinal:02d}.json", result)
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "admissible": result["admissible"],
                          "reason": reason, "rate_remaining": result["rate_remaining"]}), flush=True)
        if status == 403 and result["rate_remaining"] == "0":
            break
    save(args.output / "LABEL-RESULT.json", {
        "schema_version": "are.g01-r64-label-result/v1", "attempted": len(results),
        "admissible": sum(row["admissible"] for row in results),
        "unattempted_rate_limit": len(results) < len(candidates),
        "results": results, "source_rankings_opened": False,
        "scores_computed": False, "gold_export_to_source_side": False,
        "model_calls": 0,
    })


if __name__ == "__main__":
    main()
