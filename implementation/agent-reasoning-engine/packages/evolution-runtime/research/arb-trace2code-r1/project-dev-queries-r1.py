#!/usr/bin/env python3
"""Evaluator-only ARB projection: export Gin development queries, never gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
DEV_REPO = "gin-gonic/gin"
QUERY_KEYS = {"command", "failure_excerpt", "run_strategy", "source_type"}
CORPUS_KEYS = {"base_commit", "type"}


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def digest_ids(ids: list[str]) -> str:
    return hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive = args.archive.resolve(strict=True)
    source = args.source.resolve(strict=True)
    output = args.output.absolute()
    if output.exists():
        raise SystemExit("refusing existing output")
    if sha256_file(archive) != ARCHIVE_SHA256:
        raise SystemExit("archive hash mismatch")
    source_audit = source / "SOURCE-CORPUS-AUDIT.json"
    audit = json.loads(source_audit.read_text())
    if audit.get("schema") != "are.arb-trace2code-source-audit/v1" or audit.get("chunk_rows") != 356074:
        raise SystemExit("source-only corpus audit missing or failed")
    snapshots = {
        (entry["repo"], entry["base_commit"])
        for entry in (
            json.loads(line)
            for line in (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines()
            if line.strip()
        )
    }

    dev = []
    holdout_ids = []
    all_ids = set()
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark sample member missing")
        for line in stream:
            row = json.loads(line)
            identity = row["id"]
            if not isinstance(identity, str) or not identity or identity in all_ids:
                raise SystemExit("invalid or duplicate sample ID")
            all_ids.add(identity)
            if row.get("task_type") != "trace2code" or (row.get("repo"), row.get("base_commit")) not in snapshots:
                raise SystemExit("task or corpus snapshot mismatch")
            if set(row["query"]) != QUERY_KEYS or not all(isinstance(v, str) for v in row["query"].values()):
                raise SystemExit("unexpected query schema")
            if set(row["candidate_corpus"]) != CORPUS_KEYS or row["candidate_corpus"]["type"] != "repo_at_base_commit":
                raise SystemExit("unexpected candidate corpus identity")
            if row["candidate_corpus"]["base_commit"] != row["base_commit"]:
                raise SystemExit("candidate corpus base mismatch")
            if row["repo"] != DEV_REPO:
                holdout_ids.append(identity)
                continue
            # Explicit allowlist: no gold, spans, metadata, negatives or provenance.
            dev.append({
                "id": identity,
                "repo": row["repo"],
                "base_commit": row["base_commit"],
                "task_type": row["task_type"],
                "version": row["version"],
                "candidate_corpus": {key: row["candidate_corpus"][key] for key in sorted(CORPUS_KEYS)},
                "query": {key: row["query"][key] for key in sorted(QUERY_KEYS)},
            })
    if len(all_ids) != 101 or len(dev) != 56 or len(holdout_ids) != 45:
        raise SystemExit("unexpected development/holdout counts")

    output.mkdir(parents=True, exist_ok=False)
    projection = output / "DEV-QUERIES.jsonl"
    with projection.open("x", encoding="utf-8") as stream:
        for row in sorted(dev, key=lambda item: item["id"]):
            stream.write(json.dumps(row, sort_keys=True, ensure_ascii=False) + "\n")
    receipt = {
        "schema": "are.arb-trace2code-repo-split/v1",
        "archive_sha256": ARCHIVE_SHA256,
        "source_audit_sha256": sha256_file(source_audit),
        "rule": "development repo gin-gonic/gin; all other repos held out before any ARB score",
        "later_evaluator_candidate_filter": "all_files",
        "development_count": len(dev),
        "development_query_sha256": sha256_file(projection),
        "development_id_set_sha256": digest_ids([row["id"] for row in dev]),
        "heldout_count": len(holdout_ids),
        "heldout_id_set_sha256": digest_ids(holdout_ids),
        "heldout_queries_exported": False,
        "gold_values_exported": False,
    }
    (output / "SPLIT-RECEIPT.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, sort_keys=True))


if __name__ == "__main__":
    main()
