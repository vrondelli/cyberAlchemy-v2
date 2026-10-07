#!/usr/bin/env python3
"""Freeze a new source-only G03 cohort under the owner-approved r2 exposure rule."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

from project_stream import SOURCE_BYTES, SOURCE_SHA256, project_stream


SEED = b"are-product-replication-g03-v3\x00"
PRIOR_FOUR = {"0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs"}
R2_ASSIGNED = {"b6019101", "b3c15d39"}
R2_RESULT_SHA256 = "fa7ef5e709ed4bd718e8bf17ff4b1e6bbfbd7f2c5aafe6812859fa48e69e0381"
R2_SELECTION_SHA256 = "355c02fdd7d3c2697371b59ddf4d7c69612902f5435dfe1cfe351b4b04946a7a"


def digest(path):
    hasher = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def original_selector():
    path = Path(__file__).with_name("select-product-replication.py")
    spec = importlib.util.spec_from_file_location("g03_selector_base", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.SEED = SEED
    return module, path


def main():
    parser = argparse.ArgumentParser()
    for name in ("source", "queue", "prior-manifest", "r1-selection", "r2-selection",
                 "r2-manifest", "r2-result", "output-root"):
        parser.add_argument("--" + name, required=True, type=Path)
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    source, queue_path, prior_path, r1_path, r2_path, r2_manifest_path, result_path, root = (
        getattr(args, name.replace("-", "_")).resolve() for name in
        ("source", "queue", "prior-manifest", "r1-selection", "r2-selection",
         "r2-manifest", "r2-result", "output-root"))
    if root.exists() or source.stat().st_size != SOURCE_BYTES or source.stat().st_mode & 0o222:
        raise ValueError("source or new output root invalid")
    if digest(r2_path) != R2_SELECTION_SHA256 or digest(result_path) != R2_RESULT_SHA256:
        raise ValueError("sealed r2 evidence drift")
    queue_bytes, prior_bytes, r1_bytes, r2_bytes = (
        path.read_bytes() for path in (queue_path, prior_path, r1_path, r2_path))
    queue, prior, r1, r2 = (
        json.loads(data) for data in (queue_bytes, prior_bytes, r1_bytes, r2_bytes))
    r2_manifest = json.loads(r2_manifest_path.read_bytes())
    if (queue.get("schema_version") != "are.longmemeval-unexposed-candidate-queue/v2"
            or queue.get("selection_uses_evaluator_data") is not False
            or prior.get("schema_version") != "are.longmemeval-fast-cohort-source/v1"
            or len(prior.get("question_ids", [])) != 16
            or r1.get("schema_version") != "are.longmemeval-product-replication-selection/v1"
            or r2.get("schema_version") != "are.longmemeval-product-replication-selection/v2"
            or r2_manifest.get("schema_version") != "are.longmemeval-product-replication-source/v1"
            or r2_manifest.get("selection_file_sha256") != R2_SELECTION_SHA256
            or r2.get("old_selection_file_sha256") != digest(r1_path)
            or r2.get("source_sha256") != SOURCE_SHA256
            or r2.get("queue_file_sha256") != digest(queue_path)
            or r2.get("prior_manifest_sha256") != digest(prior_path)
            or r2.get("reference_fields_read") is not False
            or r2.get("provider_calls") != 0):
        raise ValueError("prior exposure evidence invalid")
    r1_ids = {item["question_id"] for item in r1["ordered_questions"]}
    r2_ids = {item["question_id"] for item in r2["ordered_questions"]}
    if (len(r1_ids) != 80 or len(r2_ids) != 80 or len(r1_ids & r2_ids) != 0
            or not R2_ASSIGNED <= r2_ids or "001be529" not in r1_ids
            or r2_manifest.get("question_ids") != [item["question_id"] for item in r2["ordered_questions"]]):
        raise ValueError("sealed cohort identity invalid")
    excluded = set(queue["exposed_ids"]) | set(prior["question_ids"]) | PRIOR_FOUR | r1_ids | R2_ASSIGNED
    base, base_path = original_selector()
    rows = base.scan(source)
    selected, quotas = base.choose(rows, excluded)
    selected_ids = [item["question_id"] for item in selected]
    if set(selected_ids) & excluded:
        raise ValueError("r3 selection overlaps exposed questions")
    unstarted_r2 = r2_ids - R2_ASSIGNED
    if len(unstarted_r2) != 78:
        raise ValueError("r2 unstarted count drift")
    summary = {"status": "source-only-checked" if args.check_only else "source-only-frozen",
               "questions": len(selected), "types": quotas,
               "r2_unstarted_eligible": len(unstarted_r2),
               "r2_unstarted_selected": len(set(selected_ids) & unstarted_r2),
               "abstentions": sum(item.endswith("_abs") for item in selected_ids)}
    if args.check_only:
        print(json.dumps(summary))
        return
    root.mkdir(mode=0o700)
    selection = {
        "schema_version": "are.longmemeval-product-replication-selection/v3",
        "status": "frozen-before-model-dispatch",
        "source_revision": "98d7416c24c778c2fee6e6f3006e7a073259d48f",
        "source_sha256": SOURCE_SHA256, "source_bytes": SOURCE_BYTES,
        "source_records": len(rows), "source_fields": sorted(base.SOURCE_FIELDS),
        "selector_sha256": digest(Path(__file__)), "selection_algorithm_sha256": digest(base_path),
        "parser_sha256": digest(Path(__file__).with_name("project_stream.py")),
        "queue_file_sha256": digest(queue_path), "prior_manifest_sha256": digest(prior_path),
        "r1_selection_file_sha256": digest(r1_path),
        "r2_selection_file_sha256": R2_SELECTION_SHA256,
        "r2_manifest_file_sha256": digest(r2_manifest_path),
        "r2_result_file_sha256": R2_RESULT_SHA256,
        "r2_result_access": "sha256-only; model answers not parsed",
        "r2_assigned_question_ids": sorted(R2_ASSIGNED),
        "r2_never_dispatched_question_ids": sorted(unstarted_r2),
        "exposure_rule": "r1 and r2 assigned excluded; r2 never-dispatched eligible",
        "prior_four_question_ids": sorted(PRIOR_FOUR), "excluded_count": len(excluded),
        "seed_hex": SEED.hex(),
        "selection_rule": "SHA-256 seed+question ID ascending within six types; 80 round-robin slots; force lowest-ranked unexposed _abs only if draw has none",
        "type_quotas": quotas, "ordered_questions": selected,
        "reference_fields_read": False, "evaluator_fields_emitted": False,
        "provider_calls": 0, "authority_effect": "none",
    }
    with (root / "SELECTION.json").open("x") as stream:
        json.dump(selection, stream, indent=2)
        stream.write("\n")
    with source.open("rb") as stream:
        projection = project_stream(stream, root / "source", question_ids=selected_ids,
                                    expected_selection_size=80, output_limit=64 * 1024**2)
    projected = {item["question_id"]: item for item in projection["selected"]}
    bindings = []
    for index, item in enumerate(selected):
        row = projected[item["question_id"]]
        if row["question_type"] != item["question_type"]:
            raise ValueError("source question-type drift")
        bindings.append({"index": index, "question_id": item["question_id"],
                         "question_type": item["question_type"], "path": row["path"],
                         "bytes": row["bytes"], "file_sha256": row["sha256"]})
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
    summary.update({"selection_sha256": digest(root / "SELECTION.json"),
                    "manifest_sha256": digest(root / "source/manifest.json")})
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
