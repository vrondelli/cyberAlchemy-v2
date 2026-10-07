#!/usr/bin/env python3
"""Replay the frozen symbol rule on exposed Bears Java, in two phases."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath

BEARS_RANK_SHA = "a8d1e2474275a58e013e3722400118c50c4a83ba8a83e3cdbaf3c7ddf4b0f699"
BEARS_QUERY_SHA = "be63d0919095bdca86090e86510a15368ea7b14cab8872f7765d17e928300d71"
BEARS_GOLD_SHA = "44bfee25a52adce3df5dbd449f218eb404ff1a00cae3199bfe9628620070f642"
SYMBOL_SHA = "5f82858f8cdb21186e6b9c4664b513935a60f68f0b7556cdd957d826170a519a"
BM25_SHA = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"
SYMBOL_PATH = Path(__file__).with_name("rank_symbol_dev_r84.py")
BM25_PATH = Path(__file__).resolve().parents[1] / "arb-trace2code-r1/rank-gin-official-bm25-replica-r1.py"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def rank(args):
    if (args.output.exists() or sha(args.rankings.read_bytes()) != BEARS_RANK_SHA
            or sha(args.queries.read_bytes()) != BEARS_QUERY_SHA
            or sha(SYMBOL_PATH.read_bytes()) != SYMBOL_SHA
            or sha(BM25_PATH.read_bytes()) != BM25_SHA):
        raise SystemExit("rank-input-drift")
    sym = module(SYMBOL_PATH, "r84_symbol")
    bm = module(BM25_PATH, "pinned_bm25")
    rankings = [json.loads(x) for x in args.rankings.read_text().splitlines()]
    queries = [json.loads(x) for x in args.queries.read_text().splitlines()]
    if len(rankings) != 24 or len(queries) != 24:
        raise SystemExit("population-drift")
    args.output.mkdir(mode=0o700, parents=True)
    rows = []
    for i, (row, query) in enumerate(zip(rankings, queries, strict=True), 1):
        if (row["ordinal"] != i or query["ordinal"] != i
                or row["repo"] != query["repo"]
                or row["query_sha256"] != query["query_sha256"]):
            raise SystemExit("case-binding-drift")
        are, raw, a = row["are"], row["raw_bm25"], row["base"]
        symbol = sym.symbol_rank(query["query"], are, bm.tokenize)
        b = sym.order(are, raw, symbol)
        c = sym.order(are, are, raw, symbol)
        safe = sym.protect_consensus(c, a, are, raw)
        if any(set(x) != set(are) or len(x) != len(are) for x in (raw,a,b,c,safe)):
            raise SystemExit("ranking-universe-drift")
        rows.append({"ordinal": i, "repo": row["repo"],
                     "query_sha256": row["query_sha256"],
                     "symbol_positive": len(symbol),
                     "a": a, "b": b, "c": c, "safe": safe})
    data = "".join(json.dumps(x, sort_keys=True) + "\n" for x in rows).encode()
    fd = os.open(args.output / "RANKINGS.jsonl", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    save_new(args.output / "SOURCE-SEAL.json", {
        "schema_version": "are.g01-bears-r88-exposed-source/v1", "cases": 24,
        "source_rankings_sha256": BEARS_RANK_SHA, "source_queries_sha256": BEARS_QUERY_SHA,
        "symbol_rule_sha256": SYMBOL_SHA, "bm25_tokenizer_sha256": BM25_SHA,
        "output_sha256": sha(data), "gold_values_used": False,
        "model_calls": 0})
    print(json.dumps({"cases": 24, "rankings_sha256": sha(data)}))


def evaluate(args):
    if (args.output.exists() or sha(args.gold.read_bytes()) != BEARS_GOLD_SHA):
        raise SystemExit("evaluation-input-drift")
    seal = json.loads((args.rank_dir / "SOURCE-SEAL.json").read_bytes())
    rank_path = args.rank_dir / "RANKINGS.jsonl"
    if sha(rank_path.read_bytes()) != seal["output_sha256"] or seal["gold_values_used"]:
        raise SystemExit("rank-seal-drift")
    rows = [json.loads(x) for x in rank_path.read_text().splitlines()]
    labels = json.loads(args.gold.read_bytes())["rows"]
    if len(rows) != 24 or len(labels) != 24:
        raise SystemExit("population-drift")
    result = []
    for i, (row, label) in enumerate(zip(rows, labels, strict=True), 1):
        if row["ordinal"] != i or label["ordinal"] != i or row["repo"] != label["repo"]:
            raise SystemExit("case-binding-drift")
        gold = label["gold_paths"]
        arms = {}
        for mode in ("all", "production"):
            arms[mode] = {}
            for arm in ("a", "b", "c", "safe"):
                rank = row[arm]
                if mode == "production":
                    rank = [path for path in rank
                            if "test" not in PurePosixPath(path).parts
                            and "tests" not in PurePosixPath(path).parts]
                if any(path not in rank for path in gold):
                    raise SystemExit("gold-excluded-by-source-role")
                first = min(rank.index(path) + 1 for path in gold)
                arms[mode][arm] = {"first_rank": first,
                                   "rr8": 1 / first if first <= 8 else 0,
                                   "hit3": int(first <= 3),
                                   "recall20": sum(path in rank[:20] for path in gold) / len(gold)}
        result.append({"ordinal": i, "repo": row["repo"], "scores": arms})
    summary = {mode: {arm: {metric: sum(row["scores"][mode][arm][metric] for row in result) / 24
                           for metric in ("rr8", "hit3", "recall20")}
                      for arm in ("a", "b", "c", "safe")}
               for mode in ("all", "production")}
    args.output.mkdir(mode=0o700, parents=True)
    save_new(args.output / "EXPOSED-EVALUATION.json", {
        "schema_version": "are.g01-bears-r88-exposed-evaluation/v1",
        "cases": 24, "gold_sha256": BEARS_GOLD_SHA,
        "rank_seal_sha256": sha((args.rank_dir / "SOURCE-SEAL.json").read_bytes()),
        "scores": summary, "rows": result, "claim_eligible": False})
    print(json.dumps(summary, sort_keys=True))


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="operation", required=True)
    source = sub.add_parser("rank")
    for name in ("rankings", "queries", "output"):
        source.add_argument("--" + name, required=True, type=Path)
    evaluator = sub.add_parser("evaluate")
    for name in ("rank_dir", "gold", "output"):
        evaluator.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    args = parser.parse_args()
    rank(args) if args.operation == "rank" else evaluate(args)


if __name__ == "__main__":
    main()
