#!/usr/bin/env python3
"""Seal the prospectively selected BugSwarm transfer campaign before ranking."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path


EXPECTED = {
    "candidate": "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d",
    "source": "29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818",
    "query_seal": "0470c4aa7119b269a7150c0fa6a14567709605dc4d02a025823f87d797895995",
    "queries": "4dafeef345483b050df368efc6f3ec636b0b1bca5681950c08ab5da5846ce8e3",
    "gold": "962da35d492866ce6e587f82863ce6fda7969645be0b615ab07c8b315df957f8",
    "gold_projection": "46ee78cabe65f4df304971fdab3640e0141aa6c5a87b2b0cc22a122a47f9c524",
    "protocol": "8929d29cac3c03ccb9fb0a9344a9a227f4a0dc3558d8d5b6c1502e4ff671430b",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for key in EXPECTED:
        parser.add_argument("--" + key.replace("_", "-"), type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("freeze-output-exists")
    for key, expected in EXPECTED.items():
        if digest(getattr(args, key)) != expected:
            raise SystemExit("input-pin-drift:" + key)
    candidate = json.loads(args.candidate.read_bytes())["selected"]
    source = json.loads(args.source.read_bytes())["records"]
    query_seal = json.loads(args.query_seal.read_bytes())
    queries = [json.loads(line) for line in args.queries.read_text().splitlines()]
    gold = json.loads(args.gold.read_bytes())["results"]
    gold_projection = json.loads(args.gold_projection.read_bytes())["results"]
    if not all(len(rows) == 24 for rows in (candidate, source, queries, gold, gold_projection)):
        raise SystemExit("denominator-drift")
    if query_seal["cases"] != 24 or query_seal["queries_sha256"] != EXPECTED["queries"]:
        raise SystemExit("query-seal-drift")
    for index, (case, src, query, label, projected) in enumerate(
            zip(candidate, source, queries, gold, gold_projection), 1):
        if (case["ordinal"] != index or src["ordinal"] != index
                or label["ordinal"] != index or projected["ordinal"] != index
                or case["image_tag"] != src["image_tag"] != query["id"]
                or case["repo"] != src["repo"] != query["repo"]
                or case["failure_commit"] != src["commit"] != query["base_commit"]
                or not label["gold_admissible"] or not projected["all_projected"]):
            raise SystemExit("case-identity-or-gold-drift:" + str(index))
    frozen = {"schema_version": "are.g01-bugswarm-transfer-r1-freeze/v1",
              "status": "pre-ranking-pre-provider-pre-score",
              "pins": EXPECTED,
              "cases": 24, "repositories": 24,
              "languages": {"Python": 12, "Java": 12},
              "case_ids": [row["image_tag"] for row in candidate],
              "source_side_exported_gold": False,
              "model_calls": 0,
              "claim_ceiling": "Private provisional trace-to-code transfer only; HTTP log/diff provenance unresolved; no ContextBench, official RepoMap, live ARE, cost, or product superiority claim."}
    encoded = (json.dumps(frozen, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": 24, "repositories": 24,
                      "freeze_sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
