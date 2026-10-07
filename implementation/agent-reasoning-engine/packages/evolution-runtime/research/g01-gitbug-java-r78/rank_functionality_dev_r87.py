#!/usr/bin/env python3
"""Source-only four-channel development fusion with optional consensus guard."""

import argparse
import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath

SOURCE_SHA = "aaff284494a0726d5517a2f492a36186d6c34a35b4166819dc3a83f77211eb46"
QUERIES_SHA = "478fc0b4fca5936cca09fdffe0a95b9dc2af2bb42482a9aa910fddc48be23eaf"
R84_SHA = "e1ef342e646806d223b3e8bf02c06c45f2f9b4f116b064aeaa708bf8cd6e774d"
PROVIDER_SHA = "b3fc8257762144611313368d002bf1717ee5ea285402008115d755245b230b85"
BM25_SHA = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"
BM25_PATH = Path(__file__).resolve().parents[1] / "arb-trace2code-r1/rank-gin-official-bm25-replica-r1.py"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def order(universe, *rankings):
    scores = {}
    for ranking in rankings:
        for position, path in enumerate(ranking, 1):
            scores[path] = scores.get(path, 0.0) + 1 / (60 + position)
    return sorted(universe, key=lambda path: (-scores.get(path, 0.0), path))


def protect(candidate, baseline, are, raw):
    result = list(candidate)
    for path in sorted(set(are[:3]) & set(raw[:3]), key=baseline.index):
        target = baseline.index(path)
        current = result.index(path)
        if current > target:
            result.pop(current)
            result.insert(target, path)
    return result


def main():
    parser = argparse.ArgumentParser()
    for name in ("source", "queries", "r84", "provider", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.source.read_bytes()) != SOURCE_SHA
            or sha(args.queries.read_bytes()) != QUERIES_SHA
            or sha(args.r84.read_bytes()) != R84_SHA
            or sha((args.provider / "RUN-RESULT.json").read_bytes()) != PROVIDER_SHA
            or sha(BM25_PATH.read_bytes()) != BM25_SHA):
        raise SystemExit("output-or-input-drift")
    source = json.loads(args.source.read_bytes())["records"]
    queries = [json.loads(x) for x in args.queries.read_text().splitlines()]
    previous = [json.loads(x) for x in args.r84.read_text().splitlines()]
    provider = json.loads((args.provider / "RUN-RESULT.json").read_bytes())
    packets_path = args.provider / "PACKETS.jsonl"
    packets = [json.loads(x) for x in packets_path.read_text().splitlines()]
    summaries = [json.loads((args.provider / f"SUMMARY-{i:03d}.json").read_bytes())
                 for i in range(1, 13)]
    if (len(source) != 12 or len(queries) != 12 or len(previous) != 12
            or len(packets) != 12 or len(summaries) != 12
            or provider["status"] != "complete" or provider["attempts"] != 12
            or provider["packets_sha256"] != sha(packets_path.read_bytes())):
        raise SystemExit("provider-or-population-drift")
    spec = importlib.util.spec_from_file_location("pinned_bm25", BM25_PATH)
    bm25 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bm25)
    args.output.mkdir(mode=0o700, parents=True)
    save_new(args.output / "RANKING-FREEZE.json", (json.dumps({
        "schema_version": "are.g01-gitbug-r87-ranking-freeze/v1",
        "source_sha256": SOURCE_SHA, "queries_sha256": QUERIES_SHA,
        "r84_rankings_sha256": R84_SHA, "provider_result_sha256": PROVIDER_SHA,
        "bm25_sha256": BM25_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R87-FUNCTIONALITY-DEV-PROTOCOL.md").read_bytes()),
        "cases": 12, "gold_values_used": False}, sort_keys=True, indent=2) + "\n").encode())
    rows = []
    for i, (src, query, old, packet, summary) in enumerate(
            zip(source, queries, previous, packets, summaries, strict=True), 1):
        if (not (src["ordinal"] == query["ordinal"] == old["ordinal"] == packet["ordinal"]
                 == summary["ordinal"] == i) or
                src["repo"] != query["repo"] or src["repo"] != old["repo"] or
                src["repo"] != packet["repo"] or src["repo"] != summary["repo"] or
                query["query_sha256"] != old["query_sha256"] or
                query["query_sha256"] != packet["query_sha256"] or
                query["query_sha256"] != summary["query_sha256"]):
            raise SystemExit("case-binding-drift")
        root = Path(src["root"]).resolve(strict=True)
        if not root.is_relative_to(args.source.parent.resolve(strict=True)):
            raise SystemExit("source-root-escape")
        are, raw, symbol = old["are"], old["raw_bm25"], old["symbol"]
        chunks = []
        for path in sorted(are):
            rel = PurePosixPath(path)
            if rel.is_absolute() or ".." in rel.parts or not path.endswith(".java"):
                raise SystemExit("unsafe-source-path")
            target = root.joinpath(*rel.parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit("source-path-escape")
            lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
            for start in range(0, max(1, len(lines)), 120):
                chunks.append({"path": path, "chunk_id": f"{path}:{start+1}",
                               "text": "\n".join(lines[start:start+120]),
                               "symbol": "", "kind": ""})
        snapshot = bm25.Snapshot(chunks, len(are))
        functionality = snapshot.rank(summary["summary"] if summary["valid"] else query["query"])
        if set(functionality) != set(are) or len(functionality) != len(are):
            raise SystemExit("functionality-universe-drift")
        fused = order(are, are, raw, symbol, functionality)
        safe = protect(fused, old["a_are_raw"], are, raw)
        rows.append({"schema_version": "are.g01-gitbug-r87-ranking/v1",
                     "ordinal": i, "repo": src["repo"],
                     "query_sha256": query["query_sha256"],
                     "summary_valid": summary["valid"],
                     "functionality_bm25": functionality,
                     "d_four_channel": fused, "d_safe": safe})
        print(json.dumps({"ordinal": i, "summary_valid": summary["valid"]}), flush=True)
        del snapshot, chunks
        gc.collect()
    data = "".join(json.dumps(x, sort_keys=True) + "\n" for x in rows).encode()
    save_new(args.output / "RANKINGS.jsonl", data)
    save_new(args.output / "RANKING-SEAL.json", (json.dumps({
        "schema_version": "are.g01-gitbug-r87-ranking-seal/v1",
        "cases": 12, "rankings_sha256": sha(data),
        "freeze_sha256": sha((args.output / "RANKING-FREEZE.json").read_bytes()),
        "gold_values_used": False}, sort_keys=True, indent=2) + "\n").encode())


if __name__ == "__main__":
    main()
