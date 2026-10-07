#!/usr/bin/env python3
"""Run pinned official RepoMap on exposed ARB edge queries without opening gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import subprocess
import sys
import time


OFFICIAL_CODE_COMMIT = "07014c986f3deadb1548c62b32c0ffbe6a81465d"
SOURCE_AUDIT_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
RANKINGS_SHA256 = "90562963631facf609b1ee1599f190c307e95a8e99f45e7ac2e00581bad95b6a"
GIN_QUERIES_SHA256 = "19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a"
NONGIN_QUERIES_SHA256 = "fd40d61077846f49374ee61a87e561699d85de9016ac590790be5228fa67b08c"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_jsonl(path: pathlib.Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines()]


def edge_window(value: str) -> str:
    raw = value.encode("utf-8")
    if len(raw) <= 1024:
        return value.strip()
    head = raw[:509].decode("utf-8", errors="replace").replace("\ufffd", "")
    tail = raw[-509:].decode("utf-8", errors="replace").replace("\ufffd", "")
    return f"{head}\n...\n{tail}".strip()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("official-code", "source", "rankings", "gin-queries", "nongin-queries", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    code, source, rankings, gin_queries, nongin_queries = (
        path.resolve(strict=True) for path in
        (args.official_code, args.source, args.rankings, args.gin_queries, args.nongin_queries))
    if args.output.exists() or tuple(map(sha256_file, (
            source / "SOURCE-CORPUS-AUDIT.json", rankings, gin_queries, nongin_queries))) != (
            SOURCE_AUDIT_SHA256, RANKINGS_SHA256, GIN_QUERIES_SHA256, NONGIN_QUERIES_SHA256):
        raise SystemExit("output exists or input pin drift")
    head = subprocess.check_output(["git", "-C", str(code), "rev-parse", "HEAD"], text=True).strip()
    if head != OFFICIAL_CODE_COMMIT or subprocess.run(
            ["git", "-C", str(code), "diff", "--quiet"], check=False).returncode != 0 or \
            subprocess.run(["git", "-C", str(code), "diff", "--cached", "--quiet"], check=False).returncode != 0 or \
            subprocess.check_output(["git", "-C", str(code), "status", "--porcelain", "--untracked-files=all"]):
        raise SystemExit("official code commit/cleanliness drift")
    if not (code / "src/agent_retrieval_bench/repomap_eval.py").is_file():
        raise SystemExit("official RepoMap module missing")
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(code / "src"))
    from agent_retrieval_bench.repomap_eval import build_repomap_index, rank_files_for_sample

    queries = load_jsonl(gin_queries) + load_jsonl(nongin_queries)
    query_by_id = {row["id"]: row for row in queries}
    bases = load_jsonl(rankings)
    if len(queries) != 101 or len(query_by_id) != 101 or len(bases) != 101 or \
            {row["id"] for row in bases} != set(query_by_id):
        raise SystemExit("exposed denominator drift")
    manifest_rows = load_jsonl(source / "corpus/v2_trace2code/corpus_manifest.jsonl")
    manifest = {(row["repo"], row["base_commit"]): row for row in manifest_rows}
    if len(manifest_rows) != 98 or len(manifest) != 98:
        raise SystemExit("snapshot manifest drift")
    grouped: dict[tuple[str, str], list[dict]] = {}
    for row in bases:
        query = query_by_id[row["id"]]
        if row["repo"] != query["repo"] or row["base_commit"] != query["base_commit"]:
            raise SystemExit("query identity drift")
        grouped.setdefault((row["repo"], row["base_commit"]), []).append(row)
    predictions = {}
    started = time.monotonic()
    for index_number, (key, items) in enumerate(sorted(grouped.items()), 1):
        meta = manifest.get(key)
        if meta is None or meta["status"] != "ok":
            raise SystemExit("missing snapshot")
        rel = pathlib.PurePosixPath(meta["chunks_path"])
        if rel.parts[:2] != ("data", "corpus") or ".." in rel.parts:
            raise SystemExit("unsafe manifest source path")
        chunks_path = source.joinpath(*rel.parts[1:]).resolve(strict=True)
        if not chunks_path.is_relative_to(source):
            raise SystemExit("snapshot escapes source-only tree")
        chunks = load_jsonl(chunks_path)
        if len(chunks) != meta["chunk_count"]:
            raise SystemExit("snapshot chunk-count drift")
        repomap = build_repomap_index(chunks)
        candidate_paths = set(repomap.nodes)
        if len(candidate_paths) != meta["file_count"]:
            raise SystemExit("snapshot file-count drift")
        for base in items:
            query_row = query_by_id[base["id"]]
            if set(query_row["query"]) != {"command", "failure_excerpt", "run_strategy", "source_type"}:
                raise SystemExit("query shape drift")
            wire = edge_window(query_row["query"]["failure_excerpt"])
            query_sha = hashlib.sha256(wire.encode()).hexdigest()
            if not wire or len(wire.encode()) > 1024 or query_sha != base["query_sha256"]:
                raise SystemExit("matched edge-query drift")
            if candidate_paths != set(base["arb_edge_bm25"]) or \
                    candidate_paths != set(base["are_edge_trace_text"]):
                raise SystemExit("candidate universe mismatch")
            ranked = rank_files_for_sample(
                sample={"task_type": "trace2code", "query": query_row["query"]},
                query_text=wire, index=repomap, candidate_paths=candidate_paths,
                query_weight=0.65, pagerank_weight=0.25, affinity_weight=0.10)
            paths = [path for path, _, _ in ranked]
            if len(paths) != len(candidate_paths) or set(paths) != candidate_paths:
                raise SystemExit("RepoMap ranking coverage drift")
            predictions[base["id"]] = {
                "id": base["id"], "repo": base["repo"], "base_commit": base["base_commit"],
                "query_sha256": query_sha, "candidate_count": len(paths),
                "arb_edge_bm25": base["arb_edge_bm25"],
                "are_edge_trace_text": base["are_edge_trace_text"],
                "official_repomap_edge": paths,
            }
        if index_number % 10 == 0 or index_number == len(grouped):
            print(json.dumps({"snapshots_done": index_number, "snapshots_total": len(grouped),
                              "cases_done": len(predictions), "elapsed_s": round(time.monotonic() - started, 2)}),
                  file=sys.stderr, flush=True)
    if len(predictions) != 101:
        raise SystemExit("prediction denominator drift")
    args.output.mkdir(parents=True, exist_ok=False)
    output = args.output / "OFFICIAL-REPOMAP-EDGE-RANKINGS.jsonl"
    output.write_text("".join(json.dumps(predictions[item_id], sort_keys=True) + "\n"
                              for item_id in sorted(predictions)))
    receipt = {"schema": "are.arb-exposed-official-repomap-edge-source-r1/v1",
               "posture": "matched edge-query exposed development; official code, no labels or provider calls",
               "official_code_commit": OFFICIAL_CODE_COMMIT, "source_audit_sha256": SOURCE_AUDIT_SHA256,
               "rankings_sha256": RANKINGS_SHA256,
               "query_sha256": {"gin": GIN_QUERIES_SHA256, "nongin": NONGIN_QUERIES_SHA256},
               "prediction_sha256": sha256_file(output), "cases": 101,
               "snapshots": len(grouped), "gold_opened": False, "model_calls": 0}
    (args.output / "SOURCE-SEAL.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, sort_keys=True))


if __name__ == "__main__":
    main()
