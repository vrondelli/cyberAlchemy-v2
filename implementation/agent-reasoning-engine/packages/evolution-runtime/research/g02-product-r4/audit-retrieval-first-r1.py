#!/usr/bin/env python3
"""Replay a sealed exposed G02 retrieval probe, then tally file labels separately."""

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path


UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
EXPECTED_SEAL_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("ranker", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != EXPECTED_SEAL_SHA256:
        raise SystemExit("seal hash mismatch")
    sealed = json.loads(args.seal.read_text())
    if sealed["schema_version"] != "g02.retrieval-first-exposed-seal/v1":
        raise SystemExit("seal schema mismatch")
    if sha(args.ranker) != sealed["script_sha256"]:
        raise SystemExit("ranker hash mismatch")
    rows = sealed["results"]
    if len(rows) != 12 or len({r["instance_id"] for r in rows}) != 12:
        raise SystemExit("unexpected r3 denominator")
    for row in rows:
        if row["posture"] != "source-only-exposed-development-no-score":
            raise SystemExit("unexpected posture")
        if any("gold" in key or "score_file" in key for key in row):
            raise SystemExit("evaluator data in source-only row")
        replay = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), row["pair_root"]], text=True))
        if replay != row:
            raise SystemExit(f"source-only replay mismatch: {row['instance_id']}")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    counts = ("gold", "undelivered", "raw10", "structured10", "raw30",
              "structured30", "raw_new30", "structured_new30",
              "raw_false30", "structured_false30")
    results = []
    for row in rows:
        gold = set(loader.get(row["instance_id"]).files())
        delivered = set(row["delivered_paths"])
        raw = [item["path"] for item in row["raw_top30"]]
        structured = [item["path"] for item in row["structured_top30"]]
        if len(raw) != len(set(raw)) or len(structured) != len(set(structured)):
            raise SystemExit("duplicate retrieval path")
        results.append({
            "repo": row["pair_root"].split("/g02-cross-layer-pr3-")[-1].split("-")[0],
            "id": row["instance_id"].split("__")[-1],
            "gold": len(gold),
            "undelivered": len(gold - delivered),
            "raw10": len(gold & set(raw[:10])),
            "structured10": len(gold & set(structured[:10])),
            "raw30": len(gold & set(raw)),
            "structured30": len(gold & set(structured)),
            "raw_new30": len((gold - delivered) & set(raw)),
            "structured_new30": len((gold - delivered) & set(structured)),
            "raw_false30": len(set(raw) - gold),
            "structured_false30": len(set(structured) - gold),
        })
    print(json.dumps({
        "schema_version": "g02.retrieval-first-exposed-audit/v1",
        "posture": "exposed-development-only-no-native-score-or-superiority",
        "seal_sha256": EXPECTED_SEAL_SHA256,
        "ranker_sha256": sealed["script_sha256"],
        "replay": "12/12 exact source-only rows",
        "rows": results,
        "totals": {key: sum(row[key] for row in results) for key in counts},
    }, sort_keys=True))


if __name__ == "__main__":
    main()
