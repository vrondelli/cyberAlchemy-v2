#!/usr/bin/env python3
"""Seal r61/r62 fixed fusion on r72 source before evaluator labels."""

import argparse
import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath

BM25_SHA = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"
QUERIES_SHA = "854906f04f70a67b1387fe03e44173caac39108e0e1c2ace60420a0187ea891a"
SOURCE_SHA = "8eb68c605ef20e2c7be0d873f62c218c088e6c974c8bca83f179ff38f0517023"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    data = (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def rrf(*rankings):
    scores = {}
    for ranking in rankings:
        for position, path in enumerate(ranking, 1):
            scores[path] = scores.get(path, 0.0) + 1 / (60 + position)
    return scores


def union(*rankings, cap):
    result = []
    for ranking in rankings:
        for path in ranking:
            if path not in result:
                result.append(path)
    return result[:cap]


def main():
    parser = argparse.ArgumentParser()
    for name in ("source", "queries", "are", "provider", "bm25", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.source.read_bytes()) != SOURCE_SHA or sha(args.queries.read_bytes()) != QUERIES_SHA or sha(args.bm25.read_bytes()) != BM25_SHA:
        raise SystemExit("output-or-input-drift")
    source = json.loads(args.source.read_bytes())["records"]
    queries = [json.loads(line) for line in args.queries.read_text().splitlines()]
    are_seal = json.loads((args.are / "ARE-SEAL.json").read_bytes())
    provider = json.loads((args.provider / "RUN-RESULT.json").read_bytes())
    packets = [json.loads(line) for line in (args.provider / "PACKETS.jsonl").read_text().splitlines()]
    summaries = [json.loads((args.provider / f"SUMMARY-{i:03d}.json").read_bytes()) for i in range(1, 25)]
    if (len(source) != 24 or len(queries) != 24 or len(packets) != 24 or len(summaries) != 24
            or provider["status"] != "complete" or provider["attempts"] != 24
            or provider["packets_sha256"] != sha((args.provider / "PACKETS.jsonl").read_bytes())
            or are_seal["cases"] != 24 or len(are_seal["rankings"]) != 24):
        raise SystemExit("population-or-provider-drift")
    spec = importlib.util.spec_from_file_location("pinned_arb_bm25", args.bm25)
    if spec is None or spec.loader is None:
        raise SystemExit("bm25-unavailable")
    bm25 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bm25)
    args.output.mkdir(parents=True, mode=0o700)
    freeze = {"schema_version": "are.g01-r72-fusion-freeze/v1", "cases": 24,
              "source_sha256": SOURCE_SHA, "queries_sha256": QUERIES_SHA,
              "are_seal_sha256": sha((args.are / "ARE-SEAL.json").read_bytes()),
              "provider_result_sha256": sha((args.provider / "RUN-RESULT.json").read_bytes()),
              "packets_sha256": provider["packets_sha256"], "bm25_sha256": BM25_SHA,
              "protocol_sha256": sha(Path(__file__).with_name("R72-MIXED-INPUT-PROTOCOL.md").read_bytes()),
              "script_sha256": sha(Path(__file__).read_bytes()),
              "gold_opened": False, "passing_source_opened": False}
    save(args.output / "FUSION-FREEZE.json", freeze)
    output = []
    for i, (src, q, packet, summary) in enumerate(zip(source, queries, packets, summaries, strict=True), 1):
        ranking_path = args.are / f"ARE-RANKING-{i:02d}.json"
        if sha(ranking_path.read_bytes()) != are_seal["rankings"][i-1]["sha256"]:
            raise SystemExit(f"are-ranking-drift:{i}")
        are = json.loads(ranking_path.read_bytes())
        if not (src["ordinal"] == q["ordinal"] == packet["ordinal"] == summary["ordinal"] == are["ordinal"] == i
                and src["id"] == q["id"] == packet["id"] == summary["id"] == are["id"]
                and src["repo"] == q["repo"] == packet["repo"] == summary["repo"] == are["repo"]
                and src["base_commit"] == q["base_commit"] == packet["base_commit"] == are["base_commit"]
                and q["query_sha256"] == packet["query_sha256"] == summary["query_sha256"] == are["query_sha256"]):
            raise SystemExit(f"case-binding:{i}")
        root = Path(src["root"]).resolve(strict=True)
        if not root.is_relative_to(args.source.parent.resolve(strict=True)):
            raise SystemExit("source-root-escape")
        ranked = are["ranked_files"]
        if len(ranked) != src["projected_files"] or len(set(ranked)) != len(ranked):
            raise SystemExit("source-universe-drift")
        chunks = []
        for path in sorted(ranked):
            rel = PurePosixPath(path)
            if rel.is_absolute() or ".." in rel.parts or ".git" in rel.parts or not path.endswith(".py"):
                raise SystemExit("unsafe-source-path")
            target = root.joinpath(*rel.parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit("source-path-escape")
            lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
            for start in range(0, max(1, len(lines)), 120):
                chunks.append({"path": path, "chunk_id": f"{path}:{start+1}",
                               "text": "\n".join(lines[start:start+120]), "symbol": "", "kind": ""})
        snapshot = bm25.Snapshot(chunks, len(ranked))
        raw = snapshot.rank(q["query"])
        func = snapshot.rank(summary["summary"] if summary["valid"] else q["query"])
        if set(raw) != set(ranked) or set(func) != set(ranked) or len(raw) != len(ranked) or len(func) != len(ranked):
            raise SystemExit("bm25-universe-drift")
        base_scores = rrf(ranked, raw)
        base = sorted(base_scores, key=lambda path: (-base_scores[path], path))
        candidate = union(ranked[:10], raw[:10], func[:10], cap=30)
        top = func[:30]
        top_set = set(top)
        completed = top + [path for path in base if path not in top_set]
        treatment_scores = rrf(ranked, raw, completed)
        candidate_set = set(candidate)
        treatment = sorted(candidate, key=lambda path: (-treatment_scores[path], path)) + [path for path in base if path not in candidate_set]
        if len(treatment) != len(base) or set(treatment) != set(base):
            raise SystemExit("treatment-universe-drift")
        output.append({"schema_version": "are.g01-r72-ranking/v1", "ordinal": i,
                       "id": q["id"], "repo": q["repo"], "input_type": q["input_type"],
                       "query_sha256": q["query_sha256"], "summary_valid": summary["valid"],
                       "candidate_count": len(candidate), "base": base, "treatment": treatment})
        print(json.dumps({"ordinal": i, "files": len(ranked), "chunks": len(chunks)}), flush=True)
        del snapshot, chunks
        gc.collect()
    data = "".join(json.dumps(row, sort_keys=True) + "\n" for row in output).encode()
    fd = os.open(args.output / "RANKINGS.jsonl", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    save(args.output / "FUSION-SEAL.json", {"schema_version": "are.g01-r72-fusion-seal/v1",
         "cases": 24, "rankings_sha256": sha(data), "freeze_sha256": sha((args.output / "FUSION-FREEZE.json").read_bytes()),
         "valid_summaries": sum(row["summary_valid"] for row in output),
         "gold_opened": False, "passing_source_opened": False})
    print(json.dumps({"cases": 24, "rankings_sha256": sha(data)}))


if __name__ == "__main__":
    main()
