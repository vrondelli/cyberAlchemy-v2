#!/usr/bin/env python3
"""Evaluator-only label audit of a sealed G02 direct-import graph probe."""

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


RANKING_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source_seal", type=Path)
    parser.add_argument("source_script", type=Path)
    parser.add_argument("ranking_seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    source = json.loads(args.source_seal.read_text())
    ranking = json.loads(args.ranking_seal.read_text())
    if source.get("schema_version") != "g02.direct-import-graph-source-seal/v1" or \
            source.get("posture") != "source-only-exposed-development-no-gold-or-native-score-opened" or \
            sha(args.ranking_seal) != RANKING_SHA256 or \
            source.get("ranking_seal_sha256") != RANKING_SHA256 or \
            sha(args.ranker) != ranking["script_sha256"] or \
            sha(args.source_script) != source.get("script_sha256") or \
            len(source["rows"]) != 12 or len(ranking["results"]) != 12:
        raise SystemExit("source seal provenance mismatch")
    spec = importlib.util.spec_from_file_location("g02_direct_import_graph", args.source_script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    for original, sealed_row in zip(ranking["results"], source["rows"]):
        replay = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), original["pair_root"]], text=True))
        if replay != original or module.choose(original) != sealed_row:
            raise SystemExit("source-only graph replay mismatch")
    parquet = UPSTREAM / "data/full.parquet"
    if sha(parquet) != PARQUET_SHA256:
        raise SystemExit("native gold parquet drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(parquet))
    rows = []
    for original, sealed_row in zip(ranking["results"], source["rows"]):
        gold = set(loader.get(original["instance_id"]).files())
        delivered = set(original["delivered_paths"])
        chosen = set(sealed_row["selected_paths"])
        rows.append({"id": original["instance_id"].split("__")[-1],
                     "repo": original["pair_root"].split("/g02-cross-layer-pr3-")[-1].split("-")[0],
                     "read_slots": len(chosen),
                     "new_gold_hits": len(chosen & (gold - delivered)),
                     "false_positive_files": len(chosen - gold),
                     "outside_raw_top30": sealed_row["selected_outside_raw_top30"],
                     "undelivered_gold_files": len(gold - delivered)})
    fields = ("read_slots", "new_gold_hits", "false_positive_files", "outside_raw_top30",
              "undelivered_gold_files")
    totals = {key: sum(row[key] for row in rows) for key in fields}
    totals["tasks_with_new_gold"] = sum(row["new_gold_hits"] > 0 for row in rows)
    by_repo = defaultdict(lambda: {key: 0 for key in fields})
    for row in rows:
        for key in fields:
            by_repo[row["repo"]][key] += row[key]
    receipt = {"schema_version": "g02.direct-import-graph-exposed-audit/v1",
               "posture": "evaluator-only-exposed-development-no-model-no-native-score",
               "source_seal_sha256": sha(args.source_seal),
               "source_script_sha256": sha(args.source_script),
               "ranking_seal_sha256": RANKING_SHA256,
               "gold_parquet_sha256": PARQUET_SHA256,
               "source_only_replay": "12/12 exact rows",
               "rows": rows, "totals": totals, "by_repo": dict(by_repo),
               "claim_ceiling": "Acquisition label diagnostic only; not actual ARE reads, native F1, cost, independent holdout, or superiority.",
               "open_questions": ["Can relationship-aware acquisition improve native quality at bounded cost when integrated into live ARE selection?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "audited", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "totals": totals, "by_repo": dict(by_repo)}, sort_keys=True))


if __name__ == "__main__":
    main()
