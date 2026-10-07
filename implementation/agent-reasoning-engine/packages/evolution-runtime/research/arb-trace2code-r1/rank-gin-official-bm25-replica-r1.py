#!/usr/bin/env python3
"""Source-only replica of pinned ARB chunk BM25 on exposed Gin queries."""

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
OFFICIAL_CODE_COMMIT = "07014c986f3deadb1548c62b32c0ffbe6a81465d"
TOKEN_RE = re.compile(r"[A-Za-z0-9]+")
K1 = 1.5
B = 0.75


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def tokenize(value: str) -> list[str]:
    spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
    return [token.lower() for token in TOKEN_RE.findall(spaced)]


def chunk_text(chunk: dict) -> str:
    return " ".join(str(part) for part in
                    (chunk.get("path"), chunk.get("symbol"), chunk.get("kind"), chunk.get("text")) if part)


def tail_window(value: str) -> str:
    return value.encode("utf-8")[-1024:].decode("utf-8", errors="replace").replace("\ufffd", "").strip()


def edge_window(value: str) -> str:
    raw = value.encode("utf-8")
    if len(raw) <= 1024:
        return value.strip()
    head = raw[:509].decode("utf-8", errors="replace").replace("\ufffd", "")
    tail = raw[-509:].decode("utf-8", errors="replace").replace("\ufffd", "")
    return f"{head}\n...\n{tail}".strip()


class Snapshot:
    def __init__(self, chunks: list[dict], expected_files: int) -> None:
        self.chunks = chunks
        self.paths = [str(chunk["path"]) for chunk in chunks]
        self.chunk_ids = [str(chunk.get("chunk_id") or "") for chunk in chunks]
        self.file_paths = set(self.paths)
        if len(self.file_paths) != expected_files:
            raise SystemExit("snapshot file count drift")
        self.postings: dict[str, list[tuple[int, int]]] = collections.defaultdict(list)
        self.lengths = []
        for index, chunk in enumerate(chunks):
            tokens = collections.Counter(tokenize(chunk_text(chunk)))
            self.lengths.append(sum(tokens.values()))
            for term, tf in tokens.items():
                self.postings[term].append((index, tf))
        self.average_length = sum(self.lengths) / len(self.lengths) if self.lengths else 0.0

    def rank(self, query: str) -> list[str]:
        query_counts = collections.Counter(tokenize(query))
        if not query_counts:
            raise SystemExit("empty comparator query")
        n = len(self.chunks)
        scores = [0.0] * n
        for term, query_count in query_counts.items():
            posting = self.postings.get(term, ())
            if not posting:
                continue
            df = len(posting)
            idf = math.log(1.0 + (n - df + 0.5) / (df + 0.5))
            for index, tf in posting:
                length_norm = 1.0 - B
                if self.average_length > 0:
                    length_norm += B * (self.lengths[index] / self.average_length)
                denominator = tf + K1 * length_norm
                scores[index] += query_count * idf * ((tf * (K1 + 1.0)) / denominator)
        order = sorted(range(n), key=lambda index: (-scores[index], self.paths[index], self.chunk_ids[index]))
        ranked = list(dict.fromkeys(self.paths[index] for index in order))
        if len(ranked) != len(self.file_paths):
            raise SystemExit("ranked file count drift")
        return ranked


def load_snapshot(source: pathlib.Path, manifest: dict, repo: str, commit: str) -> Snapshot:
    entry = manifest.get((repo, commit))
    if entry is None:
        raise SystemExit("missing source snapshot")
    relative = entry["chunks_path"].removeprefix("data/")
    if not relative.startswith("corpus/v2_trace2code/") or ".." in pathlib.PurePosixPath(relative).parts:
        raise SystemExit("unsafe chunk path")
    chunks = [json.loads(line) for line in (source / relative).read_text().splitlines()]
    if len(chunks) != entry["chunk_count"] or any(
            chunk.get("repo") != repo or chunk.get("base_commit") != commit for chunk in chunks):
        raise SystemExit("chunk identity/count drift")
    return Snapshot(chunks, entry["file_count"])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--queries", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    source, queries = (path.resolve(strict=True) for path in (args.source, args.queries))
    output = args.output.absolute()
    if output.exists() or sha256_file(source / "SOURCE-CORPUS-AUDIT.json") != SOURCE_AUDIT_SHA256 or \
            sha256_file(queries) != DEV_QUERIES_SHA256:
        raise SystemExit("output exists or input pin drift")
    items = [json.loads(line) for line in queries.read_text().splitlines()]
    if len(items) != 56 or len({row["id"] for row in items}) != 56 or any(
            row["repo"] != "gin-gonic/gin" or set(row["query"]) !=
            {"command", "failure_excerpt", "run_strategy", "source_type"} for row in items):
        raise SystemExit("development query shape drift")
    manifest = {(row["repo"], row["base_commit"]): row for row in
                (json.loads(line) for line in
                 (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())}
    grouped = collections.defaultdict(list)
    for index, item in enumerate(items):
        grouped[(item["repo"], item["base_commit"])].append((index, item))
    rows = [None] * len(items)
    total_chunks = 0
    for (repo, commit), group in grouped.items():
        snapshot = load_snapshot(source, manifest, repo, commit)
        total_chunks += len(snapshot.chunks)
        for index, item in group:
            query = item["query"]
            full = json.dumps(query, ensure_ascii=False, sort_keys=True)
            windows = {"full_json": full, "tail_failure": tail_window(query["failure_excerpt"]),
                       "edge_failure": edge_window(query["failure_excerpt"])}
            if any(not value or (name != "full_json" and len(value.encode("utf-8")) > 1024)
                   for name, value in windows.items()):
                raise SystemExit("query window invalid")
            rankings = {name: snapshot.rank(value) for name, value in windows.items()}
            rows[index] = {"id": item["id"], "repo": repo, "base_commit": commit,
                           "candidate_count": len(snapshot.file_paths), "chunk_count": len(snapshot.chunks),
                           "query_sha256": {name: hashlib.sha256(value.encode()).hexdigest()
                                            for name, value in windows.items()},
                           "rankings": rankings}
    if any(row is None for row in rows):
        raise SystemExit("missing ranked case")
    output.mkdir(parents=True, exist_ok=False)
    path = output / "OFFICIAL-BM25-REPLICA-RANKINGS.jsonl"
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows))
    seal = {"schema": "are.arb-trace2code-gin-official-bm25-replica-r1/v1",
            "posture": "source-only replica of pinned ARB chunk BM25; not official executable",
            "official_code_commit": OFFICIAL_CODE_COMMIT,
            "source_audit_sha256": SOURCE_AUDIT_SHA256, "dev_queries_sha256": DEV_QUERIES_SHA256,
            "prediction_sha256": sha256_file(path), "development_cases": len(rows),
            "snapshots": len(grouped), "loaded_chunks_across_snapshots": total_chunks,
            "gold_opened": False, "heldout_queries_opened": False, "model_calls": 0}
    (output / "SOURCE-SEAL.json").write_text(json.dumps(seal, indent=2, sort_keys=True) + "\n")
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
