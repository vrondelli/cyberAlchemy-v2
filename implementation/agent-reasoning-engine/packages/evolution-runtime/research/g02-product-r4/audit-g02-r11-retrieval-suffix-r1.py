#!/usr/bin/env python3
"""Evaluator-only suffix and candidate-coverage audit of sealed r11 retrieval."""

import argparse
import hashlib
import json
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path


SEAL_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
SOURCE_EXTS = {".c", ".cc", ".cpp", ".go", ".h", ".java", ".js", ".jsx",
               ".kt", ".py", ".rs", ".ts", ".tsx"}


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != SEAL_SHA256 or sha(UPSTREAM / "data/full.parquet") != PARQUET_SHA256:
        raise SystemExit("sealed input drift")
    sealed = json.loads(args.seal.read_text())
    if sealed.get("schema_version") != "g02.r11-retrieval-exposed-seal/v1" or len(sealed["rows"]) != 12:
        raise SystemExit("unexpected source-only cohort")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    suffix_counts = Counter()
    totals = Counter()
    by_source = defaultdict(Counter)
    rows = []
    for row in sealed["rows"]:
        gold = set(loader.get(row["instance_id"]).files())
        delivered = set(row["delivered_paths"])
        missing = gold - delivered
        raw = {item["path"] for item in row["raw_top30"]}
        structured = {item["path"] for item in row["structured_top30"]}
        result = {"ordinal": row["ordinal"], "source": row["source"],
                  "undelivered_gold": len(missing),
                  "code_suffix": 0, "non_code_suffix": 0,
                  "raw_top30": 0, "structured_top30": 0, "union_top30": 0,
                  "code_suffix_outside_union_top30": 0}
        for path in missing:
            suffix = Path(path).suffix.casefold() or "<none>"
            suffix_counts[suffix] += 1
            code = suffix in SOURCE_EXTS
            result["code_suffix" if code else "non_code_suffix"] += 1
            result["raw_top30"] += int(path in raw)
            result["structured_top30"] += int(path in structured)
            result["union_top30"] += int(path in raw or path in structured)
            result["code_suffix_outside_union_top30"] += int(code and path not in raw and path not in structured)
        rows.append(result)
        for key, value in result.items():
            if isinstance(value, int) and key != "ordinal":
                totals[key] += value
                by_source[row["source"]][key] += value
        by_source[row["source"]]["tasks"] += 1
    if totals["undelivered_gold"] != 22:
        raise SystemExit("expected exposed undelivered count drift")
    output = {"schema_version": "g02.r11-retrieval-suffix-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-model-no-native-score",
              "source_seal_sha256": SEAL_SHA256,
              "native_gold_parquet_sha256": PARQUET_SHA256,
              "code_suffix_policy": sorted(SOURCE_EXTS),
              "rows": rows, "totals": dict(sorted(totals.items())),
              "suffix_counts": dict(sorted(suffix_counts.items())),
              "by_source": {key: dict(sorted(value.items())) for key, value in sorted(by_source.items())},
              "claim_ceiling": "Suffix and top-30 candidate-coverage diagnostic only; suffix eligibility does not prove base presence, size eligibility, nonzero retrieval score, or actual reads. No native F1, cost, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"totals": output["totals"], "suffix_counts": output["suffix_counts"],
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
