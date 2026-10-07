#!/usr/bin/env python3
"""Read-only, source-only feasibility audit after the terminal G03 r3 attempt."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path


R3_SELECTION_SHA256 = "9bb2a9905ad9323366088a0e72cb9a77fbb8870440b6d0a914c7c0763441aad2"
R3_RESULT_SHA256 = "eb033c328411ac86c6212d377957e2bdd260ac4b9a662e21cb22a22845c11289"
PRIOR_FOUR = {"0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs"}


def read_bound(path, expected_sha256):
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected_sha256:
        raise ValueError(f"source identity drift: {path.name}")
    return json.loads(raw)


def audit(source, r1_path, r3_path, result_path, prior_path, queue_path):
    r3 = read_bound(r3_path, R3_SELECTION_SHA256)
    result = read_bound(result_path, R3_RESULT_SHA256)
    r1 = read_bound(r1_path, r3["r1_selection_file_sha256"])
    prior = read_bound(prior_path, r3["prior_manifest_sha256"])
    queue = read_bound(queue_path, r3["queue_file_sha256"])
    if (len(r1["ordered_questions"]) != 80 or len(prior["question_ids"]) != 16
            or len(r3["ordered_questions"]) != 80 or len(result["results"]) != 80
            or result["question_ids"] != [row["question_id"] for row in r3["ordered_questions"]]
            or result["status"] != "failed" or result["assignments"] != 23
            or result["completed"] != 22 or result["failure_count"] != 1
            or result["unknown_usage"] is not False
            or queue["schema_version"] != "are.longmemeval-unexposed-candidate-queue/v2"
            or queue["selection_uses_evaluator_data"] is not False):
        raise ValueError("sealed campaign identity or terminal status drift")
    assigned = {row["question_id"] for row in result["results"] if row["status"] != "not-started"}
    if len(assigned) != 23 or sum(row["status"] == "not-started" for row in result["results"]) != 57:
        raise ValueError("r3 assigned or never-dispatched count drift")
    prior_excluded = ({row["question_id"] for row in r1["ordered_questions"]}
                      | set(r3["r2_assigned_question_ids"]) | set(prior["question_ids"]) | PRIOR_FOUR)
    queue_only_ids = set(queue["exposed_ids"]) - prior_excluded
    if (len(prior_excluded) != 102 or len(queue_only_ids) != 8
            or r3["excluded_count"] != len(prior_excluded | set(queue["exposed_ids"]))
            or assigned & (prior_excluded | set(queue["exposed_ids"]))):
        raise ValueError("exposure lineage drift")
    excluded = prior_excluded | assigned | set(queue["exposed_ids"])

    selector_path = Path(__file__).with_name("select-product-replication.py")
    spec = importlib.util.spec_from_file_location("g03_source_only_selector", selector_path)
    selector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(selector)
    rows = selector.scan(source)  # Strict streaming parser emits only ID and type.
    types = sorted({row["question_type"] for row in rows})
    if len(types) != 6:
        raise ValueError("source question-type drift")
    counts = Counter(row["question_type"] for row in rows if row["question_id"] not in excluded)
    quotas = {kind: 80 // 6 + (index < 80 % 6) for index, kind in enumerate(types)}
    by_type = {kind: {"old_quota": quotas[kind], "eligible_available": counts[kind]}
               for kind in types}
    return {"schema_version": "are.g03-r4-source-only-supply-audit/v1", "status": "audited-not-frozen",
            "source_rows": len(rows), "known_excluded": len(excluded),
            "queue_only_exclusions": len(queue_only_ids),
            "r3_assigned_excluded": len(assigned), "r3_never_dispatched_eligible": 57,
            "old_quota_feasible": all(counts[kind] >= quotas[kind] for kind in types),
            "eligible_abstentions": sum(row["question_id"].endswith("_abs") and row["question_id"] not in excluded for row in rows),
            "by_type": by_type, "evaluator_fields_emitted": False, "provider_calls": 0,
            "claim_ceiling": "Feasibility only; no r4 cohort, benchmark score, or GLM dispatch"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    for name in ("source", "r1-selection", "r3-selection", "r3-result", "prior-manifest", "queue"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(audit(args.source, args.r1_selection, args.r3_selection,
                           args.r3_result, args.prior_manifest, args.queue), sort_keys=True))
