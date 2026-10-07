#!/usr/bin/env python3
"""Evaluator-only native-gold eligibility audit for an unscored G01 r2 cohort."""
import hashlib
import json
import os
from pathlib import Path
import sys

from contextbench.parsers.gold import GoldLoader


def main() -> int:
    if len(sys.argv) != 4:
        raise ValueError("usage: preflight-gold-r2.py INDEX-RECEIPT PARQUET OUTPUT")
    index_path, parquet, output = map(Path, sys.argv[1:])
    index = json.loads(index_path.read_text())
    if index.get("status") != "passed" or len(index.get("results", [])) != 24:
        raise ValueError("source-index-preflight-not-passed")
    ids = [row["instance_id"] for row in index["results"]]
    if len(set(ids)) != 24:
        raise ValueError("duplicate-id")
    loader = GoldLoader(str(parquet))
    rows = []
    for instance_id in ids:
        gold = loader.get(instance_id)
        rows.append({"instance_id": instance_id, "eligible": bool(gold and gold.files())})
    result = {
        "schema_version": "are.g01-r2-native-gold-eligibility/v1",
        "status": "passed" if all(row["eligible"] for row in rows) else "failed",
        "source_index_preflight_sha256": hashlib.sha256(index_path.read_bytes()).hexdigest(),
        "parquet_sha256": hashlib.sha256(parquet.read_bytes()).hexdigest(),
        "native_gold_loader": "GoldLoader.files()",
        "rows": rows,
        "gold_paths_or_values_exported": False,
        "model_calls": 0,
        "claim_ceiling": "Evaluator-only native-gold existence bit; no score or cohort freeze",
        "open_questions_ref": "G01-R2-RECOVERY-PLAN-CANDIDATE.md",
    }
    output.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    descriptor = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(json.dumps({"status": result["status"], "eligible": sum(row["eligible"] for row in rows),
                      "planned": len(rows), "output_sha256": hashlib.sha256(output.read_bytes()).hexdigest()}))
    return 0 if result["status"] == "passed" else 2


if __name__ == "__main__":
    raise SystemExit(main())
