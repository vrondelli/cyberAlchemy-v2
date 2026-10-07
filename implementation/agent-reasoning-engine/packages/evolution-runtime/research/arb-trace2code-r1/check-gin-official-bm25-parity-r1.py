#!/usr/bin/env python3
"""Check sealed Gin replica rankings against pinned official BM25 functions.

Read the exact official baseline.py bytes from stdin; never persist source code.
"""

from __future__ import annotations

import argparse
import ast
from collections import Counter
import hashlib
import importlib.util
import json
import math
import pathlib
import re
import sys


OFFICIAL_SHA256 = "5a82f9a087eb90f9ada2ad6b6047fe8b9781b013749f3d176b1cbdbe7b7f05d1"
REPLICA_SHA256 = "1d8b81e146fa0d01911e4a03d75db64e79af8020030cbead889beadb44505e78"
SOURCE_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
QUERIES_SHA256 = "19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a"
FUNCTIONS = {"rank_chunks_bm25_with_scores", "unique_ranked_paths", "chunk_text", "tokenize"}


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def official_functions(source: bytes) -> dict:
    if hashlib.sha256(source).hexdigest() != OFFICIAL_SHA256:
        raise SystemExit("official baseline source hash drift")
    tree = ast.parse(source.decode("utf-8"))
    selected = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in FUNCTIONS]
    if {node.name for node in selected} != FUNCTIONS:
        raise SystemExit("official function set drift")
    module = ast.Module(body=[ast.ImportFrom(module="__future__", names=[ast.alias(name="annotations")], level=0),
                              *selected], type_ignores=[])
    namespace = {"Counter": Counter, "math": math, "re": re,
                 "TOKEN_RE": re.compile(r"[A-Za-z0-9]+"), "BM25_K1": 1.5, "BM25_B": 0.75}
    exec(compile(ast.fix_missing_locations(module), "pinned-official-baseline-extract", "exec"), namespace)
    return namespace


def replica_module(path: pathlib.Path):
    spec = importlib.util.spec_from_file_location("gin_bm25_replica", path)
    if spec is None or spec.loader is None:
        raise SystemExit("cannot load local replica")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--queries", type=pathlib.Path, required=True)
    parser.add_argument("--rankings", type=pathlib.Path, required=True)
    parser.add_argument("--replica-script", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    source, queries, rankings, script = (path.resolve(strict=True) for path in
                                         (args.source, args.queries, args.rankings, args.replica_script))
    if args.output.exists() or (sha256_file(source / "SOURCE-CORPUS-AUDIT.json"), sha256_file(queries),
                               sha256_file(rankings)) != (SOURCE_SHA256, QUERIES_SHA256, REPLICA_SHA256):
        raise SystemExit("output exists or input pin drift")
    official = official_functions(sys.stdin.buffer.read())
    local = replica_module(script)
    items = [json.loads(line) for line in queries.read_text().splitlines()]
    sealed = {row["id"]: row for row in (json.loads(line) for line in rankings.read_text().splitlines())}
    if len(items) != 56 or len(sealed) != 56 or {row["id"] for row in items} != set(sealed):
        raise SystemExit("case-set drift")
    manifest = {(row["repo"], row["base_commit"]): row for row in
                (json.loads(line) for line in
                 (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())}
    snapshots = {}
    checked = 0
    for item in items:
        repo, commit = item["repo"], item["base_commit"]
        if repo != "gin-gonic/gin":
            raise SystemExit("non-development repo")
        key = (repo, commit)
        if key not in snapshots:
            entry = manifest.get(key)
            if entry is None:
                raise SystemExit("snapshot missing")
            relative = entry["chunks_path"].removeprefix("data/")
            if not relative.startswith("corpus/v2_trace2code/") or ".." in pathlib.PurePosixPath(relative).parts:
                raise SystemExit("unsafe chunk path")
            chunks = [json.loads(line) for line in (source / relative).read_text().splitlines()]
            if len(chunks) != entry["chunk_count"]:
                raise SystemExit("snapshot count drift")
            snapshots[key] = chunks
        chunks = snapshots[key]
        query = item["query"]
        windows = {"full_json": json.dumps(query, ensure_ascii=False, sort_keys=True),
                   "tail_failure": local.tail_window(query["failure_excerpt"]),
                   "edge_failure": local.edge_window(query["failure_excerpt"])}
        row = sealed[item["id"]]
        if row["base_commit"] != commit or row["repo"] != repo:
            raise SystemExit("sealed case identity drift")
        for mode, text in windows.items():
            digest = hashlib.sha256(text.encode()).hexdigest()
            if row["query_sha256"][mode] != digest:
                raise SystemExit(f"sealed query digest drift {mode}")
            official_chunks = [chunk for _, chunk in official["rank_chunks_bm25_with_scores"](text, chunks)]
            ranked = official["unique_ranked_paths"](official_chunks)
            if ranked != row["rankings"][mode]:
                first = next((i for i, (left, right) in enumerate(zip(ranked, row["rankings"][mode]))
                              if left != right), min(len(ranked), len(row["rankings"][mode])))
                raise SystemExit(f"official/replica divergence at case {item['id']}, {mode}, rank {first + 1}")
            checked += 1
    report = {"schema": "are.arb-gin-official-bm25-function-parity-r1/v1",
              "official_baseline_source_sha256": OFFICIAL_SHA256,
              "official_commit": "07014c986f3deadb1548c62b32c0ffbe6a81465d",
              "replica_rankings_sha256": REPLICA_SHA256,
              "source_audit_sha256": SOURCE_SHA256, "dev_queries_sha256": QUERIES_SHA256,
              "cases": len(items), "modes": list(windows), "exact_rankings_matched": checked,
              "all_files_rank_order_equal": checked == 168, "gold_opened": False,
              "heldout_queries_opened": False, "model_calls": 0,
              "posture": "pinned official ranking functions executed in isolation; not official package evaluator"}
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / "PARITY-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
