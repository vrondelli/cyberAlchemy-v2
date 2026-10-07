#!/usr/bin/env python3
"""Evaluator-only ARB BCY formula replica on exposed Gin development rankings."""

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
TAIL_SHA256 = "b2dbdbfc3145d0d313aa9aa3bf70162e97467f7f6bf51bd286bb0a82968335b7"
EDGE_SHA256 = "1e6d8d4170163318b05a693950db6609c21f7aef2d11911747e4f29c0cc30bcd"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"
OFFICIAL_CODE_COMMIT = "07014c986f3deadb1548c62b32c0ffbe6a81465d"
BUDGETS = (4000, 8000, 16000, 32000)
TOKEN_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*|[0-9]+|[^A-Za-z0-9_\s]", re.UNICODE)


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def token_count(value: str) -> int:
    return len(TOKEN_RE.findall(value))


def pack(ranking: list[str], gold: set[str], files: dict[str, str], budget: int) -> dict[str, float]:
    used = 0
    covered = set()
    packed_files = 0
    partial_files = 0
    for path in ranking[:20]:  # Official published details retain top-20 file lists.
        text = files.get(path)
        if text is None:
            raise SystemExit("ranked file missing from canonical corpus")
        header_tokens = token_count(f"### {path}\n")
        content_tokens = token_count(text)
        separator_tokens = 1 if text else 0
        total_tokens = header_tokens + content_tokens + separator_tokens
        if total_tokens <= 0:
            continue
        remaining = budget - used
        if remaining <= 0:
            break
        packed_files += 1
        if total_tokens <= remaining:
            used += total_tokens
            included_content_tokens = content_tokens
        else:
            partial_files += 1
            included_content_tokens = min(content_tokens, max(0, remaining - header_tokens))
            used = budget
        if path in gold and content_tokens > 0 and included_content_tokens >= 1:
            covered.add(path)
        if used >= budget:
            break
    return {"bcy": len(covered) / len(gold), "used_tokens": float(used),
            "packed_files": float(packed_files), "partial_files": float(partial_files)}


def load_snapshot(source: pathlib.Path, manifest: dict[tuple[str, str], dict], repo: str,
                  commit: str) -> dict[str, str]:
    entry = manifest.get((repo, commit))
    if entry is None:
        raise SystemExit("missing source snapshot")
    relative = entry["chunks_path"].removeprefix("data/")
    if not relative.startswith("corpus/v2_trace2code/") or ".." in pathlib.PurePosixPath(relative).parts:
        raise SystemExit("unsafe source path")
    files = {}
    with (source / relative).open(encoding="utf-8") as stream:
        for line in stream:
            row = json.loads(line)
            if row.get("repo") != repo or row.get("base_commit") != commit:
                raise SystemExit("snapshot identity drift")
            if row.get("kind") == "file":
                path = row["path"]
                if path in files:
                    raise SystemExit("duplicate file text")
                files[path] = str(row.get("text") or "")
    if len(files) != entry["file_count"]:
        raise SystemExit("snapshot file count drift")
    return files


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--tail", type=pathlib.Path, required=True)
    parser.add_argument("--edge", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, source, tail_path, edge_path = (path.resolve(strict=True) for path in
                                             (args.archive, args.source, args.tail, args.edge))
    output = args.output.absolute()
    if output.exists() or (sha256_file(archive), sha256_file(source / "SOURCE-CORPUS-AUDIT.json"),
                           sha256_file(tail_path), sha256_file(edge_path)) != (
            ARCHIVE_SHA256, SOURCE_AUDIT_SHA256, TAIL_SHA256, EDGE_SHA256):
        raise SystemExit("output exists or input pin drift")
    tail_rows = [json.loads(line) for line in tail_path.read_text().splitlines()]
    edge_rows = [json.loads(line) for line in edge_path.read_text().splitlines()]
    tail, edge = ({row["id"]: row for row in rows} for rows in (tail_rows, edge_rows))
    ids = set(tail)
    if (len(tail_rows), len(edge_rows), len(tail), len(edge)) != (56, 56, 56, 56) or \
            ids != set(edge) or hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest() != DEV_ID_SET_SHA256:
        raise SystemExit("development case-set drift")
    manifest = {(row["repo"], row["base_commit"]): row for row in
                (json.loads(line) for line in
                 (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())}
    snapshots = {}
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # No held-out label access.
            t, e = tail.get(row["id"]), edge.get(row["id"])
            if t is None or e is None or t["base_commit"] != row["base_commit"] or e["base_commit"] != row["base_commit"]:
                raise SystemExit("sample identity drift")
            key = (row["repo"], row["base_commit"])
            if key not in snapshots:
                snapshots[key] = load_snapshot(source, manifest, *key)
            files = snapshots[key]
            rankings = {"tail_bm25": t["bm25_ranked_files"],
                        "tail_trace_text": t["trace_text_ranked_files"],
                        "edge_bm25": e["edge_bm25"],
                        "edge_trace_text": e["edge_trace_text"]}
            common = set(rankings["tail_bm25"])
            if len(common) != len(files) or any(len(paths) != len(files) or set(paths) != common
                                               for paths in rankings.values()) or common != set(files):
                raise SystemExit("all-files candidate drift")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(common):
                raise SystemExit("gold outside canonical corpus")
            scored.append({"id": row["id"], "gold_file_count": len(gold),
                           "metrics": {name: {str(budget): pack(paths, gold, files, budget)
                                              for budget in BUDGETS}
                                       for name, paths in rankings.items()}})
    if len(scored) != 56 or {row["id"] for row in scored} != ids:
        raise SystemExit("scored denominator drift")
    names = ("tail_bm25", "tail_trace_text", "edge_bm25", "edge_trace_text")
    aggregates = {name: {str(budget): {
        metric: statistics.mean(row["metrics"][name][str(budget)][metric] for row in scored)
        for metric in ("bcy", "used_tokens", "packed_files", "partial_files")}
        for budget in BUDGETS} for name in names}
    comparisons = {str(budget): {mode: {
        "mean_bcy_delta": statistics.mean(
            row["metrics"][f"edge_{mode}"][str(budget)]["bcy"] -
            row["metrics"][f"tail_{mode}"][str(budget)]["bcy"] for row in scored),
        "improved": sum(row["metrics"][f"edge_{mode}"][str(budget)]["bcy"] >
                        row["metrics"][f"tail_{mode}"][str(budget)]["bcy"] for row in scored),
        "regressed": sum(row["metrics"][f"edge_{mode}"][str(budget)]["bcy"] <
                         row["metrics"][f"tail_{mode}"][str(budget)]["bcy"] for row in scored)}
        for mode in ("bm25", "trace_text")} for budget in BUDGETS}
    report = {"schema": "are.arb-trace2code-gin-bcy-audit-r1/v1",
              "posture": "local replica of canonical BCY formula on exposed Gin source projections; not official executable or holdout",
              "official_code_commit": OFFICIAL_CODE_COMMIT, "tokenizer": "regex_code_tokenizer_v1",
              "archive_sha256": ARCHIVE_SHA256, "source_audit_sha256": SOURCE_AUDIT_SHA256,
              "tail_sha256": TAIL_SHA256, "edge_sha256": EDGE_SHA256,
              "development_cases": len(scored), "gold_file_entries": sum(row["gold_file_count"] for row in scored),
              "heldout_gold_inspected": False, "budgets": BUDGETS, "rank_depth": 20,
              "aggregates": aggregates, "comparisons": comparisons,
              "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    output.mkdir(parents=True, exist_ok=False)
    (output / "EVALUATOR-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
