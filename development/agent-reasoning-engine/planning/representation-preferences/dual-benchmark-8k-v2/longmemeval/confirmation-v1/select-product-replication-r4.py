#!/usr/bin/env python3
"""Freeze the approved r4 source-only cohort, excluding every dispatched predecessor."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

from project_stream import SOURCE_BYTES, SOURCE_SHA256, project_stream


SEED = b"are-product-replication-g03-v4\x00"
PRIOR_FOUR = {"0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs"}
R2_ASSIGNED = {"b6019101", "b3c15d39"}
R2_RESULT_SHA256 = "fa7ef5e709ed4bd718e8bf17ff4b1e6bbfbd7f2c5aafe6812859fa48e69e0381"
R2_SELECTION_SHA256 = "355c02fdd7d3c2697371b59ddf4d7c69612902f5435dfe1cfe351b4b04946a7a"
R3_SELECTION_SHA256 = "9bb2a9905ad9323366088a0e72cb9a77fbb8870440b6d0a914c7c0763441aad2"
R3_RESULT_SHA256 = "eb033c328411ac86c6212d377957e2bdd260ac4b9a662e21cb22a22845c11289"
R3_ASSIGNED = set("69fee5aa 88432d0a_abs 8aef76bc 09d032c9 bc8a6e93_abs gpt4_2655b836 10e09553 21d02d0d 65240037 195a1a1b 36580ce8 gpt4_45189cb4 4b24c848 ef9cf60a e8a79c70 d24813b1 29f2956b_abs gpt4_fe651585_abs 618f13b2 6d550036 fca762bc b0479f84 c19f7a0b".split())
QUOTAS = {"knowledge-update": 14, "multi-session": 14, "single-session-assistant": 14,
          "single-session-preference": 10, "single-session-user": 14, "temporal-reasoning": 14}


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


def choose_r4(rows, excluded):
    rank = lambda row: hashlib.sha256(SEED + row["question_id"].encode()).hexdigest()
    if {row["question_type"] for row in rows} != set(QUOTAS):
        raise ValueError("source type drift")
    buckets = {}
    for question_type, quota in QUOTAS.items():
        available = sorted((row for row in rows if row["question_type"] == question_type
                            and row["question_id"] not in excluded), key=rank)
        if len(available) < quota:
            raise ValueError(f"{question_type}: insufficient unexposed source rows")
        buckets[question_type] = available[:quota]
    if not any(row["question_id"].endswith("_abs") for bucket in buckets.values() for row in bucket):
        eligible = sorted((row for row in rows if row["question_id"].endswith("_abs")
                           and row["question_id"] not in excluded), key=rank)
        if not eligible:
            raise ValueError("no eligible abstention")
        replacement = eligible[0]
        bucket = buckets[replacement["question_type"]]
        bucket[-1] = replacement
        bucket.sort(key=rank)
    selected = [buckets[t][i] for i in range(14) for t in sorted(QUOTAS) if i < QUOTAS[t]]
    if len(selected) != 80 or len({row["question_id"] for row in selected}) != 80:
        raise ValueError("selected denominator invalid")
    return selected, QUOTAS


def main():
    parser = argparse.ArgumentParser()
    for name in ("source", "queue", "prior-manifest", "r1-selection", "r2-selection",
                 "r2-manifest", "r2-result", "r3-selection", "r3-result", "output-root"):
        parser.add_argument("--" + name, required=True, type=Path)
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    source, queue_path, prior_path, r1_path, r2_path, r2_manifest_path, result_path, r3_path, r3_result_path, root = (
        getattr(args, name.replace("-", "_")).resolve() for name in
        ("source", "queue", "prior-manifest", "r1-selection", "r2-selection",
         "r2-manifest", "r2-result", "r3-selection", "r3-result", "output-root"))
    if root.exists() or source.stat().st_size != SOURCE_BYTES or source.stat().st_mode & 0o222:
        raise ValueError("source or new output root invalid")
    if digest(r2_path) != R2_SELECTION_SHA256 or digest(result_path) != R2_RESULT_SHA256:
        raise ValueError("sealed r2 evidence drift")
    if digest(r3_path) != R3_SELECTION_SHA256 or digest(r3_result_path) != R3_RESULT_SHA256:
        raise ValueError("sealed r3 evidence drift")
    queue_bytes, prior_bytes, r1_bytes, r2_bytes = (
        path.read_bytes() for path in (queue_path, prior_path, r1_path, r2_path))
    queue, prior, r1, r2 = (
        json.loads(data) for data in (queue_bytes, prior_bytes, r1_bytes, r2_bytes))
    r2_manifest = json.loads(r2_manifest_path.read_bytes())
    r3 = json.loads(r3_path.read_bytes())
    r3_result = json.loads(r3_result_path.read_bytes())
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
    if (r3.get("schema_version") != "are.longmemeval-product-replication-selection/v3"
            or r3.get("source_sha256") != SOURCE_SHA256
            or r3.get("r2_selection_file_sha256") != R2_SELECTION_SHA256
            or r3.get("r2_result_file_sha256") != R2_RESULT_SHA256
            or r3.get("reference_fields_read") is not False
            or r3.get("provider_calls") != 0
            or r3_result.get("schema_version") != "are.longmemeval-product-replication-paired-result/v1"
            or [item["question_id"] for item in r3_result["results"] if item["status"] != "not-started"]
            != [item["question_id"] for item in r3["ordered_questions"][:23]]
            or set(item["question_id"] for item in r3["ordered_questions"][:23]) != R3_ASSIGNED):
        raise ValueError("r3 assignment evidence invalid")
    r1_ids = {item["question_id"] for item in r1["ordered_questions"]}
    r2_ids = {item["question_id"] for item in r2["ordered_questions"]}
    if (len(r1_ids) != 80 or len(r2_ids) != 80 or len(r1_ids & r2_ids) != 0
            or not R2_ASSIGNED <= r2_ids or "001be529" not in r1_ids
            or r2_manifest.get("question_ids") != [item["question_id"] for item in r2["ordered_questions"]]):
        raise ValueError("sealed cohort identity invalid")
    excluded = set(queue["exposed_ids"]) | set(prior["question_ids"]) | PRIOR_FOUR | r1_ids | R2_ASSIGNED | R3_ASSIGNED
    base, base_path = original_selector()
    rows = base.scan(source)
    selected, quotas = choose_r4(rows, excluded)
    selected_ids = [item["question_id"] for item in selected]
    if set(selected_ids) & excluded:
        raise ValueError("r4 selection overlaps exposed questions")
    unstarted_r2 = r2_ids - R2_ASSIGNED
    if len(unstarted_r2) != 78:
        raise ValueError("r2 unstarted count drift")
    summary = {"status": "source-only-checked" if args.check_only else "source-only-frozen",
               "questions": len(selected), "types": quotas,
               "r2_unstarted_eligible": len(unstarted_r2),
               "r2_unstarted_selected": len(set(selected_ids) & unstarted_r2),
               "r3_unstarted_selected": len(set(selected_ids) & ({item["question_id"] for item in r3["ordered_questions"]} - R3_ASSIGNED)),
               "abstentions": sum(item.endswith("_abs") for item in selected_ids)}
    if args.check_only:
        print(json.dumps(summary))
        return
    root.mkdir(mode=0o700)
    selection = {
        "schema_version": "are.longmemeval-product-replication-selection/v4",
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
        "r3_selection_file_sha256": R3_SELECTION_SHA256,
        "r3_result_file_sha256": R3_RESULT_SHA256,
        "r3_result_access": "assignment status and IDs only; model answers not parsed",
        "r3_assigned_question_ids": sorted(R3_ASSIGNED),
        "r2_result_access": "sha256-only; model answers not parsed",
        "r2_assigned_question_ids": sorted(R2_ASSIGNED),
        "r2_never_dispatched_question_ids": sorted(unstarted_r2),
        "exposure_rule": "r1 and r2/r3 assigned excluded; r2/r3 never-dispatched eligible",
        "prior_four_question_ids": sorted(PRIOR_FOUR), "excluded_count": len(excluded),
        "seed_hex": SEED.hex(),
        "selection_rule": "SHA-256 seed+question ID ascending within six types; fixed quotas 14/14/14/10/14/14; round-robin slots; force lowest-ranked unexposed _abs only if draw has none",
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
