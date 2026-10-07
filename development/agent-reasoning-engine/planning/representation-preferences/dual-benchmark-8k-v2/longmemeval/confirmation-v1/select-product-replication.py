#!/usr/bin/env python3
"""Freeze and project an 80-question LongMemEval-S source-only replication cohort."""
import argparse
import hashlib
import json
import os
from pathlib import Path

from project_stream import Reader, SOURCE_BYTES, SOURCE_SHA256, ProjectionError, project_stream, record


SEED = b"are-product-replication-g03-v1\x00"
PRIOR_FOUR = {"0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs"}
SOURCE_FIELDS = {"question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"}


class Discard:
    def put(self, _text):
        pass


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def scan(source):
    with source.open("rb") as stream:
        reader = Reader(stream, SOURCE_BYTES)
        reader.expect("[")
        rows, seen = [], set()
        while True:
            item = record(reader, Discard())
            question_id, question_type = item["question_id"], item["question_type"]
            if question_id in seen or not isinstance(question_type, str) or not question_type:
                raise ProjectionError("duplicate question ID or missing type")
            seen.add(question_id)
            rows.append({"question_id": question_id, "question_type": question_type})
            reader.ws()
            delimiter = reader.get()
            if delimiter == "]":
                break
            if delimiter != ",":
                raise ProjectionError("invalid top-level array")
        reader.ws()
        if reader.peek() or len(rows) != 500 or reader.count != SOURCE_BYTES or reader.hash.hexdigest() != SOURCE_SHA256:
            raise ProjectionError("source identity drift")
        return rows


def choose(rows, excluded, target=80):
    types = sorted({row["question_type"] for row in rows})
    if len(types) != 6 or target != 80:
        raise ValueError("expected six source question types and 80 tasks")
    quotas = {question_type: target // len(types) + (index < target % len(types))
              for index, question_type in enumerate(types)}
    rank = lambda row: hashlib.sha256(SEED + row["question_id"].encode()).hexdigest()
    buckets = {}
    for question_type in types:
        available = sorted((row for row in rows if row["question_type"] == question_type
                            and row["question_id"] not in excluded), key=rank)
        if len(available) < quotas[question_type]:
            raise ValueError(f"{question_type}: insufficient unexposed source-only questions")
        buckets[question_type] = available[:quotas[question_type]]
    if not any(row["question_id"].endswith("_abs") for bucket in buckets.values() for row in bucket):
        abstentions = sorted((row for row in rows if row["question_id"].endswith("_abs")
                              and row["question_id"] not in excluded), key=rank)
        if not abstentions:
            raise ValueError("no unexposed abstention question")
        replacement = abstentions[0]
        bucket = buckets[replacement["question_type"]]
        bucket[-1] = replacement
        bucket.sort(key=rank)
    selected = [buckets[question_type][index] for index in range(max(quotas.values()))
                for question_type in types if index < len(buckets[question_type])]
    if len(selected) != target or len({row["question_id"] for row in selected}) != target:
        raise ValueError("selected denominator invalid")
    return selected, quotas


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--queue", required=True, type=Path)
    parser.add_argument("--prior-manifest", required=True, type=Path)
    parser.add_argument("--output-root", required=True, type=Path)
    args = parser.parse_args()
    source, queue_path, prior_path, root = [path.resolve() for path in
                                            (args.source, args.queue, args.prior_manifest, args.output_root)]
    if root.exists() or source.stat().st_size != SOURCE_BYTES or source.stat().st_mode & 0o222:
        raise ValueError("source or new output root invalid")
    queue_bytes, prior_bytes = queue_path.read_bytes(), prior_path.read_bytes()
    queue, prior = json.loads(queue_bytes), json.loads(prior_bytes)
    if queue.get("schema_version") != "are.longmemeval-unexposed-candidate-queue/v2" or \
       queue.get("selection_uses_evaluator_data") is not False or \
       prior.get("schema_version") != "are.longmemeval-fast-cohort-source/v1" or len(prior.get("question_ids", [])) != 16:
        raise ValueError("exposure evidence invalid")
    excluded = set(queue["exposed_ids"]) | set(prior["question_ids"]) | PRIOR_FOUR
    rows = scan(source)
    selected, quotas = choose(rows, excluded)
    root.mkdir(mode=0o700)
    selection = {"schema_version": "are.longmemeval-product-replication-selection/v1",
                 "status": "frozen-before-model-dispatch", "source_revision": "98d7416c24c778c2fee6e6f3006e7a073259d48f",
                 "source_sha256": SOURCE_SHA256, "source_bytes": SOURCE_BYTES,
                 "source_records": len(rows), "source_fields": sorted(SOURCE_FIELDS),
                 "selector_sha256": digest(Path(__file__)),
                 "parser_sha256": digest(Path(__file__).with_name("project_stream.py")),
                 "queue_file_sha256": hashlib.sha256(queue_bytes).hexdigest(),
                 "prior_manifest_sha256": hashlib.sha256(prior_bytes).hexdigest(),
                 "prior_four_question_ids": sorted(PRIOR_FOUR), "excluded_count": len(excluded),
                 "seed_hex": SEED.hex(), "selection_rule": "SHA-256 seed+question ID ascending within six types; 80 round-robin slots; force lowest-ranked unexposed _abs only if draw has none",
                 "type_quotas": quotas, "ordered_questions": selected,
                 "reference_fields_read": False, "evaluator_fields_emitted": False,
                 "provider_calls": 0, "authority_effect": "none"}
    with (root / "SELECTION.json").open("x") as out:
        json.dump(selection, out, indent=2); out.write("\n")
    with source.open("rb") as stream:
        receipt = project_stream(stream, root / "source", question_ids=[row["question_id"] for row in selected],
                                 expected_selection_size=80, output_limit=64 * 1024**2)
    projected = {row["question_id"]: row for row in receipt["selected"]}
    bindings = []
    for index, row in enumerate(selected):
        item = projected[row["question_id"]]
        if item["question_type"] != row["question_type"]:
            raise ValueError("source question-type drift")
        bindings.append({"index": index, "question_id": row["question_id"],
                         "question_type": row["question_type"], "path": item["path"],
                         "bytes": item["bytes"], "file_sha256": item["sha256"]})
    manifest = {"schema_version": "are.longmemeval-product-replication-source/v1",
                "source_sha256": SOURCE_SHA256, "selection_file_sha256": digest(root / "SELECTION.json"),
                "question_ids": [row["question_id"] for row in selected], "rows": bindings,
                "evaluator_fields_emitted": False, "provider_calls": 0, "authority_effect": "none"}
    with (root / "source/manifest.json").open("x") as out:
        json.dump(manifest, out, separators=(",", ":")); out.write("\n")
    os.chmod(root / "source/manifest.json", 0o400)
    print(json.dumps({"status": "source-only-frozen", "questions": len(selected), "types": quotas,
                      "abstentions": sum(row["question_id"].endswith("_abs") for row in selected),
                      "selection_sha256": digest(root / "SELECTION.json"),
                      "manifest_sha256": digest(root / "source/manifest.json")}))


if __name__ == "__main__":
    main()
