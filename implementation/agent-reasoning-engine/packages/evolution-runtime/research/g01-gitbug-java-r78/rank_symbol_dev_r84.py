#!/usr/bin/env python3
"""Seal source-only BM25, symbol, and ARE-fusion development rankings."""

import argparse
import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re

SOURCE_SHA = "aaff284494a0726d5517a2f492a36186d6c34a35b4166819dc3a83f77211eb46"
QUERIES_SHA = "478fc0b4fca5936cca09fdffe0a95b9dc2af2bb42482a9aa910fddc48be23eaf"
BM25_SHA = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"
BM25_PATH = Path(__file__).resolve().parents[1] / "arb-trace2code-r1/rank-gin-official-bm25-replica-r1.py"
SUFFIX = re.compile(r"(?:Tests?|TestCase|IT|Spec)$", re.IGNORECASE)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def rrf(*rankings):
    scores = {}
    for ranking in rankings:
        for position, path in enumerate(ranking, 1):
            scores[path] = scores.get(path, 0.0) + 1 / (60 + position)
    return scores


def order(universe, *rankings):
    scores = rrf(*rankings)
    return sorted(universe, key=lambda path: (-scores.get(path, 0.0), path))


def test_classes(query):
    section = query.split("failure:\n", 1)[0].removeprefix("failing tests:\n")
    result = []
    for line in section.splitlines():
        if "#" not in line:
            continue
        qualified = line.split("#", 1)[0]
        parts = qualified.split(".")
        stem = SUFFIX.sub("", parts[-1])
        if stem and stem != parts[-1]:
            result.append((stem, parts[:-1]))
    return result


def symbol_rank(query, paths, tokenize):
    classes = test_classes(query)
    if not classes:
        return []
    ranked = []
    for path in paths:
        rel = PurePosixPath(path)
        stem = rel.stem
        stem_tokens = set(tokenize(stem))
        packages = [x.lower() for x in rel.parts[:-1]]
        score = 0.0
        for expected, package in classes:
            expected_tokens = set(tokenize(expected))
            if not expected_tokens:
                continue
            exact = stem.lower() == expected.lower()
            token_overlap = len(stem_tokens & expected_tokens) / len(stem_tokens | expected_tokens)
            if not exact and token_overlap == 0:
                continue
            package_overlap = sum(1 for part in package[-3:] if part.lower() in packages)
            candidate = (10.0 if exact else 0.0) + 3.0 * token_overlap + 0.2 * package_overlap
            score = max(score, candidate)
        if score > 0:
            ranked.append((score, path))
    return [path for _, path in sorted(ranked, key=lambda x: (-x[0], x[1]))[:30]]


def protect_consensus(candidate, baseline, are, raw):
    result = list(candidate)
    common = set(are[:3]) & set(raw[:3])
    for path in sorted(common, key=baseline.index):
        target = baseline.index(path)
        current = result.index(path)
        if current > target:
            result.pop(current)
            result.insert(target, path)
    return result


def main():
    parser = argparse.ArgumentParser()
    for name in ("source", "queries", "are", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    are_seal_path = args.are / "ARE-SEAL.json"
    if (args.output.exists() or sha(args.source.read_bytes()) != SOURCE_SHA
            or sha(args.queries.read_bytes()) != QUERIES_SHA
            or sha(BM25_PATH.read_bytes()) != BM25_SHA):
        raise SystemExit("output-or-input-drift")
    source = json.loads(args.source.read_bytes())["records"]
    queries = [json.loads(x) for x in args.queries.read_text().splitlines()]
    are_seal = json.loads(are_seal_path.read_bytes())
    if len(source) != 12 or len(queries) != 12 or are_seal["cases"] != 12:
        raise SystemExit("population-drift")
    spec = importlib.util.spec_from_file_location("pinned_bm25", BM25_PATH)
    bm25 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bm25)
    args.output.mkdir(mode=0o700, parents=True)
    save_new(args.output / "RANKING-FREEZE.json", (json.dumps({
        "schema_version": "are.g01-gitbug-r84-ranking-freeze/v1",
        "source_sha256": SOURCE_SHA, "queries_sha256": QUERIES_SHA,
        "are_seal_sha256": sha(are_seal_path.read_bytes()), "bm25_sha256": BM25_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R84-SYMBOL-DEV-PROTOCOL.md").read_bytes()),
        "cases": 12, "gold_values_used": False, "model_calls": 0},
        sort_keys=True, indent=2) + "\n").encode())
    output = []
    for i, (src, query) in enumerate(zip(source, queries, strict=True), 1):
        rank_path = args.are / f"ARE-RANKING-{i:02d}.json"
        if sha(rank_path.read_bytes()) != are_seal["rankings"][i-1]["sha256"]:
            raise SystemExit("are-ranking-drift")
        are = json.loads(rank_path.read_bytes())
        if (not (src["ordinal"] == query["ordinal"] == i)
                or src["repo"] != query["repo"] or src["repo"] != are["repo"]
                or src["base_commit"] != query["base_commit"]
                or query["query_sha256"] != are["query_sha256"]):
            raise SystemExit("case-binding-drift")
        root = Path(src["root"]).resolve(strict=True)
        if not root.is_relative_to(args.source.parent.resolve(strict=True)):
            raise SystemExit("source-root-escape")
        universe = are["ranked_files"]
        if len(universe) != src["projected_files"] or len(set(universe)) != len(universe):
            raise SystemExit("source-universe-drift")
        chunks = []
        for path in sorted(universe):
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
        snapshot = bm25.Snapshot(chunks, len(universe))
        raw = snapshot.rank(query["query"])
        symbol = symbol_rank(query["query"], universe, bm25.tokenize)
        a = order(universe, universe, raw)
        b = order(universe, raw, symbol)
        c = order(universe, universe, raw, symbol)
        c_safe = protect_consensus(c, a, universe, raw)
        if any(set(x) != set(universe) or len(x) != len(universe) for x in (raw,a,b,c,c_safe)):
            raise SystemExit("ranking-universe-drift")
        output.append({"schema_version": "are.g01-gitbug-r84-ranking/v1",
                       "ordinal": i, "repo": src["repo"],
                       "query_sha256": query["query_sha256"],
                       "candidate_count": len(universe), "symbol_positive": len(symbol),
                       "are": universe, "raw_bm25": raw, "symbol": symbol,
                       "a_are_raw": a, "b_raw_symbol": b,
                       "c_are_raw_symbol": c, "c_safe": c_safe})
        print(json.dumps({"ordinal": i, "files": len(universe),
                          "symbol_positive": len(symbol)}), flush=True)
        del snapshot, chunks
        gc.collect()
    data = "".join(json.dumps(x, sort_keys=True) + "\n" for x in output).encode()
    save_new(args.output / "RANKINGS.jsonl", data)
    save_new(args.output / "RANKING-SEAL.json", (json.dumps({
        "schema_version": "are.g01-gitbug-r84-ranking-seal/v1", "cases": 12,
        "rankings_sha256": sha(data),
        "freeze_sha256": sha((args.output / "RANKING-FREEZE.json").read_bytes()),
        "gold_values_used": False, "model_calls": 0}, sort_keys=True, indent=2) + "\n").encode())


if __name__ == "__main__":
    main()
