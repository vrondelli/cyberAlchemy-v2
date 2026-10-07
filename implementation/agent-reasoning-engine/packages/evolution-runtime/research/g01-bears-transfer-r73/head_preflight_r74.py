#!/usr/bin/env python3
"""One-shot exact-commit codeload HEAD screen for Bears source order."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SOURCE_SHA = "b4a07e64c2cbe4fc018ce70efce5ad728945e88e9150ea8d5241b7c754f186b2"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def probe(row):
    url = f"https://codeload.github.com/{row['repo']}/tar.gz/{row['buggy_commit']}"
    request = Request(url, method="HEAD", headers={"User-Agent": "ARE-G01-Bears-r74/1"})
    try:
        with urlopen(request, timeout=30) as reply:
            return {"ordinal": row["ordinal"], "bug_id": row["bug_id"], "repo": row["repo"],
                    "buggy_commit": row["buggy_commit"], "url": url,
                    "status": reply.status, "final_url": reply.geturl(),
                    "content_length": reply.headers.get("Content-Length"), "error": None}
    except HTTPError as error:
        return {"ordinal": row["ordinal"], "bug_id": row["bug_id"], "repo": row["repo"],
                "buggy_commit": row["buggy_commit"], "url": url,
                "status": error.code, "final_url": error.geturl(),
                "content_length": error.headers.get("Content-Length"), "error": f"http-{error.code}"}
    except (URLError, TimeoutError, OSError) as error:
        return {"ordinal": row["ordinal"], "bug_id": row["bug_id"], "repo": row["repo"],
                "buggy_commit": row["buggy_commit"], "url": url,
                "status": None, "final_url": None, "content_length": None,
                "error": type(error).__name__}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.source.read_bytes()) != SOURCE_SHA:
        raise SystemExit("output-exists-or-source-drift")
    source = json.loads(args.source.read_bytes())
    rows = source["rows"]
    if len(rows) != 37 or source["gold_values_used"] or source["model_calls"]:
        raise SystemExit("source-shape-drift")
    args.output.mkdir(parents=True, mode=0o700)
    freeze = {"schema_version": "are.g01-bears-r74-head-freeze/v1", "cases": 37,
              "source_sha256": SOURCE_SHA,
              "protocol_sha256": sha(Path(__file__).with_name("R74-HEAD-PROTOCOL.md").read_bytes()),
              "script_sha256": sha(Path(__file__).read_bytes()),
              "max_workers": 4, "max_requests": 37, "automatic_retries": 0,
              "gold_values_used": False, "model_calls": 0}
    save(args.output / "HEAD-FREEZE.json", freeze)
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(probe, rows))
    if len(results) != 37 or any(row["ordinal"] != i for i, row in enumerate(results, 1)):
        raise SystemExit("response-order-drift")
    save(args.output / "HEAD-RESULT.json", {"schema_version": "are.g01-bears-r74-head-result/v1",
         "attempted": len(results), "status_200": sum(row["status"] == 200 for row in results),
         "results": results, "archive_bytes_admitted": 0,
         "gold_values_used": False, "model_calls": 0})
    print(json.dumps({"attempted": len(results),
                      "status_200": sum(row["status"] == 200 for row in results),
                      "other": [{"ordinal": row["ordinal"], "status": row["status"],
                                 "error": row["error"]} for row in results if row["status"] != 200]}))


if __name__ == "__main__":
    main()
