#!/usr/bin/env python3
"""One-case memory-bounded 120-line chunk BM25 over frozen BugSwarm code."""

from __future__ import annotations

import argparse
import collections
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path, PurePosixPath
import time


SOURCE_SHA = "29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818"
QUERIES_SHA = "4dafeef345483b050df368efc6f3ec636b0b1bca5681950c08ab5da5846ce8e3"
FREEZE_SHA = "f3d46be103d8917a8f8e9e755b05d8a7da1e7d7a09181fec3c00d1158ec14151"
BM25_SHA = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_bm25(path: Path):
    if sha(path) != BM25_SHA:
        raise SystemExit("bm25-code-pin-drift")
    spec = importlib.util.spec_from_file_location("pinned_arb_bm25", path)
    if spec is None or spec.loader is None:
        raise SystemExit("bm25-code-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ordinal", type=int, required=True)
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--source-receipt", type=Path, required=True)
    parser.add_argument("--queries", type=Path, required=True)
    parser.add_argument("--freeze", type=Path, required=True)
    parser.add_argument("--are-rankings", type=Path, required=True)
    parser.add_argument("--bm25-code", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    args = parser.parse_args()
    if not 1 <= args.ordinal <= 24 or sha(args.source_receipt) != SOURCE_SHA or \
            sha(args.queries) != QUERIES_SHA or sha(args.freeze) != FREEZE_SHA:
        raise SystemExit("ordinal-or-input-pin-drift")
    bm25 = load_bm25(args.bm25_code)
    records = json.loads(args.source_receipt.read_bytes())["records"]
    queries = [json.loads(line) for line in args.queries.read_text().splitlines()]
    freeze = json.loads(args.freeze.read_bytes())
    if len(records) != 24 or len(queries) != 24 or len(freeze["case_ids"]) != 24:
        raise SystemExit("denominator-drift")
    index = args.ordinal - 1
    src, query = records[index], queries[index]
    are_path = args.are_rankings / f"ARE-RANKING-{args.ordinal:02d}.json"
    are = json.loads(are_path.read_bytes())
    if (src["ordinal"] != args.ordinal or are["ordinal"] != args.ordinal
            or freeze["case_ids"][index] != query["id"] != are["id"] != src["image_tag"]
            or query["base_commit"] != src["commit"] != are["base_commit"]
            or query["query_sha256"] != are["query_sha256"]
            or are["candidate_count"] != src["projected_files"]):
        raise SystemExit("case-identity-drift")
    root = (args.source_root / Path(src["root"]).name).resolve(strict=True)
    if not root.is_relative_to(args.source_root.resolve(strict=True)):
        raise SystemExit("source-root-escape")
    paths = sorted(are["ranked_files"])
    if len(paths) != len(set(paths)) or len(paths) != src["projected_files"]:
        raise SystemExit("candidate-coverage-drift")
    query_counts = collections.Counter(bm25.tokenize(query["query"]))
    if not query_counts:
        raise SystemExit("empty-query-tokens")
    terms = set(query_counts)
    chunks = []
    started = time.monotonic()
    for path in paths:
        rel = PurePosixPath(path)
        if rel.is_absolute() or ".." in rel.parts or ".git" in rel.parts:
            raise SystemExit("unsafe-source-path")
        target = root.joinpath(*rel.parts).resolve(strict=True)
        if not target.is_relative_to(root) or not target.is_file():
            raise SystemExit("source-path-escape")
        lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
        for start in range(0, max(1, len(lines)), 120):
            chunk = {"path": path, "chunk_id": f"{path}:{start+1}",
                     "text": "\n".join(lines[start:start + 120]), "symbol": "", "kind": ""}
            tokens = collections.Counter(bm25.tokenize(bm25.chunk_text(chunk)))
            chunks.append((path, chunk["chunk_id"], sum(tokens.values()),
                           {term: tokens[term] for term in terms if tokens[term]}))
    n = len(chunks)
    avg_len = sum(length for _, _, length, _ in chunks) / n if n else 0.0
    df = collections.Counter(term for _, _, _, tf in chunks for term in tf)
    scores = []
    for path, chunk_id, length, tf in chunks:
        score = 0.0
        for term, query_count in query_counts.items():
            term_tf = tf.get(term, 0)
            if not term_tf:
                continue
            idf = math.log(1.0 + (n - df[term] + 0.5) / (df[term] + 0.5))
            length_norm = 1.0 - bm25.B
            if avg_len > 0:
                length_norm += bm25.B * (length / avg_len)
            score += query_count * idf * ((term_tf * (bm25.K1 + 1.0)) /
                                          (term_tf + bm25.K1 * length_norm))
        scores.append((score, path, chunk_id))
    scores.sort(key=lambda item: (-item[0], item[1], item[2]))
    ranked = list(dict.fromkeys(path for _, path, _ in scores))
    elapsed_ms = round((time.monotonic() - started) * 1000)
    if len(ranked) != len(paths) or set(ranked) != set(paths):
        raise SystemExit("ranked-coverage-drift")
    args.output_root.mkdir(mode=0o700, parents=True, exist_ok=True)
    output = args.output_root / f"CHUNK-RANKING-{args.ordinal:02d}.json"
    result = {"schema_version": "are.g01-bugswarm-chunk-ranking-r1/v1",
              "ordinal": args.ordinal, "id": query["id"], "repo": query["repo"],
              "language": query["language"], "base_commit": src["commit"],
              "query_sha256": query["query_sha256"], "are_ranking_sha256": sha(are_path),
              "candidate_count": len(ranked), "chunk_count": n,
              "ranker_elapsed_ms": elapsed_ms, "ranked_files": ranked,
              "gold_opened": False, "model_calls": 0}
    encoded = (json.dumps(result, sort_keys=True) + "\n").encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"ordinal": args.ordinal, "candidate_count": len(ranked),
                      "chunks": n, "ranker_elapsed_ms": elapsed_ms,
                      "ranking_sha256": hashlib.sha256(encoded).hexdigest()}), flush=True)


if __name__ == "__main__":
    main()
