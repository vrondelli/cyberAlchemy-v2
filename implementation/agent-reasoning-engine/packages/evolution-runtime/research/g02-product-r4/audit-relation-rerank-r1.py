#!/usr/bin/env python3
"""Replay sealed exposed G02 relation reranking and tally evaluator file labels."""

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path


UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
SOURCE_SEAL_SHA = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
RERANK_SEAL_SHA = "2c991cab39eca22e1f5e2a4d468a529e53b0b79bc8952795c4dcfac5f7ff2761"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source_seal", type=Path)
    parser.add_argument("rerank_seal", type=Path)
    parser.add_argument("reranker", type=Path)
    args = parser.parse_args()
    if sha(args.source_seal) != SOURCE_SEAL_SHA or sha(args.rerank_seal) != RERANK_SEAL_SHA:
        raise SystemExit("seal hash mismatch")
    sealed = json.loads(args.rerank_seal.read_text())
    if sha(args.reranker) != sealed["script_sha256"]:
        raise SystemExit("reranker hash mismatch")
    replay = json.loads(subprocess.check_output(
        [sys.executable, str(args.reranker), str(args.source_seal)], text=True))
    for key in ("rows", "posture", "input_seal_sha256"):
        if replay[key] != sealed[key]:
            raise SystemExit(f"source-only replay mismatch: {key}")
    rows = sealed["rows"]
    if len(rows) != 12 or len({row["instance_id"] for row in rows}) != 12:
        raise SystemExit("unexpected denominator")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    output = []
    for row in rows:
        gold = set(loader.get(row["instance_id"]).files())
        raw = set(row["raw_undelivered_top10"])
        related = {item["path"] for item in row["relation_undelivered_top10"]}
        if len(raw) != len(row["raw_undelivered_top10"]) or len(related) != len(row["relation_undelivered_top10"]):
            raise SystemExit("duplicate path")
        output.append({
            "id": row["instance_id"].split("__")[-1],
            "repo": row["pair_root"].split("/g02-cross-layer-pr3-")[-1].split("-")[0],
            "raw_hits": len(raw & gold),
            "relation_hits": len(related & gold),
            "raw_false": len(raw - gold),
            "relation_false": len(related - gold),
            "relation_imports": sum(item["signals"]["direct_import"]
                                    for item in row["relation_undelivered_top10"]),
        })
    fields = ("raw_hits", "relation_hits", "raw_false", "relation_false", "relation_imports")
    print(json.dumps({
        "schema_version": "g02.relation-rerank-exposed-audit/v1",
        "posture": "exposed-development-only-no-native-score-or-superiority",
        "source_seal_sha256": SOURCE_SEAL_SHA,
        "rerank_seal_sha256": RERANK_SEAL_SHA,
        "reranker_sha256": sealed["script_sha256"],
        "replay": "12/12 exact source-only rows",
        "rows": output,
        "totals": {field: sum(row[field] for row in output) for field in fields},
    }, sort_keys=True))


if __name__ == "__main__":
    main()
