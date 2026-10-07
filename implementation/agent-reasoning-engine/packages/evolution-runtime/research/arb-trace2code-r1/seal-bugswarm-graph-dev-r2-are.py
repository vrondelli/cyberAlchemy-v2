#!/usr/bin/env python3
"""Seal all 24 source-only ARE baseline rankings before evaluator reads."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path


SOURCE_SHA = "201f4ba4d31d93dbfbff5f808307c079d46f4db2319cb40a4df08e7d0bb9bf51"
QUERIES_SHA = "9ccaeb5a21d3391f819eddb151a38cb3d2a287562abe1850df2a4cc8ab81a561"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--queries", required=True, type=Path)
    parser.add_argument("--rankings", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (sha(args.source.read_bytes()) != SOURCE_SHA
            or sha(args.queries.read_bytes()) != QUERIES_SHA
            or args.output.exists()):
        raise SystemExit("input-pin-drift-or-output-exists")
    source = json.loads(args.source.read_bytes())["records"]
    queries = [json.loads(line) for line in args.queries.read_text().splitlines()]
    if len(source) != len(queries) or len(source) != 24:
        raise SystemExit("denominator-drift")
    rankings = []
    for ordinal, (src, query) in enumerate(zip(source, queries), 1):
        path = args.rankings / f"ARE-RANKING-{ordinal:02d}.json"
        data = path.read_bytes()
        row = json.loads(data)
        paths = row["ranked_files"]
        if (row["ordinal"] != ordinal or src["ordinal"] != ordinal
                or row["id"] != query["id"] or row["id"] != src["image_tag"]
                or row["repo"] != src["repo"] or row["base_commit"] != src["commit"]
                or row["query_sha256"] != query["query_sha256"]
                or len(paths) != src["projected_files"]
                or len(paths) != len(set(paths)) or row["candidate_count"] != len(paths)
                or row["indexed_bytes"] != src["projected_bytes"]
                or row["gold_opened"] is not False or row["model_calls"] != 0):
            raise SystemExit("ranking-identity-or-coverage-drift:" + str(ordinal))
        rankings.append({"ordinal": ordinal, "id": row["id"],
                         "ranking_sha256": sha(data),
                         "candidate_count": len(paths),
                         "ranker_elapsed_ms": row["ranker_elapsed_ms"]})
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-are-seal-r2/v1",
               "source_sha256": SOURCE_SHA, "queries_sha256": QUERIES_SHA,
               "script_sha256": sha(Path(__file__).read_bytes()),
               "gold_opened": False, "reserved_confirmation_opened": False,
               "model_calls": 0, "rankings": rankings}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"rankings": len(rankings), "seal_sha256": sha(data),
                      "total_ranker_elapsed_ms": sum(row["ranker_elapsed_ms"]
                                                     for row in rankings)}))


if __name__ == "__main__":
    main()
