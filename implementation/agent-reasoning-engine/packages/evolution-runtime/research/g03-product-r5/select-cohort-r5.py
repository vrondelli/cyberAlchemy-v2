#!/usr/bin/env python3
"""Freeze a 50-question, five-type G03 cohort using only source fields."""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

R = Path("/opt/are/evolution-runtime")
B = Path("/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f")
SOURCE = B / "longmemeval_s_cleaned.json"
QUEUE = B / "projection-v1/candidate-queue.json"
PRIOR = B / "fast-cohort-16-v1/manifest.json"
FOUR = B / "unexposed-live-v1/source-v1/manifest.json"
SELECTOR = R / "g03-product-replication-tools-r4/select-product-replication.py"
PROJECTOR = R / "g03-product-replication-tools-r4/project_stream.py"
OUT = R / "g03-product-replication-r5"
TYPES = ("knowledge-update", "multi-session", "single-session-assistant", "single-session-user", "temporal-reasoning")
SEED = b"are-product-replication-g03-r5\0"
SOURCE_SHA = "d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442"

def digest(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

def main():
    if OUT.exists() or digest(SOURCE) != SOURCE_SHA:
        raise ValueError("source drift or output root exists")
    queue, prior, four = (json.loads(path.read_text()) for path in (QUEUE, PRIOR, FOUR))
    selections = [json.loads((R / f"g03-product-replication-r{i}/SELECTION.json").read_text()) for i in range(1, 5)]
    if len(selections[3]["ordered_questions"]) != 80 or selections[3]["excluded_count"] != 133:
        raise ValueError("r4 exposure drift")
    prior_ids = set(queue["exposed_ids"]) | set(prior["question_ids"]) | {row["question_id"] for row in four["rows"]}
    prior_ids.update(selections[3]["prior_four_question_ids"])
    prior_ids.update(row["question_id"] for row in selections[0]["ordered_questions"])
    prior_ids.update(selections[3]["r2_assigned_question_ids"])
    prior_ids.update(selections[3]["r3_assigned_question_ids"])
    prior_ids.update(row["question_id"] for row in selections[3]["ordered_questions"])
    sys.path.insert(0, str(SELECTOR.parent))
    selector = module(SELECTOR, "g03_r5_base_selector")
    rows = selector.scan(SOURCE)
    buckets = {}
    for question_type in TYPES:
        available = sorted((row for row in rows if row["question_type"] == question_type and row["question_id"] not in prior_ids),
                           key=lambda row: hashlib.sha256(SEED + row["question_id"].encode()).hexdigest())
        if len(available) < 10:
            raise ValueError(f"{question_type}: only {len(available)} unexposed rows")
        buckets[question_type] = available[:10]
    selected = [buckets[t][i] for i in range(10) for t in TYPES]
    ids = [row["question_id"] for row in selected]
    if len(set(ids)) != 50 or set(ids) & prior_ids:
        raise ValueError("selection overlap")
    OUT.mkdir(mode=0o700)
    selection = {"schema_version": "are.longmemeval-product-replication-selection/v5", "status": "frozen-before-model-dispatch",
                 "source_revision": "98d7416c24c778c2fee6e6f3006e7a073259d48f", "source_sha256": SOURCE_SHA,
                 "source_bytes": SOURCE.stat().st_size, "source_records": len(rows), "source_fields": sorted(selector.SOURCE_FIELDS),
                 "selector_sha256": digest(Path(__file__)), "selection_algorithm_sha256": digest(SELECTOR), "parser_sha256": digest(PROJECTOR),
                 "queue_file_sha256": digest(QUEUE), "prior_manifest_sha256": digest(PRIOR),
                 "prior_selection_file_sha256": {str(i): digest(R / f"g03-product-replication-r{i}/SELECTION.json") for i in range(1, 5)},
                 "exposure_rule": "Exclude prior pilot, queue, r1, dispatched r2/r3, and all r4; never-dispatched r2/r3 may be selected.",
                 "excluded_count": len(prior_ids), "seed_hex": SEED.hex(),
                 "selection_rule": "SHA-256 seed+question ID within each of five available types; 10 per type; round-robin; preference stratum exhausted by r4.",
                 "type_quotas": {t: 10 for t in TYPES}, "omitted_type": "single-session-preference", "ordered_questions": selected,
                 "reference_fields_read": False, "evaluator_fields_emitted": False, "provider_calls": 0, "authority_effect": "none"}
    spath = OUT / "SELECTION.json"
    spath.write_text(json.dumps(selection, indent=2) + "\n")
    spath.chmod(0o600)
    sys.path.insert(0, str(PROJECTOR.parent))
    projector = module(PROJECTOR, "g03_r5_project_stream")
    with SOURCE.open("rb") as stream:
        projected = projector.project_stream(stream, OUT / "source", question_ids=ids,
                                              expected_selection_size=50, output_limit=64 * 1024**2)
    by_id = {row["question_id"]: row for row in projected["selected"]}
    bindings = []
    for index, row in enumerate(selected):
        source = by_id[row["question_id"]]
        if source["question_type"] != row["question_type"]:
            raise ValueError("type drift")
        bindings.append({"index": index, "question_id": row["question_id"], "question_type": row["question_type"],
                         "path": source["path"], "bytes": source["bytes"], "file_sha256": source["sha256"]})
    manifest = {"schema_version": "are.longmemeval-product-replication-source/v1", "source_sha256": SOURCE_SHA,
                "selection_file_sha256": digest(spath), "question_ids": ids, "rows": bindings,
                "evaluator_fields_emitted": False, "provider_calls": 0, "authority_effect": "none"}
    mpath = OUT / "source/manifest.json"
    mpath.write_text(json.dumps(manifest, separators=(",", ":")) + "\n")
    mpath.chmod(0o400)
    print(json.dumps({"selection_sha256": digest(spath), "manifest_sha256": digest(mpath),
                      "questions": len(selected), "types": selection["type_quotas"], "abstentions": sum(id.endswith("_abs") for id in ids)}))

if __name__ == "__main__":
    main()
