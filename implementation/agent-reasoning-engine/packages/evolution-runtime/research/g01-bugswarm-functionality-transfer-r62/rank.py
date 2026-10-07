#!/usr/bin/env python3
"""Seal r62 BugSwarm Python rankings before opening evaluator labels."""

import argparse
import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import time

PINS = {
    "r34": "fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c",
    "r36": "14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395",
    "r37": "999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65",
    "are_seal": "b5c6665bbb1a9142d9b77b9de69d222f014d1fe1847ea89d1208fead1621691d",
    "provider_result": "cbbc0df8d991fa8bf1c4cbe502b3d9125313448ad6ff6b630783420498d6eba4",
    "packets": "b93dce6920436597bd3f3d2576eb9014bc0f8081da8137f43d4db824e17fb4ef",
    "bm25_code": "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def save_exclusive(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def rrf_scores(*rankings):
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
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", type=Path, required=True)
    ap.add_argument("--provider", type=Path, required=True)
    ap.add_argument("--bm25-code", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    if args.output.exists():
        raise SystemExit("output exists")
    files = {"r34": args.base / "selective-r28/final-r34/RESULT.json",
             "r36": args.base / "selective-r28/code-projection-r36/RESULT.json",
             "r37": args.base / "selective-r28/query-only-r37/QUERIES.jsonl",
             "are_seal": args.base / "selective-r28/rankings-r38/are/ARE-SEAL.json",
             "provider_result": args.provider / "RUN-RESULT.json",
             "packets": args.provider / "PACKETS.jsonl", "bm25_code": args.bm25_code}
    for name, path in files.items():
        if sha(path) != PINS[name]:
            raise SystemExit(f"input drift: {name}")
    spec = importlib.util.spec_from_file_location("pinned_arb_bm25", args.bm25_code)
    if spec is None or spec.loader is None:
        raise SystemExit("BM25 unavailable")
    bm25 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bm25)
    r34 = json.loads(files["r34"].read_text())
    r36 = json.loads(files["r36"].read_text())
    are_seal = json.loads(files["are_seal"].read_text())
    provider = json.loads(files["provider_result"].read_text())
    queries = {row["ordinal"]: row for row in rows(files["r37"])}
    sources = {row["slot"]: row for row in r36["records"]}
    are_hashes = {row["ordinal"]: row["ranking_sha256"] for row in are_seal["rankings"]}
    packets = rows(files["packets"])
    if (provider["status"] != "complete" or provider["attempts"] != 17 or
            provider["packets_sha256"] != PINS["packets"] or len(packets) != 17 or
            len([row for row in r34["rows"] if row["language"] == "Python"]) != 17):
        raise SystemExit("provider/population drift")
    args.output.mkdir(parents=True)
    summary_paths = [args.provider / f"SUMMARY-{i:03d}.json" for i in range(1, 18)]
    summary_hashes = [sha(path) for path in summary_paths]
    save_exclusive(args.output / "RUN-FREEZE.json", {"schema_version": "are.g01-r62-source-freeze/v1",
        "cases": 17, "input_sha256": PINS, "summary_sha256": summary_hashes,
        "script_sha256": sha(Path(__file__)),
        "protocol_sha256": sha(Path(__file__).with_name("PROTOCOL.md")),
        "gold_opened": False})
    output = []
    started = time.monotonic()
    for packet, summary_path in zip(packets, summary_paths, strict=True):
        slot = packet["ordinal"]
        summary = json.loads(summary_path.read_text())
        query = queries[slot]
        source = sources[slot]
        ranking_file = args.base / f"selective-r28/rankings-r38/are/ARE-RANKING-{slot:02d}.json"
        if sha(ranking_file) != are_hashes[slot]:
            raise SystemExit("ARE ranking drift")
        ranking = json.loads(ranking_file.read_text())
        if not (packet["id"] == summary["id"] == query["id"] == ranking["id"] and
                packet["repo"] == summary["repo"] == query["repo"] == source["repo"] == ranking["repo"] and
                packet["query_sha256"] == summary["query_sha256"] == query["query_sha256"] == ranking["query_sha256"] and
                packet["base_commit"] == query["base_commit"] == source["failed_commit"] == ranking["base_commit"] and
                packet["language"] == source["language"] == ranking["language"] == "Python"):
            raise SystemExit("case identity drift")
        root = Path(source["root"]).resolve(strict=True)
        projection = (args.base / "selective-r28/code-projection-r36/roots").resolve(strict=True)
        if not root.is_relative_to(projection):
            raise SystemExit("source root escape")
        are = ranking["ranked_files"]
        if len(are) != ranking["candidate_count"] or len(set(are)) != len(are):
            raise SystemExit("ARE universe drift")
        chunks = []
        for path in sorted(are):
            rel = PurePosixPath(path)
            if rel.is_absolute() or ".." in rel.parts or ".git" in rel.parts or not path.endswith(".py"):
                raise SystemExit("unsafe or non-Python path")
            target = root.joinpath(*rel.parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit("ranked path outside source")
            lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
            for start in range(0, max(1, len(lines)), 120):
                chunks.append({"path": path, "chunk_id": f"{path}:{start+1}",
                               "text": "\n".join(lines[start:start+120]), "symbol": "", "kind": ""})
        snapshot = bm25.Snapshot(chunks, len(are))
        raw = snapshot.rank(query["query"])
        functionality_query = summary["summary"] if summary["valid"] else query["query"]
        functionality = snapshot.rank(functionality_query)
        if len(raw) != len(are) or set(raw) != set(are) or len(functionality) != len(are) or set(functionality) != set(are):
            raise SystemExit("BM25 universe drift")
        base_scores = rrf_scores(are, raw)
        base = sorted(base_scores, key=lambda path: (-base_scores[path], path))
        candidate = union(are[:10], raw[:10], functionality[:10], cap=30)
        top = functionality[:30]
        top_set = set(top)
        completed = top + [path for path in base if path not in top_set]
        treatment_scores = rrf_scores(are, raw, completed)
        candidate_set = set(candidate)
        treatment = sorted(candidate, key=lambda path: (-treatment_scores[path], path)) + [path for path in base if path not in candidate_set]
        if len(treatment) != len(base) or set(treatment) != set(base):
            raise SystemExit("treatment universe drift")
        output.append({"schema_version": "are.g01-r62-ranking/v1", "ordinal": slot,
                       "id": query["id"], "repo": query["repo"], "query_sha256": query["query_sha256"],
                       "summary_valid": summary["valid"], "candidate_count": len(candidate),
                       "raw_candidate_count": len(union(are[:10], raw[:10], cap=20)),
                       "candidate": candidate, "base": base, "treatment": treatment,
                       "chunks": len(chunks)})
        print(json.dumps({"slot": slot, "chunks": len(chunks), "summary_valid": summary["valid"],
                          "elapsed_ms": round((time.monotonic()-started)*1000)}), flush=True)
        del snapshot, chunks
        gc.collect()
    if len(output) != 17:
        raise SystemExit("output denominator drift")
    out = args.output / "RANKINGS.jsonl"
    out.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output))
    save_exclusive(args.output / "SOURCE-SEAL.json", {"schema_version": "are.g01-r62-source-seal/v1",
        "status": "complete", "cases": 17, "valid_summaries": sum(row["summary_valid"] for row in output),
        "rankings_sha256": sha(out), "freeze_sha256": sha(args.output / "RUN-FREEZE.json"),
        "elapsed_ms": round((time.monotonic()-started)*1000), "gold_opened": False})
    print((args.output / "SOURCE-SEAL.json").read_text())


if __name__ == "__main__":
    main()
