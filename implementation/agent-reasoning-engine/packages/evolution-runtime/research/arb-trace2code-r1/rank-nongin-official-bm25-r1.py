#!/usr/bin/env python3
"""Source-only pinned-method ARB BM25 rankings on non-Gin confirmation queries."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import pathlib


SOURCE_AUDIT_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
REPLICA_SCRIPT_SHA256 = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_replica(path: pathlib.Path):
    if sha256_file(path) != REPLICA_SCRIPT_SHA256:
        raise SystemExit("replica code drift")
    spec = importlib.util.spec_from_file_location("gin_bm25_replica", path)
    if spec is None or spec.loader is None:
        raise SystemExit("cannot load replica")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--queries", type=pathlib.Path, required=True)
    parser.add_argument("--replica-script", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    source, queries, script = (path.resolve(strict=True) for path in
                               (args.source, args.queries, args.replica_script))
    seal = json.loads((queries.parent / "QUERY-SEAL.json").read_text())
    if args.output.exists() or sha256_file(source / "SOURCE-CORPUS-AUDIT.json") != SOURCE_AUDIT_SHA256 or \
            seal.get("schema") != "are.arb-trace2code-nongin-query-projection-r1/v1" or \
            seal.get("query_projection_sha256") != sha256_file(queries):
        raise SystemExit("input pin drift")
    replica = load_replica(script)
    items = [json.loads(line) for line in queries.read_text().splitlines()]
    if len(items) != 45 or len({row["id"] for row in items}) != 45 or any(
            row["repo"] == "gin-gonic/gin" for row in items):
        raise SystemExit("cohort drift")
    manifest = {(row["repo"], row["base_commit"]): row for row in
                (json.loads(line) for line in
                 (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())}
    grouped = {}
    for item in items:
        grouped.setdefault((item["repo"], item["base_commit"]), []).append(item)
    ranked = {}
    for (repo, commit), group in grouped.items():
        snapshot = replica.load_snapshot(source, manifest, repo, commit)
        for item in group:
            query = item["query"]
            windows = {"edge_failure": replica.edge_window(query["failure_excerpt"]),
                       "full_json": json.dumps(query, ensure_ascii=False, sort_keys=True)}
            if not windows["edge_failure"] or len(windows["edge_failure"].encode()) > 1024:
                raise SystemExit("query window drift")
            ranked[item["id"]] = {"id": item["id"], "repo": repo, "base_commit": commit,
                                  "candidate_count": len(snapshot.file_paths),
                                  "query_sha256": {name: hashlib.sha256(value.encode()).hexdigest()
                                                   for name, value in windows.items()},
                                  "rankings": {name: snapshot.rank(value) for name, value in windows.items()}}
    args.output.mkdir(parents=True, exist_ok=False)
    path = args.output / "ARB-BM25-RANKINGS.jsonl"
    path.write_text("".join(json.dumps(ranked[item["id"]], sort_keys=True) + "\n" for item in items))
    report = {"schema": "are.arb-trace2code-nongin-bm25-source-r1/v1",
              "posture": "source-only official-method replica with exposed Gin pinned-function parity; not package evaluator",
              "source_audit_sha256": SOURCE_AUDIT_SHA256, "query_projection_sha256": sha256_file(queries),
              "replica_script_sha256": REPLICA_SCRIPT_SHA256, "prediction_sha256": sha256_file(path),
              "cases": len(ranked), "snapshots": len(grouped), "gold_opened": False, "model_calls": 0}
    (args.output / "SOURCE-SEAL.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
