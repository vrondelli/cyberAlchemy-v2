#!/usr/bin/env python3
"""Source-only ARB Gin development rankings: BM25 and fixed trace-aware r1."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import math
import pathlib
import re


SOURCE_AUDIT_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
DEV_QUERIES_SHA256 = "19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a"
STOP = {"and", "are", "build", "failed", "file", "for", "from", "gin", "github", "has", "not", "package", "test", "the", "type", "undefined", "with"}
WORD = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")
FIELD_ERROR = re.compile(r"type\s+([A-Za-z_][A-Za-z0-9_]*)\s+has no field or method\s+([A-Za-z_][A-Za-z0-9_]*)")
UNDEFINED = re.compile(r"undefined:\s*([A-Za-z_][A-Za-z0-9_]*)")


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def terms(value: str) -> list[str]:
    result = []
    for match in WORD.finditer(value):
        word = match.group()
        parts = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", word).replace("_", " ").split()
        result.extend(part.casefold() for part in [word, *parts] if len(part) >= 3 and part.casefold() not in STOP)
    return result


def query_anchors(failure: str) -> set[str]:
    anchors = set()
    for match in FIELD_ERROR.finditer(failure):
        anchors.update(terms(match.group(1)))
        anchors.update(terms(match.group(2)))
    for match in UNDEFINED.finditer(failure):
        anchors.update(terms(match.group(1)))
    return anchors


def load_snapshot(path: pathlib.Path, repo: str, commit: str) -> dict[str, dict]:
    documents: dict[str, dict] = {}
    with path.open(encoding="utf-8") as stream:
        for line in stream:
            row = json.loads(line)
            if row["repo"] != repo or row["base_commit"] != commit:
                raise SystemExit("source snapshot identity drift")
            file_path = row["path"]
            document = documents.setdefault(file_path, {"text": "", "symbols": []})
            if row["kind"] == "file":
                if document["text"]:
                    raise SystemExit("duplicate file-level chunk")
                document["text"] = row["text"]
            elif row["kind"] == "symbol":
                document["symbols"].append(row["symbol"] or "")
            else:
                raise SystemExit("unexpected source chunk kind")
    for name, document in documents.items():
        document["freq"] = collections.Counter(terms(document["text"] + " " + name))
        document["length"] = max(1, sum(document["freq"].values()))
        document["symbol_terms"] = set(terms(" ".join(document["symbols"])))
        document["path_terms"] = set(terms(name))
    return documents


def rankings(documents: dict[str, dict], query: dict) -> tuple[list[str], list[str]]:
    n = len(documents)
    df = collections.Counter(term for document in documents.values() for term in document["freq"])
    avg_len = sum(document["length"] for document in documents.values()) / n
    qterms = set(terms(query["failure_excerpt"] + " " + query["command"]))
    anchors = query_anchors(query["failure_excerpt"])
    baseline = {}
    treatment = {}
    for path, document in documents.items():
        score = 0.0
        for term in qterms:
            tf = document["freq"].get(term, 0)
            if tf:
                idf = math.log1p((n - df[term] + 0.5) / (df[term] + 0.5))
                score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * document["length"] / avg_len))
        baseline[path] = score
        anchor_bonus = sum(3.0 for term in anchors if term in document["symbol_terms"])
        anchor_bonus += sum(1.5 for term in anchors if term in document["freq"])
        anchor_bonus += sum(1.0 for term in anchors if term in document["path_terms"])
        test_penalty = 2.0 if path.endswith("_test.go") else 0.0
        treatment[path] = score + anchor_bonus - test_penalty
    return (
        sorted(documents, key=lambda path: (-baseline[path], path)),
        sorted(documents, key=lambda path: (-treatment[path], path)),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--queries", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    queries = args.queries.resolve(strict=True)
    output = args.output.absolute()
    if output.exists() or sha256_file(source / "SOURCE-CORPUS-AUDIT.json") != SOURCE_AUDIT_SHA256 or sha256_file(queries) != DEV_QUERIES_SHA256:
        raise SystemExit("output exists or source/query pin drift")
    manifest = {
        (row["repo"], row["base_commit"]): row
        for row in (json.loads(line) for line in (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())
    }
    cache = {}
    rows = []
    for line in queries.read_text().splitlines():
        item = json.loads(line)
        identity = (item["repo"], item["base_commit"])
        if item["repo"] != "gin-gonic/gin" or identity not in manifest:
            raise SystemExit("development query outside declared source split")
        if identity not in cache:
            relative = manifest[identity]["chunks_path"].removeprefix("data/")
            cache[identity] = load_snapshot(source / relative, *identity)
            if len(cache[identity]) != manifest[identity]["file_count"]:
                raise SystemExit("snapshot file count drift")
        baseline, trace_aware = rankings(cache[identity], item["query"])
        rows.append({"id": item["id"], "repo": item["repo"], "base_commit": item["base_commit"],
                     "candidate_count": len(baseline), "baseline_ranked_files": baseline,
                     "trace_aware_ranked_files": trace_aware})
    if len(rows) != 56 or len({row["id"] for row in rows}) != 56:
        raise SystemExit("development denominator mismatch")
    output.mkdir(parents=True, exist_ok=False)
    ranking_path = output / "SOURCE-RANKINGS.jsonl"
    with ranking_path.open("x", encoding="utf-8") as stream:
        for row in rows:
            stream.write(json.dumps(row, sort_keys=True) + "\n")
    receipt = {
        "schema": "are.arb-trace2code-gin-rankings-r1/v1",
        "source_audit_sha256": SOURCE_AUDIT_SHA256,
        "dev_queries_sha256": DEV_QUERIES_SHA256,
        "prediction_sha256": sha256_file(ranking_path),
        "development_cases": len(rows),
        "snapshot_count": len(cache),
        "baseline": "BM25 over file-level text and path; all snapshot files ranked",
        "trace_aware": "same BM25 plus fixed Go error-identifier symbol/text/path bonuses and _test.go penalty",
        "gold_opened": False,
        "model_calls": 0,
        "holdout_queries_opened": False,
    }
    (output / "SOURCE-SEAL.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, sort_keys=True))


if __name__ == "__main__":
    main()
