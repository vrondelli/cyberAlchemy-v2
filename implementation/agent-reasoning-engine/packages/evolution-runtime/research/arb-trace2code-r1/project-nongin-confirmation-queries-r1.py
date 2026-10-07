#!/usr/bin/env python3
"""Export only non-Gin query fields after the transfer protocol is frozen."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
SPLIT_SHA256 = "dc562df2664fcab9bca079ab502d4402aefec1f1eba48f366ad093bd9c783107"
SOURCE_AUDIT_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
QUERY_KEYS = {"command", "failure_excerpt", "run_strategy", "source_type"}


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def digest_ids(ids: list[str]) -> str:
    return hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--split", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, source, split = (path.resolve(strict=True) for path in (args.archive, args.source, args.split))
    if args.output.exists() or (sha256_file(archive), sha256_file(source / "SOURCE-CORPUS-AUDIT.json"),
                               sha256_file(split)) != (ARCHIVE_SHA256, SOURCE_AUDIT_SHA256, SPLIT_SHA256):
        raise SystemExit("output exists or pinned input drift")
    receipt = json.loads(split.read_text())
    if receipt.get("schema") != "are.arb-trace2code-repo-split/v1" or receipt.get("heldout_count") != 45 or \
            receipt.get("development_count") != 56 or receipt.get("archive_sha256") != ARCHIVE_SHA256:
        raise SystemExit("split receipt drift")
    snapshots = {(row["repo"], row["base_commit"]) for row in
                 (json.loads(line) for line in
                  (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())}
    projected = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("sample member missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] == "gin-gonic/gin":
                continue
            if row["task_type"] != "trace2code" or (row["repo"], row["base_commit"]) not in snapshots or \
                    set(row["query"]) != QUERY_KEYS:
                raise SystemExit("confirmation query/corpus drift")
            projected.append({"id": row["id"], "repo": row["repo"], "base_commit": row["base_commit"],
                              "query": {key: row["query"][key] for key in sorted(QUERY_KEYS)}})
    ids = [row["id"] for row in projected]
    if len(ids) != 45 or len(set(ids)) != 45 or digest_ids(ids) != receipt["heldout_id_set_sha256"]:
        raise SystemExit("confirmation denominator/ID drift")
    args.output.mkdir(parents=True, exist_ok=False)
    path = args.output / "CONFIRMATION-QUERIES.jsonl"
    path.write_text("".join(json.dumps(row, sort_keys=True, ensure_ascii=False) + "\n"
                            for row in sorted(projected, key=lambda item: item["id"])))
    seal = {"schema": "are.arb-trace2code-nongin-query-projection-r1/v1",
            "archive_sha256": ARCHIVE_SHA256, "split_receipt_sha256": sha256_file(split),
            "source_audit_sha256": SOURCE_AUDIT_SHA256, "case_count": 45,
            "id_set_sha256": digest_ids(ids), "query_projection_sha256": sha256_file(path),
            "gold_values_accessed": False, "gold_values_exported": False, "model_calls": 0}
    (args.output / "QUERY-SEAL.json").write_text(json.dumps(seal, indent=2, sort_keys=True) + "\n")
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
