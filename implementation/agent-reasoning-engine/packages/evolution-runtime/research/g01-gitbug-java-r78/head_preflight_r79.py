#!/usr/bin/env python3
"""One-shot original buggy-commit HEAD screen for r78b supply."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SOURCE_SHA = "eef0efa22d78160613f20d09157b8dc0397bbd81f0a0277f613818cb2bb72002"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_new(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def probe(row):
    url = f"https://codeload.github.com/{row['repo']}/tar.gz/{row['buggy_commit']}"
    request = Request(url, method="HEAD", headers={"User-Agent": "ARE-G01-GitBug-r79/1"})
    record = {"ordinal": row["ordinal"], "repo": row["repo"],
              "buggy_commit": row["buggy_commit"], "url": url}
    try:
        with urlopen(request, timeout=30) as reply:
            return {**record, "status": reply.status, "final_url": reply.geturl(),
                    "content_length": reply.headers.get("Content-Length"), "error": None}
    except HTTPError as error:
        return {**record, "status": error.code, "final_url": error.geturl(),
                "content_length": error.headers.get("Content-Length"),
                "error": f"http-{error.code}"}
    except (URLError, TimeoutError, OSError) as error:
        return {**record, "status": None, "final_url": None,
                "content_length": None, "error": type(error).__name__}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or digest(args.source) != SOURCE_SHA:
        raise SystemExit("output-exists-or-source-drift")
    source = json.loads(args.source.read_bytes())
    rows = source["rows"]
    if (len(rows) != 53 or source["gold_values_used"]
            or source["model_calls"] or source["scores_computed"]):
        raise SystemExit("source-shape-drift")
    args.output.mkdir(mode=0o700, parents=True)
    save_new(args.output / "HEAD-FREEZE.json", {
        "schema_version": "are.g01-gitbug-r79-head-freeze/v1", "cases": 53,
        "source_sha256": SOURCE_SHA,
        "protocol_sha256": digest(Path(__file__).with_name("HEAD-PROTOCOL.md")),
        "script_sha256": digest(Path(__file__)), "max_workers": 4,
        "max_requests": 53, "automatic_retries": 0,
        "gold_values_used": False, "model_calls": 0})
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(probe, rows))
    if len(results) != 53 or any(x["ordinal"] != i for i, x in enumerate(results, 1)):
        raise SystemExit("response-order-drift")
    save_new(args.output / "HEAD-RESULT.json", {
        "schema_version": "are.g01-gitbug-r79-head-result/v1",
        "attempted": len(results),
        "status_200": sum(x["status"] == 200 for x in results),
        "results": results, "archive_bytes_admitted": 0,
        "gold_values_used": False, "model_calls": 0})
    print(json.dumps({"attempted": len(results),
                      "status_200": sum(x["status"] == 200 for x in results),
                      "other": [{"ordinal": x["ordinal"], "status": x["status"],
                                 "error": x["error"]} for x in results
                                if x["status"] != 200]}))


if __name__ == "__main__":
    main()
