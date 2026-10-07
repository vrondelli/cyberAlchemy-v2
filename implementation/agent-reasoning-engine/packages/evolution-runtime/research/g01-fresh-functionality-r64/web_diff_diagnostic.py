#!/usr/bin/env python3
"""r65 provisional web-diff old-side screen after r64 API parser failure."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shlex
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

SOURCE_SHA = "877b040f027375c61af9e23666d3429a4af810e08fac29b359d63e7cd35be30e"
RAW_SHA = "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"
R64_FAILED_SHA = None  # Evaluator diagnostic only; r64 is not repaired.
MAX_DIFF = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_once(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def save(path: Path, value: object) -> None:
    write_once(path, (json.dumps(value, sort_keys=True, indent=2) + "\n").encode())


def fetch(url: str, method: str, limit: int) -> tuple[int, bytes, str]:
    request = Request(url, method=method, headers={"User-Agent": "ARE-G01-r65-web-diff/1"})
    try:
        with urlopen(request, timeout=45) as response:
            return response.status, response.read(limit + 1), response.geturl()
    except HTTPError as error:
        return error.code, error.read(min(limit, 65536)), error.geturl()
    except (URLError, TimeoutError):
        return 0, b"", url


def source_path(path: str) -> bool:
    if not path or path.startswith("/") or "\\" in path or ".." in path.split("/"):
        return False
    parts = [part.lower() for part in path.split("/")]
    base = parts[-1]
    return path.endswith(".py") and not (
        any(part in ("test", "tests", "testing", "testdata", "fixtures", "examples", "docs")
            for part in parts[:-1]) or base.startswith("test_") or base.endswith("_test.py"))


def parse_paths(body: bytes) -> tuple[list[str], list[str], bool]:
    try:
        lines = body.decode("utf-8", errors="strict").splitlines()
    except UnicodeDecodeError:
        return [], [], False
    changed, added = [], []
    current = None
    is_added = False

    def finish() -> None:
        if current and source_path(current):
            (added if is_added else changed).append(current)

    for line in lines:
        if line.startswith("diff --git "):
            finish()
            current = None
            is_added = False
            try:
                tokens = shlex.split(line[len("diff --git "):])
            except ValueError:
                return [], [], False
            if len(tokens) != 2 or not tokens[0].startswith("a/") or not tokens[1].startswith("b/"):
                return [], [], False
            current = tokens[0][2:]
        elif line.startswith("new file mode ") or line == "--- /dev/null":
            is_added = True
        elif line.startswith("rename from "):
            current = line[len("rename from "):]
    finish()
    return sorted(set(changed)), sorted(set(added)), True


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
    candidates = [row for row in source["results"] if row["exact"]]
    if len(candidates) != 28 or len(raw) != 4388:
        raise SystemExit("population-drift")
    args.output.mkdir(parents=True, mode=0o700)
    save(args.output / "WEB-DIFF-FREEZE.json", {
        "schema_version": "are.g01-r65-web-diff-freeze/v1",
        "source_result_sha256": SOURCE_SHA, "raw_sha256": RAW_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "purpose": "Provisional label-supply diagnostic after r64 GitHub API head_commit parser error; cannot repair r64 or establish direct-tree gold",
        "rule": "Fetch exact two-dot GitHub web .diff, parse old-side non-test Python files; require all such paths exist at exact failed commit; reject added Python source",
        "automatic_retries": 0, "maximum_diff_requests": 28,
        "gold_export_to_source_side": False, "scores_computed": False, "model_calls": 0,
    })
    results = []
    for ordinal, case in enumerate(candidates, 1):
        failed = case["failed_commit"]
        passed = raw[case["image_tag"]]["passed_job"]["trigger_sha"]
        url = (f"https://github.com/{quote(case['repo'], safe='/')}/compare/"
               f"{quote(failed, safe='')}..{quote(passed, safe='')}.diff")
        status, body, final_url = fetch(url, "GET", MAX_DIFF)
        if status == 200 and len(body) <= MAX_DIFF:
            write_once(args.output / f"WEB-DIFF-{ordinal:02d}.diff", body)
        paths, added, parsed = parse_paths(body) if status == 200 and len(body) <= MAX_DIFF else ([], [], False)
        missing = []
        for path in paths:
            old_url = (f"https://raw.githubusercontent.com/{quote(case['repo'], safe='/')}/"
                       f"{quote(failed, safe='')}/{quote(path, safe='/')}")
            old_status, _, _ = fetch(old_url, "HEAD", 0)
            if old_status != 200:
                missing.append({"path": path, "status": old_status})
        admissible = status == 200 and parsed and bool(paths) and not added and not missing
        result = {"ordinal": ordinal, "source_ordinal": case["ordinal"],
                  "image_tag": case["image_tag"], "repo": case["repo"],
                  "failed_commit": failed, "passed_commit": passed,
                  "status": status, "diff_sha256": sha(body), "final_url": final_url,
                  "parsed": parsed, "old_source_paths": paths, "added_source_paths": added,
                  "missing_old_source": missing, "provisionally_admissible": admissible,
                  "claim_ceiling": "Web-diff supply diagnostic only; direct exact-tree verification still required"}
        save(args.output / f"DIAGNOSTIC-{ordinal:02d}.json", result)
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "status": status, "parsed": parsed,
                          "provisionally_admissible": admissible,
                          "old_source_count": len(paths)}), flush=True)
    save(args.output / "WEB-DIFF-RESULT.json", {
        "schema_version": "are.g01-r65-web-diff-result/v1", "attempted": len(results),
        "provisionally_admissible": sum(row["provisionally_admissible"] for row in results),
        "results": results, "claim_ceiling": "Provisional old-side web-diff supply only; not final label admission, ranking, or superiority",
        "gold_export_to_source_side": False, "scores_computed": False, "model_calls": 0,
    })


if __name__ == "__main__":
    main()
