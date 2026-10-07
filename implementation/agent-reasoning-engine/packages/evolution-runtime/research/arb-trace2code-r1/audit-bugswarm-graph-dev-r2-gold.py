#!/usr/bin/env python3
"""Evaluator-only patch-path admission for sealed graph development r2."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


CANDIDATE_SHA = "c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332"
RAW_SHA = "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"
MAX_DIFF_BYTES = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(url: str, limit: int, method: str = "GET") -> tuple[int, bytes]:
    try:
        with urlopen(Request(url, method=method,
                             headers={"User-Agent": "ARE-G01-graph-dev-gold-audit/2"}),
                     timeout=30) as response:
            return response.status, response.read(limit + 1)
    except HTTPError as error:
        return error.code, b""
    except (URLError, TimeoutError):
        return 0, b""


def safe_source_path(value: object, language: str) -> bool:
    if not isinstance(value, str) or not value or value.startswith("/") or "\\" in value:
        return False
    parts = PurePosixPath(value).parts
    if any(part in (".", "..") for part in parts):
        return False
    if not value.endswith(".py" if language == "Python" else ".java"):
        return False
    lower = [part.lower() for part in parts]
    base = lower[-1]
    return not (any(part in ("test", "tests", "testing", "testdata", "fixtures",
                             "examples", "docs") for part in lower[:-1])
                or base.startswith("test_") or base.endswith("_test.py")
                or base.endswith("test.java") or base.endswith("tests.java"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", required=True, type=Path)
    parser.add_argument("--raw", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    if (sha(args.candidate.read_bytes()) != CANDIDATE_SHA
            or sha(args.raw.read_bytes()) != RAW_SHA or not args.output_dir.is_dir()):
        raise SystemExit("input-pin-drift-or-output-dir-missing")
    candidate = json.loads(args.candidate.read_bytes())
    cases = candidate["development"]
    raw = {row["image_tag"]: row for row in json.loads(args.raw.read_bytes())}
    if len(cases) != 24 or len(raw) != 4388:
        raise SystemExit("denominator-drift")
    results = []
    last_request = 0.0
    for ordinal, row in enumerate(cases, 1):
        tag = row["image_tag"]
        meta = raw[tag]
        if (meta["repo"] != row["repo"] or meta["lang"] != row["language"]
                or meta["failed_job"]["trigger_sha"] != row["failure_commit"]):
            raise SystemExit("candidate-raw-identity-drift")
        wait = 4.1 - (time.monotonic() - last_request)
        if wait > 0:
            time.sleep(wait)
        last_request = time.monotonic()
        status, body = fetch("http://www.api.bugswarm.org/v1/diffs/" +
                             quote(tag, safe=""), MAX_DIFF_BYTES)
        diff_identity, patches = False, []
        if status == 200 and len(body) <= MAX_DIFF_BYTES:
            try:
                data = json.loads(body)
                diff_identity = (data.get("image_tag") == tag
                                 and data.get("failed_sha") == row["failure_commit"]
                                 and data.get("passed_sha") == meta["passed_job"]["trigger_sha"]
                                 and isinstance(data.get("patches"), list))
                if diff_identity:
                    target = args.output_dir / f"HTTP-PROVISIONAL-DIFF-{ordinal:02d}.json"
                    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                    with os.fdopen(fd, "wb") as stream:
                        stream.write(body)
                    patches = data["patches"]
            except (ValueError, AttributeError, KeyError):
                pass
        gold = []
        for patch in patches:
            path = patch.get("old_file")
            if not safe_source_path(path, row["language"]):
                continue
            url = ("https://raw.githubusercontent.com/" + row["repo"] + "/"
                   + row["failure_commit"] + "/" + quote(path, safe="/"))
            source_status, _ = fetch(url, 0, "HEAD")
            gold.append({"path": path, "failed_source_status": source_status})
        valid = diff_identity and bool(gold) and all(
            item["failed_source_status"] == 200 for item in gold)
        results.append({"ordinal": ordinal, "image_tag": tag, "repo": row["repo"],
                        "language": row["language"], "diff_http_status": status,
                        "diff_identity": diff_identity, "all_patch_files": len(patches),
                        "source_gold_paths": gold, "gold_admissible": valid,
                        "diff_sha256": sha(body) if diff_identity else None})
        print(json.dumps({"ordinal": ordinal, "diff_identity": diff_identity,
                          "source_gold_paths": len(gold), "gold_admissible": valid}),
              flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-gold-audit-r2/v1",
               "candidate_sha256": CANDIDATE_SHA, "raw_sha256": RAW_SHA,
               "script_sha256": sha(Path(__file__).read_bytes()),
               "gold_provenance": "BugSwarm unauthenticated HTTP diff API; provisional transport",
               "failed_source_path_provenance": "GitHub HTTPS raw HEAD at exact failed commit",
               "source_side_exported_gold": False, "reserved_confirmation_opened": False,
               "model_calls": 0, "results": results}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    target = args.output_dir / "DEV-GOLD-AUDIT-R2.json"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"receipt_sha256": sha(data),
                      "gold_admissible": sum(row["gold_admissible"] for row in results)}),
          flush=True)


if __name__ == "__main__":
    main()
