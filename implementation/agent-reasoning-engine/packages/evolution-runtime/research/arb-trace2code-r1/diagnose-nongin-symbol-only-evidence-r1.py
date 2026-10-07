#!/usr/bin/env python3
"""Exploratory audit of query evidence omitted by capped file-level rows."""

from __future__ import annotations

import argparse
import collections
import hashlib
import importlib.util
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
SOURCE_AUDIT_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
QUERY_SHA256 = "fd40d61077846f49374ee61a87e561699d85de9016ac590790be5228fa67b08c"
ARB_SHA256 = "6dabb71899d0b3e8d35dae30658e8f803aec09fd67dbd973a06ad3f67b6d82f7"
ARE_SHA256 = "3a024e28c5abaeefdbc7db0ea056e8bc3a002a0d31f1589b754014f161236bcd"
REPLICA_SCRIPT_SHA256 = "f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def replica_module(path: pathlib.Path):
    if sha256_file(path) != REPLICA_SCRIPT_SHA256:
        raise SystemExit("tokenizer source drift")
    spec = importlib.util.spec_from_file_location("gin_bm25_replica", path)
    if spec is None or spec.loader is None:
        raise SystemExit("cannot load tokenizer")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def snapshot_terms(source: pathlib.Path, entry: dict, tokenize) -> dict:
    relative = entry["chunks_path"].removeprefix("data/")
    if not relative.startswith("corpus/v2_trace2code/") or ".." in pathlib.PurePosixPath(relative).parts:
        raise SystemExit("unsafe source path")
    files = collections.defaultdict(lambda: {"file_terms": None, "symbol_terms": set(),
                                       "file_bytes": None, "symbol_chunks": 0})
    for line in (source / relative).read_text().splitlines():
        row = json.loads(line)
        if row["repo"] != entry["repo"] or row["base_commit"] != entry["base_commit"]:
            raise SystemExit("snapshot identity drift")
        item = files[row["path"]]
        if row["kind"] == "file":
            if item["file_terms"] is not None:
                raise SystemExit("duplicate file row")
            item["file_terms"] = set(tokenize(row["text"] + " " + row["path"]))
            item["file_bytes"] = len(row["text"].encode())
        elif row["kind"] == "symbol":
            item["symbol_terms"].update(tokenize(str(row.get("symbol") or "") + " " + row["text"]))
            item["symbol_chunks"] += 1
        else:
            raise SystemExit("unexpected chunk kind")
    if len(files) != entry["file_count"] or any(item["file_terms"] is None for item in files.values()):
        raise SystemExit("file count drift")
    return files


def summarize(items: list[dict]) -> dict:
    return {"gold_files": len(items),
            "with_symbol_only_query_term": sum(item["symbol_only_query_terms"] > 0 for item in items),
            "mean_symbol_only_query_terms": statistics.mean(item["symbol_only_query_terms"] for item in items)
            if items else None,
            "mean_file_query_terms": statistics.mean(item["file_query_terms"] for item in items)
            if items else None,
            "capped_file_rows": sum(item["file_bytes"] >= 8000 for item in items)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("archive", "source", "queries", "arb", "are", "replica-script", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, source, queries, arb_path, are_path, script = (path.resolve(strict=True) for path in
                                                           (args.archive, args.source, args.queries,
                                                            args.arb, args.are, args.replica_script))
    if args.output.exists() or tuple(map(sha256_file, (archive, source / "SOURCE-CORPUS-AUDIT.json",
                                                     queries, arb_path, are_path))) != (
            ARCHIVE_SHA256, SOURCE_AUDIT_SHA256, QUERY_SHA256, ARB_SHA256, ARE_SHA256):
        raise SystemExit("output exists or input pin drift")
    replica = replica_module(script)
    query_by_id = {row["id"]: row for row in (json.loads(line) for line in queries.read_text().splitlines())}
    arb = {row["id"]: row for row in (json.loads(line) for line in arb_path.read_text().splitlines())}
    are = {row["id"]: row for row in (json.loads(line) for line in are_path.read_text().splitlines())}
    if len(query_by_id) != 45 or set(query_by_id) != set(arb) or set(arb) != set(are):
        raise SystemExit("case-set drift")
    manifest = {(row["repo"], row["base_commit"]): row for row in
                (json.loads(line) for line in
                 (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())}
    cache = {}
    numeric = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] == "gin-gonic/gin":
                continue
            item_id = row["id"]
            key = (row["repo"], row["base_commit"])
            if key not in cache:
                cache[key] = snapshot_terms(source, manifest[key], replica.tokenize)
            files = cache[key]
            edge = replica.edge_window(query_by_id[item_id]["query"]["failure_excerpt"])
            if hashlib.sha256(edge.encode()).hexdigest() != arb[item_id]["query_sha256"]["edge_failure"] or \
                    hashlib.sha256(edge.encode()).hexdigest() != are[item_id]["query_sha256"]:
                raise SystemExit("query identity drift")
            qterms = set(replica.tokenize(edge))
            aranks = {path: index for index, path in enumerate(arb[item_id]["rankings"]["edge_failure"], 1)}
            rranks = {path: index for index, path in enumerate(are[item_id]["trace_text_ranked_files"], 1)}
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(files) or set(aranks) != set(rranks) or set(aranks) != set(files):
                raise SystemExit("gold or candidate drift")
            for path in gold:
                item = files[path]
                numeric.append({"repo": key[0], "case_id": item_id,
                                "arb_rank": aranks[path], "are_rank": rranks[path],
                                "file_bytes": item["file_bytes"], "symbol_chunks": item["symbol_chunks"],
                                "file_query_terms": len(qterms & item["file_terms"]),
                                "symbol_only_query_terms": len((qterms & item["symbol_terms"]) - item["file_terms"])})
    if len(numeric) != 59:
        raise SystemExit("gold file denominator drift")
    groups = {"arb_better": [item for item in numeric if item["arb_rank"] < item["are_rank"]],
              "are_better": [item for item in numeric if item["are_rank"] < item["arb_rank"]],
              "tied": [item for item in numeric if item["arb_rank"] == item["are_rank"]]}
    per_repo = {repo: {name: summarize([item for item in values if item["repo"] == repo])
                       for name, values in groups.items()}
                for repo in sorted({item["repo"] for item in numeric})}
    report = {"schema": "are.arb-nongin-symbol-only-evidence-diagnostic-r1/v1",
              "posture": "post-confirmation exploratory token association; not causal proof or independent claim",
              "archive_sha256": ARCHIVE_SHA256, "source_audit_sha256": SOURCE_AUDIT_SHA256,
              "query_sha256": QUERY_SHA256, "arb_rankings_sha256": ARB_SHA256,
              "are_rankings_sha256": ARE_SHA256, "gold_files": len(numeric),
              "overall": {name: summarize(values) for name, values in groups.items()},
              "per_repo": per_repo,
              "per_gold_numeric_only": sorted(numeric, key=lambda item: (item["case_id"], item["arb_rank"]))}
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / "DIAGNOSTIC-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_gold_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
