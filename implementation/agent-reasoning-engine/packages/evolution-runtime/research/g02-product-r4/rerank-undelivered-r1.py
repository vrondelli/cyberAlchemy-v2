#!/usr/bin/env python3
"""Source-only rerank of sealed G02 r3 retrieval candidates absent from ARE reads."""

import argparse
import hashlib
import json
import re
from pathlib import Path


EXPECTED_INPUT_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
IMPORT_LINE = re.compile(r"\b(?:import|from|require)\b")


def relation(candidate, selected, base):
    candidate_path = Path(candidate)
    candidate_parent = candidate_path.parent
    stem = candidate_path.stem.casefold()
    same_dir = False
    shared_package = False
    direct_import = False
    for selected_name in selected:
        selected_path = Path(selected_name)
        if selected_path.is_absolute() or ".." in selected_path.parts:
            raise ValueError("unsafe selected path")
        same_dir |= selected_path.parent == candidate_parent
        shared_package |= (len(candidate_path.parts) >= 2 and len(selected_path.parts) >= 2
                           and candidate_path.parts[:2] == selected_path.parts[:2])
        source = base / selected_name
        if len(stem) < 5 or not source.is_file() or source.is_symlink():
            continue
        content = source.read_bytes()[:262144].decode("utf-8", "replace")
        direct_import |= any(stem in line.casefold() for line in content.splitlines()
                             if IMPORT_LINE.search(line))
    return {"same_dir": same_dir, "shared_package": shared_package,
            "direct_import": direct_import}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    args = parser.parse_args()
    data = args.seal.read_bytes()
    if hashlib.sha256(data).hexdigest() != EXPECTED_INPUT_SHA256:
        raise SystemExit("input seal mismatch")
    sealed = json.loads(data)
    output = []
    for row in sealed["results"]:
        base = Path(row["pair_root"]) / "sources/session/base"
        selected = row["selected_paths"]
        delivered = set(row["delivered_paths"])
        pool = [item for item in row["raw_top30"] if item["path"] not in delivered]
        if not pool:
            raise SystemExit(f"empty pool: {row['instance_id']}")
        max_score = max(item["score"] for item in row["raw_top30"])
        reranked = []
        for item in pool:
            candidate_path = Path(item["path"])
            if candidate_path.is_absolute() or ".." in candidate_path.parts:
                raise ValueError("unsafe candidate path")
            signals = relation(item["path"], selected, base)
            normalized = item["score"] / max_score
            score = (normalized + 0.5 * signals["same_dir"]
                     + 0.25 * signals["shared_package"]
                     + 1.0 * signals["direct_import"])
            reranked.append({"path": item["path"], "score": round(score, 6),
                             "signals": signals})
        reranked.sort(key=lambda item: (-item["score"], item["path"]))
        output.append({"instance_id": row["instance_id"],
                       "pair_root": row["pair_root"],
                       "pool_size": len(pool),
                       "raw_undelivered_top10": [item["path"] for item in pool[:10]],
                       "relation_undelivered_top10": reranked[:10]})
    print(json.dumps({"schema_version": "g02.relation-rerank-exposed/v1",
                      "posture": "source-only-no-gold-no-native-score",
                      "input_seal_sha256": EXPECTED_INPUT_SHA256,
                      "rows": output}, sort_keys=True))


if __name__ == "__main__":
    main()
