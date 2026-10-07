#!/usr/bin/env python3
"""Freeze a fresh, source-only G03 cohort disjoint from the interrupted r1 cohort."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

from project_stream import SOURCE_BYTES, SOURCE_SHA256, project_stream


SEED = b"are-product-replication-g03-v2\x00"
PRIOR_FOUR = {"0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs"}
REJECTED_ID = "001be529"


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_selector():
    original = Path(__file__).with_name("select-product-replication.py")
    spec = importlib.util.spec_from_file_location("g03_selector_r1", original)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.SEED = SEED
    return module, original


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--queue", required=True, type=Path)
    parser.add_argument("--prior-manifest", required=True, type=Path)
    parser.add_argument("--old-selection", required=True, type=Path)
    parser.add_argument("--output-root", required=True, type=Path)
    args = parser.parse_args()
    source, queue_path, prior_path, old_path, root = [path.resolve() for path in
        (args.source, args.queue, args.prior_manifest, args.old_selection, args.output_root)]
    if root.exists() or source.stat().st_size != SOURCE_BYTES or source.stat().st_mode & 0o222:
        raise ValueError("source or new output root invalid")
    queue_bytes, prior_bytes, old_bytes = [path.read_bytes() for path in (queue_path, prior_path, old_path)]
    queue, prior, old = [json.loads(data) for data in (queue_bytes, prior_bytes, old_bytes)]
    if queue.get("schema_version") != "are.longmemeval-unexposed-candidate-queue/v2" or \
       queue.get("selection_uses_evaluator_data") is not False or \
       prior.get("schema_version") != "are.longmemeval-fast-cohort-source/v1" or \
       len(prior.get("question_ids", [])) != 16 or \
       old.get("schema_version") != "are.longmemeval-product-replication-selection/v1" or \
       old.get("source_sha256") != SOURCE_SHA256 or \
       len(old.get("ordered_questions", [])) != 80 or \
       old.get("reference_fields_read") is not False or \
       old.get("provider_calls") != 0:
        raise ValueError("prior exposure evidence invalid")
    old_ids = {row["question_id"] for row in old["ordered_questions"]}
    if len(old_ids) != 80 or REJECTED_ID not in old_ids:
        raise ValueError("old cohort or rejected-question binding invalid")
    excluded = set(queue["exposed_ids"]) | set(prior["question_ids"]) | PRIOR_FOUR | old_ids
    base, original_selector_path = load_selector()
    rows = base.scan(source)
    selected, quotas = base.choose(rows, excluded)
    selected_ids = [row["question_id"] for row in selected]
    if set(selected_ids) & excluded:
        raise ValueError("new cohort overlaps prior exposure")
    root.mkdir(mode=0o700)
    selection = {
        "schema_version": "are.longmemeval-product-replication-selection/v2",
        "status": "frozen-before-model-dispatch",
        "source_revision": "98d7416c24c778c2fee6e6f3006e7a073259d48f",
        "source_sha256": SOURCE_SHA256, "source_bytes": SOURCE_BYTES,
        "source_records": len(rows), "source_fields": sorted(base.SOURCE_FIELDS),
        "selector_sha256": digest(Path(__file__)),
        "selection_algorithm_sha256": digest(original_selector_path),
        "parser_sha256": digest(Path(__file__).with_name("project_stream.py")),
        "queue_file_sha256": hashlib.sha256(queue_bytes).hexdigest(),
        "prior_manifest_sha256": hashlib.sha256(prior_bytes).hexdigest(),
        "old_selection_file_sha256": hashlib.sha256(old_bytes).hexdigest(),
        "old_cohort_excluded_count": len(old_ids),
        "provider_rejected_question_id": REJECTED_ID,
        "provider_rejected_question_action": "excluded-unchanged-with-entire-interrupted-cohort",
        "prior_four_question_ids": sorted(PRIOR_FOUR),
        "excluded_count": len(excluded), "seed_hex": SEED.hex(),
        "selection_rule": "SHA-256 seed+question ID ascending within six types; 80 round-robin slots; force lowest-ranked unexposed _abs only if draw has none",
        "type_quotas": quotas, "ordered_questions": selected,
        "reference_fields_read": False, "evaluator_fields_emitted": False,
        "provider_calls": 0, "authority_effect": "none",
    }
    with (root / "SELECTION.json").open("x") as stream:
        json.dump(selection, stream, indent=2)
        stream.write("\n")
    with source.open("rb") as stream:
        receipt = project_stream(stream, root / "source", question_ids=selected_ids,
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
                "source_sha256": SOURCE_SHA256,
                "selection_file_sha256": digest(root / "SELECTION.json"),
                "question_ids": selected_ids, "rows": bindings,
                "evaluator_fields_emitted": False, "provider_calls": 0,
                "authority_effect": "none"}
    with (root / "source/manifest.json").open("x") as stream:
        json.dump(manifest, stream, separators=(",", ":"))
        stream.write("\n")
    os.chmod(root / "source/manifest.json", 0o400)
    print(json.dumps({"status": "source-only-frozen", "questions": len(selected),
                      "types": quotas,
                      "abstentions": sum(question_id.endswith("_abs") for question_id in selected_ids),
                      "selection_sha256": digest(root / "SELECTION.json"),
                      "manifest_sha256": digest(root / "source/manifest.json")}))


if __name__ == "__main__":
    main()
