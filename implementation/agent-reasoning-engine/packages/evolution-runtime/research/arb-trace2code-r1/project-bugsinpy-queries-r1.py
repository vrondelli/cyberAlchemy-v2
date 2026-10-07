#!/usr/bin/env python3
"""Project only the frozen buggy logs to bounded, gold-blind queries."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import tarfile


FREEZE_SHA256 = "888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33"
PROJECTION_SHA256 = "d5e909aa9d2250e437bc5f9ad8b6c0845204ad9bbe86c1e465b2dccbe8fc350e"
ARCHIVE_SHA256 = "8b242a0a62b91002fedaff64e112ba8b761d15e805d4635098f51b173fff5548"
PREFIX = "BugsInPy-316b95e2353ecda832bad9b42f86fa7c2fcec8ac/"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def edge(raw: bytes) -> str:
    data = raw.decode("utf-8", errors="replace").encode("utf-8")
    if len(data) > 1024:
        value = data[:509].decode("utf-8", errors="ignore") + "\n...\n" + data[-509:].decode("utf-8", errors="ignore")
    else:
        value = data.decode("utf-8")
    value = value.strip()
    if not value or len(value.encode("utf-8")) > 1024:
        raise SystemExit("invalid edge query")
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("freeze", "projection-receipt", "archive", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.freeze) != FREEZE_SHA256 or \
            digest(args.projection_receipt) != PROJECTION_SHA256 or digest(args.archive) != ARCHIVE_SHA256:
        raise SystemExit("output exists or input drift")
    cohort = json.loads(args.freeze.read_text())["selected"]
    projected = json.loads(args.projection_receipt.read_text())
    identities = {row["case"]: row["commit"] for row in projected["records"]}
    rows = []
    with tarfile.open(args.archive, "r:gz") as archive:
        for item in cohort:
            repo, bugid, commit = item["repo"], item["bugid"], item["buggy_commit_id"]
            if identities.get(f"{repo}/{bugid}") != commit:
                raise SystemExit("source projection identity drift")
            path = PREFIX + f"projects/{repo}/bugs/{bugid}/bug_buggy.txt"
            member = archive.getmember(path)
            if not member.isfile() or member.size > 2_000_000:
                raise SystemExit("buggy log invalid")
            stream = archive.extractfile(member)
            if stream is None:
                raise SystemExit("buggy log missing")
            raw = stream.read()
            if hashlib.sha256(raw).hexdigest() != item["buggy_log_sha256"]:
                raise SystemExit("buggy log digest drift")
            query = edge(raw)
            rows.append({"id": f"{repo}/{bugid}", "repo": repo, "bugid": bugid,
                         "base_commit": commit, "query": query,
                         "query_sha256": hashlib.sha256(query.encode()).hexdigest(),
                         "query_bytes": len(query.encode())})
    if len(rows) != 24 or len({row["id"] for row in rows}) != 24:
        raise SystemExit("query denominator drift")
    args.output.mkdir(parents=True)
    path = args.output / "QUERIES.jsonl"
    path.write_text("".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n" for row in rows))
    seal = {"schema": "are.g01-bugsinpy-query-projection-r1/v1", "freeze_sha256": FREEZE_SHA256,
            "source_projection_receipt_sha256": PROJECTION_SHA256,
            "bugsinpy_archive_sha256": ARCHIVE_SHA256, "queries_sha256": digest(path),
            "cases": len(rows), "max_query_bytes": max(row["query_bytes"] for row in rows),
            "gold_opened": False, "fixed_output_opened": False}
    (args.output / "QUERY-SEAL.json").write_text(json.dumps(seal, indent=2, sort_keys=True) + "\n")
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
