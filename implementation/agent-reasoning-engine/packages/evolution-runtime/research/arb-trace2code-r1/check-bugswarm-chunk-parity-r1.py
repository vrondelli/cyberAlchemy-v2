#!/usr/bin/env python3
"""Check memory-bounded chunk ranking against the pinned full Snapshot."""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--source-receipt", type=Path, required=True)
    parser.add_argument("--queries", type=Path, required=True)
    parser.add_argument("--chunk-rankings", type=Path, required=True)
    parser.add_argument("--bm25-code", type=Path, required=True)
    args = parser.parse_args()
    spec = importlib.util.spec_from_file_location("pinned_arb_bm25", args.bm25_code)
    if spec is None or spec.loader is None:
        raise SystemExit("bm25-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    records = json.loads(args.source_receipt.read_bytes())["records"]
    queries = [json.loads(line) for line in args.queries.read_text().splitlines()]
    for ordinal in (1, 13):
        record, query = records[ordinal - 1], queries[ordinal - 1]
        output = json.loads((args.chunk_rankings / f"CHUNK-RANKING-{ordinal:02d}.json").read_bytes())
        if record["image_tag"] != query["id"] != output["id"]:
            raise SystemExit("case-identity-drift")
        root = args.source_root / Path(record["root"]).name
        chunks = []
        for path in sorted(output["ranked_files"]):
            lines = (root / path).read_text(encoding="utf-8", errors="replace").splitlines()
            for start in range(0, max(1, len(lines)), 120):
                chunks.append({"path": path, "chunk_id": f"{path}:{start+1}",
                               "text": "\n".join(lines[start:start + 120]),
                               "symbol": "", "kind": ""})
        reference = module.Snapshot(chunks, record["projected_files"]).rank(query["query"])
        if reference != output["ranked_files"]:
            raise SystemExit(f"chunk-parity-failed:{ordinal}")
        print(json.dumps({"ordinal": ordinal, "files": len(reference), "chunks": len(chunks),
                          "exact_rank_parity": True}), flush=True)


if __name__ == "__main__":
    main()
