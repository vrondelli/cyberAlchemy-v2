#!/usr/bin/env python3
"""Rank all r1+r2b source files with pinned CodeRankEmbed for G01 r55."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import platform
import sys
import time

import numpy as np
import sentence_transformers
import torch
import transformers
from sentence_transformers import SentenceTransformer


REVISION = "3c4b60807d71f79b43f3c4363786d9493691f8b1"
PINS = {
    "r1_projection": "d5e909aa9d2250e437bc5f9ad8b6c0845204ad9bbe86c1e465b2dccbe8fc350e",
    "r2b_projection": "cdee5d69535ff44ac1aca8d8f3fcea4b59f9b7519db504eeb328781738281ea2",
    "r1_queries": "bb35ea15fa9498511e329cd298084c4db7f31a636ca071ef4bb6d142f9b327f2",
    "r2b_queries": "3dabb5d1571bc852d2234bf55dcbdc1934bd2f68579f1c0a052fcebcba328251",
    "r1_are": "12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2",
    "r2b_are": "2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d",
}
VERSIONS = {"python": "3.13.16", "torch": "2.14.1+cpu", "transformers": "4.45.1",
            "sentence_transformers": "5.2.3", "numpy": "2.5.3"}


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def jsonl(path: pathlib.Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines()]


def save_exclusive(path: pathlib.Path, value: object) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def chunks(root: pathlib.Path, paths: list[str]) -> tuple[list[str], list[str]]:
    texts, owners = [], []
    for path in paths:
        rel = pathlib.PurePosixPath(path)
        if rel.is_absolute() or ".." in rel.parts:
            raise ValueError("unsafe source path")
        target = root.joinpath(*rel.parts).resolve(strict=True)
        if not target.is_relative_to(root) or not target.is_file():
            raise ValueError("source escape or missing file")
        lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
        windows = [lines[start:start + 120] for start in range(0, len(lines), 120)] or [[]]
        for window in windows:
            texts.append(f"# path: {path}\n" + "\n".join(window))
            owners.append(path)
    return texts, owners


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    parser.add_argument("--cache", type=pathlib.Path, required=True)
    args = parser.parse_args()
    current = {"python": platform.python_version(), "torch": torch.__version__,
               "transformers": transformers.__version__,
               "sentence_transformers": sentence_transformers.__version__, "numpy": np.__version__}
    if current != VERSIONS:
        raise SystemExit(f"environment drift: {current}")
    files = {
        "r1_projection": args.archive / "source-projection-r1/SOURCE-PROJECTION-RECEIPT.json",
        "r2b_projection": args.archive / "source-projection-r2b/SOURCE-PROJECTION-RECEIPT.json",
        "r1_queries": args.archive / "query-projection-r1/QUERIES.jsonl",
        "r2b_queries": args.archive / "query-projection-r2b/QUERIES.jsonl",
        "r1_are": args.archive / "are-rankings-r1/ARE-RANKINGS.jsonl",
        "r2b_are": args.archive / "are-rankings-r2b/ARE-RANKINGS.jsonl",
    }
    if any(sha(path) != PINS[name] for name, path in files.items()):
        raise SystemExit("input drift")
    script_sha = sha(pathlib.Path(__file__).resolve())
    if not args.output.exists():
        args.output.mkdir(parents=True)
        save_exclusive(args.output / "RUN-FREEZE.json", {
            "schema_version": "are.g01-r55-coderank-run-freeze/v1", "cases": 48,
            "revision": REVISION, "environment": VERSIONS, "input_sha256": PINS,
            "script_sha256": script_sha, "window_lines": 120, "batch_size": 8,
            "maximum_sequence_length": 2048, "query_prefix": "Represent this query for searching relevant code:",
            "file_collapse": "maximum normalized cosine over windows", "tie_break": "exact path",
            "gold_opened": False,
        })
    else:
        freeze = json.loads((args.output / "RUN-FREEZE.json").read_text())
        if freeze["script_sha256"] != script_sha or freeze["revision"] != REVISION:
            raise SystemExit("resume freeze drift")
    cases = []
    for cohort in ("r1", "r2b"):
        projection = {row["case"]: row for row in
                      json.loads(files[f"{cohort}_projection"].read_text())["records"]}
        queries = {row["id"]: row for row in jsonl(files[f"{cohort}_queries"])}
        rankings = {row["id"]: row for row in jsonl(files[f"{cohort}_are"])}
        if not (len(projection) == len(queries) == len(rankings) == 24):
            raise SystemExit("case map drift")
        for case_id in sorted(queries):
            cases.append((cohort, case_id, projection[case_id], queries[case_id], rankings[case_id]))
    if len(cases) != 48:
        raise SystemExit("case denominator drift")
    model = SentenceTransformer("nomic-ai/CodeRankEmbed", revision=REVISION,
                                trust_remote_code=True, device="cpu", cache_folder=str(args.cache))
    model.max_seq_length = 2048
    for ordinal, (cohort, case_id, projection, query, are) in enumerate(cases, 1):
        checkpoint = args.output / f"CASE-{ordinal:03d}.json"
        if checkpoint.exists():
            prior = json.loads(checkpoint.read_text())
            if prior["cohort"] != cohort or prior["case_id"] != case_id:
                raise SystemExit("checkpoint identity drift")
            print(json.dumps({"ordinal": ordinal, "case": f"{cohort}/{case_id}", "status": "resumed"}), flush=True)
            continue
        paths = are["ranked_files"]
        if len(paths) != projection["projected_files"] or set(paths) != set(are["ranked_files"]):
            raise SystemExit("universe drift")
        root = pathlib.Path(projection["root"]).resolve(strict=True)
        started = time.monotonic()
        texts, owners = chunks(root, paths)
        query_text = "Represent this query for searching relevant code: " + query["query"]
        qvec = model.encode([query_text], batch_size=1, normalize_embeddings=True,
                            convert_to_numpy=True, show_progress_bar=False)[0]
        vectors = model.encode(texts, batch_size=8, normalize_embeddings=True,
                               convert_to_numpy=True, show_progress_bar=False)
        similarities = vectors @ qvec
        scores = {path: -2.0 for path in paths}
        for path, value in zip(owners, similarities, strict=True):
            scores[path] = max(scores[path], float(value))
        ranked = sorted(paths, key=lambda path: (-scores[path], path))
        row = {
            "schema_version": "are.g01-r55-coderank-case/v1", "ordinal": ordinal,
            "cohort": cohort, "case_id": case_id, "repo": query["repo"],
            "base_commit": query["base_commit"], "query_sha256": query["query_sha256"],
            "candidate_count": len(paths), "chunk_count": len(texts),
            "elapsed_ms": round((time.monotonic() - started) * 1000),
            "ranked_files": ranked, "ranked_scores": [scores[path] for path in ranked],
        }
        save_exclusive(checkpoint, row)
        print(json.dumps({"ordinal": ordinal, "case": f"{cohort}/{case_id}",
                          "files": len(paths), "chunks": len(texts), "elapsed_ms": row["elapsed_ms"]}), flush=True)
    rows = [json.loads((args.output / f"CASE-{ordinal:03d}.json").read_text()) for ordinal in range(1, 49)]
    output = args.output / "CODERANK-RANKINGS.jsonl"
    if not output.exists():
        descriptor = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w") as stream:
            for row in rows: stream.write(json.dumps(row, sort_keys=True) + "\n")
        save_exclusive(args.output / "SOURCE-SEAL.json", {
            "schema_version": "are.g01-r55-coderank-seal/v1", "status": "complete",
            "cases": 48, "rankings_sha256": sha(output), "run_freeze_sha256": sha(args.output / "RUN-FREEZE.json"),
            "total_files": sum(row["candidate_count"] for row in rows),
            "total_chunks": sum(row["chunk_count"] for row in rows),
            "summed_elapsed_ms": sum(row["elapsed_ms"] for row in rows), "gold_opened": False,
        })
    print(json.dumps(json.loads((args.output / "SOURCE-SEAL.json").read_text()), sort_keys=True))


if __name__ == "__main__":
    main()
