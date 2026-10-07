#!/usr/bin/env python3
"""Evaluator-only 8K budgeted-context audit of sealed exposed ARB rankings."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
SOURCE_AUDIT_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
PREDICTION_SHA256 = "43715becfba62f33ccab93e405cae07c7af2ac8bed8fe33622621303703dbe1c"
TOKEN_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*|[0-9]+|[^A-Za-z0-9_\s]", re.UNICODE)
ARMS = ("arb_edge_bm25", "are_edge_trace_text", "trace_source_neighbor")
BUDGETS = (4_000, 8_000, 16_000, 32_000)


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_jsonl(path: pathlib.Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines()]


def tokens(text: str) -> int:
    return len(TOKEN_RE.findall(text))


def pack(ranking: list[str], gold: set[str], file_texts: dict[str, str], budget: int) -> dict:
    used = 0
    covered_1 = set()
    covered_16 = set()
    packed_files = 0
    partial_files = 0
    for path in ranking[:20]:
        text = file_texts[path]
        header = tokens(f"### {path}\n")
        content = tokens(text)
        separator = 1 if text else 0
        total = header + content + separator
        if total <= 0:
            continue
        remaining = budget - used
        if remaining <= 0:
            break
        packed_files += 1
        if total <= remaining:
            included = content
            used += total
        else:
            partial_files += 1
            included = min(content, max(0, remaining - header))
            used = budget
        if path in gold and content > 0:
            if included >= 1:
                covered_1.add(path)
            if included >= min(16, content):
                covered_16.add(path)
        if used >= budget:
            break
    return {"bcy": len(covered_1) / len(gold), "bcy_min16": len(covered_16) / len(gold),
            "used_tokens": used, "packed_files": packed_files, "partial_files": partial_files}


def aggregate(rows: list[dict]) -> dict:
    output = {"cases": len(rows), "arms": {}}
    for arm in ARMS:
        output["arms"][arm] = {
            str(budget): {metric: statistics.mean(row["metrics"][arm][str(budget)][metric] for row in rows)
                          for metric in ("bcy", "bcy_min16", "used_tokens", "packed_files", "partial_files")}
            for budget in BUDGETS}
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("archive", "source", "rankings", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, source, rankings = (path.resolve(strict=True) for path in
                                 (args.archive, args.source, args.rankings))
    if args.output.exists() or tuple(map(sha256_file, (
            archive, source / "SOURCE-CORPUS-AUDIT.json", rankings))) != (
            ARCHIVE_SHA256, SOURCE_AUDIT_SHA256, PREDICTION_SHA256):
        raise SystemExit("output exists or input pin drift")
    seal = json.loads((rankings.parent / "SOURCE-SEAL.json").read_text())
    if seal.get("prediction_sha256") != PREDICTION_SHA256 or seal.get("gold_opened") is not False:
        raise SystemExit("source-side seal drift")
    predictions = {row["id"]: row for row in load_jsonl(rankings)}
    if len(predictions) != 101:
        raise SystemExit("prediction denominator drift")
    manifest_rows = load_jsonl(source / "corpus/v2_trace2code/corpus_manifest.jsonl")
    manifest = {(row["repo"], row["base_commit"]): row for row in manifest_rows}
    if len(manifest_rows) != 98 or len(manifest) != 98:
        raise SystemExit("corpus manifest drift")
    samples = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("sample member missing")
        for line in stream:
            row = json.loads(line)
            prediction = predictions.get(row["id"])
            if prediction is None or (prediction["repo"], prediction["base_commit"]) != (
                    row["repo"], row["base_commit"]):
                raise SystemExit("sample identity drift")
            samples.append((row, prediction))
    if len(samples) != 101 or {row["id"] for row, _ in samples} != set(predictions):
        raise SystemExit("sample denominator drift")
    grouped: dict[tuple[str, str], list[tuple[dict, dict]]] = {}
    for pair in samples:
        row, _ = pair
        grouped.setdefault((row["repo"], row["base_commit"]), []).append(pair)
    scored = []
    for key, pairs in sorted(grouped.items()):
        meta = manifest.get(key)
        if meta is None or meta["status"] != "ok":
            raise SystemExit("snapshot missing")
        rel = pathlib.PurePosixPath(meta["chunks_path"])
        if rel.parts[:2] != ("data", "corpus") or ".." in rel.parts:
            raise SystemExit("unsafe source path")
        chunks_path = source.joinpath(*rel.parts[1:]).resolve(strict=True)
        if not chunks_path.is_relative_to(source):
            raise SystemExit("source path escapes isolated tree")
        file_texts = {}
        chunk_count = 0
        with chunks_path.open() as stream:
            for line in stream:
                chunk = json.loads(line)
                chunk_count += 1
                if chunk["kind"] == "file":
                    path = chunk["path"]
                    if path in file_texts:
                        raise SystemExit("duplicate file row")
                    file_texts[path] = str(chunk.get("text") or "")
        if chunk_count != meta["chunk_count"] or len(file_texts) != meta["file_count"]:
            raise SystemExit("snapshot count drift")
        for row, prediction in pairs:
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(file_texts):
                raise SystemExit("gold outside snapshot")
            if any(len(prediction[arm]) != len(file_texts) or set(prediction[arm]) != set(file_texts)
                   for arm in ARMS):
                raise SystemExit("ranking candidate universe drift")
            scored.append({"id": row["id"], "repo": row["repo"], "gold_count": len(gold),
                           "metrics": {arm: {str(budget): pack(prediction[arm], gold, file_texts, budget)
                                             for budget in BUDGETS} for arm in ARMS}})
    if len(scored) != 101:
        raise SystemExit("scored denominator drift")
    gin = [row for row in scored if row["repo"] == "gin-gonic/gin"]
    nongin = [row for row in scored if row["repo"] != "gin-gonic/gin"]
    if len(gin) != 56 or len(nongin) != 45:
        raise SystemExit("split drift")
    report = {"schema": "are.arb-exposed-trace-source-neighbor-bcy-audit-r1/v1",
              "posture": "post-confirmation exposed evaluator-only budget diagnostic; no independent claim",
              "tokenizer": "regex_code_tokenizer_v1", "rank_prefix": 20,
              "packing_rule": "official greedy file text with path header, prefix truncate, >=1 content token",
              "archive_sha256": ARCHIVE_SHA256, "source_audit_sha256": SOURCE_AUDIT_SHA256,
              "prediction_sha256": PREDICTION_SHA256, "cases": len(scored),
              "gold_file_entries": sum(row["gold_count"] for row in scored),
              "all_101": aggregate(scored), "gin_56": aggregate(gin), "nongin_45": aggregate(nongin),
              "per_repo": {repo: aggregate([row for row in scored if row["repo"] == repo])
                           for repo in sorted({row["repo"] for row in scored})},
              "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    args.output.mkdir(parents=True, exist_ok=False)
    output = args.output / "BCY-AUDIT.json"
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"cases": report["cases"], "all_101": report["all_101"],
                      "gin_56": report["gin_56"], "nongin_45": report["nongin_45"],
                      "output_sha256": sha256_file(output)}, sort_keys=True))


if __name__ == "__main__":
    main()
