#!/usr/bin/env python3
"""Source-only compact Java declaration BM25 on two exposed cohorts."""

import argparse
import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re

PINS = {
    "gitbug": {
        "source": "aaff284494a0726d5517a2f492a36186d6c34a35b4166819dc3a83f77211eb46",
        "queries": "478fc0b4fca5936cca09fdffe0a95b9dc2af2bb42482a9aa910fddc48be23eaf",
        "prior": "e1ef342e646806d223b3e8bf02c06c45f2f9b4f116b064aeaa708bf8cd6e774d",
        "cases": 12,
    },
    "bears": {
        "source": "33dc47d6db3804943b76a2dea11dcca3da35ab80451ddb6a9040a7d7dc944cf6",
        "queries": "be63d0919095bdca86090e86510a15368ea7b14cab8872f7765d17e928300d71",
        "prior": "da2a143c1d2eb6cdfe0f9906b962df7d4ea64c104aa313744a2021cfa577a08f",
        "cases": 24,
    },
}
BM25_SHA = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"
BM25_PATH = Path(__file__).resolve().parents[1] / "arb-trace2code-r1/rank-gin-official-bm25-replica-r1.py"
BEARS_RANK_SHA = "a8d1e2474275a58e013e3722400118c50c4a83ba8a83e3cdbaf3c7ddf4b0f699"
SYMBOL_SHA = "5f82858f8cdb21186e6b9c4664b513935a60f68f0b7556cdd957d826170a519a"
SYMBOL_PATH = Path(__file__).with_name("rank_symbol_dev_r84.py")
PACKAGE = re.compile(r"(?m)^\s*package\s+([A-Za-z_$][\w$.]*)\s*;")
TYPE = re.compile(r"(?m)^\s*(?:(?:public|private|protected|abstract|final|static|sealed|non-sealed)\s+)*(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)")
METHOD = re.compile(r"(?m)^\s*(?:(?:public|private|protected|static|final|abstract|synchronized|native|default|strictfp)\s+)*(?:[\w$<>\[\],.?]+\s+)+([A-Za-z_$][\w$]*)\s*\(")
SKIP = {"if", "for", "while", "switch", "catch", "return", "throw", "new", "super", "this"}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def representation(path, content):
    package = PACKAGE.search(content)
    types = list(dict.fromkeys(TYPE.findall(content)))[:64]
    methods = [name for name in dict.fromkeys(METHOD.findall(content)) if name not in SKIP][:256]
    text = " ".join((package.group(1) if package else "", " ".join(types), " ".join(methods)))
    return {"path": path, "chunk_id": path, "text": text, "symbol": "", "kind": ""}


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
    parser.add_argument("--population", required=True, choices=sorted(PINS))
    for name in ("source", "queries", "prior", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    parser.add_argument("--bears-original", type=Path)
    args = parser.parse_args()
    pin = PINS[args.population]
    if (args.output.exists() or sha(args.source.read_bytes()) != pin["source"]
            or sha(args.queries.read_bytes()) != pin["queries"]
            or sha(args.prior.read_bytes()) != pin["prior"]
            or sha(BM25_PATH.read_bytes()) != BM25_SHA):
        raise SystemExit("output-or-input-drift")
    srcs = json.loads(args.source.read_bytes())["records"]
    queries = [json.loads(x) for x in args.queries.read_text().splitlines()]
    prior = [json.loads(x) for x in args.prior.read_text().splitlines()]
    if any(len(rows) != pin["cases"] for rows in (srcs, queries, prior)):
        raise SystemExit("population-drift")
    spec = importlib.util.spec_from_file_location("pinned_bm25", BM25_PATH)
    bm25 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bm25)
    bears_original = None
    symbol_rule = None
    if args.population == "bears":
        if (args.bears_original is None
                or sha(args.bears_original.read_bytes()) != BEARS_RANK_SHA
                or sha(SYMBOL_PATH.read_bytes()) != SYMBOL_SHA):
            raise SystemExit("bears-original-or-symbol-drift")
        bears_original = [json.loads(x) for x in args.bears_original.read_text().splitlines()]
        if len(bears_original) != 24:
            raise SystemExit("bears-population-drift")
        symbol_spec = importlib.util.spec_from_file_location("r84_symbol", SYMBOL_PATH)
        symbol_rule = importlib.util.module_from_spec(symbol_spec)
        symbol_spec.loader.exec_module(symbol_rule)
    args.output.mkdir(mode=0o700, parents=True)
    save_new(args.output / "RANKING-FREEZE.json", (json.dumps({
        "schema_version": "are.g01-r90-structure-freeze/v1",
        "population": args.population, "cases": pin["cases"],
        "inputs_sha256": pin, "bm25_sha256": BM25_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R90-STRUCTURE-DEV-PROTOCOL.md").read_bytes()),
        "gold_values_used": False, "model_calls": 0}, sort_keys=True, indent=2) + "\n").encode())
    rows = []
    for i, (src, query, old) in enumerate(zip(srcs, queries, prior, strict=True), 1):
        if (not (src["ordinal"] == query["ordinal"] == old["ordinal"] == i)
                or src["repo"] != query["repo"] or src["repo"] != old["repo"]
                or query["query_sha256"] != old["query_sha256"]):
            raise SystemExit("case-binding-drift")
        root = Path(src["root"]).resolve(strict=True)
        if not root.is_relative_to(args.source.parent.resolve(strict=True)):
            raise SystemExit("source-root-escape")
        if args.population == "gitbug":
            actual_are = old["are"]
            raw = old["raw_bm25"]
            symbol = old["symbol"]
            baseline = old["a_are_raw"]
        else:
            # Bears r88 stores complete A/B ranks but not standalone ARE/raw;
            # recover those from the separately sealed r77 source rankings.
            original = bears_original[i-1]
            if (original["ordinal"] != i or original["repo"] != src["repo"]
                    or original["query_sha256"] != query["query_sha256"]):
                raise SystemExit("bears-original-case-drift")
            actual_are, raw = original["are"], original["raw_bm25"]
            baseline = old["a"]
            symbol = []  # Bears r88 symbol list is not exported; derive below.
        if len(actual_are) != src["projected_files"]:
            raise SystemExit("source-file-count-drift")
        chunks = []
        for path in sorted(actual_are):
            rel = PurePosixPath(path)
            if rel.is_absolute() or ".." in rel.parts or not path.endswith(".java"):
                raise SystemExit("unsafe-source-path")
            target = root.joinpath(*rel.parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit("source-path-escape")
            chunks.append(representation(path, target.read_text(encoding="utf-8", errors="replace")))
        snap = bm25.Snapshot(chunks, len(actual_are))
        structured = snap.rank(query["query"])
        if args.population == "bears":
            # Equivalent source-only test-class projection from the pinned
            # r84 function, reconstructed from the failure query.
            symbol = symbol_rule.symbol_rank(query["query"], actual_are, bm25.tokenize)
        strong = order(actual_are, raw, symbol, structured)
        treatment = order(actual_are, actual_are, raw, symbol, structured)
        safe = protect(treatment, baseline, actual_are, raw)
        if any(set(x) != set(actual_are) or len(x) != len(actual_are)
               for x in (structured,strong,treatment,safe)):
            raise SystemExit("ranking-universe-drift")
        rows.append({"ordinal": i, "repo": src["repo"],
                     "query_sha256": query["query_sha256"],
                     "structure_bm25": structured,
                     "strong_raw_symbol_structure": strong,
                     "treatment_are_raw_symbol_structure": treatment,
                     "treatment_safe": safe})
        print(json.dumps({"ordinal": i, "files": len(actual_are)}), flush=True)
        del snap, chunks
        gc.collect()
    data = "".join(json.dumps(x, sort_keys=True) + "\n" for x in rows).encode()
    save_new(args.output / "RANKINGS.jsonl", data)
    save_new(args.output / "RANKING-SEAL.json", (json.dumps({
        "schema_version": "are.g01-r90-structure-seal/v1",
        "population": args.population, "cases": pin["cases"],
        "rankings_sha256": sha(data), "gold_values_used": False,
        "model_calls": 0}, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"cases": pin["cases"], "rankings_sha256": sha(data)}))


if __name__ == "__main__":
    main()
