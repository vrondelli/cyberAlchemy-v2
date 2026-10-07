#!/usr/bin/env python3
"""Freeze r80 partition and safely admit only the first 12 buggy sources."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SOURCE_SHA = "eef0efa22d78160613f20d09157b8dc0397bbd81f0a0277f613818cb2bb72002"
HEAD_SHA = "ead4a1778861534776133930fbe56b693851ce1f564bcf8d9e9b5bd877119204"
AUDITOR_SHA = "d02615241d8fdb6715e1de28dfb2c68e2e3f48de1e6e906a99879a758f30d987"
AUDITOR_PATH = Path(__file__).resolve().parents[1] / "g01-bears-transfer-r73/admit_source_r75.py"
MAX_COMPRESSED = 128 * 1024 * 1024


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def save_bytes_new(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def download(url):
    req = Request(url, method="GET", headers={"User-Agent": "ARE-G01-GitBug-r80/1"})
    try:
        with urlopen(req, timeout=120) as reply:
            return reply.status, reply.read(MAX_COMPRESSED + 1), reply.geturl(), None
    except HTTPError as error:
        return error.code, error.read(65536), error.geturl(), f"http-{error.code}"
    except (URLError, TimeoutError, OSError) as error:
        return None, b"", None, type(error).__name__


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--head", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.source.read_bytes()) != SOURCE_SHA or sha(args.head.read_bytes()) != HEAD_SHA:
        raise SystemExit("output-or-input-drift")
    if sha(AUDITOR_PATH.read_bytes()) != AUDITOR_SHA:
        raise SystemExit("auditor-drift")
    spec = importlib.util.spec_from_file_location("bears_r75_source_auditor", AUDITOR_PATH)
    auditor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(auditor)
    rows = json.loads(args.source.read_bytes())["rows"]
    heads = json.loads(args.head.read_bytes())["results"]
    if len(rows) != 53 or len(heads) != 53:
        raise SystemExit("population-drift")
    for row, head in zip(rows, heads, strict=True):
        if (row["ordinal"] != head["ordinal"] or row["repo"] != head["repo"]
                or row["buggy_commit"] != head["buggy_commit"]):
            raise SystemExit("head-binding-drift")
    args.output.mkdir(parents=True, mode=0o700)
    archive_root = args.output / "source-only-archives"
    archive_root.mkdir(mode=0o700)
    save_new(args.output / "PARTITION-FREEZE.json", {
        "schema_version": "are.g01-gitbug-r80-partition/v1",
        "source_sha256": SOURCE_SHA, "head_sha256": HEAD_SHA,
        "auditor_sha256": AUDITOR_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R80-DEV-SOURCE-PROTOCOL.md").read_bytes()),
        "development_ordinals": list(range(1, 13)),
        "intended_confirmation_ordinals": list(range(13, 37)),
        "source_order_replacement_ordinals": list(range(37, 54)),
        "max_compressed_bytes": MAX_COMPRESSED,
        "max_members": auditor.MAX_MEMBERS,
        "max_declared_bytes": auditor.MAX_DECLARED,
        "max_java_file_bytes": auditor.MAX_JAVA_FILE,
        "max_java_total_bytes": auditor.MAX_JAVA_TOTAL,
        "automatic_retries": 0, "gold_values_used": False,
        "model_calls": 0, "scores_computed": False})
    results = []
    for row, head in zip(rows[:12], heads[:12], strict=True):
        status, body, final_url, error = (None, b"", None, "head-not-200")
        audit = None
        if head["status"] == 200:
            status, body, final_url, error = download(head["url"])
            if status == 200 and error is None and final_url == head["url"]:
                audit, error = auditor.audit_archive(body, row["buggy_commit"])
            elif error is None:
                error = "status-or-redirect"
        accepted = audit is not None and error is None
        name = f"{row['ordinal']:02d}-{row['buggy_commit']}.tar.gz" if accepted else None
        if accepted:
            save_bytes_new(archive_root / name, body)
        result = {"ordinal": row["ordinal"], "repo": row["repo"],
                  "buggy_commit": row["buggy_commit"],
                  "head_status": head["status"], "get_status": status,
                  "get_bytes": len(body), "get_sha256": sha(body),
                  "accepted": accepted, "reason": error, "archive": name,
                  "audit": audit, "gold_values_used": False, "model_calls": 0}
        save_new(args.output / f"CASE-{row['ordinal']:02d}.json", result)
        results.append(result)
        print(json.dumps({"ordinal": row["ordinal"], "accepted": accepted,
                          "reason": error, "get_bytes": len(body)}), flush=True)
    save_new(args.output / "DEV-SOURCE-RESULT.json", {
        "schema_version": "are.g01-gitbug-r80-dev-source/v1",
        "attempted": len(results), "admitted": sum(x["accepted"] for x in results),
        "results": results, "gold_values_used": False, "model_calls": 0,
        "scores_computed": False})


if __name__ == "__main__":
    main()
