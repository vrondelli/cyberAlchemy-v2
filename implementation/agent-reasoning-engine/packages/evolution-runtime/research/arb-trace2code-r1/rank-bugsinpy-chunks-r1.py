#!/usr/bin/env python3
"""Gold-blind 120-line chunk BM25 on frozen BugsInPy source projections."""

from __future__ import annotations

import argparse
import gc
import hashlib
import importlib.util
import json
import pathlib
import time


PROJECTION_SHA256 = "d5e909aa9d2250e437bc5f9ad8b6c0845204ad9bbe86c1e465b2dccbe8fc350e"
QUERY_SHA256 = "bb35ea15fa9498511e329cd298084c4db7f31a636ca071ef4bb6d142f9b327f2"
ARE_SHA256 = "12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2"
BM25_CODE_SHA256 = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def rows(path: pathlib.Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines()]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("projection", "queries", "are-rankings", "bm25-code", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.projection / "SOURCE-PROJECTION-RECEIPT.json") != PROJECTION_SHA256 or \
            digest(args.queries) != QUERY_SHA256 or digest(args.are_rankings) != ARE_SHA256 or \
            digest(args.bm25_code) != BM25_CODE_SHA256:
        raise SystemExit("output exists or input drift")
    spec = importlib.util.spec_from_file_location("arb_bm25_replica", args.bm25_code)
    if spec is None or spec.loader is None:
        raise SystemExit("BM25 implementation unavailable")
    bm25 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bm25)
    meta = {row["case"]: row for row in json.loads(
        (args.projection / "SOURCE-PROJECTION-RECEIPT.json").read_text())["records"]}
    queries = {row["id"]: row for row in rows(args.queries)}
    are = rows(args.are_rankings)
    if len(are) != 24 or len(queries) != 24 or set(meta) != set(queries):
        raise SystemExit("cohort denominator drift")
    results = []
    for baseline in are:
        case = baseline["id"]
        item, source = queries[case], meta[case]
        if baseline["base_commit"] != source["commit"] or item["query_sha256"] != baseline["query_sha256"]:
            raise SystemExit("case identity drift")
        root = pathlib.Path(source["root"]).resolve(strict=True)
        if not root.is_relative_to(args.projection.resolve(strict=True)):
            raise SystemExit("source root escapes projection")
        chunks = []
        for path in sorted(baseline["ranked_files"]):
            rel = pathlib.PurePosixPath(path)
            if rel.is_absolute() or ".." in rel.parts or ".git" in rel.parts:
                raise SystemExit("unsafe ranked path")
            target = root.joinpath(*rel.parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit("ranked path outside source")
            lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
            for start in range(0, max(1, len(lines)), 120):
                chunks.append({"path": path, "chunk_id": f"{path}:{start+1}",
                               "text": "\n".join(lines[start:start+120]),
                               "symbol": "", "kind": ""})
        started = time.monotonic()
        snapshot = bm25.Snapshot(chunks, baseline["candidate_count"])
        ranked = snapshot.rank(item["query"])
        elapsed_ms = round((time.monotonic() - started) * 1000)
        if len(ranked) != baseline["candidate_count"] or set(ranked) != set(baseline["ranked_files"]):
            raise SystemExit(f"candidate universe mismatch: {case}")
        results.append({"id": case, "repo": item["repo"], "base_commit": source["commit"],
                        "query_sha256": item["query_sha256"], "candidate_count": len(ranked),
                        "chunk_count": len(chunks), "ranker_elapsed_ms": elapsed_ms,
                        "ranked_files": ranked})
        print(json.dumps({"case": case, "chunks": len(chunks), "ranker_elapsed_ms": elapsed_ms}), flush=True)
        del snapshot, chunks
        gc.collect()
    args.output.mkdir(parents=True)
    path = args.output / "CHUNK-BM25-RANKINGS.jsonl"
    path.write_text("".join(json.dumps(item) + "\n" for item in results))
    receipt = {"schema": "are.g01-bugsinpy-chunk-bm25-rankings-r1/v1",
               "cases": len(results), "source_projection_sha256": PROJECTION_SHA256,
               "queries_sha256": QUERY_SHA256, "are_rankings_sha256": ARE_SHA256,
               "bm25_code_sha256": BM25_CODE_SHA256,
               "prediction_sha256": digest(path),
               "chunks_total": sum(item["chunk_count"] for item in results),
               "ranker_elapsed_ms_total": sum(item["ranker_elapsed_ms"] for item in results),
               "gold_opened": False, "model_calls": 0}
    (args.output / "SOURCE-SEAL.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, sort_keys=True))


if __name__ == "__main__":
    main()
